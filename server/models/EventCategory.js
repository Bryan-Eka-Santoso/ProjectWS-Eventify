module.exports = (sequelize, DataTypes) => {
  const EventCategory = sequelize.define(
    "EventCategory",
    {
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },

      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      tableName: "event_categories",
      timestamps: false,
    }
  );

  return EventCategory;
};