import {
  ItemAnalytics,
  Item,
  User,
  Category,
  sequelize,
} from "../models/Index.js";
import { Op } from "sequelize";

const trackItemView = async (req, res) => {
  try {
    const { item_id } = req.params;
    const userId = req.user?.user_id || null;
    const {
      user_agent,
      ip_address,
      referrer,
      device_type = "unknown",
      location,
    } = req.body;

    // Get the item to check ownership
    const item = await Item.findByPk(item_id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Don't track views from the item owner
    if (userId && userId === item.user_id) {
      return res.status(200).json({
        success: true,
        message: "Owner view not tracked",
      });
    }

    // Check if this user has already viewed this item
    if (userId) {
      // For logged-in users, check by user_id
      const existingView = await ItemAnalytics.findOne({
        where: {
          item_id,
          user_id: userId,
          action_type: "view",
        },
      });

      if (existingView) {
        return res.status(200).json({
          success: true,
          message: "View already tracked for this user",
        });
      }
    } else {
      // For anonymous users, check by IP address
      const clientIp = ip_address || req.ip;
      const existingView = await ItemAnalytics.findOne({
        where: {
          item_id,
          user_id: null,
          ip_address: clientIp,
          action_type: "view",
        },
      });

      if (existingView) {
        return res.status(200).json({
          success: true,
          message: "View already tracked for this IP address",
        });
      }
    }

    await ItemAnalytics.create({
      item_id,
      user_id: userId,
      action_type: "view",
      user_agent: user_agent || req.headers["user-agent"],
      ip_address: ip_address || req.ip,
      referrer_url: referrer || req.headers.referer,
      device_type,
      location,
    });

    res.status(200).json({
      success: true,
      message: "View tracked successfully",
    });
  } catch (error) {
    console.error("Error tracking item view:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track view",
      error: error.message,
    });
  }
};

const trackItemInteraction = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { event_type, metadata } = req.body;
    const userId = req.user.id;

    const validEventTypes = [
      "contact",
      "share",
      "save",
      "report",
      "match_attempt",
    ];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event type. Must be: " + validEventTypes.join(", "),
      });
    }

    await ItemAnalytics.create({
      item_id,
      user_id: userId,
      event_type,
      user_agent: req.headers["user-agent"],
      ip_address: req.ip,
      referrer: req.headers.referer,
      metadata,
    });

    res.status(200).json({
      success: true,
      message: `${event_type} event tracked successfully`,
    });
  } catch (error) {
    console.error("Error tracking item interaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track interaction",
      error: error.message,
    });
  }
};

const getItemAnalytics = async (req, res) => {
  try {
    const { item_id } = req.params;
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const item = await Item.findOne({
      where: {
        id: item_id,
        user_id: userId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or you don't have access",
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await ItemAnalytics.findAll({
      attributes: [
        "action_type",
        [sequelize.fn("COUNT", "*"), "count"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("user_id"))
          ),
          "unique_users",
        ],
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
      ],
      where: {
        item_id: item_id,
        createdAt: { [Op.gte]: startDate },
      },
      group: ["action_type", sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "DESC"],
        ["action_type", "ASC"],
      ],
      raw: true,
    });

    const summaryData = await ItemAnalytics.findAll({
      attributes: [
        [sequelize.fn("COUNT", "*"), "total_events"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("user_id"))
          ),
          "unique_viewers",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN action_type = 'view' THEN 1 END")
          ),
          "views",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN action_type = 'contact' THEN 1 END")
          ),
          "contacts",
        ],
        [
          sequelize.fn(
            "COUNT",
            sequelize.literal("CASE WHEN action_type = 'share' THEN 1 END")
          ),
          "shares",
        ],
      ],
      where: {
        item_id: item_id,
        createdAt: { [Op.gte]: startDate },
      },
      raw: true,
    });
    const summary = summaryData[0] || {
      total_events: 0,
      unique_viewers: 0,
      views: 0,
      contacts: 0,
      shares: 0,
    };

    const devices = await ItemAnalytics.findAll({
      attributes: ["device_type", [sequelize.fn("COUNT", "*"), "count"]],
      where: {
        item_id: item_id,
        createdAt: { [Op.gte]: startDate },
        device_type: { [Op.not]: null },
      },
      group: ["device_type"],
      order: [[sequelize.fn("COUNT", "*"), "DESC"]],
      raw: true,
    });

    res.status(200).json({
      success: true,
      message: "Item analytics retrieved successfully",
      data: {
        item: {
          id: item.id,
          title: item.title,
          status: item.status,
          view_count: item.view_count,
        },
        period: `${days} days`,
        summary: summary,
        timeline: analytics,
        device_breakdown: devices,
      },
    });
  } catch (error) {
    console.error("Error getting item analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get item analytics",
      error: error.message,
    });
  }
};

