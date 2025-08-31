// models/Notification.js
export default (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      related_item_id: {
        type: DataTypes.INTEGER,
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
      },
      related_user_id: {
        type: DataTypes.INTEGER,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      action_url: {
        type: DataTypes.STRING(500),
      },
    },
    {
      tableName: "notifications",
      timestamps: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["type"] },
        { fields: ["is_read"] },
        { fields: ["createdAt"] },
      ],
    }
  );

  return Notification;
};
