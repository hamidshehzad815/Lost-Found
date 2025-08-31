// models/ItemTag.js
export default (sequelize, DataTypes) => {
  const ItemTag = sequelize.define(
    "ItemTag",
    {
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
        primaryKey: true,
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "tags", key: "tag_id" },
        onDelete: "CASCADE",
        primaryKey: true,
      },
    },
    {
      tableName: "item_tags",
      timestamps: true,
      indexes: [{ fields: ["item_id"] }, { fields: ["tag_id"] }],
    }
  );

  return ItemTag;
};
