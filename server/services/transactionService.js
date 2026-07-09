// server/services/transactionService.js
const db = require("../models");
const emailService = require("./emailService");
const User = db.User;
const TicketType = db.TicketType;
const Event = db.Event;
const Transaction = db.Transaction;
const TransactionDetail = db.TransactionDetail;
const UserVoucher = db.UserVoucher;
const Voucher = db.Voucher;
const UserTicket = db.UserTicket;
const notificationService = require("./notificationService");

// Inisialisasi Engine Midtrans SDK Client di dalam Service Layer
const midtransClient = require("midtrans-client");
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

const transactionService = {
  /**
   * 🛒 SERVICE: Mengolah logika hitung duit, voucher, simpan DB, dan dapetin Snap Token Midtrans
   */
  processCheckout: async ({
    user_id,
    ticket_type_id,
    quantity,
    user_voucher_id,
  }) => {
    // Ambil data kategori tiket beserta Event-nya
    const ticketType = await TicketType.findByPk(ticket_type_id, {
      include: [{ model: Event, as: "Event" }],
    });
    if (!ticketType) {
      throw new Error("Tipe kategori tiket tidak ditemukan gess.");
    }

    if (ticketType.remaining_quota < quantity) {
      throw new Error(
        `Gagal checkout, sisa kuota tiket tinggal ${ticketType.remaining_quota} unit.`,
      );
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      throw new Error("User tidak ditemukan gess.");
    }

    // Hitung rincian finansial tiket
    let totalAmount = ticketType.price * quantity;
    let discountAmount = 0;

    if (user_voucher_id) {
      const checkVoucher = await UserVoucher.findOne({
        where: { id: user_voucher_id, user_id, is_used: false },
        include: [{ model: Voucher, as: "Voucher" }],
      });

      if (checkVoucher && checkVoucher.Voucher) {
        const voucher = checkVoucher.Voucher;

        const percentage =
          voucher.percentage !== null && voucher.percentage !== undefined
            ? Number(voucher.percentage)
            : null;

        const maxCut =
          voucher.max_cut !== null && voucher.max_cut !== undefined
            ? Number(voucher.max_cut)
            : null;

        // Jika percentage ada, voucher dianggap diskon persen.
        if (percentage !== null && percentage > 0) {
          discountAmount = Math.floor((percentage / 100) * totalAmount);

          if (maxCut !== null && maxCut > 0 && discountAmount > maxCut) {
            discountAmount = maxCut;
          }
        }

        // Jika percentage kosong tapi max_cut ada, voucher dianggap potongan nominal tetap.
        else if (maxCut !== null && maxCut > 0) {
          discountAmount = maxCut;
        }

        // Diskon tidak boleh lebih besar dari total harga.
        if (discountAmount > totalAmount) {
          discountAmount = totalAmount;
        }
      }
    }

    let finalAmount = totalAmount - discountAmount;
    if (finalAmount < 0) finalAmount = 0;

    // 1. Simpan data transaksi utama (pending)
    const newTransaction = await Transaction.create({
      user_id,
      user_voucher_id: user_voucher_id || null,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      payment_status: "pending",
    });

    // 2. Simpan rincian kuantitas detail
    await TransactionDetail.create({
      transaction_id: newTransaction.id,
      ticket_type_id: ticket_type_id,
      quantity: quantity,
      subtotal: finalAmount,
    });

    // PARAMETER ENGINE MIDTRANS SNAP GATEWAY
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

    // Kembalikan data murni hasil olahan ke controller
    return {
      snapToken: midtransTx.token,
      orderId: midtransOrderId,
      transactionId: newTransaction.id,
    };
  },

  /**
   * ⚡ SERVICE: Mengolah logika Webhook Callback kelulusan pembayaran, potong kuota, cetak tiket, bonus poin
   */
  processMidtransCallback: async ({
    order_id,
    transaction_status,
    fraud_status,
    payment_type,
  }) => {
    // Kupas kembali ID transaksi asli dari string order_id
    const partId = order_id.split("-")[1];
    const transactionId = parseInt(partId);

    const tx = await Transaction.findByPk(transactionId, {
      include: [{ model: TransactionDetail, as: "Details" }],
    });

    if (!tx) {
      return { status: 404, message: "Data transaksi internal tidak valid." };
    }
    if (tx.payment_status === "paid") {
      return { status: 200, message: "Transaksi ini sudah lunas diproses." };
    }

    // Deteksi kelulusan pembayaran gess
    if (
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")
    ) {
      const detail = tx.Details[0];
      const buyer = await User.findByPk(tx.user_id);

      const ticketTypeWithEvent = await TicketType.findByPk(detail.ticket_type_id, {
        include: [{ model: Event, as: "Event" }],
      });
      // 1. Potong kuota tiket
      if (ticketTypeWithEvent) {
        await TicketType.update(
          {
            remaining_quota: Math.max(
              0,
              ticketTypeWithEvent.remaining_quota - detail.quantity,
            ),
          },
          { where: { id: ticketTypeWithEvent.id } },
        );
      }

      // 2. Hanguskan voucher jika digunakan
      if (tx.user_voucher_id) {
        await UserVoucher.update(
          { is_used: true, used_at: new Date() },
          { where: { id: tx.user_voucher_id } },
        );
      }

      // 3. Terbitkan tiket resmi aktif sebanyak quantity
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
      const createdTickets = await UserTicket.bulkCreate(ticketsToCreate);

      // 4. Kalkulasi bonus reward poin (> 500rb)
      let calculatedPoints = 0;
      if (tx.final_amount >= 500000) {
        calculatedPoints = Math.floor(tx.final_amount / 1000);

        const buyer = await User.findByPk(tx.user_id);
        if (buyer) {
          const currentPoints =
            buyer.points !== undefined && buyer.points !== null
              ? buyer.points
              : 0;
          await User.update(
            { points: currentPoints + calculatedPoints },
            { where: { id: tx.user_id } },
          );

          // Catat sejarah koin
          await db.sequelize.query(
            `INSERT INTO point_histories (user_id, amount, type, description, created_at) VALUES (${tx.user_id}, ${calculatedPoints}, 'earn', 'Bonus pembelian tiket di atas 500rb', NOW())`,
          );
        }
      }

      // B. Update status pembayaran transaksi utama menjadi 'paid'
      await Transaction.update(
        {
          payment_status: "paid",
          payment_method: payment_type || "Simulated Payment",
          earned_points: calculatedPoints,
        },
        { where: { id: transactionId } },
      );
      if (buyer?.email && ticketTypeWithEvent?.Event) {
        try {
          await emailService.sendTicketPurchaseSuccessEmail({
            to: buyer.email,
            name: buyer.name,
            event: ticketTypeWithEvent.Event,
            transaction: {
              ...tx.get({ plain: true }),
              payment_status: "paid",
              payment_method: payment_type || "Simulated Payment",
              earned_points: calculatedPoints,
            },
            tickets: createdTickets,
          });
        } catch (error) {
          console.error("Failed to send ticket purchase email:", error.message);
        }
      }
      if (ticketTypeWithEvent?.Event) {
        try {
          await notificationService.notifyTicketPurchaseSuccess({
            user_id: tx.user_id,
            event: ticketTypeWithEvent.Event,
            transaction: {
              ...tx.get({ plain: true }),
              payment_status: "paid",
              payment_method: payment_type || "Simulated Payment",
              earned_points: calculatedPoints,
            },
            tickets: createdTickets,
          });
        } catch (error) {
          console.error(
            "Failed to send ticket purchase notification:",
            error.message
          );
        }
      }

      return {
        status: 200,
        message: "Transaksi sukses terbayar, tiket resmi diterbitkan!",
      };
    } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
      // Jika pembayaran bermasalah/gagal
      await Transaction.update(
        { payment_status: "failed" },
        { where: { id: transactionId } },
      );
      return { status: 200, message: "Transaksi ditandai gagal gess." };
    }

    return { status: 200, message: "Webhook diterima tanpa perubahan state." };
  },
};

module.exports = transactionService;
