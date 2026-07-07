const bcrypt = require("bcrypt");
const { User } = require("../models");
const jwt = require("jsonwebtoken");
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

    const { name, email, password, confirmPassword } = req.body;

    const cekEmail = await User.findOne({
      where: { email },
    });

    if (cekEmail) {
      return res.status(409).json({
        status: "error",
        message: "Email is already in use",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const apikey = await crypto.randomUUID();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      api_key: apikey,
    });

    return res.status(201).json({
      status: "success",
      message: "Registration successful",
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
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      },
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "1d",
      },
    );

    const updateUser = await User.findByPk(user.id);
    await updateUser.update({
      refresh_token: refreshToken,
    });

    await updateUser.save();

    res.cookie("rtsaya", refreshToken, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // hasil ini adalah 1 hari (1000 itu adalah 1000 milisecond)
      sameSite: "lax", // untuk mengizinkan cookie dikirim ke domain yang berbeda
    });

    return res.status(200).json({
      status: "success",
      message: "Login successful",
      token,
      refreshToken,
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
  const cookies = req.cookies;

  if (!cookies?.rtsaya) {
    return res.status(401).json("Cookie tidak ditemukan");
  }

  const refreshToken = cookies.rtsaya;

  const pengguna = await Pengguna.findOne({
    where: { refresh_token: refreshToken },
  });
  if (!pengguna) {
    return res.status(401).json("Kamu siapa?");
  }
};

exports.logout = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.rtsaya) {
      return res.sendStatus(204);
    }

    const refreshToken = cookies.rtsaya;

    const user = await User.findOne({
      where: { refresh_token: refreshToken },
    });

    if (user) {
      await user.update({
        refresh_token: null,
      });
    }

    res.clearCookie("rtsaya", {
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