const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const userItems = await Item.findAll({
      where: { user_id: userId },
      attributes: ["item_id", "status"],
    });

    const itemsStatsByStatus = {};
    for (const item of userItems) {
      if (!itemsStatsByStatus[item.status]) {
        itemsStatsByStatus[item.status] = { count: 0, total_interactions: 0 };
      }
      itemsStatsByStatus[item.status].count++;
    }

    const interactionCounts = await ItemAnalytics.count({
      where: {
        item_id: { [Op.in]: userItems.map((item) => item.item_id) },
        createdAt: { [Op.gte]: startDate },
      },
      group: ["item_id"],
    });

    const itemsStats = Object.keys(itemsStatsByStatus).map((status) => ({
      status,
      count: itemsStatsByStatus[status].count,
      total_interactions: 0,
    }));

    const recentActivity = await ItemAnalytics.findAll({
      where: {
        createdAt: { [Op.gte]: startDate },
      },
      include: [
        {
          model: Item,
          where: { user_id: userId },
          attributes: ["item_id", "title", "status"],
        },
        {
          model: User,
          attributes: ["user_id", "name"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    const trendingItems = await Item.findAll({
      where: {
        user_id: userId,
      },
      order: [["created_at", "DESC"]],
      limit: 5,
      attributes: ["item_id", "title", "status", "created_at"],
    });

    // Add view counts to trending items
    const trendingItemsWithViews = await Promise.all(
      trendingItems.map(async (item) => {
        const viewCount = await ItemAnalytics.count({
          where: {
            item_id: item.item_id,
            action_type: "view",
          },
        });
        return {
          ...item.toJSON(),
          views: viewCount,
        };
      })
    );

    const performanceData = await Promise.all([
      ItemAnalytics.count({
        distinct: true,
        col: "user_id",
        include: [
          {
            model: Item,
            where: { user_id: userId },
            attributes: [],
          },
        ],
        where: {
          createdAt: { [Op.gte]: startDate },
        },
      }),

      ItemAnalytics.count({
        include: [
          {
            model: Item,
            where: { user_id: userId },
            attributes: [],
          },
        ],
        where: {
          action_type: "contact",
          createdAt: { [Op.gte]: startDate },
        },
      }),

      ItemAnalytics.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn(
                "DISTINCT",
                sequelize.fn("DATE", sequelize.col("ItemAnalytics.createdAt"))
              )
            ),
            "active_days",
          ],
        ],
        include: [
          {
            model: Item,
            where: { user_id: userId },
            attributes: [],
          },
        ],
        where: {
          createdAt: { [Op.gte]: startDate },
        },
        raw: true,
      }),

      ItemAnalytics.count({
        include: [
          {
            model: Item,
            where: { user_id: userId },
            attributes: [],
          },
        ],
        where: {
          action_type: "view",
          createdAt: { [Op.gte]: startDate },
        },
      }),
    ]);

    const performanceResult = {
      unique_viewers: performanceData[0] || 0,
      contact_rate: performanceData[1] || 0,
      active_days: performanceData[2][0]?.active_days || 0,
      view_count: performanceData[3] || 0,
    };

    res.status(200).json({
      success: true,
      message: "User dashboard analytics retrieved successfully",
      data: {
        period: `${days} days`,
        items_by_status: itemsStats,
        recent_activity: recentActivity,
        trending_items: trendingItemsWithViews,
        performance_metrics: performanceResult,
      },
    });
  } catch (error) {
    console.error("Error getting user dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user dashboard",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalActiveUsers,
      totalItems,
      lostItems,
      foundItems,
      returnedItems,
      recentInteractions,
    ] = await Promise.all([
      User.count({ where: { is_active: true } }),
      Item.count(),
      Item.count({ where: { status: "lost" } }),
      Item.count({ where: { status: "found" } }),
      Item.count({ where: { status: "returned" } }),
      ItemAnalytics.count({ where: { createdAt: { [Op.gte]: startDate } } }),
    ]);

    const platformStats = [
      {
        total_users: totalActiveUsers,
        total_items: totalItems,
        lost_items: lostItems,
        found_items: foundItems,
        returned_items: returnedItems,
        total_interactions: recentInteractions,
      },
    ];

    const dailyActivity = await ItemAnalytics.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("createdAt")), "date"],
        [sequelize.fn("COUNT", "*"), "activity_count"],
        [
          sequelize.fn(
            "COUNT",
            sequelize.fn("DISTINCT", sequelize.col("user_id"))
          ),
          "unique_users",
        ],
      ],
      where: {
        createdAt: { [Op.gte]: startDate },
      },
      group: [sequelize.fn("DATE", sequelize.col("createdAt"))],
      order: [[sequelize.fn("DATE", sequelize.col("createdAt")), "DESC"]],
      raw: true,
    });

    const mostActiveUsers = await User.findAll({
      attributes: [
        "name",
        "email",
        [sequelize.fn("COUNT", sequelize.col("Items.item_id")), "items_posted"],
        ["createdAt", "joined_date"],
      ],
      include: [
        {
          model: Item,
          attributes: [],
          required: false,
        },
      ],
      where: {
        is_active: true,
      },
      group: ["User.user_id", "User.name", "User.email", "User.createdAt"],
      order: [[sequelize.fn("COUNT", sequelize.col("Items.item_id")), "DESC"]],
      limit: 10,
      raw: true,
    });

    const popularCategories = await Category.findAll({
      attributes: [
        ["name", "category_name"],
        [sequelize.fn("COUNT", sequelize.col("Items.item_id")), "item_count"],
      ],
      include: [
        {
          model: Item,
          attributes: [],
          required: false,
        },
      ],
      group: ["Category.category_id", "Category.name"],
      order: [[sequelize.fn("COUNT", sequelize.col("Items.item_id")), "DESC"]],
      limit: 10,
      raw: true,
    });

    res.status(200).json({
      success: true,
      message: "Admin dashboard analytics retrieved successfully",
      data: {
        period: `${days} days`,
        platform_stats: platformStats[0],
        daily_activity: dailyActivity,
        active_users: mostActiveUsers,
        popular_categories: popularCategories,
      },
    });
  } catch (error) {
    console.error("Error getting admin dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get admin dashboard",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [
      totalUsers,
      totalItems,
      returnedItems,
      totalInteractions,
      uniqueAnalyticsUsers,
    ] = await Promise.all([
      User.count(),
      Item.count(),
      Item.count({ where: { status: "returned" } }),
      ItemAnalytics.count(),
      ItemAnalytics.findAll({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("user_id"))
            ),
            "count",
          ],
        ],
        raw: true,
      }),
    ]);

    const overview = [
      {
        total_users: totalUsers,
        total_items: totalItems,
        returned_items: returnedItems,
        total_interactions: totalInteractions,
        active_users: uniqueAnalyticsUsers[0]?.count || 0,
      },
    ];

    const categoryStats = await Category.findAll({
      attributes: [
        "name",
        [sequelize.fn("COUNT", sequelize.col("Items.item_id")), "item_count"],
      ],
      include: [
        {
          model: Item,
          attributes: [],
          required: false,
        },
      ],
      group: ["Category.category_id", "Category.name"],
      order: [[sequelize.fn("COUNT", sequelize.col("Items.item_id")), "DESC"]],
      raw: true,
    });

    const dailyActivity = await ItemAnalytics.findAll({
      attributes: ["action_type", [sequelize.fn("COUNT", "*"), "count"]],
      group: ["action_type"],
      order: [["action_type", "ASC"]],
      raw: true,
    });

    res.status(200).json({
      success: true,
      message: "Platform analytics retrieved successfully",
      data: {
        period: `${days} days`,
        overview: overview[0],
        category_stats: categoryStats,
        daily_activity: dailyActivity,
      },
    });
  } catch (error) {
    console.error("Error getting platform analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get platform analytics",
      error: error.message,
    });
  }
};

