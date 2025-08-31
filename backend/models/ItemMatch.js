// models/ItemMatch.js
export default (sequelize, DataTypes) => {
  const ItemMatch = sequelize.define(
    "ItemMatch",
    {
      match_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      lost_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
      },
      found_item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
      },
      match_score: {
        type: DataTypes.DECIMAL(5, 2),
      },
      match_reasons: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      is_reviewed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "item_matches",
      timestamps: true,
      indexes: [
        { fields: ["lost_item_id"] },
        { fields: ["found_item_id"] },
        { fields: ["match_score"] },
        { unique: true, fields: ["lost_item_id", "found_item_id"] },
      ],
    }
  );

  return ItemMatch;
};
