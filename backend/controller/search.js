


import {
  SearchAlert,
  ItemMatch,
  Item,
  User,
  Category,
  Tag,
  ItemTag,
} from "../models/Index.js";
import { Op } from "sequelize";


const createSearchAlert = async (req, res) => {
  try {
    const {
      title,
      description,
      category_id,
      location,
      radius = 10,
      keywords,
      is_active = true,
    } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    
    const searchAlert = await SearchAlert.create({
      user_id: userId,
      title,
      description,
      category_id: category_id || null,
      location,
      radius,
      keywords,
      is_active,
      match_count: 0,
    });

    
    const alertWithData = await SearchAlert.findByPk(searchAlert.id, {
      include: [
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
          required: false,
        },
      ],
    });

    
    await checkForMatches(searchAlert.id);

    res.status(201).json({
      success: true,
      message: "Search alert created successfully",
      data: alertWithData,
    });
  } catch (error) {
    console.error("Error creating search alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create search alert",
      error: error.message,
    });
  }
};


const getUserSearchAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = "all" } = req.query;

    const whereClause = { user_id: userId };
    if (status === "active") {
      whereClause.is_active = true;
    } else if (status === "inactive") {
      whereClause.is_active = false;
    }

    const alerts = await SearchAlert.findAll({
      where: whereClause,
      include: [
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Search alerts retrieved successfully",
      data: alerts,
    });
  } catch (error) {
    console.error("Error getting search alerts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get search alerts",
      error: error.message,
    });
  }
};


const updateSearchAlert = async (req, res) => {
  try {
    const { alert_id } = req.params;
    const userId = req.user.id;
    const allowedFields = [
      "title",
      "description",
      "category_id",
      "location",
      "radius",
      "keywords",
      "is_active",
    ];

    const alert = await SearchAlert.findOne({
      where: {
        id: alert_id,
        user_id: userId,
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Search alert not found",
      });
    }

    const updateData = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    await alert.update(updateData);

    
    if (updateData.is_active === true || Object.keys(updateData).length > 1) {
      await checkForMatches(alert_id);
    }

    res.status(200).json({
      success: true,
      message: "Search alert updated successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Error updating search alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update search alert",
      error: error.message,
    });
  }
};


const deleteSearchAlert = async (req, res) => {
  try {
    const { alert_id } = req.params;
    const userId = req.user.id;

    const alert = await SearchAlert.findOne({
      where: {
        id: alert_id,
        user_id: userId,
      },
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Search alert not found",
      });
    }

    await alert.destroy();

    res.status(200).json({
      success: true,
      message: "Search alert deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting search alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete search alert",
      error: error.message,
    });
  }
};


const getItemMatches = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { limit = 10 } = req.query;
    const userId = req.user.id;

    
    const item = await Item.findOne({
      where: { id: item_id, user_id: userId },
      include: [
        {
          model: Category,
          attributes: ["id", "name"],
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you don't have access",
      });
    }

    
    const oppositeStatus = item.status === "lost" ? "found" : "lost";

    const matches = await Item.findAll({
      where: {
        status: oppositeStatus,
        user_id: { [Op.ne]: userId }, 
        category_id: item.category_id || { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          attributes: ["id", "name", "profile_picture"],
        },
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
        },
        {
          model: Tag,
          through: { attributes: [] },
          attributes: ["id", "name"],
        },
      ],
      limit: parseInt(limit),
      order: [["createdAt", "DESC"]],
    });

    
    const matchesWithScores = matches.map((match) => {
      let score = 0;

      
      if (match.category_id === item.category_id) score += 30;

      
      if (
        item.latitude &&
        item.longitude &&
        match.latitude &&
        match.longitude
      ) {
        const distance = calculateDistance(
          item.latitude,
          item.longitude,
          match.latitude,
          match.longitude
        );
        if (distance < 1) score += 25;
        else if (distance < 5) score += 15;
        else if (distance < 10) score += 10;
      }

      
      const itemWords = item.description.toLowerCase().split(" ");
      const matchWords = match.description.toLowerCase().split(" ");
      const commonWords = itemWords.filter((word) => matchWords.includes(word));
      score += Math.min(commonWords.length * 2, 20);

      
      const itemTags = item.Tags?.map((tag) => tag.name) || [];
      const matchTags = match.Tags?.map((tag) => tag.name) || [];
      const commonTags = itemTags.filter((tag) => matchTags.includes(tag));
      score += commonTags.length * 5;

      return {
        ...match.toJSON(),
        match_score: Math.min(score, 100),
      };
    });

    
    matchesWithScores.sort((a, b) => b.match_score - a.match_score);

    res.status(200).json({
      success: true,
      message: "Item matches retrieved successfully",
      data: {
        item: item,
        matches: matchesWithScores,
      },
    });
  } catch (error) {
    console.error("Error getting item matches:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get item matches",
      error: error.message,
    });
  }
};


