const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const upload = require("../middlewares/upload");

// ==========================================
// 🔥 ROUTE BARU KHUSUS TRANSAKSI TIKET & MIDTRANS SNAP GATEWAY
// ==========================================
router.post("/tickets/checkout", eventController.createTicketCheckout);
router.post(
  "/tickets/midtrans-callback",
  eventController.handleMidtransCallback,
);
router.get("/tickets/my-tickets", eventController.getUserTicketsList);

// ==========================================
// 🔥 ROUTE BARU KHUSUS VOUCHER & POIN (Ditaruh atas biar ga tabrakan slug /:id)
// ==========================================
router.get("/vouchers/user-points", eventController.getUserPoints);
router.get("/vouchers/shop-list", eventController.getAllVouchers);
router.post("/vouchers/claim", eventController.claimVoucher);
router.get("/vouchers/my-vouchers", eventController.getMyVouchers);

// 1. Route untuk mengambil data event berdasarkan status & filter
router.get("/published", eventController.getPublishedEvents);
router.get("/my-events", eventController.getMyEvents);

// TAMBAHAN FITUR SAVED EVENTS: Tarik list event yang disimpan per user
router.get("/saved-list", eventController.getSavedEventsList);

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
router.post("/follow-external", eventController.followExternalEvent);

// TAMBAHAN FITUR SAVED EVENTS: Toggle save dan cek status save
router.post("/toggle-save", eventController.toggleSaveEvent);
router.get("/:id/check-save", eventController.checkSaveStatus);

module.exports = router;
