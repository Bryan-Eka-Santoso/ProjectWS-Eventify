const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");
const upload = require("../middlewares/upload");

const verifyToken = require("../middlewares/verifyJWT").verifyToken;
const checkRoles = require("../middlewares/checkRoles").checkRoles;

const apiLimiter = require("../middlewares/apiLimiter");
const uploadLimiter = require("../middlewares/uploadLimiter");

const { verifyToken } = require("../middlewares/verifyJWT");
const { checkRoles } = require("../middlewares/checkRoles");

const validate = require("../middlewares/validate");
const eventValidation = require("../validators/eventValidation");
// ==========================================
// 🔥 ROUTE BARU KHUSUS TRANSAKSI TIKET & MIDTRANS SNAP GATEWAY
// ==========================================
router.post("/tickets/checkout", eventController.createTicketCheckout);
router.post(
  "/tickets/midtrans-callback",
  eventController.handleMidtransCallback,
);
router.get("/tickets/my-tickets", verifyToken, eventController.getUserTicketsList);

// ==========================================
// 🔥 ROUTE BARU KHUSUS VOUCHER & POIN (Ditaruh atas biar ga tabrakan slug /:id)
// ==========================================
router.get("/vouchers/user-points", verifyToken, eventController.getUserPoints);
router.get("/vouchers/shop-list", eventController.getAllVouchers);
router.post("/vouchers/claim", verifyToken, eventController.claimVoucher);
router.get("/vouchers/my-vouchers", verifyToken, eventController.getMyVouchers);

// 🔥 ADMIN VOUCHER (DISCOUNT) CRUD
router.get(
  "/vouchers/admin-list",
  verifyToken,
  checkRoles("admin"),
  eventController.getAllVouchersAdmin
);

router.post(
  "/vouchers",
  verifyToken,
  checkRoles("admin"),
  eventController.createVoucher
);

router.put(
  "/vouchers/:id",
  verifyToken,
  checkRoles("admin"),
  eventController.updateVoucher
);

router.delete(
  "/vouchers/:id",
  verifyToken,
  checkRoles("admin"),
  eventController.deleteVoucher
);

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
  verifyToken,
  checkRoles("admin", "organizer"),
  eventController.getMyEvents,
);

// 🔥 ADMIN: ambil SEMUA event dari semua organizer + filter status

router.get(
  "/admin/all-events",
  verifyToken,
  checkRoles("admin"),
  eventController.getAllEventsAdmin
);

// Ambil saved event milik user
router.get(
  "/saved-list",
  verifyToken,
  eventController.getSavedEventsList,
);

// Ambil categories
router.get("/categories", eventController.getCategories);

// =====================================================
// 🔥 ADMIN CATEGORY CRUD (create/update/delete)
// Ditaruh sebelum route /:id agar tidak dianggap ID event.
// =====================================================
router.post(
  "/categories",
  verifyToken,
  checkRoles("admin"),
  eventController.createCategory
);

router.put(
  "/categories/:id",
  verifyToken,
  checkRoles("admin"),
  eventController.updateCategory
);

router.delete(
  "/categories/:id",
  verifyToken,
  checkRoles("admin"),
  eventController.deleteCategory
);

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
  verifyToken,
  checkRoles("admin", "organizer"),
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
  verifyToken,
  checkRoles("admin", "organizer"),
  validate({ body: eventValidation.followExternalEventBodySchema }),
  eventController.followExternalEvent,
);

// =====================================================
// SAVED EVENT
// Taruh sebelum /:id agar route lebih aman dan rapi
// =====================================================

router.post(
  "/toggle-save",
  verifyToken,
  validate({ body: eventValidation.toggleSaveEventBodySchema }),
  eventController.toggleSaveEvent,
);

router.get(
  "/:id/check-save",
  verifyToken,
  validate({
    params: eventValidation.eventIdParamsSchema,
  }),
  eventController.checkSaveStatus,
);

// =====================================================
// EVENT UPDATE / STATUS
// =====================================================

router.put(
  "/:id",
  verifyToken,
  checkRoles("admin", "organizer"),
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
  verifyToken,
  checkRoles("admin"),
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
  verifyToken,
  checkRoles("admin", "organizer"),
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.cancelEventBodySchema,
  }),
  eventController.cancelEvent,
);

router.post(
  "/:id/refund-request",
  verifyToken,
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
  verifyToken,
  checkRoles("admin"),
  validate({
    query: eventValidation.getCancellationRequestsQuerySchema,
  }),
  eventController.getCancellationRequests,
);

router.patch(
  "/cancellation-requests/:request_id/approve",
  verifyToken,
  checkRoles("admin"),
  validate({
    params: eventValidation.cancellationRequestIdParamsSchema,
    body: eventValidation.approveCancellationRequestBodySchema,
  }),
  eventController.approveCancellationRequest,
);

router.patch(
  "/cancellation-requests/:request_id/reject",
  verifyToken,
  checkRoles("admin"),
  validate({
    params: eventValidation.cancellationRequestIdParamsSchema,
    body: eventValidation.rejectCancellationRequestBodySchema,
  }),
  eventController.rejectCancellationRequest,
);

//pakai ticket
router.patch(
  "/:id/tickets/validate",
  verifyToken,
  checkRoles("admin", "organizer"),
  validate({
    params: eventValidation.eventIdParamsSchema,
    body: eventValidation.validateTicketBodySchema,
  }),
  eventController.validateTicketCode,
);
router.get(
  "/:id/changes/:event_change_id/refund-info",
  verifyToken,
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
