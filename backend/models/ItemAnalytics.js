// models/ItemAnalytics.js
export default (sequelize, DataTypes) => {
  const ItemAnalytics = sequelize.define(
    "ItemAnalytics",
    {
      analytics_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
      },
      action_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "user_id" },
        onDelete: "SET NULL",
      },
      ip_address: {
        type: DataTypes.INET,
      },
      user_agent: {
        type: DataTypes.TEXT,
      },
      referrer_url: {
        type: DataTypes.STRING(500),
      },
    },
    {
      tableName: "item_analytics",
      timestamps: true,
      indexes: [
        { fields: ["item_id"] },
        { fields: ["action_type"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return ItemAnalytics;
};
