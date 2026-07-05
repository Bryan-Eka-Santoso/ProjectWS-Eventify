module.exports = (sequelize, DataTypes) => {
  const EventImage = sequelize.define(
    "EventImage",
    {
      event_id: { type: DataTypes.INTEGER, allowNull: false },
      image_url: { type: DataTypes.STRING, allowNull: false },
    },
    {
      tableName: "event_images",
      timestamps: false,
    },
  );
  return EventImage;
};
