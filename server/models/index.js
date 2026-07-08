const { DataTypes } = require("sequelize");
const sequelize = require("../databases/connection");

// =====================================================
// IMPORT MODELS
// =====================================================

// User & social
const User = require("./User")(sequelize, DataTypes);
const OrganizerApplication = require("./OrganizerApplication")(
  sequelize,
  DataTypes,
);
const Follow = require("./Follow")(sequelize, DataTypes);
const PointHistory = require("./PointHistory")(sequelize, DataTypes);
const Notification = require("./Notification")(sequelize, DataTypes);

// Event
const Category = require("./Category")(sequelize, DataTypes);
const Event = require("./Event")(sequelize, DataTypes);
const EventChange = require("./EventChange")(sequelize, DataTypes);
const EventCancellationRequest = require("./EventCancellationRequest")(
  sequelize,
  DataTypes,
);
const EventImage = require("./EventImage")(sequelize, DataTypes);
const EventCategory = require("./EventCategory")(sequelize, DataTypes);
const SavedEvent = require("./SavedEvent")(sequelize, DataTypes);
const TicketType = require("./TicketType")(sequelize, DataTypes);
const Comment = require("./Comment")(sequelize, DataTypes);

// Voucher, transaction, ticket, refund
const Voucher = require("./Voucher")(sequelize, DataTypes);
const UserVoucher = require("./UserVoucher")(sequelize, DataTypes);
const Transaction = require("./Transaction")(sequelize, DataTypes);
const TransactionDetail = require("./TransactionDetail")(sequelize, DataTypes);
const UserTicket = require("./UserTicket")(sequelize, DataTypes);
const RefundRequest = require("./RefundRequest")(sequelize, DataTypes);
// Community
const ChatRoom = require("./Chatroom")(sequelize, DataTypes);
const ChatRoomMember = require("./ChatRoomMember")(sequelize, DataTypes);
const ChatRoomCategory = require("./ChatRoomCategory")(sequelize, DataTypes);
const Message = require("./Message")(sequelize, DataTypes);
const MessageRead = require("./MessageRead")(sequelize, DataTypes);

const ApiLog = require("./ApiLog")(sequelize, DataTypes);


// =====================================================
// EVENT CHANGE RELATIONSHIPS
// =====================================================

Event.hasMany(EventChange, {
  foreignKey: "event_id",
  as: "EventChanges",
});

EventChange.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

User.hasMany(EventChange, {
  foreignKey: "changed_by",
  as: "EventChanges",
});

EventChange.belongsTo(User, {
  foreignKey: "changed_by",
  as: "ChangedBy",
});

// =====================================================
// EVENT CANCELLATION REQUEST RELATIONSHIPS
// =====================================================

Event.hasMany(EventCancellationRequest, {
  foreignKey: "event_id",
  as: "CancellationRequests",
});

EventCancellationRequest.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

User.hasMany(EventCancellationRequest, {
  foreignKey: "requested_by",
  as: "RequestedEventCancellations",
});

EventCancellationRequest.belongsTo(User, {
  foreignKey: "requested_by",
  as: "Requester",
});

User.hasMany(EventCancellationRequest, {
  foreignKey: "reviewed_by",
  as: "ReviewedEventCancellations",
});

EventCancellationRequest.belongsTo(User, {
  foreignKey: "reviewed_by",
  as: "Reviewer",
});

// =====================================================
// REFUND REQUEST RELATIONSHIPS
// =====================================================

Transaction.hasMany(RefundRequest, {
  foreignKey: "transaction_id",
  as: "RefundRequests",
});

RefundRequest.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "Transaction",
});

User.hasMany(RefundRequest, {
  foreignKey: "user_id",
  as: "RefundRequests",
});

RefundRequest.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

Event.hasMany(RefundRequest, {
  foreignKey: "event_id",
  as: "RefundRequests",
});

RefundRequest.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

EventChange.hasMany(RefundRequest, {
  foreignKey: "event_change_id",
  as: "RefundRequests",
});

RefundRequest.belongsTo(EventChange, {
  foreignKey: "event_change_id",
  as: "EventChange",
});

// =====================================================
// USER & ORGANIZER RELATIONSHIPS
// =====================================================

