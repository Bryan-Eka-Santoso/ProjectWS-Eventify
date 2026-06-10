const { Event } = require("../models");

const eventController = {
  // Membuat event baru (Status default: draft)
  createEvent: async (req, res) => {
    try {
      const { title, description, location, start_date, end_date } = req.body;
      const newEvent = await Event.create({
        organizer_id: 1, // Sementara hardcoded untuk simulasi login
        title,
        description,
        location,
        start_date,
        end_date,
        status: "draft",
      });
      res
        .status(201)
        .json({ message: "Event created successfully", data: newEvent });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Melihat daftar event milik sendiri (Organizer)
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

  // Mengubah status event (Ajukan/Batal)
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

  // Menampilkan semua event yang sudah di-publish (Untuk Publik)
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

  // Mengambil satu data event (Untuk Form Edit)
  getEventById: async (req, res) => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Menyimpan perubahan data event (Edit)
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
