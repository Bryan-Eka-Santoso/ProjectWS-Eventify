const db = require("../models");
const { ChatRoom, ChatRoomMember, Message ,MessageRead, ChatRoomCategory, Category,Event} = db;
const { Op  ,literal } = require("sequelize");

const canManageGroup = (role) => {
  return role === "owner" || role === "admin";
};

const canKickTarget = (requesterRole, targetRole) => {
  if (requesterRole === "owner" && targetRole !== "owner") return true;
  if (requesterRole === "admin" && targetRole === "member") return true;
  return false;
};

const findMember = async (chat_room_id, user_id) => {
  return await ChatRoomMember.findOne({
    where: {
      chat_room_id,
      user_id,
    },
  });
};

const ensureChatRoomExists = async (chat_room_id, res) => {
  const chatRoom = await ChatRoom.findByPk(chat_room_id);

  if (!chatRoom) {
    res.status(404).json({
      success: false,
      message: "Chat room not found",
    });
    return null;
  }

  return chatRoom;
};

const ensureMember = async (chat_room_id, user_id, res) => {
  const member = await findMember(chat_room_id, user_id);

  if (!member) {
    res.status(403).json({
      success: false,
      message: "User is not a member of this chat room",
    });
    return null;
  }

  return member;
};

const getMemberRole = async (chat_room_id, user_id) => {
  const member = await findMember(chat_room_id, user_id);
  return member ? member.role : null;
};
// Create new chat room
exports.createChatRoom = async (req, res) => {
  try {
    let { name, description, category_ids, creator_id } = req.body;


    const profile_image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;
    
    // Validation
    if (!name || !creator_id) {
      return res.status(400).json({
        success: false,
        message: "Name and creator_id are required",
      });
    }

    if (!profile_image_url) {
      return res.status(400).json({
        success: false,
        message: "Foto group harus diupload",
      });
    }
    
     if (category_ids) {
      try {
        category_ids = JSON.parse(category_ids);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "category_ids must be a valid JSON array",
        });
      }
    } else {
      category_ids = [];
    }

    // category_ids harus array
    if (category_ids && !Array.isArray(category_ids)) {
      return res.status(400).json({
        success: false,
        message: "category_ids must be an array",
      });
    }

    // Jika ada categories, insert ke pivot table
    if (category_ids && category_ids.length > 0) {
      // Validasi semua category_ids ada di database
      const categories = await Category.findAll({
        where: { id: category_ids },
      });

      if (categories.length !== category_ids.length) {
        return res.status(400).json({
          success: false,
          message: "One or more category_ids are invalid",
        });
      }
    }

    // Buat chat room tanpa category_id
    const newChatRoom = await ChatRoom.create({
      name,
      description: description || null,
      profile_image_url,
      creator_id,
    });

    await ChatRoomMember.create({
      chat_room_id: newChatRoom.id,
      user_id: creator_id,
      role: "owner",
    });



      // Insert ke chat_room_categories
      await Promise.all(
        category_ids.map((category_id) =>
          ChatRoomCategory.create({
            chat_room_id: newChatRoom.id,
            category_id,
          })
        )
      );

    // Return dengan categories
    const roomWithCategories = await ChatRoom.findByPk(newChatRoom.id, {
      include: [
        {
          association: "Categories",
          attributes: ["id", "name", "description"],
          through: { attributes: [] }, // Jangan tampilkan pivot table data
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Chat room created successfully",
      data: roomWithCategories,
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

    const categoryInclude = {
      association: "Categories",
      attributes: ["id", "name", "description"],
      through: { attributes: [] },
      required: false,
    };

    if (categoryIds) {
    const ids = Array.isArray(categoryIds)
      ? categoryIds.map((id) => parseInt(id))
      : categoryIds.split(",").map((id) => parseInt(id));

    categoryInclude.where = { id: { [Op.in]: ids } };
    categoryInclude.required = true;
  }

    // 3. FILTER: Berdasarkan role pembuat (official vs public)
    // filterCreator: 'official' (admin/organizer), 'public' (user)
    // Ini memerlukan join dengan tabel users

    // 4. SORTING: Urutkan berdasarkan
    switch (sortBy) {
      case "trending":
        // Urutkan berdasarkan jumlah member (terbanyak)
        orderClause = [
          [
            literal(`(
              SELECT COUNT(*) FROM chat_room_members
              WHERE chat_room_members.chat_room_id = ChatRoom.id
            )`),
            "DESC",
          ],
        ];
        break;

      case "least-members":
        // Urutkan berdasarkan jumlah member (tersedikit)
        orderClause = [
          [
            literal(`(
              SELECT COUNT(*) FROM chat_room_members
              WHERE chat_room_members.chat_room_id = ChatRoom.id
            )`),
            "ASC",
          ],
        ];
        break;

      case "recently-active":
        // Urutkan berdasarkan pesan terbaru
        orderClause = [
          [
            literal(`(
              SELECT MAX(created_at) FROM messages
              WHERE messages.chat_room_id = ChatRoom.id
            )`),
            "DESC",
          ],
        ];
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
        "profile_image_url",
        "creator_id",
        "created_at",
      ],
      include: [
         categoryInclude,
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

    query.order = orderClause;

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
    const { chat_room_id } = req.params;

    const chatRoom = await ChatRoom.findByPk(chat_room_id, {
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
      role: "member",
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
      attributes: ["id", "user_id", "role"],
      include: [
        {
          association: "User",
          attributes: ["id", "name", "email", "avatar"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["id", "ASC"]],
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
    const { chat_room_id } = req.params;
    const {
      sender_id,
      message_type = "text",
      body,
      media_url,
      recommended_event_id,
    } = req.body;

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

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const member = await ensureMember(chat_room_id, sender_id, res);
    if (!member) return;

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
      include: [
        {
          association: "Sender",
          attributes: ["id", "name", "avatar"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "ASC"]],
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
// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ["id", "name", "description"],
      order: [["id", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      error: error.message,
    });
  }
};

exports.updateChatRoom = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { name, description, user_id } = req.body;

    const chatRoom = await ChatRoom.findByPk(chat_room_id);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    // Untuk sementara hanya creator yang boleh edit group
    if (parseInt(chatRoom.creator_id) !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        message: "Only group creator can update this chat room",
      });
    }

    const updateData = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (req.file) {
      updateData.profile_image_url = `/uploads/${req.file.filename}`;
    }

    await chatRoom.update(updateData);

    return res.status(200).json({
      success: true,
      message: "Chat room updated successfully",
      data: chatRoom,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update chat room",
      error: error.message,
    });
  }
};

exports.deleteChatRoom = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { user_id } = req.body;

    const chatRoom = await ChatRoom.findByPk(chat_room_id);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    if (parseInt(chatRoom.creator_id) !== parseInt(user_id)) {
      return res.status(403).json({
        success: false,
        message: "Only group creator can delete this chat room",
      });
    }

    await chatRoom.destroy();

    return res.status(200).json({
      success: true,
      message: "Chat room deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete chat room",
      error: error.message,
    });
  }
};

exports.getChatRoomMemberCount = async (req, res) => {
  try {
    const { chat_room_id } = req.params;

    const chatRoom = await ChatRoom.findByPk(chat_room_id);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const totalMembers = await ChatRoomMember.count({
      where: { chat_room_id: chat_room_id },
    });

    return res.status(200).json({
      success: true,
      message: "Member count retrieved successfully",
      data: {
        chat_room_id: parseInt(chat_room_id),
        total_members: totalMembers,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve member count",
      error: error.message,
    });
  }
};

exports.sendMediaMessage = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { sender_id, message_type, body } = req.body;

    if (!chat_room_id || !sender_id) {
      return res.status(400).json({
        success: false,
        message: "chat_room_id and sender_id are required",
      });
    }

    if (!["image", "video"].includes(message_type)) {
      return res.status(400).json({
        success: false,
        message: "message_type must be image or video",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Media file is required",
      });
    }

    const chatRoom = await ChatRoom.findByPk(chat_room_id);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const isMember = await ChatRoomMember.findOne({
      where: {
        chat_room_id: chat_room_id,
        user_id: sender_id,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this chat room",
      });
    }

    const media_url = `/uploads/${req.file.filename}`;

    const newMessage = await Message.create({
      chat_room_id: chat_room_id,
      sender_id,
      message_type,
      body: body || null,
      media_url,
      recommended_event_id: null,
    });

    return res.status(201).json({
      success: true,
      message: "Media message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send media message",
      error: error.message,
    });
  }
};

exports.shareEventToChat = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { sender_id, recommended_event_id, body } = req.body;

    if (!sender_id || !recommended_event_id) {
      return res.status(400).json({
        success: false,
        message: "sender_id and recommended_event_id are required",
      });
    }

    const chatRoom = await ChatRoom.findByPk(chat_room_id);

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: "Chat room not found",
      });
    }

    const isMember = await ChatRoomMember.findOne({
      where: {
        chat_room_id: chat_room_id,
        user_id: sender_id,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "User is not a member of this chat room",
      });
    }

    const event = await db.Event.findByPk(recommended_event_id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const newMessage = await Message.create({
      chat_room_id: chat_room_id,
      sender_id,
      message_type: "recommendation",
      body: body || "Membagikan event",
      media_url: null,
      recommended_event_id,
    });

    return res.status(201).json({
      success: true,
      message: "Event shared to chat successfully",
      data: {
        ...newMessage.toJSON(),
        event,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to share event to chat",
      error: error.message,
    });
  }
};