User.hasMany(OrganizerApplication, {
  foreignKey: "user_id",
  as: "OrganizerApplications",
});

OrganizerApplication.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// =====================================================
// FOLLOW RELATIONSHIPS
// =====================================================

User.hasMany(Follow, {
  foreignKey: "follower_id",
  as: "FollowingRelations",
});

User.hasMany(Follow, {
  foreignKey: "following_id",
  as: "FollowerRelations",
});

Follow.belongsTo(User, {
  foreignKey: "follower_id",
  as: "Follower",
});

Follow.belongsTo(User, {
  foreignKey: "following_id",
  as: "Following",
});

// =====================================================
// POINT HISTORY RELATIONSHIPS
// =====================================================

User.hasMany(PointHistory, {
  foreignKey: "user_id",
  as: "PointHistories",
});

PointHistory.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// =====================================================
// NOTIFICATION RELATIONSHIPS
// =====================================================

User.hasMany(Notification, {
  foreignKey: "recipient_id",
  as: "Notifications",
});

User.hasMany(Notification, {
  foreignKey: "actor_id",
  as: "TriggeredNotifications",
});

Notification.belongsTo(User, {
  foreignKey: "recipient_id",
  as: "Recipient",
});

Notification.belongsTo(User, {
  foreignKey: "actor_id",
  as: "Actor",
});

// =====================================================
// EVENT RELATIONSHIPS
// =====================================================

User.hasMany(Event, {
  foreignKey: "organizer_id",
  as: "OrganizedEvents",
});

Event.belongsTo(User, {
  foreignKey: "organizer_id",
  as: "Organizer",
});

Event.hasMany(EventImage, {
  foreignKey: "event_id",
  as: "images",
});

EventImage.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

// Event & Category Many-to-Many
Event.belongsToMany(Category, {
  through: EventCategory,
  foreignKey: "event_id",
  otherKey: "category_id",
  as: "Categories",
});

Category.belongsToMany(Event, {
  through: EventCategory,
  foreignKey: "category_id",
  otherKey: "event_id",
  as: "Events",
});

// Event & SavedEvent
User.hasMany(SavedEvent, {
  foreignKey: "user_id",
  as: "SavedEvents",
});

SavedEvent.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

Event.hasMany(SavedEvent, {
  foreignKey: "event_id",
  as: "SavedByUsers",
});

SavedEvent.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

// Event & Comment
User.hasMany(Comment, {
  foreignKey: "user_id",
  as: "Comments",
});

Comment.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

Event.hasMany(Comment, {
  foreignKey: "event_id",
  as: "Comments",
});

Comment.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

// Event & TicketType
Event.hasMany(TicketType, {
  foreignKey: "event_id",
  as: "TicketTypes",
});

TicketType.belongsTo(Event, {
  foreignKey: "event_id",
  as: "Event",
});

// =====================================================
// VOUCHER RELATIONSHIPS
// =====================================================

Voucher.hasMany(UserVoucher, {
  foreignKey: "voucher_id",
  as: "UserVouchers",
});

UserVoucher.belongsTo(Voucher, {
  foreignKey: "voucher_id",
  as: "Voucher",
});

User.hasMany(UserVoucher, {
  foreignKey: "user_id",
  as: "UserVouchers",
});

UserVoucher.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// =====================================================
// TRANSACTION RELATIONSHIPS
// =====================================================

User.hasMany(Transaction, {
  foreignKey: "user_id",
  as: "Transactions",
});

Transaction.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

UserVoucher.hasMany(Transaction, {
  foreignKey: "user_voucher_id",
  as: "Transactions",
});

Transaction.belongsTo(UserVoucher, {
  foreignKey: "user_voucher_id",
  as: "UserVoucher",
});

Transaction.hasMany(TransactionDetail, {
  foreignKey: "transaction_id",
  as: "Details",
});

TransactionDetail.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "Transaction",
});

TicketType.hasMany(TransactionDetail, {
  foreignKey: "ticket_type_id",
  as: "TransactionDetails",
});

TransactionDetail.belongsTo(TicketType, {
  foreignKey: "ticket_type_id",
  as: "TicketType",
});

// =====================================================
// USER TICKET RELATIONSHIPS
// =====================================================

