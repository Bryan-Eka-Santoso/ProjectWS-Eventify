const rateLimit = require("express-rate-limit");

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,

  message: {
    status: "error",
    message: "Upload limit exceeded.",
  },
});

module.exports = uploadLimiter;
