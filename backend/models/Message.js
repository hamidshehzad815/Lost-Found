// models/Message.js
export default (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      message_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "conversations", key: "conversation_id" },
        onDelete: "CASCADE",
      },
      sender_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      message_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      message_type: {
        type: DataTypes.ENUM("text", "image", "location", "system"),
        defaultValue: "text",
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "messages",
      timestamps: true,
      indexes: [
        { fields: ["conversation_id"] },
        { fields: ["sender_id"] },
        { fields: ["is_read"] },
      ],
    }
  );

  return Message;
};
