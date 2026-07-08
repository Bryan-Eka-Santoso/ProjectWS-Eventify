const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    status: "error",
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

module.exports = authLimiter;
