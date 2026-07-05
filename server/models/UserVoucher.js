module.exports = (sequelize, DataTypes) => {
  const UserVoucher = sequelize.define(
    "UserVoucher",
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

      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      is_used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      claimed_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },

      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      expired_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "user_vouchers",
      timestamps: false,
    }
  );

  return UserVoucher;
};