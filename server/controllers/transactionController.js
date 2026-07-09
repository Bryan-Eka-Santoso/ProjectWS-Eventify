const {
  Transaction,
  TransactionDetail,
  TicketType,
  Event,
  User,
  UserTicket,
  PointHistory,
  Post,
  ChatRoom,
  Voucher,
  EventCancellationRequest,
  RefundRequest,
} = require("../models");
const { Op } = require("sequelize");

// Catatan: mengikuti konvensi tim — controller percaya user_id & role yang
// dikirim dari client (via AUTH_USER di src/config/auth.js).

const transactionController = {
  // =====================================================
  // TRANSAKSI USER
  // =====================================================

  // GET /api/transactions/my?user_id=
  getMyTransactions: async (req, res) => {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ message: "user_id wajib diisi." });
      }

      const transactions = await Transaction.findAll({
        where: { user_id },
        include: [
          {
            model: TransactionDetail,
            as: "Details",
            include: [
              {
                model: TicketType,
                as: "TicketType",
                attributes: ["id", "name", "price"],
                include: [
                  {
                    model: Event,
                    as: "Event",
                    attributes: ["id", "title", "location", "start_date"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.json({ data: transactions });
    } catch (error) {
      console.error("Error getMyTransactions:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // POINT HISTORY
  // =====================================================

  // GET /api/transactions/points/history?user_id=
  getPointHistory: async (req, res) => {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ message: "user_id wajib diisi." });
      }

      const [histories, user] = await Promise.all([
        PointHistory.findAll({
          where: { user_id },
          order: [["created_at", "DESC"]],
        }),
        User.findByPk(user_id, { attributes: ["id", "name", "points"] }),
      ]);

      return res.json({
        data: {
          current_points: user?.points || 0,
          histories,
        },
      });
    } catch (error) {
      console.error("Error getPointHistory:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // PESERTA EVENT (organizer / admin)
  // =====================================================

  // GET /api/transactions/events/:event_id/participants?user_id=&role=
  getEventParticipants: async (req, res) => {
    try {
      const { user_id, role } = req.query;
      const { event_id } = req.params;

      const event = await Event.findByPk(event_id, {
        attributes: ["id", "title", "organizer_id", "start_date", "location"],
      });

      if (!event) {
        return res.status(404).json({ message: "Event tidak ditemukan." });
      }

      const isOwner = Number(event.organizer_id) === Number(user_id);
      const isAdmin = role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          message: "Hanya organizer pemilik event atau admin yang boleh melihat peserta.",
        });
      }

      const tickets = await UserTicket.findAll({
        include: [
          {
            model: TicketType,
            as: "TicketType",
            where: { event_id },
            attributes: ["id", "name", "price"],
          },
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email", "avatar"],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.json({
        data: {
          event,
          participants: tickets,
        },
      });
    } catch (error) {
      console.error("Error getEventParticipants:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: SEMUA TRANSAKSI
  // =====================================================

  // GET /api/transactions/admin/all?role=admin
  adminGetAllTransactions: async (req, res) => {
    try {
      if (req.query.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Hanya admin yang boleh mengakses data transaksi." });
      }

      const transactions = await Transaction.findAll({
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email"],
          },
          {
            model: TransactionDetail,
            as: "Details",
            include: [
              {
                model: TicketType,
                as: "TicketType",
                attributes: ["id", "name"],
                include: [
                  {
                    model: Event,
                    as: "Event",
                    attributes: ["id", "title"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
      });

      return res.json({ data: transactions });
    } catch (error) {
      console.error("Error adminGetAllTransactions:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // ADMIN: DASHBOARD STATS
  // =====================================================

  // GET /api/transactions/admin/dashboard?role=admin
  adminGetDashboardStats: async (req, res) => {
    try {
      if (req.query.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Hanya admin yang boleh mengakses dashboard." });
      }

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setHours(0, 0, 0, 0);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

      const [
        totalUsers,
        totalEvents,
        pendingEvents,
        totalTransactions,
        totalRevenue,
        ticketsSold,
        totalPosts,
        totalChatRooms,
        totalVouchers,
        pendingCancellations,
        activeRefunds,
        recentTransactions,
        recentUsers,
        paidLast7Days,
      ] = await Promise.all([
        User.count(),
        Event.count(),
        Event.count({ where: { status: "pending_approval" } }),
        Transaction.count(),
        Transaction.sum("final_amount", {
          where: { payment_status: "paid" },
        }),
        UserTicket.count(),
        // Tabel posts baru dibuat saat boot — jangan sampai dashboard gagal
        // total kalau tabelnya belum ada.
        Post.count().catch(() => 0),
        ChatRoom.count(),
        Voucher.count(),
        EventCancellationRequest.count({ where: { status: "pending" } }),
        RefundRequest.count({
          where: { status: { [Op.in]: ["requested", "processing"] } },
        }),
        Transaction.findAll({
          limit: 5,
          order: [["created_at", "DESC"]],
          include: [
            { model: User, as: "User", attributes: ["id", "name"] },
            {
              model: TransactionDetail,
              as: "Details",
              include: [
                {
                  model: TicketType,
                  as: "TicketType",
                  attributes: ["id", "name"],
                  include: [
                    { model: Event, as: "Event", attributes: ["id", "title"] },
                  ],
                },
              ],
            },
          ],
        }),
        User.findAll({
          limit: 5,
          order: [["created_at", "DESC"]],
          attributes: ["id", "name", "email", "role", "created_at"],
        }),
        Transaction.findAll({
          where: {
            payment_status: "paid",
            created_at: { [Op.gte]: sevenDaysAgo },
          },
          attributes: ["final_amount", "created_at"],
        }),
      ]);

      // Susun omzet per hari untuk 7 hari terakhir (termasuk hari kosong)
      const revenueLast7Days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(sevenDaysAgo);
        day.setDate(sevenDaysAgo.getDate() + i);
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);

        const total = paidLast7Days
          .filter((tx) => {
            const t = new Date(tx.created_at);
            return t >= day && t < nextDay;
          })
          .reduce((sum, tx) => sum + (tx.final_amount || 0), 0);

        revenueLast7Days.push({
          date: day.toISOString().slice(0, 10),
          total,
        });
      }

      return res.json({
        data: {
          totals: {
            users: totalUsers,
            events: totalEvents,
            transactions: totalTransactions,
            revenue: totalRevenue || 0,
            tickets_sold: ticketsSold,
            posts: totalPosts,
            chat_rooms: totalChatRooms,
            vouchers: totalVouchers,
          },
          needs_attention: {
            pending_events: pendingEvents,
            pending_cancellations: pendingCancellations,
            active_refunds: activeRefunds,
          },
          revenue_last_7_days: revenueLast7Days,
          recent_transactions: recentTransactions,
          recent_users: recentUsers,
        },
      });
    } catch (error) {
      console.error("Error adminGetDashboardStats:", error);
      return res.status(500).json({ message: error.message });
    }
  },

  // =====================================================
  // DETAIL TRANSAKSI (paling bawah karena route dinamis)
  // =====================================================

  // GET /api/transactions/:id?user_id=&role=
  getTransactionById: async (req, res) => {
    try {
      const { user_id, role } = req.query;

      const transaction = await Transaction.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "User",
            attributes: ["id", "name", "email"],
          },
          {
            model: TransactionDetail,
            as: "Details",
            include: [
              {
                model: TicketType,
                as: "TicketType",
                attributes: ["id", "name", "price"],
                include: [
                  {
                    model: Event,
                    as: "Event",
                    attributes: ["id", "title", "location", "start_date"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!transaction) {
        return res.status(404).json({ message: "Transaksi tidak ditemukan." });
      }

      const isOwner = Number(transaction.user_id) === Number(user_id);
      const isAdmin = role === "admin";

      if (!isOwner && !isAdmin) {
        return res
          .status(403)
          .json({ message: "Kamu tidak punya akses ke transaksi ini." });
      }

      return res.json({ data: transaction });
    } catch (error) {
      console.error("Error getTransactionById:", error);
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = transactionController;
