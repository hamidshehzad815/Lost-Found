// models/UserTrustScore.js
export default (sequelize, DataTypes) => {
  const UserTrustScore = sequelize.define(
    "UserTrustScore",
    {
      user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      total_reviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
      },
      successful_returns: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_items_posted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      response_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      trust_level: {
        type: DataTypes.ENUM("new", "bronze", "silver", "gold", "verified"),
        defaultValue: "new",
      },
      last_calculated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_trust_scores",
      timestamps: false,
      indexes: [{ fields: ["trust_level"] }],
    }
  );

  return UserTrustScore;
};