User.hasMany(UserTicket, {
  foreignKey: "user_id",
  as: "UserTickets",
});

UserTicket.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

TicketType.hasMany(UserTicket, {
  foreignKey: "ticket_type_id",
  as: "UserTickets",
});

UserTicket.belongsTo(TicketType, {
  foreignKey: "ticket_type_id",
  as: "TicketType",
});

TransactionDetail.hasMany(UserTicket, {
  foreignKey: "transaction_detail_id",
  as: "UserTickets",
});

UserTicket.belongsTo(TransactionDetail, {
  foreignKey: "transaction_detail_id",
  as: "TransactionDetail",
});

// =====================================================
// CHAT ROOM & CATEGORY RELATIONSHIPS
// =====================================================

ChatRoom.belongsToMany(Category, {
  through: ChatRoomCategory,
  foreignKey: "chat_room_id",
  otherKey: "category_id",
  as: "Categories",
});

Category.belongsToMany(ChatRoom, {
  through: ChatRoomCategory,
  foreignKey: "category_id",
  otherKey: "chat_room_id",
  as: "ChatRooms",
});

User.hasMany(ChatRoom, {
  foreignKey: "creator_id",
  as: "CreatedChatRooms",
});

ChatRoom.belongsTo(User, {
  foreignKey: "creator_id",
  as: "Creator",
});

// =====================================================
// CHAT ROOM MEMBER RELATIONSHIPS
// =====================================================

ChatRoom.hasMany(ChatRoomMember, {
  foreignKey: "chat_room_id",
  as: "ChatRoomMembers",
});

ChatRoomMember.belongsTo(ChatRoom, {
  foreignKey: "chat_room_id",
  as: "ChatRoom",
});

User.hasMany(ChatRoomMember, {
  foreignKey: "user_id",
  as: "ChatRoomMemberships",
});

ChatRoomMember.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// =====================================================
// MESSAGE RELATIONSHIPS
// =====================================================

ChatRoom.hasMany(Message, {
  foreignKey: "chat_room_id",
  as: "Messages",
});

Message.belongsTo(ChatRoom, {
  foreignKey: "chat_room_id",
  as: "ChatRoom",
});

User.hasMany(Message, {
  foreignKey: "sender_id",
  as: "Messages",
});

Message.belongsTo(User, {
  foreignKey: "sender_id",
  as: "Sender",
});

User.hasMany(Message, {
  foreignKey: "pinned_by",
  as: "PinnedMessages",
});

Message.belongsTo(User, {
  foreignKey: "pinned_by",
  as: "PinnedBy",
});

Event.hasMany(Message, {
  foreignKey: "recommended_event_id",
  as: "RecommendedMessages",
});

Message.belongsTo(Event, {
  foreignKey: "recommended_event_id",
  as: "RecommendedEvent",
});

// =====================================================
// MESSAGE READ RELATIONSHIPS
// =====================================================

Message.hasMany(MessageRead, {
  foreignKey: "message_id",
  as: "Reads",
});

MessageRead.belongsTo(Message, {
  foreignKey: "message_id",
  as: "Message",
});

ChatRoom.hasMany(MessageRead, {
  foreignKey: "chat_room_id",
  as: "MessageReads",
});

MessageRead.belongsTo(ChatRoom, {
  foreignKey: "chat_room_id",
  as: "ChatRoom",
});

User.hasMany(MessageRead, {
  foreignKey: "user_id",
  as: "MessageReads",
});
MessageRead.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

ApiLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(ApiLog, {
  foreignKey: "user_id",
  as: "ApiLogs",
});


// =====================================================
// DB EXPORT
// =====================================================

const db = {
  sequelize,

  // User & social
  User,
  OrganizerApplication,
  Follow,
  PointHistory,
  Notification,

  // Event
  Category,
  Event,
  EventImage,
  EventCategory,
  SavedEvent,
  TicketType,
  Comment,

  // Voucher, transaction, ticket
  Voucher,
  UserVoucher,
  Transaction,
  TransactionDetail,
  UserTicket,

  // Community
  ChatRoom,
  ChatRoomMember,
  ChatRoomCategory,
  Message,
  MessageRead,

  EventChange,
  EventCancellationRequest,
  RefundRequest,

  ApiLog,
};

module.exports = db;
