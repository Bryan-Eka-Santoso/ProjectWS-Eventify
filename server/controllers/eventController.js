const db = require("../models");

const Event = db.Event;
const EventImage = db.EventImage;
const Category = db.Category;
const User = db.User;
const SavedEvent = db.SavedEvent;
const OrganizerApplication = db.OrganizerApplication;
const TicketType = db.TicketType;

// 🔥 Menggunakan model terpisah hasil sinkronisasi dengan skema database migrasi kamu gess
const Voucher = db.Voucher;
const UserVoucher = db.UserVoucher;

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
        tickets,
      } = req.body;
      const main_image =
        req.files && req.files.main_image
          ? req.files.main_image[0].filename
          : "default.jpg";

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
        organizerIdValue = app.id;
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

      if (tickets) {
        const parsedTickets = JSON.parse(tickets);
        if (Array.isArray(parsedTickets) && parsedTickets.length > 0) {
          const ticketsData = parsedTickets.map((ticket) => ({
            event_id: newEvent.id,
            name: ticket.name,
            price: parseInt(ticket.price) || 0,
            quota: parseInt(ticket.quota),
            remaining_quota: parseInt(ticket.quota),
          }));

          await TicketType.bulkCreate(ticketsData);
        }
      }

      res.status(201).json({
        message:
          role === "admin"
            ? "Event beserta tipe tiket berhasil di-publish oleh Admin!"
            : "Event beserta tipe tiket berhasil disimpan sebagai Draft oleh Organizer!",
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
          whereClause = { organizer_id: app.id };
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
            as: "categories",
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

      const event = await Event.findByPk(id, {
        include: [
          { model: EventImage, as: "images" },
          {
            model: TicketType,
            as: "ticket_types",
          },
          {
            model: OrganizerApplication,
            as: "organizer",
            include: [{ model: User, attributes: ["name", "email"] }],
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
      await Event.update(req.body, { where: { id } });
      res.json({ message: "Event updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
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
        organizerIdValue = app.id;
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

  toggleSaveEvent: async (req, res) => {
    try {
      const { user_id, event_id } = req.body;
      const alreadySaved = await SavedEvent.findOne({
        where: { user_id, event_id },
      });

      if (alreadySaved) {
        await alreadySaved.destroy();
        return res.json({
          message: "Berhasil membatalkan simpan event!",
          isSaved: false,
        });
      } else {
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

  checkSaveStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id } = req.query;

      if (!user_id) return res.json({ isSaved: false });

      const count = await SavedEvent.count({
        where: { user_id, event_id: id },
      });

      res.json({ isSaved: count > 0 });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getSavedEventsList: async (req, res) => {
    try {
      const { user_id } = req.query;
      const savedList = await SavedEvent.findAll({
        where: { user_id },
        include: [
          {
            model: Event,
            as: "event",
            required: true,
          },
        ],
      });

      const eventsOnly = savedList.map((item) => item.event);
      res.json(eventsOnly);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal memuat daftar simpanan event." });
    }
  },

  // ==========================================
  // 🔥 TAMBAHAN BARU: LOGIC FITUR VOUCHER & POIN USER GESS!
  // ==========================================

  // A. Ambil info poin user yang sedang login
  getUserPoints: async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id)
        return res.status(400).json({ message: "User ID dibutuhkan gess!" });

      const user = await User.findByPk(user_id, {
        attributes: ["id", "name", "points"],
      });
      if (!user)
        return res.status(404).json({ message: "User tidak ditemukan." });

      const currentPoints =
        user.points !== undefined && user.points !== null ? user.points : 0;

      res.json({ points: currentPoints });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal mengambil poin user." });
    }
  },

  // B. Ambil list semua jenis voucher murni langsung dari SQL (Tanpa auto-insert dummy gess!)
  getAllVouchers: async (req, res) => {
    try {
      // 1. Menampilkan voucher toko yang berstatus aktif saja gess
      const vouchers = await Voucher.findAll({
        where: { is_active: true },
      });

      // 2. 🔥 TRIK AMAN: Gandakan points_required menjadi point_cost agar terbaca oleh Frontend kamu gess!
      const formattedVouchers = vouchers.map((v) => {
        const plainVoucher = v.get({ plain: true });
        return {
          ...plainVoucher,
          point_cost: plainVoucher.points_required, // Frontend membaca ini, backend aman pakai points_required!
        };
      });

      // 3. Kirim balik data yang sudah diformat ke React frontend
      return res.json(formattedVouchers);
    } catch (error) {
      console.error("🔥 ERROR SELEKSI VOUCHER:", error);
      return res.status(500).json({
        message: "Gagal memuat daftar toko voucher gess.",
        error: error.message,
      });
    }
  },

  // C. Tukarkan poin user dengan Voucher (Akurasi field points_required & is_used)
  claimVoucher: async (req, res) => {
    try {
      const { user_id, voucher_id } = req.body;

      const user = await User.findByPk(user_id);
      const voucher = await Voucher.findByPk(voucher_id);

      if (!user) return res.status(404).json({ message: "User tidak valid!" });
      if (!voucher)
        return res.status(404).json({ message: "Voucher tidak ditemukan!" });

      const userPoints =
        user.points !== undefined && user.points !== null ? user.points : 0;

      // 🔥 VALIDASI UTAMA: Sesuai dengan field points_required gess!
      if (userPoints < voucher.points_required) {
        return res.status(400).json({
          message: `Poin kamu tidak cukup gess! Butuh ${voucher.points_required} poin, poin kamu saat ini hanya ${userPoints}.`,
        });
      }

      // Validasi Opsional: Jika stock di database kamu diisi limit tertentu
      if (voucher.stock !== null && voucher.stock <= 0) {
        return res
          .status(400)
          .json({ message: "Aduh, kuota voucher ini sudah habis gess!" });
      }

      // Potong poin user di database
      const newPointsBalance = userPoints - voucher.points_required;
      await User.update(
        { points: newPointsBalance },
        { where: { id: user_id } },
      );

      // Kurangi stock voucher toko jika tidak unlimited
      if (voucher.stock !== null) {
        await Voucher.update(
          { stock: voucher.stock - 1 },
          { where: { id: voucher_id } },
        );
      }

      // Catat klaim voucher ke tabel user_vouchers dengan default is_used = false (0) sesuai migrasi gess
      await UserVoucher.create({
        user_id,
        voucher_id,
        is_used: false,
      });

      res.json({
        message: `Sukses menukarkan ${voucher.points_required} poin dengan voucher ${voucher.name}!`,
        remainingPoints: newPointsBalance,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal memproses penukaran voucher." });
    }
  },

  // D. Ambil list voucher milik user yang statusnya is_used = false
  getMyVouchers: async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id)
        return res.status(400).json({ message: "User ID diperlukan." });

      const myVouchers = await UserVoucher.findAll({
        where: { user_id, is_used: false }, // 🎯 Sesuai kolom is_used di database kamu gess!
        include: [{ model: Voucher, as: "voucher" }],
      });

      res.json(myVouchers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal memuat voucher milik user." });
    }
  },
};

module.exports = eventController;
