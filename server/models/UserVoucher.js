module.exports = (sequelize, DataTypes) => {
  const UserVoucher = sequelize.define(
    "UserVoucher",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      voucher_id: { type: DataTypes.INTEGER, allowNull: false },
      is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
      claimed_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      used_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: "user_vouchers",
      timestamps: false, // Karena kamu sudah manual bikin claimed_at & used_at gess
    },
  );
  return UserVoucher;
};
