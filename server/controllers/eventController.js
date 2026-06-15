const db = require("../models");

// 💡 TIPS AMAN: Kita panggil langsung dari objek db agar tidak sensitif uppercase/lowercase saat destructuring
const Event = db.Event;
const EventImage = db.EventImage;
const Category = db.Category;

// Ambil model OrganizerApplication (Sesuaikan dengan nama file di folder models-mu gess)
const OrganizerApplication =
  db.OrganizerApplication ||
  db.organizerApplication ||
  db.Organizer_application;

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

      // 🔍 ATURAN LOGIKA REVISI BARU:
      let organizerIdValue = null;
      const eventStatusValue = role === "admin" ? "published" : "draft";

      if (role === "organizer") {
        // Cari id dari tabel organizer_applications berdasarkan user_id yang login gess
        const app = await OrganizerApplication.findOne({
          where: { user_id: user_id },
        });
        if (!app) {
          return res.status(400).json({
            message: "Kamu belum terdaftar atau disetujui sebagai Organizer!",
          });
        }
        organizerIdValue = app.id; // 🎯 BERHASIL MENGAMBIL ID DARI ORGANIZER_APPLICATION, BUKAN USER ID!
      }

      const newEvent = await Event.create({
        organizer_id: organizerIdValue, // ID Aplikasi jika organizer, NULL jika admin
        title,
        description,
        location,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        main_image_url: main_image,
        status: eventStatusValue,
      });

      // Masukkan ke tabel pivot many-to-many kategori jika ada (Aman tidak dibuang!)
      if (category_ids) {
        const ids = category_ids.split(",").map(Number);
        await newEvent.addCategories(ids);
      }

      // 🖼️ FITUR ALBUM: Simpan array gambar ke tabel event_images
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

      // 🔍 SINCRONISASI LOGIKA GLOBAL ADMIN DI SINI WOII:
      if (role === "organizer") {
        // Cari dulu data aplikasinya agar tahu ID organizer-nya berapa
        const app = await OrganizerApplication.findOne({
          where: { user_id: user_id },
        });
        if (app) {
          whereClause = { organizer_id: app.id }; // Saring berdasarkan ID OrganizerApplication-nya gess
        } else {
          whereClause = { organizer_id: -1 }; // Jika tidak ketemu, kunci agar tidak keluar data random
        }
      } else if (role === "admin") {
        // 🎯 KONSEP GLOBAL ADMIN SAKTI: Menampilkan mutlak seluruh event yang di-handle instansi Admin (id = null)
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
        // 📸 Memastikan relasi album ("images" sesuai kodingan lamamu) ikut terbawa ke detail beli tiket!
        include: [{ model: EventImage, as: "images" }],
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

  // --- 🌟 FITUR MENGIKUTI / MENYIMPAN EVENT LUAR KE DATABASE 🌟 ---
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

      // 🔍 ATURAN LOGIKA REVISI BARU UNTUK ADOPSI API:
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
        organizerIdValue = app.id; // 🎯 Mengambil ID dari organizer_applications, BUKAN User ID!
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
};

module.exports = eventController;
