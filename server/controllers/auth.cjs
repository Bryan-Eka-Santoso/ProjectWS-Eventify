const bcrypt = require("bcrypt");
const { User } = require("../models");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { registerSchema, loginSchema } = require("../validators/authValidator");

exports.register = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { name, email, password } = req.body;

    let user = await User.findOne({
      where: { email },
      paranoid: false,
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        api_key: crypto.randomUUID(),
      });

      return res.status(201).json({
        status: "success",
        message: "Registration successful",
        redirect: "/",
      });
    }

    if (user.deletedAt === null) {
      return res.status(409).json({
        status: "error",
        message: "Email is already in use",
      });
    }

    await user.restore();

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({
      name,
      password: hashedPassword,
      role: "user",
      api_key: crypto.randomUUID(),

      google_id: null,
      refresh_token: null,
      avatar: null,
      bio: null,
    });

    return res.status(200).json({
      status: "success",
      message: "Your account has been restored successfully.",
      redirect: "/",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }
    if (!user.password) {
      return res.status(400).json({
        status: "error",
        message: "Akun ini terdaftar menggunakan Google. Silakan login dengan Google.",
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      },
    );

    await user.update({
      refresh_token: refreshToken,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token: accessToken,
      redirect: "/",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token tidak ditemukan",
      });
    }

    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Refresh token invalid",
      });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Token refreshed successfully",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Refresh token expired atau invalid",
    });
  }
};
exports.logout = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.refreshToken) {
      return res.sendStatus(204);
    }

    const refreshToken = cookies.refreshToken;

    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    if (user) {
      await user.update({
        refresh_token: null,
      });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
    });

    return res.sendStatus(204);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({
      where: { email },
      paranoid: false,
    });

    if (!user) {
      user = await User.create({
        name,
        email,
        password: null,
        avatar: picture,
        role: "user",
        api_key: crypto.randomUUID(),
        google_id: googleId,
      });
    } else {
      if (user.deletedAt) {
        await user.restore();
      }

      await user.update({
        google_id: googleId,
        avatar: picture,
        name,
      });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "15m",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "7d",
      },
    );

    await user.update({
      refresh_token: refreshToken,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await user.update({
      refresh_token: refreshToken,
    });

    return res.status(200).json({
      message: "Login with Google successful",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to login with Google",
    });
  }
};
