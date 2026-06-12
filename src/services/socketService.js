import io from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      this.socket.on("error", (error) => {
        console.error("🔴 Socket error:", error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Join chat room
  joinRoom(chat_room_id, user_id, username) {
    if (this.socket) {
      this.socket.emit("join_room", { chat_room_id, user_id, username });
    }
  }

  // Leave chat room
  leaveRoom(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("leave_room", { chat_room_id, username });
    }
  }

  // Send message
  sendMessage(chat_room_id, sender_id, message_type = "text", body = null, media_url = null, recommended_event_id = null) {
    if (this.socket) {
      this.socket.emit("send_message", {
        chat_room_id,
        sender_id,
        message_type,
        body,
        media_url,
        recommended_event_id,
      });
    }
  }

  // Typing indicator
  userTyping(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("user_typing", { chat_room_id, username });
    }
  }

  // Stop typing
  userStopTyping(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("user_stop_typing", { chat_room_id, username });
    }
  }

  // Listen to new message
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  // Listen to user joined
  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on("user_joined", callback);
    }
  }

  // Listen to user left
  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on("user_left", callback);
    }
  }

  // Listen to user typing
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  // Listen to user stop typing
  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback);
    }
  }

  // Listen to socket errors
  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  // Remove listener
  removeListener(event,callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();