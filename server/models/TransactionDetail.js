module.exports = (sequelize, DataTypes) => {
  const TransactionDetail = sequelize.define(
    "TransactionDetail",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      ticket_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      subtotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "transaction_details",
      timestamps: false,
    }
  );

  return TransactionDetail;
};