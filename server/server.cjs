const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

// 🎯 FIXED: Path disesuaikan karena .env sudah masuk ke dalam folder server gess!
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const app = express();

// =====================================================
// ROUTES IMPORT
// =====================================================
const eventRoutes = require("./routes/eventRoutes");
const communityRoutes = require("./routes/communityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

// =====================================================
// SOCKET IMPORT
// =====================================================
const socketService = require("./sockets/socketService");
const communitySocket = require("./sockets/communitySocket");
const notificationSocket = require("./sockets/notification");

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

// Static file uploads
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// =====================================================
// API ROUTES
// =====================================================
app.use("/api/auth", require("./routes/auth.cjs"));
app.use("/api/events", eventRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/notifications", notificationRoutes);

// =====================================================
// HTTP SERVER + SOCKET.IO
// =====================================================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

// Simpan instance io agar bisa dipakai di service lain
socketService.setIo(io);

// Jalankan socket handler
communitySocket(io);
notificationSocket(io);

// Optional: kalau suatu saat controller butuh akses io langsung
app.set("io", io);

// =====================================================
// RUN SERVER
// =====================================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});