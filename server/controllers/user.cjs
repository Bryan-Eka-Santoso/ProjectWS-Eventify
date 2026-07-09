const bcrypt = require("bcrypt");
const { OrganizerApplication, User } = require("../models");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const {
  registerOrganizerSchema,
  changePasswordSchema,
  editProfileUserSchema,
  editProfileOrganizerSchema,
} = require("../validators/userValidator");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: OrganizerApplication,
          as: "OrganizerApplications",
          attributes: ["organizer_name", "phone_number", "address"],
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const { name, email, bio, organizer_name, phone_number, address } =
      req.body;

    const { error } = editProfileUserSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    name ? (user.name = name) : null;
    email ? (user.email = email) : null;
    bio ? (user.bio = bio) : null;
    organizer_name ? (user.organizer_name = organizer_name) : null;
    phone_number ? (user.phone_number = phone_number) : null;
    address ? (user.address = address) : null;
    await user.save();
    if (req.user.role === "organizer") {
      const { error } = editProfileOrganizerSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: "error",
          message: error.details[0].message,
        });
      }

      await OrganizerApplication.update(
        {
          organizer_name: organizer_name || user.organizer_name,
          phone_number: phone_number || user.phone_number,
          address: address || user.address,
        },
        {
          where: { user_id: req.user.id },
        },
      );
    }

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { error } = changePasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const user = await User.findByPk(req.user.id);
    // const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const { oldPassword, newPassword } = req.body;

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

exports.changeAvatar = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // if (user.avatar) {
    //   const oldAvatarPath = path.join(
    //     __dirname,
    //     "..",
    //     user.avatar.replace(/^\/+/, ""),
    //   );

    //   if (fs.existsSync(oldAvatarPath)) {
    //     fs.unlinkSync(oldAvatarPath);
    //   }
    // }

    const avatar = `/uploads/${req.file.filename}`;

    user.avatar = avatar;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  }
};

exports.registerOrganization = async (req, res) => {
  try {
    const { error } = registerOrganizerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }

    const { organizer_name, ktp_number, phone_number, address } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "KTP Image harus diupload",
      });
    }

    const ktpImage = `/uploads/${req.file.filename}`;

    const organizerApplication = await OrganizerApplication.create({
      organizer_name,
      ktp_number,
      ktp_image_url: ktpImage,
      phone_number,
      address,
      user_id: user.id,
    });

    await user.update({
      role: "organizer",
    });

    return res.status(201).json({
      success: true,
      message: "Organization registration submitted successfully",
      data: organizerApplication,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    console.log("User to delete:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // if (user.avatar) {
    //   const avatarPath = path.join(
    //     __dirname,
    //     "..",
    //     user.avatar.replace(/^\/+/, ""),
    //   );

    //   if (fs.existsSync(avatarPath)) {
    //     fs.unlinkSync(avatarPath);
    //   }
    // }

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// FORGOT & RESET PASSWORD
// =====================================================

// Token reset ditandatangani pakai secret + hash password user saat ini,
// jadi token otomatis hangus begitu password berhasil diganti (single-use).
const buildResetSecret = (user) =>
  process.env.ACCESS_TOKEN_SECRET + (user.password || "");

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email wajib diisi",
      });
    }

    const user = await User.findOne({ where: { email } });

    // Selalu balas sukses walau email tidak terdaftar,
    // supaya orang tidak bisa menebak-nebak email yang terdaftar.
    if (!user || !user.password) {
      return res.status(200).json({
        status: "success",
        message:
          "Jika email terdaftar, link reset password sudah dikirim ke email tersebut.",
      });
    }

    const token = jwt.sign(
      { id: user.id, purpose: "password_reset" },
      buildResetSecret(user),
      { expiresIn: "15m" },
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?id=${user.id}&token=${token}`;

    const { sendPasswordResetEmail } = require("../services/emailService");
    const mailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetLink,
    });

    return res.status(200).json({
      status: "success",
      message:
        "Jika email terdaftar, link reset password sudah dikirim ke email tersebut.",
      // Kalau SMTP belum dikonfigurasi (mode development), kirim linknya
      // langsung supaya fitur tetap bisa didemokan.
      ...(mailResult?.skipped ? { dev_reset_link: resetLink } : {}),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id, token, newPassword } = req.body;

    if (!id || !token || !newPassword) {
      return res.status(400).json({
        status: "error",
        message: "Data reset password tidak lengkap",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password baru minimal 6 karakter",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User tidak ditemukan",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, buildResetSecret(user));
    } catch {
      return res.status(400).json({
        status: "error",
        message: "Link reset password tidak valid atau sudah kedaluwarsa",
      });
    }

    if (payload.purpose !== "password_reset" || Number(payload.id) !== user.id) {
      return res.status(400).json({
        status: "error",
        message: "Link reset password tidak valid",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
    });
  }
};
