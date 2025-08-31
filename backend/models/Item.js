// models/Item.js
export default (sequelize, DataTypes) => {
  const Item = sequelize.define(
    "Item",
    {
      item_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT },
      status: {
        type: DataTypes.ENUM("lost", "found", "returned"),
        allowNull: false,
      },
      latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
      longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
      address: { type: DataTypes.STRING(255) },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "categories", key: "category_id" },
        onDelete: "SET NULL",
      },
    },
    {
      tableName: "items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        { fields: ["status"] },
        { fields: ["user_id"] },
        { fields: ["category_id"] },
        { fields: ["latitude", "longitude"] },
        { fields: ["created_at"] },
      ],
    }
  );

  return Item;
};
