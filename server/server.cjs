const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

const eventRoutes = require("./routes/eventRoutes");
const communityRoutes = require("./routes/community");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/events", eventRoutes);
app.use("/api/community", communityRoutes);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/api/auth", require("./routes/auth.cjs"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
