const rateLimit = require("express-rate-limit");

const organizerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,

  message: {
    status: "error",
    message: "Too many requests.",
  },
});

module.exports = organizerLimiter;
