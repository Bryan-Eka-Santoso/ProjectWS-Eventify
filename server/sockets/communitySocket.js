const db = require("../models");
const { ChatRoom, ChatRoomMember, Message } = db;

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // ============ JOIN CHAT ROOM ============
    socket.on("join_room", async (data) => {
      try {
        const { chat_room_id, username } = data;
        const user_id = socket.user.id;

        // Validate
        if (!chat_room_id || !user_id) {
          socket.emit("error", { message: "chat_room_id and user_id required" });
          return;
        }

        // Check if user is member
        const isMember = await ChatRoomMember.findOne({
          where: { chat_room_id, user_id },
        });

        if (!isMember) {
          socket.emit("error", { message: "User is not a member of this room" });
          return;
        }

        // Join socket room
        socket.join(`room_${chat_room_id}`);
        socket.user_id = user_id;
        socket.chat_room_id = chat_room_id;
        socket.username = username;

        console.log(`👤 ${username} joined room ${chat_room_id}`);

        // Notify other users in room
        io.to(`room_${chat_room_id}`).emit("user_joined", {
          user_id,
          username,
          message: `${username} bergabung dengan ruangan`,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ============ SEND MESSAGE ============
    socket.on("send_message", async (data) => {
      try {
        const {
          chat_room_id,
          message_type = "text",
          body,
          media_url,
          recommended_event_id,
        } = data;

        const sender_id = socket.user.id;

        // Validate
        if (!chat_room_id || !sender_id) {
          socket.emit("error", { message: "chat_room_id and sender_id required" });
          return;
        }

        // Check if user is member
        const isMember = await ChatRoomMember.findOne({
          where: { chat_room_id, user_id: sender_id },
        });

        if (!isMember) {
          socket.emit("error", { message: "User is not a member of this room" });
          return;
        }

        // Create message di database
        const newMessage = await Message.create({
          chat_room_id,
          sender_id,
          message_type,
          body: body || null,
          media_url: media_url || null,
          recommended_event_id: recommended_event_id || null,
        });

        // Broadcast ke semua user di room
        io.to(`room_${chat_room_id}`).emit("new_message", {
          id: newMessage.id,
          chat_room_id,
          sender_id,
          username: socket.username,
          message_type,
          body,
          media_url,
          recommended_event_id,
          created_at: newMessage.created_at,
        });

        console.log(`💬 Message from ${socket.username} in room ${chat_room_id}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ============ TYPING INDICATOR ============
    socket.on("user_typing", (data) => {
      try {
        const { chat_room_id, username } = data;

        // Broadcast ke semua user kecuali pengirim
        socket.to(`room_${chat_room_id}`).emit("user_typing", {
          username,
          message: `${username} sedang mengetik...`,
        });
      } catch (error) {
        console.error("Error in typing indicator:", error);
      }
    });

    // ============ STOP TYPING ============
    socket.on("user_stop_typing", (data) => {
      try {
        const { chat_room_id, username } = data;

        socket.to(`room_${chat_room_id}`).emit("user_stop_typing", {
          username,
        });
      } catch (error) {
        console.error("Error in stop typing:", error);
      }
    });

    // ============ LEAVE ROOM ============
    socket.on("leave_room", (data) => {
      try {
        const { chat_room_id, username } = data;

        socket.leave(`room_${chat_room_id}`);

        io.to(`room_${chat_room_id}`).emit("user_left", {
          username,
          message: `${username} meninggalkan ruangan`,
          timestamp: new Date(),
        });

        console.log(`👋 ${username} left room ${chat_room_id}`);
      } catch (error) {
        console.error("Error leaving room:", error);
      }
    });

    // ============ DISCONNECT ============
    socket.on("disconnect", () => {
      const { username, chat_room_id } = socket;

      if (chat_room_id) {
        io.to(`room_${chat_room_id}`).emit("user_left", {
          username,
          message: `${username} terputus dari koneksi`,
          timestamp: new Date(),
        });
      }

      console.log(`❌ User disconnected: ${socket.id}`);
    });

    // ============ ERROR HANDLER ============
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
};