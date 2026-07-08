"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // === 1. USER & SOCIAL MANAGEMENT ===
    await queryInterface.createTable("users", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      email: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      password: { type: Sequelize.STRING(255), allowNull: false },
      role: {
        type: Sequelize.ENUM("admin", "organizer", "user"),
        allowNull: false,
      },
      avatar: { type: Sequelize.STRING(255), allowNull: true },
      bio: { type: Sequelize.TEXT, allowNull: true },
      points: { type: Sequelize.INTEGER, defaultValue: 0 },
      api_key: { type: Sequelize.STRING(255), unique: true, allowNull: false },
      refresh_token: { type: Sequelize.STRING(255), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },

      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });

    await queryInterface.createTable("organizer_applications", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      organizer_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "Nama event organizer / perusahaan",
      },
      ktp_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "Nomor KTP penanggung jawab",
      },
      ktp_image_url: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "URL file foto KTP",
      },
      phone_number: { type: Sequelize.STRING(50), allowNull: false },
      address: { type: Sequelize.TEXT, allowNull: false },
      social_media_link: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Opsional untuk mengecek portofolio",
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Diisi admin jika pendaftaran ditolak",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.createTable("follows", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      follower_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      following_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("point_histories", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      type: { type: Sequelize.ENUM("earn", "spend"), allowNull: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      recipient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        comment: "User yang menerima notifikasi",
      },

      actor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        comment: "User yang memicu notifikasi. Null jika dari sistem",
      },

      type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment:
          "Contoh: payment_pending, event_canceled, voucher_expiring, community_event_recommendation",
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      target_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Contoh: event, transaction, refund, voucher, chat_room",
      },

      target_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "ID tujuan, misalnya event_id, transaction_id, chat_room_id",
      },

      data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Data tambahan dalam format JSON",
      },

      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    // === 2. EVENT MANAGEMENT ===
    await queryInterface.createTable("categories", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
    });

    await queryInterface.createTable("events", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      organizer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        comment: "Null jika ditarik dari API luar via Axios",
      },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      main_image_url: { type: Sequelize.STRING(255), allowNull: false },
      location: { type: Sequelize.TEXT, allowNull: false },
      start_date: { type: Sequelize.DATE, allowNull: false },
      end_date: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM(
          "draft",
          "pending_approval",
          "published",
          "rejected",
          "canceled",
          "completed",
        ),
        defaultValue: "draft",
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Alasan dari admin jika event ditolak",
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Alasan pembatalan event",
      },

      canceled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      canceled_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      external_id: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: true,
        comment: "ID unik dari API pihak ketiga (Axios)",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.createTable("event_changes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },

      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        comment: "Organizer/Admin yang mengubah event",
      },

      change_type: {
        type: Sequelize.ENUM(
          "minor",
          "schedule",
          "location",
          "schedule_location",
        ),
        allowNull: false,
        defaultValue: "minor",
      },

      old_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      new_start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      old_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      new_end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      old_location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      new_location: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      change_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      refund_deadline: {
        type: Sequelize.DATE,
        allowNull: true,
        comment:
          "Batas user boleh ajukan refund, contoh 3x24 jam setelah perubahan",
      },

      status: {
        type: Sequelize.ENUM("active", "closed", "expired"),
        allowNull: false,
        defaultValue: "active",
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
    await queryInterface.createTable("event_cancellation_requests", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },

      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        comment: "Organizer/Admin yang mengajukan pembatalan",
      },

      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        comment: "Admin yang approve/reject request",
      },

      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      admin_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      requested_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
    await queryInterface.createTable("event_images", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },
      image_url: { type: Sequelize.STRING(255), allowNull: false },
    });

    await queryInterface.createTable("event_categories", {
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("ticket_types", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Contoh: VIP, Regular, Early Bird",
      },
      price: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      quota: { type: Sequelize.INTEGER, allowNull: false },
      remaining_quota: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.createTable("saved_events", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("comments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },
      body: { type: Sequelize.TEXT, allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // === 3. TRANSACTION, POINTS & VOUCHER SYSTEM ===
    await queryInterface.createTable("vouchers", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(100), unique: true, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      percentage: { type: Sequelize.INTEGER, allowNull: true },
      max_cut: { type: Sequelize.INTEGER, allowNull: true },
      points_required: { type: Sequelize.INTEGER, defaultValue: 0 },
      stock: { type: Sequelize.INTEGER, allowNull: true },
      valid_until: { type: Sequelize.DATE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
    });

    await queryInterface.createTable("user_vouchers", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      voucher_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "vouchers", key: "id" },
        onDelete: "CASCADE",
      },
      is_used: { type: Sequelize.BOOLEAN, defaultValue: false },
      claimed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      used_at: { type: Sequelize.DATE, allowNull: true },
      expired_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment:
          "Expired khusus user voucher. Jika null, bisa pakai vouchers.valid_until",
      },
    });

    await queryInterface.createTable("transactions", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      user_voucher_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "user_vouchers", key: "id" },
        onDelete: "SET NULL",
      },
      total_amount: { type: Sequelize.INTEGER, allowNull: false },
      discount_amount: { type: Sequelize.INTEGER, defaultValue: 0 },
      final_amount: { type: Sequelize.INTEGER, allowNull: false },
      earned_points: { type: Sequelize.INTEGER, defaultValue: 0 },
      payment_status: {
        type: Sequelize.ENUM("pending", "paid", "expired", "failed"),
        defaultValue: "pending",
      },
      payment_method: { type: Sequelize.STRING(100), allowNull: true },
      refund_status: {
        type: Sequelize.ENUM(
          "none",
          "requested",
          "processing",
          "refunded",
          "rejected",
        ),
        defaultValue: "none",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        ),
      },
    });

    await queryInterface.createTable("refund_requests", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "transactions", key: "id" },
        onDelete: "CASCADE",
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },

      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "events", key: "id" },
        onDelete: "CASCADE",
      },

      event_change_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "event_changes", key: "id" },
        onDelete: "SET NULL",
        comment: "Diisi jika refund berasal dari perubahan jadwal/lokasi",
      },

      refund_type: {
        type: Sequelize.ENUM("event_canceled", "event_changed"),
        allowNull: false,
      },

      refund_method: {
        type: Sequelize.ENUM("original_payment", "wallet"),
        allowNull: false,
        defaultValue: "original_payment",
      },

      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "requested",
          "processing",
          "refunded",
          "rejected",
          "expired",
        ),
        allowNull: false,
        defaultValue: "requested",
      },

      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      requested_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      refunded_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      rejected_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.createTable("transaction_details", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "transactions", key: "id" },
        onDelete: "CASCADE",
      },
      ticket_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "ticket_types", key: "id" },
        onDelete: "CASCADE",
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      subtotal: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.createTable("user_tickets", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      ticket_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "ticket_types", key: "id" },
        onDelete: "CASCADE",
      },
      transaction_detail_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "transaction_details", key: "id" },
        onDelete: "CASCADE",
      },
      ticket_code: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "used", "refunded"),
        defaultValue: "active",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // === 4. COMMUNITY & CHAT ROOMS (REAL-TIME) ===
    await queryInterface.createTable("chat_rooms", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      profile_image_url: { type: Sequelize.STRING(255), allowNull: false },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // ===== PIVOT TABLE: Chat Rooms & Categories =====
    await queryInterface.createTable("chat_room_categories", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      chat_room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "chat_rooms", key: "id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "categories", key: "id" },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("chat_room_members", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      chat_room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "chat_rooms", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.ENUM("owner", "admin", "member"),
        allowNull: false,
        defaultValue: "member",
      },
      joined_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("messages", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      chat_room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "chat_rooms", key: "id" },
        onDelete: "CASCADE",
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      message_type: {
        type: Sequelize.ENUM("text", "image", "video", "recommendation"),
        defaultValue: "text",
      },
      body: { type: Sequelize.TEXT, allowNull: true },
      media_url: { type: Sequelize.STRING(255), allowNull: true },
      recommended_event_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "events", key: "id" },
        onDelete: "SET NULL",
      },
      is_pinned: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pinned_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pinned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("message_reads", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      message_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "messages", key: "id" },
        onDelete: "CASCADE",
      },
      chat_room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "chat_rooms", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      read_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addConstraint("message_reads", {
      fields: ["message_id", "user_id"],
      type: "unique",
      name: "unique_message_read_per_user",
    });

    // Organizer application
    await queryInterface.addIndex("organizer_applications", ["status"], {
      name: "idx_organizer_applications_status",
    });

    // Event
    await queryInterface.addIndex("events", ["organizer_id"], {
      name: "idx_events_organizer_id",
    });

    await queryInterface.addIndex("events", ["status"], {
      name: "idx_events_status",
    });

    await queryInterface.addIndex("events", ["start_date"], {
      name: "idx_events_start_date",
    });

    // Ticket type
    await queryInterface.addIndex("ticket_types", ["event_id"], {
      name: "idx_ticket_types_event_id",
    });

    // Voucher
    await queryInterface.addIndex("user_vouchers", ["user_id"], {
      name: "idx_user_vouchers_user_id",
    });

    await queryInterface.addIndex("user_vouchers", ["voucher_id"], {
      name: "idx_user_vouchers_voucher_id",
    });

    // Transaction
    await queryInterface.addIndex("transactions", ["user_id"], {
      name: "idx_transactions_user_id",
    });

    await queryInterface.addIndex("transactions", ["payment_status"], {
      name: "idx_transactions_payment_status",
    });

    // Notification
    await queryInterface.addIndex("notifications", ["recipient_id"], {
      name: "idx_notifications_recipient_id",
    });

    await queryInterface.addIndex(
      "notifications",
      ["recipient_id", "is_read"],
      {
        name: "idx_notifications_recipient_read",
      },
    );

    // Community
    await queryInterface.addIndex("chat_room_members", ["chat_room_id"], {
      name: "idx_chat_room_members_chat_room_id",
    });

    await queryInterface.addIndex("chat_room_members", ["user_id"], {
      name: "idx_chat_room_members_user_id",
    });

    await queryInterface.addIndex("messages", ["chat_room_id"], {
      name: "idx_messages_chat_room_id",
    });

    await queryInterface.addIndex("message_reads", ["user_id"], {
      name: "idx_message_reads_user_id",
    });
    // Event change
    await queryInterface.addIndex("event_changes", ["event_id"], {
      name: "idx_event_changes_event_id",
    });

    await queryInterface.addIndex("event_changes", ["refund_deadline"], {
      name: "idx_event_changes_refund_deadline",
    });

    // Event cancellation request
    await queryInterface.addIndex("event_cancellation_requests", ["event_id"], {
      name: "idx_event_cancellation_requests_event_id",
    });

    await queryInterface.addIndex("event_cancellation_requests", ["status"], {
      name: "idx_event_cancellation_requests_status",
    });

    // Refund request
    await queryInterface.addIndex("refund_requests", ["transaction_id"], {
      name: "idx_refund_requests_transaction_id",
    });

    await queryInterface.addIndex("refund_requests", ["user_id"], {
      name: "idx_refund_requests_user_id",
    });

    await queryInterface.addIndex("refund_requests", ["event_id"], {
      name: "idx_refund_requests_event_id",
    });

    await queryInterface.addIndex("refund_requests", ["status"], {
      name: "idx_refund_requests_status",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tabel dilakukan dengan urutan terbalik untuk menghindari error Foreign Key
    await queryInterface.dropTable("message_reads");
    await queryInterface.dropTable("messages");
    await queryInterface.dropTable("chat_room_members");
    await queryInterface.dropTable("chat_room_categories");
    await queryInterface.dropTable("chat_rooms");

    await queryInterface.dropTable("user_tickets");
    await queryInterface.dropTable("refund_requests");
    await queryInterface.dropTable("transaction_details");
    await queryInterface.dropTable("transactions");
    await queryInterface.dropTable("user_vouchers");
    await queryInterface.dropTable("vouchers");

    await queryInterface.dropTable("comments");
    await queryInterface.dropTable("saved_events");
    await queryInterface.dropTable("ticket_types");
    await queryInterface.dropTable("event_categories");
    await queryInterface.dropTable("event_cancellation_requests");
    await queryInterface.dropTable("event_changes");
    await queryInterface.dropTable("event_images");
    await queryInterface.dropTable("events");
    await queryInterface.dropTable("categories");

    await queryInterface.dropTable("notifications");

    await queryInterface.dropTable("point_histories");
    await queryInterface.dropTable("follows");
    await queryInterface.dropTable("organizer_applications");
    await queryInterface.dropTable("users");
  },
};
