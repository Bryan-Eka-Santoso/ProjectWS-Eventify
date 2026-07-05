const db = require("../models");

const Event = db.Event;
const EventImage = db.EventImage;
const Category = db.Category;
const User = db.User;
const SavedEvent = db.SavedEvent; // 🎯 Sekarang ini dijamin 100% aman dan terbaca karena sudah didaftarkan di index.js!
const OrganizerApplication = db.OrganizerApplication;

const { Op } = require("sequelize");

const EventChange = db.EventChange;
const EventCancellationRequest = db.EventCancellationRequest;
const Transaction = db.Transaction;
const TransactionDetail = db.TransactionDetail;
const TicketType = db.TicketType;
const notificationService = require("../services/notificationService");
const refundService = require("../services/refundService");
const emailService = require("../services/emailService");

const MAJOR_CHANGE_LIMIT_DAYS = 4;
const REFUND_WINDOW_HOURS = 72;

const sendError = (res, statusCode, message, error = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(error && { error }),
  });
};

const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && { data }),
  });
};

const addHours = (date, hours) => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

const getDaysBeforeEvent = (startDate) => {
  const now = new Date();
  const eventStart = new Date(startDate);
  const diffMs = eventStart - now;

  return diffMs / (1000 * 60 * 60 * 24);
};

const isBeforeMajorChangeLimit = (event) => {
  const daysBeforeEvent = getDaysBeforeEvent(event.start_date);
  return daysBeforeEvent < MAJOR_CHANGE_LIMIT_DAYS;
};

const getOrganizerApplicationByUser = async (user_id) => {
  return await OrganizerApplication.findOne({
    where: { user_id },
  });
};

const canManageEvent = async ({ event, user_id, role }) => {
  if (role === "admin") {
    return {
      allowed: true,
      organizerApplication: null,
    };
  }

  if (role !== "organizer") {
    return {
      allowed: false,
      message: "Only admin or organizer can manage event",
    };
  }

  const organizerApplication = await getOrganizerApplicationByUser(user_id);

  if (!organizerApplication) {
    return {
      allowed: false,
      message: "Organizer application not found",
    };
  }

  // Catatan:
  // Project kamu sekarang ada kemungkinan organizer_id menyimpan id organizer_applications.
  // Tapi migration awal biasanya organizer_id mengarah ke users.id.
  // Jadi pengecekan dibuat fleksibel agar tidak langsung error.
  const isOwnerByApplicationId =
    parseInt(event.organizer_id) === parseInt(organizerApplication.id);

  const isOwnerByUserId = parseInt(event.organizer_id) === parseInt(user_id);

  if (!isOwnerByApplicationId && !isOwnerByUserId) {
    return {
      allowed: false,
      message: "You are not allowed to manage this event",
    };
  }

  return {
    allowed: true,
    organizerApplication,
  };
};

const getChangeType = ({
  isScheduleChanged,
  isLocationChanged,
}) => {
  if (isScheduleChanged && isLocationChanged) return "schedule_location";
  if (isScheduleChanged) return "schedule";
  if (isLocationChanged) return "location";
  return "minor";
};

const getEventBuyers = async (event_id) => {
  const transactions = await Transaction.findAll({
    where: {
      payment_status: "paid",
    },
    include: [
      {
        model: TransactionDetail,
        as: "Details",
        required: true,
        include: [
          {
            model: TicketType,
            as: "TicketType",
            required: true,
            where: { event_id },
          },
        ],
      },
    ],
  });

  const userIds = [
    ...new Set(transactions.map((transaction) => transaction.user_id)),
  ];

  if (userIds.length === 0) return [];

  return await User.findAll({
    where: {
      id: {
        [Op.in]: userIds,
      },
    },
  });
};

const sendEventChangedEmails = async ({ users, event, eventChange }) => {
  for (const user of users) {
    try {
      await emailService.sendEventChangedEmail({
        to: user.email,
        name: user.name,
        event,
        eventChange,
      });
    } catch (error) {
      console.error("Failed to send event changed email:", error.message);
    }
  }
};

