const db = require("../models");
const { Event, EventImage, Category } = db;

const eventController = {
  createEvent: async (req, res) => {
    try {
      // 1. Tambahkan 'role' ke dalam destructuring
      const {
        title,
        description,
        location,
        start_date,
        end_date,
        category_ids,
        role, // <--- Menangkap role dari frontend
      } = req.body;

      const main_image_url = req.files["main_image"]
        ? req.files["main_image"][0].filename
        : null;

      if (!main_image_url) {
        return res
          .status(400)
          .json({ message: "Gambar utama (main_image) wajib diunggah!" });
      }

      // 2. LOGIKA DYNAMIC STATUS:
      // Jika role adalah 'admin', maka 'published'. Selain itu (organizer), maka 'draft'.
      const eventStatus = role === "admin" ? "published" : "draft";

      const newEvent = await Event.create({
        organizer_id: 1,
        title,
        description,
        location,
        start_date,
        end_date,
        main_image_url,
        status: eventStatus, // <--- Gunakan variabel dinamis di sini
      });

      // ... (sisanya kodingan Many-to-Many dan upload album tetap sama)
      if (category_ids) {
        let ids = [];
        if (typeof category_ids === "string" && category_ids.trim() !== "") {
          ids = category_ids.split(",").map(Number);
        } else if (Array.isArray(category_ids)) {
          ids = category_ids.map(Number);
        }
        if (ids.length > 0) {
          await newEvent.setCategories(ids);
        }
      }

      if (req.files && req.files["album"] && req.files["album"].length > 0) {
        const albumData = req.files["album"].map((file) => ({
          event_id: newEvent.id,
          image_url: file.filename,
        }));
        await EventImage.bulkCreate(albumData);
      }

      res.status(201).json({ message: "Success", data: newEvent });
    } catch (error) {
      console.error("🔥 ERROR DI CREATE EVENT:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getMyEvents: async (req, res) => {
    try {
      const myEvents = await Event.findAll({
        where: { organizer_id: 1 },
        order: [["id", "DESC"]],
      });
      res.json(myEvents);
    } catch (error) {
      res.status(500).json({ message: error.message });
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

  // --- 🌟 FITUR BARU: MENGIKUTI / MENYIMPAN EVENT LUAR KE DATABASE 🌟 ---
  // --- 🌟 FITUR BARU: MENGIKUTI / MENYIMPAN EVENT LUAR KE DATABASE 🌟 ---
  followExternalEvent: async (req, res) => {
    try {
      // 1. Ambil 'role' dari req.body yang dikirim oleh frontend
      const { external_id, title, location, start_date, role } = req.body;

      // Cek apakah sudah pernah diadopsi
      let event = await Event.findOne({ where: { external_id: external_id } });

      if (event) {
        return res
          .status(400)
          .json({ message: "Event ini sudah pernah diadopsi!" });
      }

      // 2. JALUR DINAMIS STATUS:
      // Jika role yang masuk adalah 'admin', langsung 'published'. Jika bukan (organizer), jadi 'draft'.
      const externalEventStatus = role === "admin" ? "published" : "draft";

      // 3. Simpan ke database dengan status yang sudah dinamis
      event = await Event.create({
        organizer_id: 1,
        title: title,
        description: "Event internasional hasil kurasi.",
        location: location || "Online",
        start_date: new Date(start_date),
        end_date: new Date(start_date),
        main_image_url: "default-banner.jpg",
        status: externalEventStatus, // 🔥 Di sini letak kuncinya gess!
      });

      event.external_id = String(external_id);
      await event.save();

      // 4. Berikan pesan alert yang berbeda biar pas demo mantap dilihat dosen
      const customMessage =
        role === "admin"
          ? "Berhasil diadopsi dan LANGSUNG DI-PUBLISH ke halaman utama!"
          : "Berhasil disimpan ke Draf! Silakan kelola di menu My Events.";

      res.status(201).json({
        message: customMessage,
        data: event,
      });
    } catch (error) {
      console.error("🔥 ERROR DI FOLLOW EXTERNAL EVENT:", error);
      res
        .status(500)
        .json({ message: "Error saat menyimpan event eksternal." });
    }
  },
};

module.exports = eventController;
