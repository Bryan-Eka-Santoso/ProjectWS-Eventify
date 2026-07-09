const express = require("express");
const router = express.Router();

const communityController = require("../controllers/communityController");
const upload = require("../middlewares/upload");

const validate = require("../middlewares/validate");
const communityValidation = require("../validators/communityValidation");

const verifyToken = require("../middlewares/verifyJWT").verifyToken;
const checkRoles = require("../middlewares/checkRoles").checkRoles;

const apiLimiter = require("../middlewares/apiLimiter");
const uploadLimiter = require("../middlewares/uploadLimiter");

// =========================
// STATIC / GLOBAL ROUTES
// =========================

router.use(apiLimiter);
router.use(verifyToken);

router.get("/categories", communityController.getCategories);

router.get(
  "/unread-counts",
  validate({
    query: communityValidation.userIdQuerySchema,
  }),
  communityController.getUnreadCounts,
);

// =========================
// CHAT ROOM / GROUP ROOT
// =========================

router.post(
  "/",
  uploadLimiter,
  upload.single("profile_image"),
  validate({
    body: communityValidation.createChatRoomBodySchema,
    file: {
      required: true,
      fieldName: "profile_image",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      maxSize: 2 * 1024 * 1024, // 2MB
    },
  }),
  communityController.createChatRoom,
);

router.get(
  "/",
  validate({
    query: communityValidation.getAllChatRoomsQuerySchema,
  }),
  communityController.getAllChatRooms,
);

// =========================
// MEMBERSHIP GLOBAL ROUTES
// =========================

router.post(
  "/join",
  validate({
    body: communityValidation.membershipBodySchema,
  }),
  communityController.joinChatRoom,
);

router.post(
  "/leave",
  validate({
    body: communityValidation.membershipBodySchema,
  }),
  communityController.leaveChatRoom,
);

router.get(
  "/check-membership",
  validate({
    query: communityValidation.checkMembershipQuerySchema,
  }),
  communityController.checkMembership,
);

// =========================
// MESSAGE GLOBAL ROUTES
// =========================

router.delete(
  "/messages/:message_id",
  validate({
    params: communityValidation.messageIdParamsSchema,
    body: communityValidation.userIdBodySchema,
  }),
  communityController.deleteMessage,
);

router.post(
  "/messages/:message_id/pin",
  validate({
    params: communityValidation.messageIdParamsSchema,
    body: communityValidation.userIdBodySchema,
  }),
  communityController.pinMessage,
);

router.delete(
  "/messages/:message_id/pin",
  validate({
    params: communityValidation.messageIdParamsSchema,
    body: communityValidation.userIdBodySchema,
  }),
  communityController.unpinMessage,
);

// =========================
// CHAT ROOM / GROUP DYNAMIC ROUTES
// =========================

router.put(
  "/:chat_room_id",
  uploadLimiter,
  upload.single("profile_image"),
  validate({
    params: communityValidation.updateChatRoomParamsSchema,
    body: communityValidation.updateChatRoomBodySchema,
    file: {
      required: false,
      fieldName: "profile_image",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      maxSize: 2 * 1024 * 1024, // 2MB
    },
  }),
  communityController.updateChatRoom,
);

router.delete(
  "/:chat_room_id",
  validate({
    params: communityValidation.deleteChatRoomParamsSchema,
    body: communityValidation.deleteChatRoomBodySchema,
  }),
  communityController.deleteChatRoom,
);

router.get(
  "/:chat_room_id/member-count",
  validate({
    params: communityValidation.chatRoomIdParamsSchema,
  }),
  communityController.getChatRoomMemberCount,
);

router.get(
  "/:chat_room_id/members",
  validate({
    params: communityValidation.chatRoomIdParamsSchema,
    query: communityValidation.paginationQuerySchema,
  }),
  communityController.getChatRoomMembers,
);

router.put(
  "/:chat_room_id/members/:user_id/role",
  validate({
    params: communityValidation.memberParamsSchema,
    body: communityValidation.updateMemberRoleBodySchema,
  }),
  communityController.updateMemberRole,
);

router.delete(
  "/:chat_room_id/members/:user_id",
  validate({
    params: communityValidation.memberParamsSchema,
    body: communityValidation.kickMemberBodySchema,
  }),
  communityController.kickMember,
);

// =========================
// CHAT ROOM MESSAGES
// =========================

router.post(
  "/:chat_room_id/messages",
  validate({
    params: communityValidation.sendMessageParamsSchema,
    body: communityValidation.sendMessageBodySchema,
  }),
  communityController.sendMessage,
);

router.post(
  "/:chat_room_id/messages/media",
  uploadLimiter,
  upload.single("media"),
  validate({
    params: communityValidation.sendMediaMessageParamsSchema,
    body: communityValidation.sendMediaMessageBodySchema,
    file: {
      required: true,
      fieldName: "media",
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "video/mp4",
        "video/webm",
        "video/ogg",
      ],
      maxSize: 20 * 1024 * 1024, // 20MB
    },
  }),
  communityController.sendMediaMessage,
);

router.post(
  "/:chat_room_id/messages/share-event",
  validate({
    params: communityValidation.shareEventParamsSchema,
    body: communityValidation.shareEventBodySchema,
  }),
  communityController.shareEventToChat,
);

router.get(
  "/:chat_room_id/messages/search",
  validate({
    params: communityValidation.searchMessagesParamsSchema,
    query: communityValidation.searchMessagesQuerySchema,
  }),
  communityController.searchMessages,
);

router.get(
  "/:chat_room_id/messages/latest",
  validate({
    params: communityValidation.getLatestMessagesParamsSchema,
    query: communityValidation.getLatestMessagesQuerySchema,
  }),
  communityController.getLatestMessages,
);

router.get(
  "/:chat_room_id/messages",
  validate({
    params: communityValidation.getMessagesParamsSchema,
    query: communityValidation.getMessagesQuerySchema,
  }),
  communityController.getMessages,
);

// =========================
// PINNED MESSAGES
// =========================

router.get(
  "/:chat_room_id/pinned-messages",
  validate({
    params: communityValidation.pinnedMessagesParamsSchema,
    query: communityValidation.userIdQuerySchema,
  }),
  communityController.getPinnedMessages,
);

// =========================
// MESSAGE READS / UNREAD
// =========================

router.post(
  "/:chat_room_id/messages/read",
  validate({
    params: communityValidation.markMessagesAsReadParamsSchema,
    body: communityValidation.markMessagesAsReadBodySchema,
  }),
  communityController.markMessagesAsRead,
);

router.post(
  "/:chat_room_id/read-all",
  validate({
    params: communityValidation.markAllMessagesAsReadParamsSchema,
    body: communityValidation.markAllMessagesAsReadBodySchema,
  }),
  communityController.markAllMessagesAsRead,
);

router.get(
  "/:chat_room_id/unread-count",
  validate({
    params: communityValidation.chatRoomIdParamsSchema,
    query: communityValidation.userIdQuerySchema,
  }),
  communityController.getUnreadCountByRoom,
);

// =========================
// CHAT ROOM DETAIL
// Harus paling bawah supaya tidak bentrok dengan route lain
// =========================

router.get(
  "/:chat_room_id",
  validate({
    params: communityValidation.chatRoomIdParamsSchema,
  }),
  communityController.getChatRoomById,
);

module.exports = router;
