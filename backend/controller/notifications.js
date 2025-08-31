


import { Notification, UserPreference, User, Item } from "../models/Index.js";
import { Op } from "sequelize";


const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status = "all" } = req.query;

    const whereClause = { user_id: userId };
    if (status !== "all") {
      whereClause.is_read = status === "read";
    }

    const offset = (page - 1) * limit;

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Item,
          as: "RelatedItem",
          attributes: ["id", "title", "status"],
          required: false,
        },
        {
          model: User,
          as: "RelatedUser",
          attributes: ["id", "name", "profile_picture"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      data: {
        notifications: notifications.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(notifications.count / limit),
          total_notifications: notifications.count,
          has_more: notifications.count > offset + notifications.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
      error: error.message,
    });
  }
};


const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};


const markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id: notification_id,
        user_id: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.update({
      is_read: true,
      read_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};


const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          user_id: userId,
          is_read: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};


const deleteNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id: notification_id,
        user_id: userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.destroy();

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};


const getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalCount = await Notification.count({
      where: { user_id: userId },
    });

    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Notification count retrieved successfully",
      data: {
        total_count: totalCount,
        unread_count: unreadCount,
      },
    });
  } catch (error) {
    console.error("Error getting notification count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification count",
      error: error.message,
    });
  }
};


const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await UserPreference.findOne({
      where: { user_id: userId },
    });

    
    if (!preferences) {
      preferences = await UserPreference.create({
        user_id: userId,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        new_messages: true,
        item_matches: true,
        status_updates: true,
        weekly_summary: true,
      });
    }

    res.status(200).json({
      success: true,
      message: "User preferences retrieved successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Error getting user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user preferences",
      error: error.message,
    });
  }
};


const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const allowedFields = [
      "email_notifications",
      "push_notifications",
      "sms_notifications",
      "new_messages",
      "item_matches",
      "status_updates",
      "weekly_summary",
    ];

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

    let preferences = await UserPreference.findOne({
      where: { user_id: userId },
    });

    if (preferences) {
      await preferences.update(updateData);
    } else {
      
      preferences = await UserPreference.create({
        user_id: userId,
        ...updateData,
      });
    }

    res.status(200).json({
      success: true,
      message: "User preferences updated successfully",
      data: preferences,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user preferences",
      error: error.message,
    });
  }
};


const sendNotification = async (
  userId,
  type,
  title,
  message,
  relatedItemId = null,
  relatedUserId = null
) => {
  try {
    
    const preferences = await UserPreference.findOne({
      where: { user_id: userId },
    });

    let shouldSend = true;
    if (preferences) {
      switch (type) {
        case "new_message":
          shouldSend = preferences.new_messages;
          break;
        case "item_match":
          shouldSend = preferences.item_matches;
          break;
        case "status_update":
          shouldSend = preferences.status_updates;
          break;
        default:
          shouldSend = true;
      }
    }

    if (shouldSend) {
      await createNotification({
        user_id: userId,
        type,
        title,
        message,
        related_item_id: relatedItemId,
        related_user_id: relatedUserId,
        is_read: false,
      });
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

export {
  getUserNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount,
  getUserPreferences,
  updateUserPreferences,
  sendNotification,
};
