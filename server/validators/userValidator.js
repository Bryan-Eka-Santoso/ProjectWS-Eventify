const Joi = require("joi");

const registerOrganizerSchema = Joi.object({
  organizer_name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Organizer name cannot be empty.",
    "string.min": "Organizer name must be at least 3 characters.",
    "string.max": "Organizer name cannot exceed 100 characters.",
    "any.required": "Organizer name is required.",
  }),
  ktp_number: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(16)
    .max(16)
    .required()
    .messages({
      "string.empty": "KTP number cannot be empty.",
      "string.pattern.base": "KTP number must contain only digits.",
      "string.min": "KTP number must be exactly 16 characters.",
      "string.max": "KTP number must be exactly 16 characters.",
      "any.required": "KTP number is required.",
    }),
  phone_number: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(15)
    .required()
    .messages({
      "string.empty": "Phone number cannot be empty.",
      "string.pattern.base": "Phone number must contain only digits.",
      "string.min": "Phone number must be at least 10 characters.",
      "string.max": "Phone number cannot exceed 15 characters.",
      "any.required": "Phone number is required.",
    }),
  address: Joi.string().min(10).max(200).required().messages({
    "string.empty": "Address cannot be empty.",
    "string.min": "Address must be at least 10 characters.",
    "string.max": "Address cannot exceed 200 characters.",
    "any.required": "Address is required.",
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(8).required().messages({
    "string.empty": "Current password cannot be empty.",
    "string.min": "Current password must be at least 8 characters.",
    "any.required": "Current password is required.",
  }),
  newPassword: Joi.string().min(8).required().messages({
    "string.empty": "New password cannot be empty.",
    "string.min": "New password must be at least 8 characters.",
    "any.required": "New password is required.",
  }),
  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "string.empty": "Password confirmation cannot be empty.",
      "any.only": "Password confirmation must match the new password.",
      "any.required": "Password confirmation is required.",
    }),
});

module.exports = { registerOrganizerSchema, changePasswordSchema };
