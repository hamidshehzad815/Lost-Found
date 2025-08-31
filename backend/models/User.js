// models/User.js
export default (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: true }, // Make nullable for Google OAuth users
      phone: { type: DataTypes.STRING(20) },
      profile_picture_url: { type: DataTypes.STRING(255) },
      is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      verification_token: { type: DataTypes.STRING(255) },
      reset_password_token: { type: DataTypes.STRING(255) },
      reset_password_expires: { type: DataTypes.DATE },
      last_login: { type: DataTypes.DATE },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      // Google OAuth fields
      google_id: { type: DataTypes.STRING(100) },
      provider: { type: DataTypes.STRING(50), defaultValue: "local" }, // 'local' or 'google'
    },
    {
      tableName: "users",
      timestamps: true,
      indexes: [
        { unique: true, fields: ["email"] },
        { fields: ["phone"] },
        { fields: ["verification_token"] },
        { fields: ["reset_password_token"] },
        { fields: ["google_id"] },
      ],
    }
  );

  return User;
};
