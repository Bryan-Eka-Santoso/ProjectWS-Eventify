module.exports = (sequelize, DataTypes) => {
  const UserTicket = sequelize.define(
    "UserTicket",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ticket_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      transaction_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ticket_code: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      status: {
        type: DataTypes.ENUM("active", "used", "refunded"),
        defaultValue: "active",
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "user_tickets",
      timestamps: false,
    }
  );

  return UserTicket;
};