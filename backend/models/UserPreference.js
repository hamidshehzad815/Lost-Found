// models/UserPreference.js
export default (sequelize, DataTypes) => {
  const UserPreference = sequelize.define(
    "UserPreference",
    {
      preference_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      push_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      sms_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      marketing_emails: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      notification_radius: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
    },
    {
      tableName: "user_preferences",
      timestamps: true,
    }
  );

  return UserPreference;
};
