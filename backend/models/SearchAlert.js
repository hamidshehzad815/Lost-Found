// models/SearchAlert.js
export default (sequelize, DataTypes) => {
  const SearchAlert = sequelize.define(
    "SearchAlert",
    {
      alert_id: {
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
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      keywords: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      category_id: {
        type: DataTypes.INTEGER,
        references: { model: "categories", key: "category_id" },
        onDelete: "SET NULL",
      },
      location_latitude: {
        type: DataTypes.DECIMAL(9, 6),
      },
      location_longitude: {
        type: DataTypes.DECIMAL(9, 6),
      },
      search_radius: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
      min_reward: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "search_alerts",
      timestamps: true,
      indexes: [
        { fields: ["user_id"] },
        { fields: ["location_latitude", "location_longitude"] },
      ],
    }
  );

  return SearchAlert;
};
