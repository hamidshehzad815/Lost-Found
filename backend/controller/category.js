import { Category } from "../models/Index.js";

const addCategory = async (req, res) => {
  try {
    const { name, description, icon_name, color_code, is_active, sort_order } =
      req.body;

    if (!name) {
      return res.status(400).send({ message: "Category name required" });
    }

    const category = await Category.findOne({
      where: { name: name.toLowerCase() },
    });

    if (category) {
      return res.status(409).send({ message: "Category already exists" });
    }

    const categoryData = {
      name: name.toLowerCase(),
      description: description || null,
      icon_name: icon_name || null,
      color_code: color_code || null,
      is_active: is_active !== undefined ? is_active : true,
      sort_order: sort_order || 0,
    };

    const newCategory = await Category.create(categoryData);

    return res.status(201).send({
      message: "Category Added",
      category: newCategory,
    });
  } catch (error) {
    console.error("Add category error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { include_inactive = false } = req.query;

    const whereCondition =
      include_inactive === "true" ? {} : { is_active: true };

    const categories = await Category.findAll({
      where: whereCondition,
      attributes: [
        "category_id",
        "name",
        "description",
        "icon_name",
        "color_code",
        "is_active",
        "sort_order",
      ],
      order: [
        ["sort_order", "ASC"],
        ["name", "ASC"],
      ],
    });

    return res.status(200).send({
      categories,
      message: "Categories retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).send({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

const initializeCategories = async (req, res) => {
  try {
    const defaultCategories = [
      {
        name: "electronics",
        icon_name: "📱",
        color_code: "#3B82F6",
        description: "Electronic devices and gadgets",
      },
      {
        name: "clothing",
        icon_name: "👕",
        color_code: "#EF4444",
        description: "Clothing and fashion items",
      },
      {
        name: "jewelry",
        icon_name: "💍",
        color_code: "#F59E0B",
        description: "Jewelry and accessories",
      },
      {
        name: "documents",
        icon_name: "📄",
        color_code: "#10B981",
        description: "Important documents and papers",
      },
      {
        name: "keys",
        icon_name: "🔑",
        color_code: "#6366F1",
        description: "Keys and keychains",
      },
      {
        name: "bags",
        icon_name: "🎒",
        color_code: "#8B5CF6",
        description: "Bags, purses, and luggage",
      },
      {
        name: "toys",
        icon_name: "🧸",
        color_code: "#EC4899",
        description: "Toys and games",
      },
      {
        name: "books",
        icon_name: "📚",
        color_code: "#14B8A6",
        description: "Books and educational materials",
      },
      {
        name: "sports equipment",
        icon_name: "⚽",
        color_code: "#F97316",
        description: "Sports and fitness equipment",
      },
      {
        name: "accessories",
        icon_name: "👑",
        color_code: "#84CC16",
        description: "Various accessories",
      },
      {
        name: "pets",
        icon_name: "🐕",
        color_code: "#06B6D4",
        description: "Lost or found pets",
      },
      {
        name: "other",
        icon_name: "📦",
        color_code: "#6B7280",
        description: "Other miscellaneous items",
      },
    ];

    const results = [];
    let sortOrder = 0;

    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({
        where: { name: categoryData.name.toLowerCase() },
      });

      if (!existingCategory) {
        const newCategory = await Category.create({
          name: categoryData.name.toLowerCase(),
          description: categoryData.description,
          icon_name: categoryData.icon_name,
          color_code: categoryData.color_code,
          is_active: true,
          sort_order: sortOrder,
        });
        results.push(newCategory);
      }
      sortOrder += 10; // Leave gaps for future insertions
    }

    return res.status(200).send({
      message: `Initialized categories. ${results.length} new categories added.`,
      newCategories: results,
    });
  } catch (error) {
    console.error("Error initializing categories:", error);
    return res.status(500).send({
      message: "Error initializing categories",
      error: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { name, description, icon_name, color_code, is_active, sort_order } =
      req.body;

    const category = await Category.findOne({
      where: { category_id },
    });

    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.toLowerCase();
    if (description !== undefined) updateData.description = description;
    if (icon_name !== undefined) updateData.icon_name = icon_name;
    if (color_code !== undefined) updateData.color_code = color_code;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    await category.update(updateData);

    return res.status(200).send({
      message: "Category updated successfully",
      category: category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const category = await Category.findOne({
      where: { category_id },
    });

    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }

    // Soft delete by setting is_active to false
    await category.update({ is_active: false });

    return res.status(200).send({
      message: "Category deactivated successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { category_id } = req.params;

    const category = await Category.findOne({
      where: { category_id },
    });

    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }

    return res.status(200).send({
      category,
      message: "Category retrieved successfully",
    });
  } catch (error) {
    console.error("Get category error:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

export {
  addCategory,
  getAllCategories,
  initializeCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
};
