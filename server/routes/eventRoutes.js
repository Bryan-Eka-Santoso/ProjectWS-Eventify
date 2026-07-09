const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const upload = require("../middlewares/upload");

const verifyToken = require("../middlewares/verifyJWT").verifyToken;
const checkRoles = require("../middlewares/checkRoles").checkRoles;

const apiLimiter = require("../middlewares/apiLimiter");
const uploadLimiter = require("../middlewares/uploadLimiter");

// ==========================================
// 🔥 ROUTE BARU KHUSUS TRANSAKSI TIKET & MIDTRANS SNAP GATEWAY
// ==========================================

router.use(apiLimiter);
router.use(verifyToken);

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
const validate = require("../middlewares/validate");
const eventValidation = require("../validators/eventValidation");

// =====================================================
// GET EVENTS
// =====================================================

// Ambil event published + filter kategori
router.get(
  "/published",
  validate({ query: eventValidation.getPublishedEventsQuerySchema }),
  eventController.getPublishedEvents,
);

// Ambil event milik organizer/admin
router.get(
  "/my-events",
  validate({ query: eventValidation.getMyEventsQuerySchema }),
  eventController.getMyEvents,
);

// Ambil saved event milik user
router.get(
  "/saved-list",
  validate({ query: eventValidation.savedEventsQuerySchema }),
  eventController.getSavedEventsList,
);

// Ambil categories
router.get("/categories", eventController.getCategories);

// =====================================================
// 🔥 GEOAPIFY LOCATION AUTOCOMPLETE
// Route ini dipanggil frontend saat user mengetik lokasi event.
// Harus ditaruh sebelum route /:id agar tidak dianggap sebagai ID event.
// =====================================================
router.get("/locations/autocomplete", eventController.searchLocationGeoapify);

// =====================================================
// CREATE EVENT
// =====================================================

router.post(
  "/",
  upload.fields([
    { name: "main_image", maxCount: 1 },
    { name: "album", maxCount: 10 },
  ]),
  validate({ body: eventValidation.createEventBodySchema }),
  eventController.createEvent,
);

// =====================================================
// EXTERNAL EVENT
// Taruh sebelum /:id agar route lebih aman dan rapi
// =====================================================

router.post(
  "/follow-external",
  validate({ body: eventValidation.followExternalEventBodySchema }),
  eventController.followExternalEvent,
);

// =====================================================
// SAVED EVENT
// Taruh sebelum /:id agar route lebih aman dan rapi
// =====================================================

router.post(
  "/toggle-save",
  validate({ body: eventValidation.toggleSaveEventBodySchema }),
  eventController.toggleSaveEvent,
);

router.get(
  "/:id/check-save",
  validate({
    params: eventValidation.eventIdParamsSchema,
    query: eventValidation.checkSaveStatusQuerySchema,
  }),
  eventController.checkSaveStatus,
);

// =====================================================
// EVENT UPDATE / STATUS
// =====================================================

router.put(
  "/:id",
  upload.fields([
    { name: "main_image", maxCount: 1 },
    { name: "album", maxCount: 10 },
  ]),
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.updateEventBodySchema,
  }),
  eventController.updateEvent,
);

router.patch(
  "/:id/status",
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.updateStatusBodySchema,
  }),
  eventController.updateStatus,
);

// =====================================================
// CANCEL EVENT / REFUND FLOW
// Jangan aktifkan dulu kalau function controller-nya belum dibuat.
// Nanti setelah kita rewrite eventController, bagian ini bisa dibuka.
// =====================================================

router.patch(
  "/:id/cancel",
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.cancelEventBodySchema,
  }),
  eventController.cancelEvent,
);

router.post(
  "/:id/refund-request",
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.requestRefundBodySchema,
  }),
  eventController.requestRefundAfterEventChanged,
);

// =====================================================
// ADMIN CANCELLATION REQUEST ROUTES
// =====================================================

router.get(
  "/cancellation-requests",
  validate({
    query: eventValidation.getCancellationRequestsQuerySchema,
  }),
  eventController.getCancellationRequests,
);

router.patch(
  "/cancellation-requests/:request_id/approve",
  validate({
    params: eventValidation.cancellationRequestIdParamsSchema,
    body: eventValidation.approveCancellationRequestBodySchema,
  }),
  eventController.approveCancellationRequest,
);

router.patch(
  "/cancellation-requests/:request_id/reject",
  validate({
    params: eventValidation.cancellationRequestIdParamsSchema,
    body: eventValidation.rejectCancellationRequestBodySchema,
  }),
  eventController.rejectCancellationRequest,
);

//pakai ticket
router.patch(
  "/:id/tickets/validate",
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.validateTicketBodySchema,
  }),
  eventController.validateTicketCode,
);
router.get(
  "/:id/changes/:event_change_id/refund-info",
  eventController.getEventChangeRefundInfo,
);
// =====================================================
// DETAIL EVENT
// Harus di bawah route spesifik
// =====================================================

router.get(
  "/:id",
  validate({ params: eventValidation.eventIdParamsSchema }),
  eventController.getEventById,
);

module.exports = router;
