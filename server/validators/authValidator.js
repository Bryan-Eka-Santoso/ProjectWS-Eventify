const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Name Cannot Be Empty",
    "string.min": "Name Must Be At Least 3 Characters",
    "string.max": "Name Cannot Exceed 100 Characters",
    "any.required": "Name Is Required",
  }),

  email: Joi.string().email().required().messages({
    "string.empty": "Email Cannot Be Empty",
    "string.email": "Invalid Email Format",
    "any.required": "Email Is Required",
  }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password Cannot Be Empty",
    "string.min": "Password Must Be At Least 8 Characters",
    "any.required": "Password Is Required",
  }),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "string.empty": "Password Confirmation Cannot Be Empty",
    "any.only": "Password Confirmation Must Match Password",
    "any.required": "Password Confirmation Is Required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email Cannot Be Empty",
    "string.email": "Invalid Email Format",
    "any.required": "Email Is Required",
  }),

  password: Joi.string().min(8).required().messages({
    "string.empty": "Password Cannot Be Empty",
    "string.min": "Password Must Be At Least 8 Characters",
    "any.required": "Password Is Required",
  }),
});

module.exports = { registerSchema, loginSchema };
