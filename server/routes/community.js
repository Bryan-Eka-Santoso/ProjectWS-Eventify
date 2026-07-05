const express = require("express");
const router = express.Router();

const communityController = require("../controllers/community");
const upload = require("../middlewares/upload");

// =========================
// STATIC / GLOBAL ROUTES
// =========================
router.get("/categories", communityController.getCategories);
router.get("/unread-counts", communityController.getUnreadCounts);

// =========================
// CHAT ROOM / GROUP ROOT
// =========================
router.post(
  "/",
  upload.single("profile_image"),
  communityController.createChatRoom
);

router.get("/", communityController.getAllChatRooms);

// =========================
// MEMBERSHIP GLOBAL ROUTES
// =========================
router.post("/join", communityController.joinChatRoom);
router.post("/leave", communityController.leaveChatRoom);
router.get("/check-membership", communityController.checkMembership);

// =========================
// MESSAGE GLOBAL ROUTES
// =========================
router.delete("/messages/:message_id", communityController.deleteMessage);

router.post("/messages/:message_id/pin", communityController.pinMessage);
router.delete("/messages/:message_id/pin", communityController.unpinMessage);

// =========================
// CHAT ROOM / GROUP DYNAMIC ROUTES
// =========================
router.put(
  "/:chat_room_id",
  upload.single("profile_image"),
  communityController.updateChatRoom
);

router.delete("/:chat_room_id", communityController.deleteChatRoom);

router.get(
  "/:chat_room_id/member-count",
  communityController.getChatRoomMemberCount
);

router.get(
  "/:chat_room_id/members",
  communityController.getChatRoomMembers
);

router.put(
  "/:chat_room_id/members/:user_id/role",
  communityController.updateMemberRole
);

router.delete(
  "/:chat_room_id/members/:user_id",
  communityController.kickMember
);

// =========================
// CHAT ROOM MESSAGES
// =========================
router.post(
  "/:chat_room_id/messages",
  communityController.sendMessage
);

router.post(
  "/:chat_room_id/messages/media",
  upload.single("media"),
  communityController.sendMediaMessage
);

router.post(
  "/:chat_room_id/messages/share-event",
  communityController.shareEventToChat
);

router.get(
  "/:chat_room_id/messages/search",
  communityController.searchMessages
);

router.get(
  "/:chat_room_id/messages/latest",
  communityController.getLatestMessages
);

router.get(
  "/:chat_room_id/messages",
  communityController.getMessages
);

// =========================
// PINNED MESSAGES
// =========================
router.get(
  "/:chat_room_id/pinned-messages",
  communityController.getPinnedMessages
);

// =========================
// MESSAGE READS / UNREAD
// =========================
router.post(
  "/:chat_room_id/messages/read",
  communityController.markMessagesAsRead
);

router.post(
  "/:chat_room_id/read-all",
  communityController.markAllMessagesAsRead
);

router.get(
  "/:chat_room_id/unread-count",
  communityController.getUnreadCountByRoom
);

// =========================
// CHAT ROOM DETAIL
// Harus paling bawah
// =========================
router.get("/:chat_room_id", communityController.getChatRoomById);

module.exports = router;