module.exports = (sequelize, DataTypes) => {
  const OrganizerApplication = sequelize.define(
    "OrganizerApplication",
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      organizer_name: { type: DataTypes.STRING, allowNull: false },
      ktp_number: { type: DataTypes.STRING, allowNull: false },
      ktp_image_url: { type: DataTypes.STRING },
      phone_number: { type: DataTypes.STRING },
      address: { type: DataTypes.TEXT },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
    },
    {
      tableName: "organizer_applications", // Menghubungkan langsung ke tabel database kamu gess
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return OrganizerApplication;
};
