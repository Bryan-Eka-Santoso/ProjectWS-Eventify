module.exports = (sequelize, DataTypes) => {
  const TicketType = sequelize.define(
    "TicketType",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },

      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      quota: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },

      remaining_quota: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "ticket_types",
      timestamps: false,
    }
  );

  return TicketType;
};