exports.updateMemberRole = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.params;
    const { requester_id, role } = req.body;

    if (!requester_id || !role) {
      return res.status(400).json({
        success: false,
        message: "requester_id and role are required",
      });
    }

    if (!["admin", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role can only be admin or member",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const requesterRole = await getMemberRole(chat_room_id, requester_id);

    if (requesterRole !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Only owner can update member role",
      });
    }

    const targetMember = await findMember(chat_room_id, user_id);

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: "Target member not found in this chat room",
      });
    }

    if (targetMember.role === "owner") {
      return res.status(403).json({
        success: false,
        message: "Owner role cannot be changed from this endpoint",
      });
    }

    await targetMember.update({ role });

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: targetMember,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update member role",
      error: error.message,
    });
  }
};

exports.kickMember = async (req, res) => {
  try {
    const { chat_room_id, user_id } = req.params;
    const { requester_id } = req.body;

    if (!requester_id) {
      return res.status(400).json({
        success: false,
        message: "requester_id is required",
      });
    }

    if (parseInt(requester_id) === parseInt(user_id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot kick yourself",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const requesterMember = await findMember(chat_room_id, requester_id);
    const targetMember = await findMember(chat_room_id, user_id);

    if (!requesterMember) {
      return res.status(403).json({
        success: false,
        message: "Requester is not a member of this chat room",
      });
    }

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: "Target member not found in this chat room",
      });
    }

    if (!canKickTarget(requesterMember.role, targetMember.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to kick this member",
      });
    }

    await targetMember.destroy();

    return res.status(200).json({
      success: true,
      message: "Member kicked successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to kick member",
      error: error.message,
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const message = await Message.findByPk(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const isSender = parseInt(message.sender_id) === parseInt(user_id);
    const userRole = await getMemberRole(message.chat_room_id, user_id);
    const isAdminOrOwner = canManageGroup(userRole);

    if (!isSender && !isAdminOrOwner) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this message",
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

exports.searchMessages = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { keyword, user_id, page = 1, limit = 20 } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    if (!keyword || !keyword.trim()) {
      return res.status(400).json({
        success: false,
        message: "keyword is required",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const member = await ensureMember(chat_room_id, user_id, res);
    if (!member) return;

    const offset = (page - 1) * limit;

    const whereClause = {
      chat_room_id,
      body: {
        [Op.like]: `%${keyword}%`,
      },
    };

    const messages = await Message.findAll({
      where: whereClause,
      attributes: [
        "id",
        "chat_room_id",
        "sender_id",
        "message_type",
        "body",
        "media_url",
        "recommended_event_id",
        "is_pinned",
        "pinned_at",
        "created_at",
      ],
      include: [
        {
          association: "Sender",
          attributes: ["id", "name", "avatar"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    const total = await Message.count({
      where: whereClause,
    });

    return res.status(200).json({
      success: true,
      message: "Messages searched successfully",
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
      message: "Failed to search messages",
      error: error.message,
    });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const message = await Message.findByPk(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const userRole = await getMemberRole(message.chat_room_id, user_id);

    if (!canManageGroup(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only owner or admin can pin message",
      });
    }

    await message.update({
      is_pinned: true,
      pinned_at: new Date(),
      pinned_by: user_id,
    });

    return res.status(200).json({
      success: true,
      message: "Message pinned successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to pin message",
      error: error.message,
    });
  }
};

exports.unpinMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const message = await Message.findByPk(message_id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const userRole = await getMemberRole(message.chat_room_id, user_id);

    if (!canManageGroup(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only owner or admin can unpin message",
      });
    }

    await message.update({
      is_pinned: false,
      pinned_at: null,
      pinned_by: null,
    });

    return res.status(200).json({
      success: true,
      message: "Message unpinned successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to unpin message",
      error: error.message,
    });
  }
};

exports.getPinnedMessages = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const member = await ensureMember(chat_room_id, user_id, res);
    if (!member) return;

    const messages = await Message.findAll({
      where: {
        chat_room_id,
        is_pinned: true,
      },
      attributes: [
        "id",
        "chat_room_id",
        "sender_id",
        "message_type",
        "body",
        "media_url",
        "recommended_event_id",
        "is_pinned",
        "pinned_at",
        "pinned_by",
        "created_at",
      ],
      include: [
        {
          association: "Sender",
          attributes: ["id", "name", "avatar"],
        },
      ],
      order: [["pinned_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Pinned messages retrieved successfully",
      data: messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pinned messages",
      error: error.message,
    });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { user_id, message_ids } = req.body;

    if (!user_id || !Array.isArray(message_ids)) {
      return res.status(400).json({
        success: false,
        message: "user_id and message_ids array are required",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const member = await ensureMember(chat_room_id, user_id, res);
    if (!member) return;

    const messages = await Message.findAll({
      where: {
        id: { [Op.in]: message_ids },
        chat_room_id,
        sender_id: { [Op.ne]: user_id },
      },
      attributes: ["id"],
    });

    const readData = messages.map((message) => ({
      message_id: message.id,
      chat_room_id,
      user_id,
    }));

    if (readData.length > 0) {
      await MessageRead.bulkCreate(readData, {
        ignoreDuplicates: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Messages marked as read successfully",
      data: {
        marked_count: readData.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

exports.markAllMessagesAsRead = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const member = await ensureMember(chat_room_id, user_id, res);
    if (!member) return;

    const messages = await Message.findAll({
      where: {
        chat_room_id,
        sender_id: { [Op.ne]: user_id },
      },
      attributes: ["id"],
    });

    const readData = messages.map((message) => ({
      message_id: message.id,
      chat_room_id,
      user_id,
    }));

    if (readData.length > 0) {
      await MessageRead.bulkCreate(readData, {
        ignoreDuplicates: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "All messages marked as read successfully",
      data: {
        marked_count: readData.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all messages as read",
      error: error.message,
    });
  }
};

exports.getUnreadCountByRoom = async (req, res) => {
  try {
    const { chat_room_id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const chatRoom = await ensureChatRoomExists(chat_room_id, res);
    if (!chatRoom) return;

    const member = await ensureMember(chat_room_id, user_id, res);
    if (!member) return;

    const readMessages = await MessageRead.findAll({
      where: {
        chat_room_id,
        user_id,
      },
      attributes: ["message_id"],
    });

    const readMessageIds = readMessages.map((item) => item.message_id);

    const unreadCount = await Message.count({
      where: {
        chat_room_id,
        sender_id: { [Op.ne]: user_id },
        id: {
          [Op.notIn]: readMessageIds.length > 0 ? readMessageIds : [0],
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: {
        chat_room_id: parseInt(chat_room_id),
        user_id: parseInt(user_id),
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve unread count",
      error: error.message,
    });
  }
};

exports.getUnreadCounts = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const memberships = await ChatRoomMember.findAll({
      where: {
        user_id,
      },
      attributes: ["chat_room_id"],
    });

    const results = await Promise.all(
      memberships.map(async (membership) => {
        const chat_room_id = membership.chat_room_id;

        const readMessages = await MessageRead.findAll({
          where: {
            chat_room_id,
            user_id,
          },
          attributes: ["message_id"],
        });

        const readMessageIds = readMessages.map((item) => item.message_id);

        const unreadCount = await Message.count({
          where: {
            chat_room_id,
            sender_id: { [Op.ne]: user_id },
            id: {
              [Op.notIn]: readMessageIds.length > 0 ? readMessageIds : [0],
            },
          },
        });

        return {
          chat_room_id,
          unread_count: unreadCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Unread counts retrieved successfully",
      data: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve unread counts",
      error: error.message,
    });
  }
};























