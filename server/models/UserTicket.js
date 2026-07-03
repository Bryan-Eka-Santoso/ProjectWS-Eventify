module.exports = (sequelize, DataTypes) => {
  const UserTicket = sequelize.define(
    "UserTicket",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      ticket_type_id: { type: DataTypes.INTEGER, allowNull: false },
      transaction_detail_id: { type: DataTypes.INTEGER, allowNull: false },
      ticket_code: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "used", "refunded"),
        defaultValue: "active",
      },
    },
    {
      tableName: "user_tickets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );

  UserTicket.associate = (models) => {
    UserTicket.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    UserTicket.belongsTo(models.TicketType, {
      foreignKey: "ticket_type_id",
      as: "ticket_type",
    });
    UserTicket.belongsTo(models.TransactionDetail, {
      foreignKey: "transaction_detail_id",
      as: "detail",
    });
  };

  return UserTicket;
};
