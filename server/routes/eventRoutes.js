const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");

// Definisi Rute Event
router.get("/published", eventController.getPublishedEvents);
router.get("/my-events", eventController.getMyEvents);
router.post("/", eventController.createEvent);
router.get("/:id", eventController.getEventById);
router.put("/:id", eventController.updateEvent);
router.patch("/:id/status", eventController.updateStatus);

module.exports = router;
