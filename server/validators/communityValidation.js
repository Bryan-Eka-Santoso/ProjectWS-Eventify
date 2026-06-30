const Joi = require("joi");
const id = Joi.number().integer().positive().required();

const optionalText = Joi.string().trim().allow("", null);

const categoryIdsString = Joi.string()
  .custom((value, helpers) => {
    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        return helpers.error("any.invalid");
      }

      const isValid = parsed.every(
        (item) => Number.isInteger(Number(item)) && Number(item) > 0
      );

      if (!isValid) {
        return helpers.error("any.invalid");
      }

      return value;
    } catch (error) {
      return helpers.error("any.invalid");
    }
  }, "category_ids JSON array validation")
  .messages({
    "any.invalid":
      "category_ids must be a valid JSON array of positive numbers, example: [1,2,3]",
  });

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
      "categoryIds must be comma separated positive numbers, example: 1,2,3",
  });

// =========================
// CHAT ROOM / GROUP
// =========================

const getAllChatRoomsQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).allow("").optional(),

  filterCreator: Joi.string().valid("official", "public").optional(),

  categoryIds: commaSeparatedIds.optional(),

  sortBy: Joi.string()
    .valid("newest", "trending", "least-members", "recently-active")
    .default("newest")
    .optional(),

  page: Joi.number().integer().min(1).default(1).optional(),

  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

const createChatRoomBodySchema = Joi.object({
  name: Joi.string().trim().min(3).max(255).required().messages({
    "string.empty": "Name cannot be empty",
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 255 characters",
    "any.required": "Name is required",
  }),

  description: optionalText.max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),

  creator_id: id.messages({
    "any.required": "creator_id is required",
    "number.base": "creator_id must be a number",
    "number.positive": "creator_id must be a positive number",
  }),

  category_ids: categoryIdsString.optional(),
});

const chatRoomIdParamsSchema = Joi.object({
  chat_room_id: id.messages({
    "any.required": "chat_room_id is required",
    "number.base": "chat_room_id must be a number",
  }),
});

const updateChatRoomParamsSchema = chatRoomIdParamsSchema;

const updateChatRoomBodySchema = Joi.object({
  name: Joi.string().trim().min(3).max(255).optional().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name cannot exceed 255 characters",
  }),

  description: optionalText.max(1000).optional().messages({
    "string.max": "Description cannot exceed 1000 characters",
  }),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const deleteChatRoomParamsSchema = chatRoomIdParamsSchema;

const deleteChatRoomBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

// =========================
// MEMBERSHIP
// =========================

const membershipBodySchema = Joi.object({
  chat_room_id: id.messages({
    "any.required": "chat_room_id is required",
    "number.base": "chat_room_id must be a number",
  }),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const checkMembershipQuerySchema = Joi.object({
  chat_room_id: id.messages({
    "any.required": "chat_room_id is required",
    "number.base": "chat_room_id must be a number",
  }),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

// =========================
// MESSAGE
// =========================

const messageType = Joi.string().valid(
  "text",
  "image",
  "video",
  "recommendation"
);

const sendMessageParamsSchema = chatRoomIdParamsSchema;

const sendMessageBodySchema = Joi.object({
  sender_id: id.messages({
    "any.required": "sender_id is required",
    "number.base": "sender_id must be a number",
  }),

  message_type: messageType.default("text").optional(),

  body: optionalText.when("message_type", {
    is: "text",
    then: Joi.string().trim().min(1).required().messages({
      "string.empty": "Body is required for text messages",
      "string.min": "Body is required for text messages",
      "any.required": "Body is required for text messages",
    }),
    otherwise: optionalText.optional(),
  }),

  media_url: Joi.string()
    .trim()
    .uri({ allowRelative: true })
    .when("message_type", {
      is: Joi.valid("image", "video"),
      then: Joi.required().messages({
        "any.required": "media_url is required for image/video messages",
      }),
      otherwise: Joi.optional().allow("", null),
    }),

  recommended_event_id: Joi.number()
    .integer()
    .positive()
    .when("message_type", {
      is: "recommendation",
      then: Joi.required().messages({
        "any.required":
          "recommended_event_id is required for recommendation messages",
      }),
      otherwise: Joi.optional().allow(null),
    }),
});

const sendMediaMessageParamsSchema = chatRoomIdParamsSchema;

const sendMediaMessageBodySchema = Joi.object({
  sender_id: id.messages({
    "any.required": "sender_id is required",
    "number.base": "sender_id must be a number",
  }),

  message_type: Joi.string().valid("image", "video").required().messages({
    "any.only": "message_type must be image or video",
    "any.required": "message_type is required",
  }),

  body: optionalText.max(1000).optional(),
});

const shareEventParamsSchema = chatRoomIdParamsSchema;

const shareEventBodySchema = Joi.object({
  sender_id: id.messages({
    "any.required": "sender_id is required",
    "number.base": "sender_id must be a number",
  }),

  recommended_event_id: id.messages({
    "any.required": "recommended_event_id is required",
    "number.base": "recommended_event_id must be a number",
  }),

  body: optionalText.max(1000).optional(),
});

const getMessagesParamsSchema = chatRoomIdParamsSchema;

const getMessagesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
});

const getLatestMessagesParamsSchema = chatRoomIdParamsSchema;

const getLatestMessagesQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(30).optional(),
});