const getPopularItems = async (req, res) => {
  try {
    const { days = 7, limit = 10, category_id } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let whereClause = {
      view_count: { [Op.gt]: 0 },
    };
    if (category_id) {
      whereClause.category_id = category_id;
    }

    const popularItems = await Item.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "name", "profile_picture"],
        },
        {
          model: Category,
          attributes: ["id", "name", "icon", "color"],
          required: false,
        },
        {
          model: ItemAnalytics,
          where: {
            created_at: { [Op.gte]: startDate },
            event_type: "view",
          },
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "id",
        "title",
        "description",
        "status",
        "view_count",
        "createdAt",
        [
          sequelize.fn("COUNT", sequelize.col("ItemAnalytics.id")),
          "recent_views",
        ],
      ],
      group: ["Item.id", "User.id", "Category.id"],
      order: [
        [sequelize.literal("recent_views"), "DESC"],
        ["view_count", "DESC"],
      ],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: "Popular items retrieved successfully",
      data: {
        period: `${days} days`,
        items: popularItems,
      },
    });
  } catch (error) {
    console.error("Error getting popular items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular items",
      error: error.message,
    });
  }
};

export {
  trackItemView,
  trackItemInteraction,
  getItemAnalytics,
  getUserDashboard,
  getAdminDashboard,
  getPlatformAnalytics,
  getPopularItems,
};
