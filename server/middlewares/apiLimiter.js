const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,

  message: {
    status: "error",
    message: "Too many requests.",
  },
});

module.exports = apiLimiter;
