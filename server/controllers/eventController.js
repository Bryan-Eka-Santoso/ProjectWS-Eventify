const db = require("../models");
const { Event, EventImage, Category } = db;

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
      } = req.body;

      const main_image_url = req.files["main_image"]
        ? req.files["main_image"][0].filename
        : null;

      if (!main_image_url) {
        return res
          .status(400)
          .json({ message: "Gambar utama (main_image) wajib diunggah!" });
      }

      const newEvent = await Event.create({
        organizer_id: 1,
        title,
        description,
        location,
        start_date,
        end_date,
        main_image_url,
        status: "draft",
      });

      // --- PERBAIKAN SAKTI SISI BACKEND: MANY-TO-MANY VALIDATION ---
      if (category_ids) {
        let ids = [];

        if (typeof category_ids === "string" && category_ids.trim() !== "") {
          // Jika format FormData berupa string murni "1,2,3"
          ids = category_ids.split(",").map(Number);
        } else if (Array.isArray(category_ids)) {
          // Jaga-jaga jika dibaca langsung sebagai susunan Array
          ids = category_ids.map(Number);
        }

        // Jalankan sinkronisasi tabel relasi hanya jika ada ID yang valid
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
      // Biar kamu gampang melacak error di terminal vscode/cmd
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
};

module.exports = eventController;
