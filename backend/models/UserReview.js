// models/UserReview.js
export default (sequelize, DataTypes) => {
  const UserReview = sequelize.define(
    "UserReview",
    {
      review_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reviewer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      reviewed_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "items", key: "item_id" },
        onDelete: "CASCADE",
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      review_text: {
        type: DataTypes.TEXT,
      },
      review_type: {
        type: DataTypes.ENUM(
          "general",
          "return",
          "communication",
          "reliability"
        ),
        defaultValue: "general",
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "user_reviews",
      timestamps: true,
      indexes: [
        { fields: ["reviewer_id"] },
        { fields: ["reviewed_user_id"] },
        { fields: ["item_id"] },
        { fields: ["rating"] },
      ],
      validate: {
        noSelfReview() {
          if (this.reviewer_id === this.reviewed_user_id) {
            throw new Error("Users cannot review themselves");
          }
        },
      },
    }
  );

  return UserReview;
};
