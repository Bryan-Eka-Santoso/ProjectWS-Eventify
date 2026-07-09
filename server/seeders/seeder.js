"use strict";

const bcrypt = require("bcrypt");
const crypto = require("crypto");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    const password = await bcrypt.hash("password123", 10);

    // =========================
    // USERS
    // =========================
    await queryInterface.bulkInsert("users", [
      {
        id: 1,
        name: "Admin Eventify",
        email: "admin@eventify.com",
        password,
        role: "admin",
        avatar: null,
        bio: "Admin utama Eventify.",
        points: 1000,
        api_key: crypto.randomUUID(),
        refresh_token: null,
        created_at: now,
        updated_at: now,
        deletedAt: null,
      },
      {
        id: 2,
        name: "Organizer Nusantara",
        email: "organizer@eventify.com",
        password,
        role: "organizer",
        avatar: null,
        bio: "Organizer event musik, edukasi, dan komunitas.",
        points: 500,
        api_key: crypto.randomUUID(),
        refresh_token: null,
        created_at: now,
        updated_at: now,
        deletedAt: null,
      },
      {
        id: 3,
        name: "Budi Santoso",
        email: "budi@mail.com",
        password,
        role: "user",
        avatar: null,
        bio: "Suka ikut konser dan workshop.",
        points: 250,
        api_key: crypto.randomUUID(),
        refresh_token: null,
        created_at: now,
        updated_at: now,
        deletedAt: null,
      },
      {
        id: 4,
        name: "Sinta Wijaya",
        email: "sinta@mail.com",
        password,
        role: "user",
        avatar: null,
        bio: "Aktif di komunitas teknologi.",
        points: 180,
        api_key: crypto.randomUUID(),
        refresh_token: null,
        created_at: now,
        updated_at: now,
        deletedAt: null,
      },
    ]);

    await queryInterface.bulkInsert("organizer_applications", [
      {
        id: 1,
        user_id: 2,
        organizer_name: "Nusantara Creative",
        ktp_number: "3578010101010001",
        ktp_image_url: "/uploads/dummy-ktp.jpg",
        phone_number: "081234567890",
        address: "Jl. Raya Event No. 10, Surabaya",
        social_media_link: "https://instagram.com/nusantara.creative",
        status: "approved",
        rejection_reason: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("follows", [
      {
        id: 1,
        follower_id: 3,
        following_id: 2,
        created_at: now,
      },
      {
        id: 2,
        follower_id: 4,
        following_id: 2,
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("point_histories", [
      {
        id: 1,
        user_id: 3,
        amount: 100,
        type: "earn",
        description: "Bonus registrasi akun",
        created_at: now,
      },
      {
        id: 2,
        user_id: 4,
        amount: 80,
        type: "earn",
        description: "Bonus aktivitas awal",
        created_at: now,
      },
    ]);

    // =========================
    // CATEGORIES
    // =========================
    await queryInterface.bulkInsert("categories", [
      {
        id: 1,
        name: "Music",
        description: "Konser, festival musik, dan pertunjukan live.",
      },
      {
        id: 2,
        name: "Technology",
        description: "Seminar, workshop, hackathon, dan tech meetup.",
      },
      {
        id: 3,
        name: "Education",
        description: "Kelas, pelatihan, dan event edukatif.",
      },
      {
        id: 4,
        name: "Community",
        description: "Gathering dan kegiatan komunitas.",
      },
    ]);

    // =========================
    // EVENTS
    // =========================
    await queryInterface.bulkInsert("events", [
      {
        id: 1,
        organizer_id: 2,
        title: "Nusantara Music Fest 2026",
        description: "Festival musik lokal dengan berbagai musisi nasional.",
        main_image_url: "music-fest.jpg",
        location: "Surabaya Convention Center",
        start_date: new Date("2026-08-10T18:00:00"),
        end_date: new Date("2026-08-10T22:00:00"),
        status: "published",
        rejection_reason: null,
        cancellation_reason: null,
        canceled_at: null,
        canceled_by: null,
        external_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        organizer_id: 2,
        title: "React & Node.js Workshop",
        description: "Workshop fullstack sederhana menggunakan React dan Node.js.",
        main_image_url: "react-node-workshop.jpg",
        location: "Coworking Space Surabaya",
        start_date: new Date("2026-09-15T09:00:00"),
        end_date: new Date("2026-09-15T16:00:00"),
        status: "published",
        rejection_reason: null,
        cancellation_reason: null,
        canceled_at: null,
        canceled_by: null,
        external_id: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        organizer_id: null,
        title: "Global Online Tech Talk",
        description: "Event eksternal hasil kurasi admin.",
        main_image_url: "default-banner.jpg",
        location: "Online",
        start_date: new Date("2026-10-01T19:00:00"),
        end_date: new Date("2026-10-01T21:00:00"),
        status: "published",
        rejection_reason: null,
        cancellation_reason: null,
        canceled_at: null,
        canceled_by: null,
        external_id: "external-tech-talk-001",
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("event_images", [
      {
        id: 1,
        event_id: 1,
        image_url: "music-fest-gallery-1.jpg",
      },
      {
        id: 2,
        event_id: 2,
        image_url: "workshop-gallery-1.jpg",
      },
    ]);

    await queryInterface.bulkInsert("event_categories", [
      { event_id: 1, category_id: 1 },
      { event_id: 1, category_id: 4 },
      { event_id: 2, category_id: 2 },
      { event_id: 2, category_id: 3 },
      { event_id: 3, category_id: 2 },
    ]);

    await queryInterface.bulkInsert("event_changes", [
      {
        id: 1,
        event_id: 2,
        changed_by: 2,
        change_type: "minor",
        old_start_date: null,
        new_start_date: null,
        old_end_date: null,
        new_end_date: null,
        old_location: null,
        new_location: null,
        change_reason: "Update deskripsi workshop.",
        refund_deadline: null,
        status: "closed",
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("event_cancellation_requests", [
      {
        id: 1,
        event_id: 1,
        requested_by: 2,
        reviewed_by: null,
        reason: "Contoh request pembatalan pending.",
        status: "pending",
        admin_note: null,
        requested_at: now,
        reviewed_at: null,
      },
    ]);

    await queryInterface.bulkInsert("ticket_types", [
      {
        id: 1,
        event_id: 1,
        name: "Regular",
        price: 150000,
        quota: 100,
        remaining_quota: 98,
      },
      {
        id: 2,
        event_id: 1,
        name: "VIP",
        price: 300000,
        quota: 50,
        remaining_quota: 50,
      },
      {
        id: 3,
        event_id: 2,
        name: "Workshop Seat",
        price: 200000,
        quota: 40,
        remaining_quota: 39,
      },
    ]);

    await queryInterface.bulkInsert("saved_events", [
      {
        id: 1,
        user_id: 3,
        event_id: 1,
        created_at: now,
      },
      {
        id: 2,
        user_id: 4,
        event_id: 2,
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("comments", [
      {
        id: 1,
        user_id: 3,
        event_id: 1,
        body: "Event musiknya menarik, saya mau ikut!",
        created_at: now,
      },
      {
        id: 2,
        user_id: 4,
        event_id: 2,
        body: "Workshop ini cocok untuk pemula fullstack.",
        created_at: now,
      },
    ]);

    // =========================
    // VOUCHER & TRANSACTION
    // =========================
    await queryInterface.bulkInsert("vouchers", [
      {
        id: 1,
        code: "WELCOME10",
        name: "Diskon Pengguna Baru",
        percentage: 10,
        max_cut: 25000,
        points_required: 50,
        stock: 100,
        valid_until: new Date("2026-12-31T23:59:59"),
        is_active: true,
      },
      {
        id: 2,
        code: "EVENTIFY25",
        name: "Diskon Eventify 25%",
        percentage: 25,
        max_cut: 50000,
        points_required: 150,
        stock: 50,
        valid_until: new Date("2026-12-31T23:59:59"),
        is_active: true,
      },
    ]);

    await queryInterface.bulkInsert("user_vouchers", [
      {
        id: 1,
        user_id: 3,
        voucher_id: 1,
        is_used: true,
        claimed_at: now,
        used_at: now,
        expired_at: new Date("2026-12-31T23:59:59"),
      },
      {
        id: 2,
        user_id: 4,
        voucher_id: 2,
        is_used: false,
        claimed_at: now,
        used_at: null,
        expired_at: new Date("2026-12-31T23:59:59"),
      },
    ]);

    await queryInterface.bulkInsert("transactions", [
      {
        id: 1,
        user_id: 3,
        user_voucher_id: 1,
        total_amount: 150000,
        discount_amount: 15000,
        final_amount: 135000,
        earned_points: 13,
        payment_status: "paid",
        payment_method: "Simulated Payment",
        refund_status: "none",
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        user_id: 4,
        user_voucher_id: null,
        total_amount: 200000,
        discount_amount: 0,
        final_amount: 200000,
        earned_points: 20,
        payment_status: "paid",
        payment_method: "Simulated Payment",
        refund_status: "none",
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("transaction_details", [
      {
        id: 1,
        transaction_id: 1,
        ticket_type_id: 1,
        quantity: 1,
        subtotal: 150000,
      },
      {
        id: 2,
        transaction_id: 2,
        ticket_type_id: 3,
        quantity: 1,
        subtotal: 200000,
      },
    ]);

    await queryInterface.bulkInsert("user_tickets", [
      {
        id: 1,
        user_id: 3,
        ticket_type_id: 1,
        transaction_detail_id: 1,
        ticket_code: "EVT-001-REG-BUDI",
        status: "active",
        created_at: now,
      },
      {
        id: 2,
        user_id: 4,
        ticket_type_id: 3,
        transaction_detail_id: 2,
        ticket_code: "EVT-002-WS-SINTA",
        status: "active",
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("refund_requests", [
      {
        id: 1,
        transaction_id: 2,
        user_id: 4,
        event_id: 2,
        event_change_id: 1,
        refund_type: "event_changed",
        refund_method: "original_payment",
        amount: 200000,
        reason: "Contoh data pengajuan refund karena perubahan event.",
        status: "requested",
        rejection_reason: null,
        requested_at: now,
        processed_at: null,
        refunded_at: null,
        rejected_at: null,
      },
    ]);

    // =========================
    // COMMUNITY & CHAT
    // =========================
    await queryInterface.bulkInsert("chat_rooms", [
      {
        id: 1,
        name: "Komunitas Musik Surabaya",
        description: "Tempat diskusi event musik dan konser.",
        profile_image_url: "/uploads/community-music.jpg",
        creator_id: 2,
        created_at: now,
      },
      {
        id: 2,
        name: "Tech Meetup Indonesia",
        description: "Diskusi workshop, seminar, dan meetup teknologi.",
        profile_image_url: "/uploads/community-tech.jpg",
        creator_id: 4,
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("chat_room_categories", [
      {
        id: 1,
        chat_room_id: 1,
        category_id: 1,
        created_at: now,
      },
      {
        id: 2,
        chat_room_id: 1,
        category_id: 4,
        created_at: now,
      },
      {
        id: 3,
        chat_room_id: 2,
        category_id: 2,
        created_at: now,
      },
      {
        id: 4,
        chat_room_id: 2,
        category_id: 4,
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("chat_room_members", [
      {
        id: 1,
        chat_room_id: 1,
        user_id: 2,
        role: "owner",
        joined_at: now,
      },
      {
        id: 2,
        chat_room_id: 1,
        user_id: 3,
        role: "member",
        joined_at: now,
      },
      {
        id: 3,
        chat_room_id: 2,
        user_id: 4,
        role: "owner",
        joined_at: now,
      },
      {
        id: 4,
        chat_room_id: 2,
        user_id: 2,
        role: "admin",
        joined_at: now,
      },
    ]);

    await queryInterface.bulkInsert("messages", [
      {
        id: 1,
        chat_room_id: 1,
        sender_id: 2,
        message_type: "text",
        body: "Selamat datang di komunitas musik!",
        media_url: null,
        recommended_event_id: null,
        is_pinned: true,
        pinned_at: now,
        pinned_by: 2,
        deleted_at: null,
        created_at: now,
      },
      {
        id: 2,
        chat_room_id: 1,
        sender_id: 3,
        message_type: "recommendation",
        body: "Saya rekomendasikan event ini.",
        media_url: null,
        recommended_event_id: 1,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
        deleted_at: null,
        created_at: now,
      },
      {
        id: 3,
        chat_room_id: 2,
        sender_id: 4,
        message_type: "text",
        body: "Ada yang mau ikut workshop React?",
        media_url: null,
        recommended_event_id: null,
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
        deleted_at: null,
        created_at: now,
      },
    ]);

    await queryInterface.bulkInsert("message_reads", [
      {
        id: 1,
        message_id: 1,
        chat_room_id: 1,
        user_id: 3,
        read_at: now,
      },
      {
        id: 2,
        message_id: 3,
        chat_room_id: 2,
        user_id: 2,
        read_at: now,
      },
    ]);

    // =========================
    // SOCIAL POSTS
    // =========================
    await queryInterface.bulkInsert("posts", [
      {
        id: 1,
        user_id: 2,
        content: "Nusantara Music Fest sudah dibuka. Yuk daftar!",
        image_url: "music-post.jpg",
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        user_id: 4,
        content: "Baru saja menemukan workshop React yang menarik.",
        image_url: null,
        created_at: now,
        updated_at: now,
      },
    ]);

    await queryInterface.bulkInsert("post_comments", [
      {
        id: 1,
        post_id: 1,
        user_id: 3,
        body: "Siap ikut!",
        created_at: now,
      },
      {
        id: 2,
        post_id: 2,
        user_id: 2,
        body: "Workshop-nya cocok untuk pemula.",
        created_at: now,
      },
    ]);

    // =========================
    // NOTIFICATIONS
    // =========================
    await queryInterface.bulkInsert("notifications", [
    {
        id: 1,
        recipient_id: 3,
        actor_id: 2,
        type: "event_recommendation",
        title: "Event baru untuk kamu",
        body: "Organizer merekomendasikan Nusantara Music Fest 2026.",
        target_type: "event",
        target_id: 1,
        data: JSON.stringify({
        event_id: 1,
        event_title: "Nusantara Music Fest 2026",
        }),
        is_read: false,
        read_at: null,
        created_at: now,
        updated_at: now,
    },
    {
        id: 2,
        recipient_id: 4,
        actor_id: null,
        type: "voucher_available",
        title: "Voucher tersedia",
        body: "Voucher EVENTIFY25 tersedia untuk kamu klaim.",
        target_type: "voucher",
        target_id: 2,
        data: JSON.stringify({
        voucher_id: 2,
        code: "EVENTIFY25",
        }),
        is_read: false,
        read_at: null,
        created_at: now,
        updated_at: now,
    },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("notifications", null, {});
    await queryInterface.bulkDelete("post_comments", null, {});
    await queryInterface.bulkDelete("posts", null, {});
    await queryInterface.bulkDelete("message_reads", null, {});
    await queryInterface.bulkDelete("messages", null, {});
    await queryInterface.bulkDelete("chat_room_members", null, {});
    await queryInterface.bulkDelete("chat_room_categories", null, {});
    await queryInterface.bulkDelete("chat_rooms", null, {});
    await queryInterface.bulkDelete("user_tickets", null, {});
    await queryInterface.bulkDelete("transaction_details", null, {});
    await queryInterface.bulkDelete("refund_requests", null, {});
    await queryInterface.bulkDelete("transactions", null, {});
    await queryInterface.bulkDelete("user_vouchers", null, {});
    await queryInterface.bulkDelete("vouchers", null, {});
    await queryInterface.bulkDelete("comments", null, {});
    await queryInterface.bulkDelete("saved_events", null, {});
    await queryInterface.bulkDelete("ticket_types", null, {});
    await queryInterface.bulkDelete("event_categories", null, {});
    await queryInterface.bulkDelete("event_images", null, {});
    await queryInterface.bulkDelete("event_cancellation_requests", null, {});
    await queryInterface.bulkDelete("event_changes", null, {});
    await queryInterface.bulkDelete("events", null, {});
    await queryInterface.bulkDelete("categories", null, {});
    await queryInterface.bulkDelete("point_histories", null, {});
    await queryInterface.bulkDelete("follows", null, {});
    await queryInterface.bulkDelete("organizer_applications", null, {});
    await queryInterface.bulkDelete("users", null, {});
  },
};