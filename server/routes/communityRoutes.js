const express = require("express");
const router = express.Router();

const communityController = require("../controllers/communityController");
const upload = require("../middlewares/upload");

const validate = require("../middlewares/validate");
const communityValidation = require("../validators/communityValidation");

// =========================
// STATIC / GLOBAL ROUTES
// =========================

router.use(apiLimiter);
router.use(verifyToken);

router.get("/categories", communityController.getCategories);

router.get(
  "/admin/all-rooms",
  verifyToken,
  checkRoles("admin"),
  communityController.adminGetAllChatRooms
);

router.delete(
  "/admin/rooms/:chat_room_id",
  verifyToken,
  checkRoles("admin"),
  communityController.adminDeleteChatRoom
);

router.get(
  "/unread-counts",
  validate({
    query: communityValidation.userIdQuerySchema,
  }),
  communityController.getUnreadCounts
);

router.post(
  "/",
  upload.single("profile_image"),
  validate({
    body: communityValidation.createChatRoomBodySchema,
    file: {
      required: true,
      fieldName: "profile_image",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      maxSize: 2 * 1024 * 1024,
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

router.post(
  "/join",
  verifyToken,
  validate({
    body: communityValidation.membershipBodySchema,
  }),
  communityController.joinChatRoom,
);

router.post(
  "/leave",
  verifyToken,
  validate({
    body: communityValidation.membershipBodySchema,
  }),
  communityController.leaveChatRoom,
);

router.get(
  "/check-membership",
  verifyToken,
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
  verifyToken,
  validate({
    params: communityValidation.messageIdParamsSchema,
  }),
  communityController.deleteMessage,
);

router.post(
  "/messages/:message_id/pin",
  verifyToken,
  validate({
    params: communityValidation.messageIdParamsSchema,
  }),
  communityController.pinMessage,
);
router.delete(
  "/messages/:message_id/pin",
  verifyToken,
  validate({
    params: communityValidation.messageIdParamsSchema,
  }),
  communityController.unpinMessage,
);
// =========================
// CHAT ROOM / GROUP DYNAMIC ROUTES
// =========================

router.put(
  "/:chat_room_id",
  upload.single("profile_image"),
  validate({
    params: communityValidation.updateChatRoomParamsSchema,
    body: communityValidation.updateChatRoomBodySchema,
    file: {
      required: false,
      fieldName: "profile_image",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      maxSize: 2 * 1024 * 1024,
    },
  }),
  communityController.updateChatRoom,
);

router.delete(
  "/:chat_room_id",
  verifyToken,
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

router.delete(
  "/:chat_room_id",
  verifyToken,
  validate({
    params: communityValidation.deleteChatRoomParamsSchema,
    body: communityValidation.deleteChatRoomBodySchema,
  }),
  communityController.updateMemberRole
);
router.delete(
  "/:chat_room_id/members/:user_id",
  verifyToken,
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
  verifyToken,
  validate({
    params: communityValidation.sendMessageParamsSchema,
    body: communityValidation.sendMessageBodySchema,
  }),
  communityController.sendMessage,
);

router.post(
  "/:chat_room_id/messages/media",
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
      maxSize: 20 * 1024 * 1024,
    },
  }),
  communityController.sendMediaMessage,
);


router.post(
  "/:chat_room_id/messages/share-event",
  verifyToken,
  validate({
    params: communityValidation.shareEventParamsSchema,
    body: communityValidation.shareEventBodySchema,
  }),
  communityController.shareEventToChat,
);

router.get(
  "/:chat_room_id/messages/search",
  verifyToken,
  validate({
    params: communityValidation.searchMessagesParamsSchema,
    query: communityValidation.searchMessagesQuerySchema,
  }),
  communityController.searchMessages,
);

router.get(
  "/:chat_room_id/messages/latest",
  verifyToken,
  validate({
    params: communityValidation.getLatestMessagesParamsSchema,
    query: communityValidation.getLatestMessagesQuerySchema,
  }),
  communityController.getLatestMessages,
);

router.get(
  "/:chat_room_id/messages",
  verifyToken,
  validate({
    params: communityValidation.getMessagesParamsSchema,
    query: communityValidation.getMessagesQuerySchema,
  }),
  communityController.getMessages,
);

router.get(
  "/:chat_room_id/pinned-messages",
  verifyToken,
  validate({
    params: communityValidation.pinnedMessagesParamsSchema,
  }),
  communityController.getPinnedMessages,
);


// =========================
// MESSAGE READS / UNREAD
// =========================

router.post(
  "/:chat_room_id/messages/read",
  verifyToken,
  validate({
    params: communityValidation.markMessagesAsReadParamsSchema,
    body: communityValidation.markMessagesAsReadBodySchema,
  }),
  communityController.markMessagesAsRead,
);

router.post(
  "/:chat_room_id/read-all",
  verifyToken,
  validate({
    params: communityValidation.markAllMessagesAsReadParamsSchema,
    body: communityValidation.markAllMessagesAsReadBodySchema,
  }),
  communityController.markAllMessagesAsRead,
);


router.get(
  "/:chat_room_id/unread-count",
  verifyToken,
  validate({
    params: communityValidation.chatRoomIdParamsSchema,
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
