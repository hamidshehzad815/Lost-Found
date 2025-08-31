// models/Conversation.js
export default (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      conversation_id: {
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
      requester_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      owner_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("active", "closed", "resolved"),
        defaultValue: "active",
      },
    },
    {
      tableName: "conversations",
      timestamps: true,
      indexes: [
        { fields: ["item_id"] },
        { fields: ["requester_id"] },
        { fields: ["owner_id"] },
        { unique: true, fields: ["item_id", "requester_id", "owner_id"] },
      ],
    }
  );

  return Conversation;
};
