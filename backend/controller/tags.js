


import { Tag, ItemTag, Item, Category } from "../models/Index.js";
import { Op } from "sequelize";


const getAllTags = async (req, res) => {
  try {
    const { category_id, search, limit = 50, offset = 0 } = req.query;

    let whereClause = {};
    if (category_id) {
      whereClause.category_id = category_id;
    }
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const tags = await Tag.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["category_id", "name", "color_code"],
          required: false,
        },
      ],
      attributes: ["tag_id", "name", "usage_count", "createdAt"],
      order: [
        ["usage_count", "DESC"],
        ["name", "ASC"],
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Tags retrieved successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error getting tags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get tags",
      error: error.message,
    });
  }
};


const getTagsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const tags = await Tag.findAll({
      where: { category_id },
      order: [
        ["usage_count", "DESC"],
        ["name", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      message: "Category tags retrieved successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error getting category tags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get category tags",
      error: error.message,
    });
  }
};


const createTag = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Tag name is required",
      });
    }

    
    const existingTag = await Tag.findOne({
      where: { name: name.toLowerCase().trim() },
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: "Tag already exists",
        data: existingTag,
      });
    }

    
    const tag = await Tag.create({
      name: name.toLowerCase().trim(),
      category_id: category_id || null,
      usage_count: 0,
    });

    
    const tagWithCategory = await Tag.findByPk(tag.id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
          required: false,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: tagWithCategory,
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tag",
      error: error.message,
    });
  }
};


const addTagsToItem = async (req, res) => {
  try {
    const { item_id, tag_ids } = req.body;
    const userId = req.user.id;

    if (!item_id || !tag_ids || !Array.isArray(tag_ids)) {
      return res.status(400).json({
        success: false,
        message: "item_id and tag_ids array are required",
      });
    }

    
    const item = await Item.findOne({
      where: {
        id: item_id,
        user_id: userId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you don't have permission",
      });
    }

    
    await ItemTag.destroy({
      where: { item_id },
    });

    
    const itemTags = tag_ids.map((tag_id) => ({
      item_id,
      tag_id,
    }));

    await ItemTag.bulkCreate(itemTags, { ignoreDuplicates: true });

    
    await Tag.update(
      { usage_count: Tag.sequelize.literal("usage_count + 1") },
      { where: { id: tag_ids } }
    );

    
    const itemWithTags = await Item.findByPk(item_id, {
      include: [
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ["id", "name", "category_id"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Tags added to item successfully",
      data: itemWithTags,
    });
  } catch (error) {
    console.error("Error adding tags to item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add tags to item",
      error: error.message,
    });
  }
};


const removeTagsFromItem = async (req, res) => {
  try {
    const { item_id, tag_ids } = req.body;
    const userId = req.user.id;

    if (!item_id || !tag_ids || !Array.isArray(tag_ids)) {
      return res.status(400).json({
        success: false,
        message: "item_id and tag_ids array are required",
      });
    }

    
    const item = await Item.findOne({
      where: {
        id: item_id,
        user_id: userId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you don't have permission",
      });
    }

    
    await ItemTag.destroy({
      where: {
        item_id,
        tag_id: tag_ids,
      },
    });

    
    await Tag.update(
      { usage_count: Tag.sequelize.literal("usage_count - 1") },
      { where: { id: tag_ids } }
    );

    res.status(200).json({
      success: true,
      message: "Tags removed from item successfully",
    });
  } catch (error) {
    console.error("Error removing tags from item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove tags from item",
      error: error.message,
    });
  }
};


const getItemTags = async (req, res) => {
  try {
    const { item_id } = req.params;

    const item = await Item.findByPk(item_id, {
      include: [
        {
          model: Tag,
          through: { attributes: [] },
          include: [
            {
              model: Category,
              attributes: ["id", "name", "icon", "color"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Item tags retrieved successfully",
      data: {
        item_id: item.id,
        title: item.title,
        tags: item.Tags,
      },
    });
  } catch (error) {
    console.error("Error getting item tags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get item tags",
      error: error.message,
    });
  }
};


const getPopularTags = async (req, res) => {
  try {
    const { limit = 20, category_id } = req.query;

    let whereClause = {};
    if (category_id) {
      whereClause.category_id = category_id;
    }

    const tags = await Tag.findAll({
      where: whereClause,
      order: [["usage_count", "DESC"]],
      limit: parseInt(limit),
      include: [
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
          required: false,
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Popular tags retrieved successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error getting popular tags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular tags",
      error: error.message,
    });
  }
};


const searchItemsByTags = async (req, res) => {
  try {
    const { tag_ids, status, category_id, page = 1, limit = 20 } = req.query;

    if (!tag_ids) {
      return res.status(400).json({
        success: false,
        message: "tag_ids parameter is required",
      });
    }

    const tagIdArray = Array.isArray(tag_ids)
      ? tag_ids
      : tag_ids.split(",").map((id) => parseInt(id));
    const offset = (page - 1) * limit;

    let itemWhereClause = {};
    if (status) itemWhereClause.status = status;
    if (category_id) itemWhereClause.category_id = category_id;

    const items = await Item.findAndCountAll({
      where: itemWhereClause,
      include: [
        {
          model: Tag,
          through: { attributes: [] },
          where: { id: tagIdArray },
          required: true,
        },
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
          required: false,
        },
      ],
      distinct: true,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Items found by tags",
      data: {
        items: items.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(items.count / limit),
          total_items: items.count,
          has_more: items.count > offset + items.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error searching items by tags:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search items by tags",
      error: error.message,
    });
  }
};


const updateTag = async (req, res) => {
  try {
    const { tag_id } = req.params;
    const { name, category_id } = req.body;

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    const updateData = {};
    if (name) {
      
      const existingTag = await Tag.findOne({
        where: {
          name: name.toLowerCase().trim(),
          id: { [Op.ne]: tag_id },
        },
      });

      if (existingTag) {
        return res.status(400).json({
          success: false,
          message: "Tag name already exists",
        });
      }

      updateData.name = name.toLowerCase().trim();
    }
    if (category_id !== undefined) updateData.category_id = category_id;

    await tag.update(updateData);

    res.status(200).json({
      success: true,
      message: "Tag updated successfully",
      data: tag,
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tag",
      error: error.message,
    });
  }
};


const deleteTag = async (req, res) => {
  try {
    const { tag_id } = req.params;

    const tag = await Tag.findByPk(tag_id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    
    await ItemTag.destroy({
      where: { tag_id },
    });

    
    await tag.destroy();

    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tag",
      error: error.message,
    });
  }
};

export {
  getAllTags,
  getTagsByCategory,
  createTag,
  addTagsToItem,
  removeTagsFromItem,
  getItemTags,
  getPopularTags,
  searchItemsByTags,
  updateTag,
  deleteTag,
};
