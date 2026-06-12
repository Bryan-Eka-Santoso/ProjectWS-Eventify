const express = require("express");
const router = express.Router();
const communityController = require("../controllers/community");

// ============ CHAT ROOM ROUTES ============
// POST - Create new chat room
router.post("/", communityController.createChatRoom);

// GET - Get all chat rooms dengan search, filter, sorting, pagination
router.get("/", communityController.getAllChatRooms);

// POST - Join chat room
router.post("/join", communityController.joinChatRoom);

// POST - Leave chat room
router.post("/leave", communityController.leaveChatRoom);

// GET - Check if user is member
router.get("/check-membership", communityController.checkMembership);

// GET - Get chat room members
router.get("/:id/members", communityController.getChatRoomMembers);

// ============ MESSAGE ROUTES ============
// POST - Send message (text, image, video, recommendation)
router.post("/:id/messages", communityController.sendMessage);

// GET - Get messages dengan pagination
router.get("/:id/messages", communityController.getMessages);

// GET - Get latest messages (untuk initial load)
router.get("/:id/messages/latest", communityController.getLatestMessages);

// DELETE - Delete message
router.delete("/messages/:message_id", communityController.deleteMessage);

// ============ CHAT ROOM DETAIL ============
// GET - Get chat room by ID (harus paling akhir karena bisa conflict)
router.get("/:id", communityController.getChatRoomById);

module.exports = router;