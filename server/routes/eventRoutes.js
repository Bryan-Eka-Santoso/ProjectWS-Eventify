const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const upload = require("../middlewares/upload");

// 1. Route untuk mengambil data event berdasarkan status & filter
router.get("/published", eventController.getPublishedEvents);
router.get("/my-events", eventController.getMyEvents);

// 2. Route untuk mengambil daftar kategori dari database (Dipakai React CreateEvent & Events Filter)
router.get("/categories", eventController.getCategories);

// 3. Route untuk membuat event baru (dengan upload gambar utama & album)
router.post(
  "/",
  upload.fields([
    { name: "main_image", maxCount: 1 },
    { name: "album", maxCount: 10 },
  ]),
  eventController.createEvent,
);

// 4. Route detail dan manajemen data event (Wajib di bawah rute spesifik seperti /categories)
router.get("/:id", eventController.getEventById);
router.put("/:id", eventController.updateEvent);
router.patch("/:id/status", eventController.updateStatus);

module.exports = router;