const createItemMatch = async (req, res) => {
  try {
    const { lost_item_id, found_item_id, confidence_score, notes } = req.body;
    const userId = req.user.id;

    
    const lostItem = await Item.findByPk(lost_item_id);
    const foundItem = await Item.findByPk(found_item_id);

    if (!lostItem || !foundItem) {
      return res.status(404).json({
        success: false,
        message: "One or both items not found",
      });
    }

    if (lostItem.user_id !== userId && foundItem.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You must own one of the items to create a match",
      });
    }

    
    const existingMatch = await ItemMatch.findOne({
      where: {
        lost_item_id,
        found_item_id,
      },
    });

    if (existingMatch) {
      return res.status(400).json({
        success: false,
        message: "Match already exists for these items",
      });
    }

    
    const match = await ItemMatch.create({
      lost_item_id,
      found_item_id,
      confidence_score: confidence_score || 75,
      status: "pending",
      notes,
      matched_by: userId,
    });

    
    const matchWithData = await ItemMatch.findByPk(match.id, {
      include: [
        {
          model: Item,
          as: "LostItem",
          include: [{ model: User, attributes: ["id", "name"] }],
        },
        {
          model: Item,
          as: "FoundItem",
          include: [{ model: User, attributes: ["id", "name"] }],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Item match created successfully",
      data: matchWithData,
    });
  } catch (error) {
    console.error("Error creating item match:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create item match",
      error: error.message,
    });
  }
};


const getUserItemMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = "all" } = req.query;

    
    const userItems = await Item.findAll({
      where: { user_id: userId },
      attributes: ["id"],
    });
    const itemIds = userItems.map((item) => item.id);

    let whereClause = {
      [Op.or]: [
        { lost_item_id: { [Op.in]: itemIds } },
        { found_item_id: { [Op.in]: itemIds } },
      ],
    };

    if (status !== "all") {
      whereClause.status = status;
    }

    const matches = await ItemMatch.findAll({
      where: whereClause,
      include: [
        {
          model: Item,
          as: "LostItem",
          include: [
            { model: User, attributes: ["id", "name", "profile_picture"] },
            { model: Category, attributes: ["id", "name", "icon"] },
          ],
        },
        {
          model: Item,
          as: "FoundItem",
          include: [
            { model: User, attributes: ["id", "name", "profile_picture"] },
            { model: Category, attributes: ["id", "name", "icon"] },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Item matches retrieved successfully",
      data: matches,
    });
  } catch (error) {
    console.error("Error getting item matches:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get item matches",
      error: error.message,
    });
  }
};


const updateMatchStatus = async (req, res) => {
  try {
    const { match_id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const validStatuses = ["pending", "confirmed", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: " + validStatuses.join(", "),
      });
    }

    const match = await ItemMatch.findOne({
      where: { id: match_id },
      include: [
        { model: Item, as: "LostItem" },
        { model: Item, as: "FoundItem" },
      ],
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    
    if (
      match.LostItem.user_id !== userId &&
      match.FoundItem.user_id !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this match",
      });
    }

    await match.update({
      status,
      notes: notes || match.notes,
      updated_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Match status updated to ${status}`,
      data: match,
    });
  } catch (error) {
    console.error("Error updating match status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update match status",
      error: error.message,
    });
  }
};


const checkForMatches = async (alertId) => {
  try {
    const alert = await SearchAlert.findByPk(alertId);
    if (!alert || !alert.is_active) return;

    
    const items = await Item.findAll({
      where: {
        status: "found", 
        category_id: alert.category_id || { [Op.ne]: null },
      },
      limit: 10,
    });

    
    await alert.update({ match_count: items.length });
  } catch (error) {
    console.error("Error checking for matches:", error);
  }
};


const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export {
  createSearchAlert,
  getUserSearchAlerts,
  updateSearchAlert,
  deleteSearchAlert,
  getItemMatches,
  createItemMatch,
  getUserItemMatches,
  updateMatchStatus,
  checkForMatches,
};
