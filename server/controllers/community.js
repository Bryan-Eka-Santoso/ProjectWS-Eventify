const sequelize = require("sequelize");
const db = require("../models");
const { ChatRoom, ChatRoomMember, Message } = db;
const { Op } = require("sequelize");

// Create new chat room
exports.createChatRoom = async (req, res) => {
  try {
    const { name, description, category_id, creator_id } = req.body;

    // Validation
    if (!name || !creator_id) {
      return res.status(400).json({
        success: false,
        message: "Name and creator_id are required",
      });
    }

    const newChatRoom = await ChatRoom.create({
      name,
      description: description || null,
      category_id: category_id || null,
      creator_id,
    });

    return res.status(201).json({
      success: true,
      message: "Chat room created successfully",
      data: newChatRoom,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create chat room",
      error: error.message,
    });
  }
};

// Get all chat rooms with search, filter, and sorting
exports.getAllChatRooms = async (req, res) => {
  try {
    const { search, filterCreator, categoryIds, sortBy, page = 1, limit = 10 } = req.query;

    let whereClause = {};
    let orderClause = [["created_at", "DESC"]]; // Default: newest

    // 1. SEARCH: Cari berdasarkan name atau description
    if (search) {
      whereClause = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    // 2. FILTER: Berdasarkan kategori
    // categoryIds bisa berupa: "1,2,3" atau array dari checkbox
    if (categoryIds) {
      const ids = Array.isArray(categoryIds) 
        ? categoryIds.map(id => parseInt(id)) 
        : categoryIds.split(',').map(id => parseInt(id));
      
      whereClause.category_id = { [Op.in]: ids };
    }

    // 3. FILTER: Berdasarkan role pembuat (official vs public)
    // filterCreator: 'official' (admin/organizer), 'public' (user)
    // Ini memerlukan join dengan tabel users

    // 4. SORTING: Urutkan berdasarkan
    switch (sortBy) {
      case "trending":
        // Urutkan berdasarkan jumlah member (terbanyak)
        orderClause = sequelize.sequelize.literal(`(
          SELECT COUNT(*) FROM chat_room_members 
          WHERE chat_room_members.chat_room_id = ChatRoom.id
        ) DESC`);
        break;

      case "least-members":
        // Urutkan berdasarkan jumlah member (tersedikit)
        orderClause = sequelize.sequelize.literal(`(
          SELECT COUNT(*) FROM chat_room_members 
          WHERE chat_room_members.chat_room_id = ChatRoom.id
        ) ASC`);
        break;

      case "recently-active":
        // Urutkan berdasarkan pesan terbaru
        orderClause = sequelize.sequelize.literal(`(
          SELECT MAX(created_at) FROM messages 
          WHERE messages.chat_room_id = ChatRoom.id
        ) DESC`);
        break;

      case "newest":
      default:
        orderClause = [["created_at", "DESC"]];
        break;
    }

    // Pagination
    const offset = (page - 1) * limit;

    let query = {
      where: whereClause,
      attributes: [
        "id",
        "name",
        "description",
        "category_id",
        "creator_id",
        "created_at",
      ],
      include: [
        {
          association: "ChatRoomMembers",
          attributes: ["id"],
          required: false,
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false,
    };

    // Apply sorting
    if (typeof orderClause === "string") {
      // Raw SQL ordering
      query.order = sequelize.sequelize.literal(orderClause);
    } else {
      query.order = orderClause;
    }

    const chatRooms = await ChatRoom.findAll(query);

    // Count total untuk pagination
    const total = await ChatRoom.count({ where: whereClause });

    return res.status(200).json({
      success: true,
      message: "Chat rooms retrieved successfully",
      data: chatRooms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chat rooms",
      error: error.message,
    });
  }
};


// Get single chat room by ID
exports.getChatRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const chatRoom = await ChatRoom.findByPk(id, {
      include: [
        {
          association: "ChatRoomMembers",
          attributes: ["id", "user_id", "joined_at"],
        },
      ],
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat room retrieved successfully",
      data: chatRoom,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chat room",
      error: error.message,
    });
  }
};

// Join chat room
exports.joinChatRoom = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.body;

    // Validation
    if (!chat_room_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "chat_room_id and user_id are required",
      });
    }

    // Cek apakah chat room ada
    const chatRoom = await ChatRoom.findByPk(chat_room_id);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    // Cek apakah user sudah bergabung
    const existingMember = await ChatRoomMember.findOne({
      where: {
        chat_room_id,
        user_id,
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this chat room",
      });
    }

    // Tambahkan user ke chat room
    const newMember = await ChatRoomMember.create({
      chat_room_id,
      user_id,
    });

    return res.status(201).json({
      success: true,
      message: "User joined chat room successfully",
      data: newMember,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to join chat room",
      error: error.message,
    });
  }
};

