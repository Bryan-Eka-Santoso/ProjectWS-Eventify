import io from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    const token = localStorage.getItem("token");

    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: (cb) => {
          const token = localStorage.getItem("token");
          cb({ token });
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket.id);
      });

      this.socket.on("connect_error", (error) => {
        console.error("🔴 Socket connect error:", error.message);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
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

  // =====================================================
  // CHAT ROOM SOCKET
  // =====================================================

  joinRoom(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("join_room", { chat_room_id, username });
    }
  }

  leaveRoom(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("leave_room", { chat_room_id, username });
    }
  }

  sendMessage(
    chat_room_id,
    message_type = "text",
    body = null,
    media_url = null,
    recommended_event_id = null
  ) {
    if (this.socket) {
      this.socket.emit("send_message", {
        chat_room_id,
        message_type,
        body,
        media_url,
        recommended_event_id,
      });
    }
  }

  userTyping(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("user_typing", { chat_room_id, username });
    }
  }

  userStopTyping(chat_room_id, username) {
    if (this.socket) {
      this.socket.emit("user_stop_typing", { chat_room_id, username });
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on("user_joined", callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on("user_left", callback);
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback);
    }
  }

  // =====================================================
  // NOTIFICATION SOCKET
  // =====================================================

  joinNotification() {
    if (this.socket) {
      this.socket.emit("join_notification");
    }
  }

  leaveNotification() {
    if (this.socket) {
      this.socket.emit("leave_notification");
    }
  }

  onNotificationJoined(callback) {
    if (this.socket) {
      this.socket.on("notification:joined", callback);
    }
  }

  onNotificationLeft(callback) {
    if (this.socket) {
      this.socket.on("notification:left", callback);
    }
  }

  onNotificationNew(callback) {
    if (this.socket) {
      this.socket.on("notification:new", callback);
    }
  }

  onNotificationError(callback) {
    if (this.socket) {
      this.socket.on("notification:error", callback);
    }
  }

  // =====================================================
  // GENERAL SOCKET HELPER
  // =====================================================

  onConnect(callback) {
    if (this.socket) {
      this.socket.on("connect", callback);
    }
  }

  onDisconnect(callback) {
    if (this.socket) {
      this.socket.on("disconnect", callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();