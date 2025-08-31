// models/Tag.js
export default (sequelize, DataTypes) => {
  const Tag = sequelize.define(
    "Tag",
    {
      tag_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      category_id: {
        type: DataTypes.INTEGER,
        references: { model: "categories", key: "category_id" },
        onDelete: "SET NULL",
      },
      usage_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "tags",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["name"] },
        { fields: ["usage_count"] },
      ],
    }
  );

  return Tag;
};
