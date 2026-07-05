const Joi = require("joi");

const id = Joi.number().integer().positive().required();

const notificationIdParamsSchema = Joi.object({
  id: id.messages({
    "any.required": "notification id is required",
    "number.base": "notification id must be a number",
    "number.positive": "notification id must be a positive number",
  }),
});

const getNotificationsQuerySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  is_read: Joi.boolean().optional(),

  page: Joi.number().integer().min(1).default(1).optional(),

  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

const userIdQuerySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const userIdBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

module.exports = {
  notificationIdParamsSchema,
  getNotificationsQuerySchema,
  userIdQuerySchema,
  userIdBodySchema,
};