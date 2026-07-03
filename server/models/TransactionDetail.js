module.exports = (sequelize, DataTypes) => {
  const TransactionDetail = sequelize.define(
    "TransactionDetail",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      transaction_id: { type: DataTypes.INTEGER, allowNull: false },
      ticket_type_id: { type: DataTypes.INTEGER, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      subtotal: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "transaction_details",
      timestamps: false,
    },
  );

  TransactionDetail.associate = (models) => {
    TransactionDetail.belongsTo(models.Transaction, {
      foreignKey: "transaction_id",
      as: "transaction",
    });
    TransactionDetail.belongsTo(models.TicketType, {
      foreignKey: "ticket_type_id",
      as: "ticket_type",
    });
    TransactionDetail.hasMany(models.UserTicket, {
      foreignKey: "transaction_detail_id",
      as: "user_tickets",
    });
  };

  return TransactionDetail;
};
