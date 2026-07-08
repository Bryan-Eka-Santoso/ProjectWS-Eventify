const bcrypt = require("bcrypt");
const { OrganizerApplication, User } = require("../models");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

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

    const { name, email, biography, organizer_name, phone_number, address } =
      req.body;

    name ? (user.name = name) : null;
    email ? (user.email = email) : null;
    biography ? (user.biography = biography) : null;

    await user.save();
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
      ktp_image_url,
      phone_number,
      address,
      user_id: user.id,
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
