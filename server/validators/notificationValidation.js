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

  is_read: Joi.boolean().optional(),

  page: Joi.number().integer().min(1).default(1).optional(),

  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});


module.exports = {
  notificationIdParamsSchema,
  getNotificationsQuerySchema,
};