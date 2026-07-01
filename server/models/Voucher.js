module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define(
    "Voucher",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: DataTypes.STRING(100), unique: true, allowNull: false },
      name: { type: DataTypes.STRING(255), allowNull: false },
      percentage: { type: DataTypes.INTEGER, allowNull: true },
      max_cut: { type: DataTypes.INTEGER, allowNull: true },
      points_required: { type: DataTypes.INTEGER, defaultValue: 0 },
      stock: { type: DataTypes.INTEGER, allowNull: true },
      valid_until: { type: DataTypes.DATE, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: "vouchers",
      timestamps: false,
    },
  );
  return Voucher;
};
