const bcrypt = require("bcrypt");
const { OrganizerApplication, User } = require("../models");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

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

    const { name, email, biography } = req.body;

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = biography || user.bio;

    await user.save();

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

    if (user.avatar) {
      const oldAvatarPath = path.join(
        __dirname,
        "..",
        user.avatar.replace(/^\/+/, ""),
      );

      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

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
    const { organizerName, ktpNumber, phoneNumber, address, socialMedia } =
      req.body;

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
      organizer_name: organizerName,
      ktp_number: ktpNumber,
      ktp_image_url: ktpImage,
      phone_number: phoneNumber,
      address: address,
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
