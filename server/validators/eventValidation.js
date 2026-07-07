const Joi = require("joi");

const id = Joi.number().integer().positive().required();

const optionalText = Joi.string().trim().allow("", null);

const commaSeparatedIds = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const values = value.split(",").map((item) => item.trim());

    const isValid = values.every(
      (item) => item !== "" && Number.isInteger(Number(item)) && Number(item) > 0
    );

    if (!isValid) {
      return helpers.error("any.invalid");
    }

    return value;
  }, "comma separated ids validation")
  .messages({
    "any.invalid":
      "category_ids must be comma separated positive numbers, example: 1,2,3",
  });

const eventIdParamsSchema = Joi.object({
  id: id.messages({
    "any.required": "event id is required",
    "number.base": "event id must be a number",
    "number.positive": "event id must be a positive number",
  }),
});

const createEventBodySchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Title cannot be empty",
    "string.min": "Title must be at least 3 characters",
    "string.max": "Title cannot exceed 255 characters",
    "any.required": "Title is required",
  }),

  description: optionalText.max(5000).optional(),

  location: Joi.string().trim().min(3).required().messages({
    "string.empty": "Location cannot be empty",
    "string.min": "Location must be at least 3 characters",
    "any.required": "Location is required",
  }),

  start_date: Joi.date().required().messages({
    "date.base": "start_date must be a valid date",
    "any.required": "start_date is required",
  }),

  end_date: Joi.date().min(Joi.ref("start_date")).required().messages({
    "date.base": "end_date must be a valid date",
    "date.min": "end_date cannot be earlier than start_date",
    "any.required": "end_date is required",
  }),

  category_ids: commaSeparatedIds.optional(),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin", "organizer").required().messages({
    "any.only": "role must be admin, organizer, or user",
    "any.required": "role is required",
  }),
  tickets: Joi.string()
  .custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        return helpers.error("any.invalid");
      }

      const isValid = parsed.every((ticket) => {
        return (
          ticket.name &&
          Number.isInteger(Number(ticket.price)) &&
          Number(ticket.price) >= 0 &&
          Number.isInteger(Number(ticket.quota)) &&
          Number(ticket.quota) > 0
        );
      });

      if (!isValid) {
        return helpers.error("any.invalid");
      }

      return value;
    } catch (error) {
      return helpers.error("any.invalid");
    }
  }, "tickets validation")
  .optional()
  .messages({
    "any.invalid":
      "tickets must be a valid JSON array with name, price, and quota",
  }),
});

const getMyEventsQuerySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin", "organizer", "user").required().messages({
    "any.only": "role must be admin, organizer, or user",
    "any.required": "role is required",
  }),
});

const updateStatusBodySchema = Joi.object({
  status: Joi.string()
    .valid(
      "draft",
      "pending_approval",
      "published",
      "rejected",
      "canceled",
      "completed"
    )
    .required()
    .messages({
      "any.only":
        "status must be draft, pending_approval, published, rejected, canceled, or completed",
      "any.required": "status is required",
    }),

  user_id: Joi.number().integer().positive().optional(),
  role: Joi.string().valid("admin", "organizer", "user").optional(),
});

const getPublishedEventsQuerySchema = Joi.object({
  category_id: Joi.number().integer().positive().optional(),
});

const updateEventBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin", "organizer", "user").required().messages({
    "any.only": "role must be admin, organizer, or user",
    "any.required": "role is required",
  }),

  title: Joi.string().trim().min(3).max(255).optional(),
  description: optionalText.max(5000).optional(),
  location: Joi.string().trim().min(3).optional(),

  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),

  category_ids: commaSeparatedIds.optional(),

  change_reason: optionalText.max(1000).optional(),
});

const followExternalEventBodySchema = Joi.object({
  external_id: Joi.alternatives()
    .try(Joi.string().trim(), Joi.number())
    .required()
    .messages({
      "any.required": "external_id is required",
    }),

  title: Joi.string().trim().min(3).max(255).required(),

  location: Joi.string().trim().allow("", null).optional(),

  start_date: Joi.date().required().messages({
    "date.base": "start_date must be a valid date",
    "any.required": "start_date is required",
  }),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin", "organizer", "user").required(),
});

const toggleSaveEventBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  event_id: id.messages({
    "any.required": "event_id is required",
    "number.base": "event_id must be a number",
  }),
});

const checkSaveStatusQuerySchema = Joi.object({
  user_id: Joi.number().integer().positive().optional(),
});

// Nanti dipakai di tahap controller cancel event
const cancelEventBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin", "organizer", "user").required(),

  cancellation_reason: Joi.string().trim().min(5).max(2000).required().messages({
    "string.empty": "cancellation_reason cannot be empty",
    "string.min": "cancellation_reason must be at least 5 characters",
    "string.max": "cancellation_reason cannot exceed 2000 characters",
    "any.required": "cancellation_reason is required",
  }),
});

// Nanti dipakai untuk refund opt-in setelah jadwal/lokasi berubah
const requestRefundBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  transaction_id: id.messages({
    "any.required": "transaction_id is required",
    "number.base": "transaction_id must be a number",
  }),

  event_change_id: id.messages({
    "any.required": "event_change_id is required",
    "number.base": "event_change_id must be a number",
  }),

  reason: optionalText.max(1000).optional(),
});

const savedEventsQuerySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const cancellationRequestIdParamsSchema = Joi.object({
  request_id: id.messages({
    "any.required": "request_id is required",
    "number.base": "request_id must be a number",
  }),
});

const getCancellationRequestsQuerySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin").required().messages({
    "any.only": "Only admin can access cancellation requests",
    "any.required": "role is required",
  }),

  status: Joi.string().valid("pending", "approved", "rejected").optional(),

  page: Joi.number().integer().min(1).default(1).optional(),

  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

const approveCancellationRequestBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin").required().messages({
    "any.only": "Only admin can approve cancellation request",
    "any.required": "role is required",
  }),

  admin_note: optionalText.max(1000).optional(),
});

const rejectCancellationRequestBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin").required().messages({
    "any.only": "Only admin can reject cancellation request",
    "any.required": "role is required",
  }),

  admin_note: Joi.string().trim().min(3).max(1000).required().messages({
    "string.empty": "admin_note cannot be empty",
    "string.min": "admin_note must be at least 3 characters",
    "string.max": "admin_note cannot exceed 1000 characters",
    "any.required": "admin_note is required",
  }),
});

const validateTicketBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  role: Joi.string().valid("admin", "organizer").required().messages({
    "any.only": "role must be admin or organizer",
    "any.required": "role is required",
  }),

  ticket_code: Joi.string().trim().min(5).max(255).required().messages({
    "string.empty": "ticket_code cannot be empty",
    "string.min": "ticket_code must be at least 5 characters",
    "string.max": "ticket_code cannot exceed 255 characters",
    "any.required": "ticket_code is required",
  }),
});

module.exports = {
  eventIdParamsSchema,
  createEventBodySchema,
  getMyEventsQuerySchema,
  updateStatusBodySchema,
  getPublishedEventsQuerySchema,
  updateEventBodySchema,
  followExternalEventBodySchema,
  toggleSaveEventBodySchema,
  checkSaveStatusQuerySchema,
  cancelEventBodySchema,
  requestRefundBodySchema,
  savedEventsQuerySchema,
  cancellationRequestIdParamsSchema,
  getCancellationRequestsQuerySchema,
  approveCancellationRequestBodySchema,
  rejectCancellationRequestBodySchema,
  validateTicketBodySchema,
};