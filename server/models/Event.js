module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      organizer_id: { type: DataTypes.INTEGER, allowNull: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      // 👇 TAMBAHKAN KOLOM INI AGAR SEQUELIZE MENGENALI main_image_url
      main_image_url: { type: DataTypes.STRING(255), allowNull: false },
      location: { type: DataTypes.TEXT, allowNull: false },
      start_date: { type: DataTypes.DATE, allowNull: false },
      end_date: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.ENUM(
          "draft",
          "pending_approval",
          "published",
          "rejected",
          "canceled",
          "completed",
        ),
        defaultValue: "draft",
      },
    },
    {
      tableName: "events",
      timestamps: true,
      createdAt: "created_at", // Sequelize mengarahkan 'createdAt' ke kolom 'created_at'
      updatedAt: "updated_at", // 👈 PERBAIKAN DI SINI: ganti 'updated_at' (u kecil) menjadi 'updatedAt' (A besar)
    },
  );

  // Jika nanti kamu butuh relasi (Association) antara Event dan EventImage, tulis di sini:
  Event.associate = (models) => {
    Event.hasMany(models.EventImage, { as: "images", foreignKey: "event_id" });
  };

  return Event;
};