const sendEventCanceledEmails = async ({ users, event }) => {
  for (const user of users) {
    try {
      await emailService.sendEventCanceledEmail({
        to: user.email,
        name: user.name,
        event,
      });
    } catch (error) {
      console.error("Failed to send event canceled email:", error.message);
    }
  }
};

const eventController = {
  createEvent: async (req, res) => {
    try {
      const {
        title,
        description,
        location,
        start_date,
        end_date,
        category_ids,
        user_id,
        role,
      } = req.body;
      const main_image =
        req.files && req.files.main_image
          ? req.files.main_image[0].filename
          : "default.jpg";

      // 🛡️ VALIDASI MODEL USER: Cek apakah user yang bikin beneran terdaftar di SQL DB kamu
      const checkUser = await User.findByPk(user_id);
      if (!checkUser) {
        return res
          .status(404)
          .json({ message: "User pembuat tidak ditemukan di database gess!" });
      }
      if (checkUser.role !== role) {
        return res.status(403).json({
          message:
            "Manipulasi data terdeteksi! Role tidak cocok dengan database.",
        });
      }

      let organizerIdValue = null;
      const eventStatusValue = role === "admin" ? "published" : "draft";

      if (role === "organizer") {
        const app = await OrganizerApplication.findOne({
          where: { user_id: user_id },
        });
        if (!app) {
          return res.status(400).json({
            message: "Kamu belum terdaftar atau disetujui sebagai Organizer!",
          });
        }
        organizerIdValue = app.user_id;
      }

      const newEvent = await Event.create({
        organizer_id: organizerIdValue,
        title,
        description,
        location,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        main_image_url: main_image,
        status: eventStatusValue,
      });

      if (category_ids) {
        const ids = category_ids.split(",").map(Number);
        await newEvent.addCategories(ids);
      }

      if (req.files && req.files.album) {
        const albumImages = req.files.album.map((file) => ({
          event_id: newEvent.id,
          image_url: file.filename,
        }));
        await EventImage.bulkCreate(albumImages);
      }

      res.status(201).json({
        message:
          role === "admin"
            ? "Event berhasil di-publish oleh Admin!"
            : "Event berhasil disimpan sebagai Draft oleh Organizer!",
        data: newEvent,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error saat membuat event." });
    }
  },

  getMyEvents: async (req, res) => {
    try {
      const { user_id, role } = req.query;

      let whereClause = {};

      if (role === "organizer") {
        const app = await OrganizerApplication.findOne({
          where: { user_id: user_id },
        });
        if (app) {
          whereClause = { organizer_id: user_id };
        } else {
          whereClause = { organizer_id: -1 };
        }
      } else if (role === "admin") {
        whereClause = { organizer_id: null };
      }

      const events = await Event.findAll({ where: whereClause });
      res.json(events);
    } catch (error) {
      console.error("Error getMyEvents:", error);
      res.status(500).json({ message: "Gagal memuat daftar event kamu." });
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      await Event.update({ status }, { where: { id } });
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getPublishedEvents: async (req, res) => {
    try {
      const { category_id } = req.query;

      let options = {
        where: { status: "published" },
        include: [
          {
            model: Category,
            as: "Categories",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
        order: [["start_date", "ASC"]],
      };

      if (category_id) {
        options.include[0].where = { id: category_id };
        options.include[0].required = true;
      }

      const events = await Event.findAll(options);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getEventById: async (req, res) => {
    try {
      const { id } = req.params;

      // 🎯 SEKARANG GET DETAIL TURUT MELAKUKAN JOIN TABLE YANG RELEVAN
      const event = await Event.findByPk(id, {
        include: [
          { model: EventImage, as: "images" },
          {
            model: User,
            as: "Organizer",
            attributes: ["id", "name", "email", "role"],
          },
          {
            model: Category,
            as: "Categories",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
        ],
      });

      if (!event) {
        return res.status(404).json({ message: "Event tidak ditemukan" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        user_id,
        role,
        title,
        description,
        location,
        start_date,
        end_date,
        category_ids,
        change_reason,
      } = req.body;

      const event = await Event.findByPk(id);

      if (!event) {
        return sendError(res, 404, "Event tidak ditemukan");
      }

      if (event.status === "canceled") {
        return sendError(
          res,
          400,
          "Event yang sudah dibatalkan tidak bisa diedit"
        );
      }

      const permission = await canManageEvent({
        event,
        user_id,
        role,
      });

      if (!permission.allowed) {
        return sendError(res, 403, permission.message);
      }

      const oldStartDate = event.start_date ? new Date(event.start_date) : null;
      const oldEndDate = event.end_date ? new Date(event.end_date) : null;
      const oldLocation = event.location;

      const newStartDate = start_date ? new Date(start_date) : oldStartDate;
      const newEndDate = end_date ? new Date(end_date) : oldEndDate;
      const newLocation = location !== undefined ? location : oldLocation;

      const isStartChanged =
        start_date &&
        oldStartDate &&
        oldStartDate.getTime() !== newStartDate.getTime();

      const isEndChanged =
        end_date &&
        oldEndDate &&
        oldEndDate.getTime() !== newEndDate.getTime();

      const isScheduleChanged = Boolean(isStartChanged || isEndChanged);

      const isLocationChanged =
        location !== undefined &&
        String(oldLocation).trim() !== String(newLocation).trim();

      const isMajorChange = isScheduleChanged || isLocationChanged;

      if (isMajorChange && isBeforeMajorChangeLimit(event)) {
        return sendError(
          res,
          400,
          "Perubahan jadwal/lokasi hanya bisa dilakukan maksimal H-4 sebelum event dimulai"
        );
      }

      const updateData = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      if (start_date !== undefined) updateData.start_date = newStartDate;
      if (end_date !== undefined) updateData.end_date = newEndDate;

      if (req.files && req.files.main_image) {
        updateData.main_image_url = req.files.main_image[0].filename;
      }

      await event.update(updateData);

      if (category_ids) {
        const ids = category_ids.split(",").map(Number);
        await event.setCategories(ids);
      }

      if (req.files && req.files.album) {
        const albumImages = req.files.album.map((file) => ({
          event_id: event.id,
          image_url: file.filename,
        }));

        await EventImage.bulkCreate(albumImages);
      }

      let eventChange = null;
      let notifiedUsers = [];

      if (isMajorChange) {
        const refundDeadline = addHours(new Date(), REFUND_WINDOW_HOURS);

        eventChange = await EventChange.create({
          event_id: event.id,
          changed_by: user_id,
          change_type: getChangeType({
            isScheduleChanged,
            isLocationChanged,
          }),
          old_start_date: isScheduleChanged ? oldStartDate : null,
          new_start_date: isScheduleChanged ? newStartDate : null,
          old_end_date: isScheduleChanged ? oldEndDate : null,
          new_end_date: isScheduleChanged ? newEndDate : null,
          old_location: isLocationChanged ? oldLocation : null,
          new_location: isLocationChanged ? newLocation : null,
          change_reason: change_reason || null,
          refund_deadline: refundDeadline,
          status: "active",
        });

        notifiedUsers = await getEventBuyers(event.id);

        if (notifiedUsers.length > 0) {
          await notificationService.notifyEventChanged({
            users: notifiedUsers,
            actor_id: user_id,
            event,
            eventChange,
          });

          await sendEventChangedEmails({
            users: notifiedUsers,
            event,
            eventChange,
          });
        }
      }

      return sendSuccess(res, 200, "Event berhasil diperbarui", {
        event,
        is_major_change: isMajorChange,
        event_change: eventChange,
        notified_users_count: notifiedUsers.length,
      });
    } catch (error) {
      console.error("Error updateEvent:", error);
      return sendError(res, 500, "Gagal memperbarui event", error.message);
    }
  },

  cancelEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, role, cancellation_reason } = req.body;

      const event = await Event.findByPk(id);

      if (!event) {
        return sendError(res, 404, "Event tidak ditemukan");
      }

      if (event.status === "canceled") {
        return sendError(res, 400, "Event sudah dibatalkan sebelumnya");
      }

      const permission = await canManageEvent({
        event,
        user_id,
        role,
      });

      if (!permission.allowed) {
        return sendError(res, 403, permission.message);
      }

      const isLessThanH4 = isBeforeMajorChangeLimit(event);

      if (role === "organizer" && isLessThanH4) {
        const existingPendingRequest = await EventCancellationRequest.findOne({
          where: {
            event_id: event.id,
            status: "pending",
          },
        });

        if (existingPendingRequest) {
          return sendError(
            res,
            400,
            "Request pembatalan event ini masih menunggu approval admin"
          );
        }

        const cancelRequest = await EventCancellationRequest.create({
          event_id: event.id,
          requested_by: user_id,
          reason: cancellation_reason,
          status: "pending",
          requested_at: new Date(),
        });

        const admins = await User.findAll({
          where: {
            role: "admin",
          },
        });

        if (admins.length > 0) {
          await notificationService.createBulkNotifications(
            admins.map((admin) => ({
              recipient_id: admin.id,
              actor_id: user_id,
              type: "event_cancellation_requested",
              title: "Request pembatalan event",
              body: `Organizer mengajukan pembatalan event "${event.title}" karena sudah kurang dari H-4.`,
              target_type: "event_cancellation_request",
              target_id: cancelRequest.id,
              data: {
                event_id: event.id,
                event_title: event.title,
                cancellation_request_id: cancelRequest.id,
                reason: cancellation_reason,
              },
            }))
          );
        }

        return sendSuccess(
          res,
          202,
          "Event sudah kurang dari H-4, request pembatalan dikirim ke admin",
          cancelRequest
        );
      }

      await event.update({
        status: "canceled",
        cancellation_reason,
        canceled_at: new Date(),
        canceled_by: user_id,
      });

      const buyers = await getEventBuyers(event.id);

      if (buyers.length > 0) {
        await notificationService.notifyEventCanceled({
          users: buyers,
          actor_id: user_id,
          event,
        });

        await sendEventCanceledEmails({
          users: buyers,
          event,
        });
      }

      const refundResult = await refundService.createAutoRefundForCanceledEvent({
        event,
        actor_id: user_id,
        refund_method: "original_payment",
      });

      return sendSuccess(res, 200, "Event berhasil dibatalkan dan refund diproses", {
        event,
        notified_users_count: buyers.length,
        refund: refundResult,
      });
    } catch (error) {
      console.error("Error cancelEvent:", error);
      return sendError(res, 500, "Gagal membatalkan event", error.message);
    }
  },

  requestRefundAfterEventChanged: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, transaction_id, event_change_id, reason } = req.body;

      const refund = await refundService.requestRefundAfterEventChanged({
        user_id,
        transaction_id,
        event_id: id,
        event_change_id,
        reason,
      });

      return sendSuccess(res, 201, "Pengajuan refund berhasil dibuat", refund);
    } catch (error) {
      console.error("Error requestRefundAfterEventChanged:", error);

      return sendError(
        res,
        error.statusCode || 500,
        error.message || "Gagal mengajukan refund"
      );
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await Category.findAll();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  followExternalEvent: async (req, res) => {
    try {
      const { external_id, title, location, start_date, user_id, role } =
        req.body;

      let event = await Event.findOne({
        where: { external_id: String(external_id) },
      });
      if (event) {
        return res
          .status(400)
          .json({ message: "Event ini sudah pernah diadopsi!" });
      }

      // 🛡️ VALIDASI MODEL USER SAAT ADOPSI API GLOBAL
      const checkUser = await User.findByPk(user_id);
      if (!checkUser) {
        return res
          .status(404)
          .json({ message: "User pengadopsi tidak ditemukan gess!" });
      }

      let organizerIdValue = null;
      const eventStatusValue = role === "admin" ? "published" : "draft";

      if (role === "organizer") {
        const app = await OrganizerApplication.findOne({
          where: { user_id: user_id },
        });
        if (!app) {
          return res.status(400).json({
            message: "Kamu belum terdaftar atau disetujui sebagai Organizer!",
          });
        }
        organizerIdValue = user_id;
      }

      event = await Event.create({
        organizer_id: organizerIdValue,
        title: title,
        description: "Event internasional hasil kurasi.",
        location: location || "Online",
        start_date: new Date(start_date),
        end_date: new Date(start_date),
        main_image_url: "default-banner.jpg",
        status: eventStatusValue,
        external_id: String(external_id),
      });

      const customMessage =
        role === "admin"
          ? "Berhasil diadopsi dan LANGSUNG DI-PUBLISH (organizer_id = NULL)!"
          : "Berhasil disimpan ke Draf (organizer_id = ID Organizer Application)!";

      res.status(201).json({ message: customMessage, data: event });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error saat mengadopsi event eksternal." });
    }
  },

  // 🔥 FUNGSI 1: Toggle Save / Unsave Event (Gaya ORM)
  toggleSaveEvent: async (req, res) => {
    try {
      const { user_id, event_id } = req.body;

      // 🔍 Cari tahu apakah data bookmark sudah ada di database gess
      const alreadySaved = await SavedEvent.findOne({
        where: { user_id, event_id },
      });

      if (alreadySaved) {
        // Jika ketemu, langsung hapus (Unsave) gess! Lebih ringkas kan?
        await alreadySaved.destroy();
        return res.json({
          message: "Berhasil membatalkan simpan event!",
          isSaved: false,
        });
      } else {
        // Jika tidak ada, buat baris data baru (Save) gess!
        await SavedEvent.create({ user_id, event_id });
        return res.json({
          message: "Event berhasil disimpan gess!",
          isSaved: true,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal memproses bookmark event." });
    }
  },

  // 🔥 FUNGSI 2: Cek status apakah user sudah save event ini (Gaya ORM)
  checkSaveStatus: async (req, res) => {
    try {
      const { id } = req.params; // ini event_id
      const { user_id } = req.query;

      if (!user_id) return res.json({ isSaved: false });

      // Cukup hitung jumlah datanya, kalau > 0 berarti true gess
      const count = await SavedEvent.count({
        where: { user_id, event_id: id },
      });

      res.json({ isSaved: count > 0 });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // 🔥 FUNGSI 3: Tarik semua event yang disimpan user dengan teknik JOIN ORM (Include)
  getSavedEventsList: async (req, res) => {
    try {
      const { user_id } = req.query;

      // Ambil data langsung dari tabel SavedEvent, lalu JOIN otomatis ke tabel Event
      const savedList = await SavedEvent.findAll({
        where: { user_id },
        include: [
          {
            model: Event,
            as: "Event", // Pastikan alias ini sama dengan yang kamu set di file asosiasi models/savedevent.js
            required: true, // bertindak sebagai INNER JOIN gess
          },
        ],
      });

      // Map hasilnya biar frontend dapet data array object event murni langsung gess
      const eventsOnly = savedList.map((item) => item.Event);

      res.json(eventsOnly);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal memuat daftar simpanan event." });
    }
  },
  getCancellationRequests: async (req, res) => {
    try {
      const { user_id, role, status, page = 1, limit = 10 } = req.query;

      if (role !== "admin") {
        return sendError(res, 403, "Only admin can view cancellation requests");
      }

      const admin = await User.findByPk(user_id);

      if (!admin || admin.role !== "admin") {
        return sendError(res, 403, "Admin user not found or invalid role");
      }

      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      const offset = (parsedPage - 1) * parsedLimit;

      const requests = await EventCancellationRequest.findAll({
        where: whereClause,
        include: [
          {
            model: Event,
            as: "Event",
          },
          {
            model: User,
            as: "Requester",
            attributes: ["id", "name", "email", "role"],
          },
          {
            model: User,
            as: "Reviewer",
            attributes: ["id", "name", "email", "role"],
          },
        ],
        order: [["requested_at", "DESC"]],
        limit: parsedLimit,
        offset,
      });

      const total = await EventCancellationRequest.count({
        where: whereClause,
      });

      return sendSuccess(res, 200, "Cancellation requests retrieved successfully", {
        requests,
        pagination: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit),
        },
      });
    } catch (error) {
      console.error("Error getCancellationRequests:", error);
      return sendError(
        res,
        500,
        "Gagal mengambil cancellation requests",
        error.message
      );
    }
  },
  approveCancellationRequest: async (req, res) => {
    try {
      const { request_id } = req.params;
      const { user_id, role, admin_note } = req.body;

      if (role !== "admin") {
        return sendError(res, 403, "Only admin can approve cancellation request");
      }

      const admin = await User.findByPk(user_id);

      if (!admin || admin.role !== "admin") {
        return sendError(res, 403, "Admin user not found or invalid role");
      }

      const cancelRequest = await EventCancellationRequest.findByPk(request_id);

      if (!cancelRequest) {
        return sendError(res, 404, "Cancellation request tidak ditemukan");
      }

      if (cancelRequest.status !== "pending") {
        return sendError(
          res,
          400,
          "Cancellation request ini sudah diproses sebelumnya"
        );
      }

      const event = await Event.findByPk(cancelRequest.event_id);

      if (!event) {
        return sendError(res, 404, "Event tidak ditemukan");
      }

      if (event.status === "canceled") {
        return sendError(res, 400, "Event sudah dibatalkan sebelumnya");
      }

      await cancelRequest.update({
        status: "approved",
        reviewed_by: user_id,
        admin_note: admin_note || null,
        reviewed_at: new Date(),
      });

      await event.update({
        status: "canceled",
        cancellation_reason: cancelRequest.reason,
        canceled_at: new Date(),
        canceled_by: user_id,
      });

      const buyers = await getEventBuyers(event.id);

      if (buyers.length > 0) {
        await notificationService.notifyEventCanceled({
          users: buyers,
          actor_id: user_id,
          event,
        });

        await sendEventCanceledEmails({
          users: buyers,
          event,
        });
      }

      await notificationService.createNotification({
        recipient_id: cancelRequest.requested_by,
        actor_id: user_id,
        type: "event_cancellation_approved",
        title: "Pembatalan event disetujui",
        body: `Request pembatalan event "${event.title}" telah disetujui admin.`,
        target_type: "event",
        target_id: event.id,
        data: {
          event_id: event.id,
          event_title: event.title,
          cancellation_request_id: cancelRequest.id,
          admin_note: admin_note || null,
        },
      });

      const refundResult = await refundService.createAutoRefundForCanceledEvent({
        event,
        actor_id: user_id,
        refund_method: "original_payment",
      });

      return sendSuccess(
        res,
        200,
        "Cancellation request approved, event canceled, and refund processed",
        {
          cancellation_request: cancelRequest,
          event,
          notified_users_count: buyers.length,
          refund: refundResult,
        }
      );
    } catch (error) {
      console.error("Error approveCancellationRequest:", error);
      return sendError(
        res,
        500,
        "Gagal approve cancellation request",
        error.message
      );
    }
  },
  rejectCancellationRequest: async (req, res) => {
    try {
      const { request_id } = req.params;
      const { user_id, role, admin_note } = req.body;

      if (role !== "admin") {
        return sendError(res, 403, "Only admin can reject cancellation request");
      }

      const admin = await User.findByPk(user_id);

      if (!admin || admin.role !== "admin") {
        return sendError(res, 403, "Admin user not found or invalid role");
      }

      const cancelRequest = await EventCancellationRequest.findByPk(request_id);

      if (!cancelRequest) {
        return sendError(res, 404, "Cancellation request tidak ditemukan");
      }

      if (cancelRequest.status !== "pending") {
        return sendError(
          res,
          400,
          "Cancellation request ini sudah diproses sebelumnya"
        );
      }

      const event = await Event.findByPk(cancelRequest.event_id);

      if (!event) {
        return sendError(res, 404, "Event tidak ditemukan");
      }

      await cancelRequest.update({
        status: "rejected",
        reviewed_by: user_id,
        admin_note,
        reviewed_at: new Date(),
      });

      await notificationService.createNotification({
        recipient_id: cancelRequest.requested_by,
        actor_id: user_id,
        type: "event_cancellation_rejected",
        title: "Pembatalan event ditolak",
        body: `Request pembatalan event "${event.title}" ditolak admin.`,
        target_type: "event_cancellation_request",
        target_id: cancelRequest.id,
        data: {
          event_id: event.id,
          event_title: event.title,
          cancellation_request_id: cancelRequest.id,
          admin_note,
        },
      });

      return sendSuccess(
        res,
        200,
        "Cancellation request rejected successfully",
        {
          cancellation_request: cancelRequest,
          event,
        }
      );
    } catch (error) {
      console.error("Error rejectCancellationRequest:", error);
      return sendError(
        res,
        500,
        "Gagal reject cancellation request",
        error.message
      );
    }
  },
};

module.exports = eventController;
