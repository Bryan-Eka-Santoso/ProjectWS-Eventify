module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      user_voucher_id: { type: DataTypes.INTEGER, allowNull: true },
      total_amount: { type: DataTypes.INTEGER, allowNull: false },
      discount_amount: { type: DataTypes.INTEGER, defaultValue: 0 },
      final_amount: { type: DataTypes.INTEGER, allowNull: false },
      earned_points: { type: DataTypes.INTEGER, defaultValue: 0 },
      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "expired", "failed"),
        defaultValue: "pending",
      },
      payment_method: { type: DataTypes.STRING(100), allowNull: true },
      refund_status: {
        type: DataTypes.ENUM("none", "requested", "refunded", "rejected"),
        defaultValue: "none",
      },
    },
    {
      tableName: "transactions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    Transaction.belongsTo(models.UserVoucher, {
      foreignKey: "user_voucher_id",
      as: "user_voucher",
    });
    Transaction.hasMany(models.TransactionDetail, {
      foreignKey: "transaction_id",
      as: "details",
    });
  };

  return Transaction;
};
