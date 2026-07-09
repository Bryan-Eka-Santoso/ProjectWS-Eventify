const db = require("../models");
const { User } = db;

module.exports = (io) => {
  io.on("connection", (socket) => {
    // User join room notifikasi pribadi
    socket.on("join_notification", async (data) => {
      try {
        const user_id = socket.user.id;

        if (!user_id) {
          socket.emit("notification:error", {
            message: "user_id is required",
          });
          return;
        }

        const user = await User.findByPk(user_id);

        if (!user) {
          socket.emit("notification:error", {
            message: "User tidak ditemukan",
          });
          return;
        }

        socket.join(`user_${user_id}`);
        socket.user_id = user_id;

        console.log(`🔔 User ${user_id} joined notification room`);

        socket.emit("notification:joined", {
          message: "Berhasil masuk room notifikasi",
          user_id,
        });
      } catch (error) {
        console.error("Error join notification:", error);
        socket.emit("notification:error", {
          message: "Gagal masuk room notifikasi",
        });
      }
    });

    // User keluar dari room notifikasi pribadi
    socket.on("leave_notification", (data) => {
      try {
        const user_id = socket.user.id;

        if (!user_id) {
          socket.emit("notification:error", {
            message: "user_id is required",
          });
          return;
        }

        socket.leave(`user_${user_id}`);

        console.log(`🔕 User ${user_id} left notification room`);

        socket.emit("notification:left", {
          message: "Berhasil keluar dari room notifikasi",
          user_id,
        });
      } catch (error) {
        console.error("Error leave notification:", error);
        socket.emit("notification:error", {
          message: "Gagal keluar dari room notifikasi",
        });
      }
    });
  });
};