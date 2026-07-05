module.exports = (sequelize, DataTypes) => {
  const SavedEvent = sequelize.define(
    "SavedEvent",
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
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "saved_events", // Menunjuk langsung ke tabel database kamu gess
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  );
  return SavedEvent;
};