// Leave chat room
exports.leaveChatRoom = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.body;

    // Validation
    if (!chat_room_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "chat_room_id and user_id are required",
      });
    }

    // Cari member
    const member = await ChatRoomMember.findOne({
      where: {
        chat_room_id,
        user_id,
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this chat room",
      });
    }

    // Hapus member
    await member.destroy();

    return res.status(200).json({
      success: true,
      message: "User left chat room successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to leave chat room",
      error: error.message,
    });
  }
};

// Get chat room members
exports.getChatRoomMembers = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Cek apakah chat room ada
    const chatRoom = await ChatRoom.findByPk(chat_room_id);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const offset = (page - 1) * limit;

    const members = await ChatRoomMember.findAll({
      where: { chat_room_id },
      attributes: ["id", "user_id", "joined_at"],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["joined_at", "DESC"]],
    });

    const total = await ChatRoomMember.count({
      where: { chat_room_id },
    });

    return res.status(200).json({
      success: true,
      message: "Chat room members retrieved successfully",
      data: members,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve chat room members",
      error: error.message,
    });
  }
};

// Check if user is member of chat room
exports.checkMembership = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.query;

    if (!chat_room_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "chat_room_id and user_id are required",
      });
    }

    const member = await ChatRoomMember.findOne({
      where: {
        chat_room_id,
        user_id,
      },
    });

    return res.status(200).json({
      success: true,
      isMember: !!member,
      data: member || null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to check membership",
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chat_room_id, sender_id, message_type = "text", body, media_url, recommended_event_id } = req.body;

    if (!chat_room_id || !sender_id) {
      return res.status(400).json({
        success: false,
        message: "chat_room_id and sender_id are required",
      });
    }

    const validMessageTypes = ["text", "image", "video", "recommendation"];
    if (!validMessageTypes.includes(message_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid message_type. Must be one of: ${validMessageTypes.join(", ")}`,
      });
    }

    if (message_type === "text" && !body) {
      return res.status(400).json({
        success: false,
        message: "Body is required for text messages",
      });
    }

    if ((message_type === "image" || message_type === "video") && !media_url) {
      return res.status(400).json({
        success: false,
        message: "media_url is required for image/video messages",
      });
    }

    if (message_type === "recommendation" && !recommended_event_id) {
      return res.status(400).json({
        success: false,
        message: "recommended_event_id is required for recommendation messages",
      });
    }

    // Cek apakah chat room ada
    const chatRoom = await ChatRoom.findByPk(chat_room_id);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    // Cek apakah user adalah member
    const isMember = await ChatRoomMember.findOne({
      where: {
        chat_room_id,
        user_id: sender_id,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this chat room",
      });
    }

    const newMessage = await Message.create({
      chat_room_id,
      sender_id,
      message_type,
      body: body || null,
      media_url: media_url || null,
      recommended_event_id: recommended_event_id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const chatRoom = await ChatRoom.findByPk(chat_room_id);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const offset = (page - 1) * limit;

    const messages = await Message.findAll({
      where: { chat_room_id },
      attributes: [
        "id",
        "chat_room_id",
        "sender_id",
        "message_type",
        "body",
        "media_url",
        "recommended_event_id",
        "created_at",
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "ASC"]], // Oldest first untuk chronological order
    });

    const total = await Message.count({
      where: { chat_room_id },
    });

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
      error: error.message,
    });
  }
};

// Get latest messages (untuk polling atau initial load)
exports.getLatestMessages = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { limit = 30 } = req.query;

    // Cek apakah chat room ada
    const chatRoom = await ChatRoom.findByPk(chat_room_id);
    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const messages = await Message.findAll({
      where: { chat_room_id },
      attributes: [
        "id",
        "chat_room_id",
        "sender_id",
        "message_type",
        "body",
        "media_url",
        "recommended_event_id",
        "created_at",
      ],
      limit: parseInt(limit),
      order: [["created_at", "DESC"]],
    });

    // Reverse untuk chronological order
    messages.reverse();

    return res.status(200).json({
      success: true,
      message: "Latest messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
      error: error.message,
    });
  }
};

// Delete message (hanya bisa dihapus oleh sender atau admin)
exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { user_id } = req.body; // User yang ingin delete

    const message = await Message.findByPk(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is sender atau admin (untuk sekarang, hanya sender)
    if (message.sender_id !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await message.destroy();

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete message",
      error: error.message,
    });
  }
};