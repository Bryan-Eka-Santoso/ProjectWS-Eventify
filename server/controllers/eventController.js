const db = require("../models");

const Event = db.Event;
const EventImage = db.EventImage;
const Category = db.Category;
const User = db.User;
const SavedEvent = db.SavedEvent;
const OrganizerApplication = db.OrganizerApplication;
const TicketType = db.TicketType;
const Voucher = db.Voucher;
const UserVoucher = db.UserVoucher;

// Ambil model relasi transaksi baru dari database gess
const Transaction = db.Transaction;
const TransactionDetail = db.TransactionDetail;
const UserTicket = db.UserTicket;

// Inisialisasi Engine Midtrans SDK Client
const midtransClient = require("midtrans-client");
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

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

  getAllVouchers: async (req, res) => {
    try {
      const vouchers = await Voucher.findAll({
        where: { is_active: true },
      });

      const formattedVouchers = vouchers.map((v) => {
        const plainVoucher = v.get({ plain: true });
        return {
          ...plainVoucher,
          point_cost: plainVoucher.points_required,
        };
      });

      return res.json(formattedVouchers);
    } catch (error) {
      console.error("🔥 ERROR SELEKSI VOUCHER:", error);
      return res.status(500).json({
        message: "Gagal memuat daftar toko voucher gess.",
        error: error.message,
      });
    }
  },

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

      if (userPoints < voucher.points_required) {
        return res.status(400).json({
          message: `Poin kamu tidak cukup gess! Butuh ${voucher.points_required} poin, poin kamu saat ini hanya ${userPoints}.`,
        });
      }

      if (voucher.stock !== null && voucher.stock <= 0) {
        return res
          .status(400)
          .json({ message: "Aduh, kuota voucher ini sudah habis gess!" });
      }

      const newPointsBalance = userPoints - voucher.points_required;
      await User.update(
        { points: newPointsBalance },
        { where: { id: user_id } },
      );

      if (voucher.stock !== null) {
        await Voucher.update(
          { stock: voucher.stock - 1 },
          { where: { id: voucher_id } },
        );
      }

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

  getMyVouchers: async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id)
        return res.status(400).json({ message: "User ID diperlukan." });

      const myVouchers = await UserVoucher.findAll({
        where: { user_id, is_used: false },
        include: [{ model: Voucher, as: "voucher" }],
      });

      res.json(myVouchers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Gagal memuat voucher milik user." });
    }
  },

  // ==========================================
  // 🔥 TAMBAHAN MANTAP: INTEGRASI SISTEM MIDTRANS SNAP GATEWAY & PEMBELIAN TIKET
  // ==========================================

  createTicketCheckout: async (req, res) => {
    try {
      const { user_id, ticket_type_id, quantity, user_voucher_id } = req.body;

      if (!user_id || !ticket_type_id || !quantity) {
        return res
          .status(400)
          .json({ message: "Data kualifikasi pembelian kurang lengkap gess!" });
      }

      // 🎯 FIXED: Menghapus as: "event" karena relasi aslimu di index.js langsung db.TicketType.belongsTo(db.Event)
      const ticketType = await TicketType.findByPk(ticket_type_id, {
        include: [{ model: Event }],
      });
      if (!ticketType)
        return res
          .status(404)
          .json({ message: "Tipe kategori tiket tidak ditemukan." });

      if (ticketType.remaining_quota < quantity) {
        return res.status(400).json({
          message: `Gagal checkout, sisa kuota tiket tinggal ${ticketType.remaining_quota} unit.`,
        });
      }

      const user = await User.findByPk(user_id);
      if (!user)
        return res.status(404).json({ message: "User tidak ditemukan gess." });

      // Hitung rincian finansial tiket
      let totalAmount = ticketType.price * quantity;
      let discountAmount = 0;

      if (user_voucher_id) {
        const checkVoucher = await UserVoucher.findOne({
          where: { id: user_voucher_id, user_id, is_used: false },
          include: [{ model: Voucher, as: "voucher" }],
        });

        if (checkVoucher && checkVoucher.voucher) {
          discountAmount = Math.floor(
            (checkVoucher.voucher.percentage / 100) * totalAmount,
          );
          if (
            checkVoucher.voucher.max_cut &&
            discountAmount > checkVoucher.voucher.max_cut
          ) {
            discountAmount = checkVoucher.voucher.max_cut;
          }
        }
      }

      let finalAmount = totalAmount - discountAmount;
      if (finalAmount < 0) finalAmount = 0;

      // 1. Simpan baris data ke tabel transactions (payment_status = pending)
      const newTransaction = await Transaction.create({
        user_id,
        user_voucher_id: user_voucher_id || null,
        total_amount: totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        payment_status: "pending",
      });

      // 2. Simpan rincian kuantitas ke tabel transaction_details
      await TransactionDetail.create({
        transaction_id: newTransaction.id,
        ticket_type_id: ticket_type_id,
        quantity: quantity,
        subtotal: finalAmount,
      });

      // 🎯 SINKRONISASI MIDTRANS ID: Menggunakan Event (Huruf Kapital) sesuai relasi barumu
      const midtransOrderId = `INV-${newTransaction.id}-${Date.now()}`;
      const eventTitle = ticketType.Event ? ticketType.Event.title : "Ticket";

      let parameter = {
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: finalAmount,
        },
        item_details: [
          {
            id: String(ticketType.id),
            price: finalAmount,
            quantity: 1,
            name: `${ticketType.name} - ${eventTitle}`,
          },
        ],
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
      };

      const midtransTx = await snap.createTransaction(parameter);

      return res.status(200).json({
        snapToken: midtransTx.token,
        orderId: midtransOrderId,
        transactionId: newTransaction.id,
      });
    } catch (error) {
      console.error("🔥 CHECKOUT ERROR:", error);
      return res.status(500).json({
        message: "Gagal memproses checkout pembayaran Midtrans gess.",
      });
    }
  },

  handleMidtransCallback: async (req, res) => {
    try {
      const {
        order_id,
        transaction_status,
        fraud_status,
        payment_type = "Simulated Payment",
      } = req.body;

      console.log(
        `⚡ Callback Masuk untuk Order ID: ${order_id} | Status: ${transaction_status}`,
      );

      // 🎯 HACK OPERASI ID: Kupas kembali ID transaksi asli lewat pemotongan string token order_id gess!
      const partId = order_id.split("-")[1];
      const transactionId = parseInt(partId);

      const tx = await Transaction.findByPk(transactionId, {
        include: [{ model: TransactionDetail, as: "details" }],
      });

      if (!tx)
        return res
          .status(404)
          .json({ message: "Data transaksi internal tidak valid." });
      if (tx.payment_status === "paid")
        return res
          .status(200)
          .json({ message: "Transaksi ini sudah lunas diproses." });

      // Deteksi status kelulusan pembayaran dari Midtrans (Settlement / Capture Accept)
      if (
        transaction_status === "settlement" ||
        (transaction_status === "capture" && fraud_status === "accept")
      ) {
        // A. Ambil item detail rincian pembelian
        const detail = tx.details[0];

        // 1. Potong sisa kuota (remaining_quota) di tabel TicketType
        const ticketType = await TicketType.findByPk(detail.ticket_type_id);
        if (ticketType) {
          await TicketType.update(
            {
              remaining_quota: Math.max(
                0,
                ticketType.remaining_quota - detail.quantity,
              ),
            },
            { where: { id: ticketType.id } },
          );
        }

        // 2. Jika bertransaksi memakai voucher, kunci status voucher jadi hangus (is_used = true)
        if (tx.user_voucher_id) {
          await UserVoucher.update(
            { is_used: true, used_at: new Date() },
            { where: { id: tx.user_voucher_id } },
          );
        }

        // 3. Terbitkan Tiket Fisik Resmi berstatus 'active' ke tabel user_tickets sebanyak quantity yang dibeli
        const ticketsToCreate = [];
        for (let i = 0; i < detail.quantity; i++) {
          const generatedCode = `TIX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${detail.id}-${i}`;
          ticketsToCreate.push({
            user_id: tx.user_id,
            ticket_type_id: detail.ticket_type_id,
            transaction_detail_id: detail.id,
            ticket_code: generatedCode,
            status: "active",
          });
        }
        await UserTicket.bulkCreate(ticketsToCreate);

        // 4. 🔥 KALKULASI REWARD POIN: Jika total pembelian (final_amount) DI ATAS ATAU SAMA DENGAN 500.000 gess!
        let calculatedPoints = 0;
        if (tx.final_amount >= 500000) {
          calculatedPoints = Math.floor(tx.final_amount / 1000); // 🎯 Dibagi 1000 sesuai rumus request kamu gess!

          const buyer = await User.findByPk(tx.user_id);
          if (buyer) {
            const currentPoints =
              buyer.points !== undefined && buyer.points !== null
                ? buyer.points
                : 0;
            // Akumulasi tambah poin ke user
            await User.update(
              { points: currentPoints + calculatedPoints },
              { where: { id: tx.user_id } },
            );

            // Catat log sejarah koin ke tabel point_histories agar klop dengan skema migrasi gess
            await db.sequelize.query(
              `INSERT INTO point_histories (user_id, amount, type, description, created_at) VALUES (${tx.user_id}, ${calculatedPoints}, 'earn', 'Bonus pembelian tiket di atas 500rb', NOW())`,
            );
            console.log(
              `🎁 SUNTIK BONUS POIN BERHASIL: User ${buyer.name} dapet +${calculatedPoints} koin.`,
            );
          }
        }

        // B. Update status pembayaran transaksi utama menjadi 'paid'
        await Transaction.update(
          {
            payment_status: "paid",
            payment_method: payment_type,
            earned_points: calculatedPoints, // Catat poin yang didapat ke dalam transaksi
          },
          { where: { id: transactionId } },
        );

        return res.status(200).json({
          message: "Transaksi sukses terbayar, tiket resmi diterbitkan!",
        });
      } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
        // Jika pembayaran kedaluwarsa atau dibatalkan user, tandai status failed
        await Transaction.update(
          { payment_status: "failed" },
          { where: { id: transactionId } },
        );
        return res
          .status(200)
          .json({ message: "Transaksi ditandai gagal gess." });
      }

      return res
        .status(200)
        .json({ message: "Webhook diterima tanpa perubahan state." });
    } catch (error) {
      console.error("🔥 ERROR MIDTRANS CALLBACK WEBHOOK:", error);
      return res
        .status(500)
        .json({ message: "Callback internal error server webhook." });
    }
  },

  getUserTicketsList: async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id)
        return res.status(400).json({ message: "User ID diperlukan gess!" });

      // 🎯 FIXED TOTAL: Menyamakan alias huruf kapital sesuai pengaturan database kamu gess!
      const tickets = await UserTicket.findAll({
        where: { user_id, status: "active" },
        include: [
          {
            model: TicketType,
            as: "ticket_type",
            include: [
              {
                model: Event,
                as: "Event", // 👈 UTAMA: Diubah jadi huruf kapital "Event" biar Sequelize nggak protes lagi gess!
              },
            ],
          },
        ],
        order: [["id", "DESC"]],
      });
      return res.json(tickets);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Gagal memuat list tiket kepemilikan kamu." });
    }
  },
};

module.exports = eventController;
