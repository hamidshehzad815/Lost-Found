// models/Report.js
export default (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      report_id: {
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
      reporter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "reports",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return Report;
};
