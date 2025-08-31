// models/Image.js
export default (sequelize, DataTypes) => {
  const Image = sequelize.define(
    "Image",
    {
      image_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      image_url: { type: DataTypes.STRING(255), allowNull: false },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow NULL initially to avoid constraint errors
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
      },
    },
    {
      tableName: "images",
      timestamps: true,
      createdAt: "uploaded_at",
      updatedAt: false,
    }
  );

  return Image;
};
