
export default (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT },
      icon_name: { type: DataTypes.STRING(50) },
      color_code: { type: DataTypes.STRING(7) },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {
      tableName: "categories",
      timestamps: false, 
      indexes: [
        { unique: true, fields: ["name"] },
        { fields: ["is_active"] },
        { fields: ["sort_order"] },
      ],
    }
  );

  return Category;
};
