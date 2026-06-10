const { Event, EventImage } = require("../models");

const eventController = {
  createEvent: async (req, res) => {
    try {
      const { title, description, location, start_date, end_date } = req.body;

      const main_image_url =
        req.files && req.files["main_image"]
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

      if (req.files && req.files["album"] && req.files["album"].length > 0) {
        const albumData = req.files["album"].map((file) => ({
          event_id: newEvent.id,
          image_url: file.filename,
        }));
        await EventImage.bulkCreate(albumData);
      }

      res.status(201).json({ message: "Success", data: newEvent });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getMyEvents: async (req, res) => {
    try {
      const myEvents = await Event.findAll({
        where: { organizer_id: 1 },
        order: [["created_at", "DESC"]],
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
      const events = await Event.findAll({
        where: { status: "published" },
        order: [["start_date", "ASC"]],
      });
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
};

module.exports = eventController;
