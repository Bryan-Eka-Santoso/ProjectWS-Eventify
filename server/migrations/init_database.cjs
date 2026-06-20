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
        type: Sequelize.ENUM("none", "requested", "refunded", "rejected"),
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
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tabel dilakukan dengan urutan terbalik untuk menghindari error Foreign Key
    await queryInterface.dropTable("messages");
    await queryInterface.dropTable("chat_room_members");
    await queryInterface.dropTable("chat_rooms");

    await queryInterface.dropTable("user_tickets");
    await queryInterface.dropTable("transaction_details");
    await queryInterface.dropTable("transactions");
    await queryInterface.dropTable("user_vouchers");
    await queryInterface.dropTable("vouchers");

    await queryInterface.dropTable("comments");
    await queryInterface.dropTable("saved_events");
    await queryInterface.dropTable("ticket_types");
    await queryInterface.dropTable("event_categories");
    await queryInterface.dropTable("events");
    await queryInterface.dropTable("categories");

    await queryInterface.dropTable("point_histories");
    await queryInterface.dropTable("follows");
    await queryInterface.dropTable("organizer_applications");
    await queryInterface.dropTable("users");
  },
};
