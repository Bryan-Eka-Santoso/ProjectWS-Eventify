const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name cannot be empty.",
    "string.min": "Name must be at least 3 characters.",
    "string.max": "Name cannot exceed 100 characters.",
    "any.required": "Name is required.",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email cannot be empty.",
    "string.email": "Invalid email format.",
    "any.required": "Email is required.",
  }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.empty": "Password confirmation cannot be empty.",
    "any.only": "Password confirmation must match the password.",
    "any.required": "Password confirmation is required.",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email cannot be empty.",
    "string.email": "Invalid email format.",
    "any.required": "Email is required.",
  }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least 8 characters.",
    "any.required": "Password is required.",
  }),
});

module.exports = { registerSchema, loginSchema };