const searchMessagesParamsSchema = chatRoomIdParamsSchema;

const searchMessagesQuerySchema = Joi.object({
  keyword: Joi.string().trim().min(1).max(100).required().messages({
    "string.empty": "keyword is required",
    "string.min": "keyword is required",
    "any.required": "keyword is required",
  }),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
});

const messageIdParamsSchema = Joi.object({
  message_id: id.messages({
    "any.required": "message_id is required",
    "number.base": "message_id must be a number",
  }),
});

const userIdBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

// =========================
// MEMBER MANAGEMENT
// =========================

const memberParamsSchema = Joi.object({
  chat_room_id: id.messages({
    "any.required": "chat_room_id is required",
    "number.base": "chat_room_id must be a number",
  }),

  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const updateMemberRoleBodySchema = Joi.object({
  requester_id: id.messages({
    "any.required": "requester_id is required",
    "number.base": "requester_id must be a number",
  }),

  role: Joi.string().valid("admin", "member").required().messages({
    "any.only": "Role can only be admin or member",
    "any.required": "role is required",
  }),
});

const kickMemberBodySchema = Joi.object({
  requester_id: id.messages({
    "any.required": "requester_id is required",
    "number.base": "requester_id must be a number",
  }),
});

// =========================
// PINNED / READ / UNREAD
// =========================

const pinnedMessagesParamsSchema = chatRoomIdParamsSchema;

const userIdQuerySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

const markMessagesAsReadParamsSchema = chatRoomIdParamsSchema;

const markMessagesAsReadBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),

  message_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      "array.base": "message_ids must be an array",
      "array.min": "message_ids must contain at least 1 message id",
      "any.required": "message_ids is required",
    }),
});

const markAllMessagesAsReadParamsSchema = chatRoomIdParamsSchema;

const markAllMessagesAsReadBodySchema = Joi.object({
  user_id: id.messages({
    "any.required": "user_id is required",
    "number.base": "user_id must be a number",
  }),
});

// =========================
// SOCKET PAYLOAD OPTIONAL
// Bisa dipakai nanti untuk validasi payload socket.
// =========================

const socketJoinRoomSchema = Joi.object({
  chat_room_id: id,

  user_id: id,

  username: Joi.string().trim().min(1).max(100).required(),
});

const socketSendMessageSchema = Joi.object({
  chat_room_id: id,

  sender_id: id,

  message_type: messageType.default("text").optional(),

  body: optionalText.optional(),

  media_url: Joi.string().trim().allow("", null).optional(),

  recommended_event_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional(),
});

const socketTypingSchema = Joi.object({
  chat_room_id: id,

  username: Joi.string().trim().min(1).max(100).required(),
});

module.exports = {
  getAllChatRoomsQuerySchema,
  createChatRoomBodySchema,
  updateChatRoomParamsSchema,
  updateChatRoomBodySchema,
  deleteChatRoomParamsSchema,
  deleteChatRoomBodySchema,
  chatRoomIdParamsSchema,
  paginationQuerySchema,

  membershipBodySchema,
  checkMembershipQuerySchema,

  sendMessageParamsSchema,
  sendMessageBodySchema,
  sendMediaMessageParamsSchema,
  sendMediaMessageBodySchema,
  shareEventParamsSchema,
  shareEventBodySchema,
  getMessagesParamsSchema,
  getMessagesQuerySchema,
  getLatestMessagesParamsSchema,
  getLatestMessagesQuerySchema,
  searchMessagesParamsSchema,
  searchMessagesQuerySchema,
  messageIdParamsSchema,
  userIdBodySchema,

  memberParamsSchema,
  updateMemberRoleBodySchema,
  kickMemberBodySchema,

  pinnedMessagesParamsSchema,
  userIdQuerySchema,
  markMessagesAsReadParamsSchema,
  markMessagesAsReadBodySchema,
  markAllMessagesAsReadParamsSchema,
  markAllMessagesAsReadBodySchema,

  socketJoinRoomSchema,
  socketSendMessageSchema,
  socketTypingSchema,
};