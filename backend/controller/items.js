import {
  Category,
  Item,
  Image,
  User,
  Conversation,
  UserReview,
  Tag,
  sequelize,
} from "../models/Index.js";
import { dmsToDecimal, decimalToDms } from "../utils/dmsConverter.js";
import { Op } from "sequelize";
import fs from "fs";


const VALID_STATUSES = ["lost", "found", "returned"];


const isValidStatus = (status) => {
  return VALID_STATUSES.includes(status);
};


const getValidStatusTransitions = (currentStatus) => {
  const transitions = {
    lost: ["found"], 
    found: ["returned"], 
    returned: [], 
  };
  return transitions[currentStatus] || [];
};


const canTransitionStatus = (fromStatus, toStatus) => {
  const validTransitions = getValidStatusTransitions(fromStatus);
  return validTransitions.includes(toStatus);
};

const uploadItem = async (req, res) => {
  console.log("🔍 uploadItem called");
  console.log("🔍 req.body:", req.body);
  console.log(
    "🔍 req.files:",
    req.files
      ? req.files.map((f) => ({
          filename: f.filename,
          originalname: f.originalname,
          size: f.size,
        }))
      : "No files"
  );

  const transaction = await sequelize.transaction();

  try {
    let {
      title,
      description,
      status,
      category: categoryId,
      lastSeenDate,
      lastSeenTime,
      location,
      latitude,
      longitude,
      contactInfo,
      reward,
      isEmergency,
      
      categoryName,
      lost_date,
      found_date,
      address,
      contact_info,
      is_sensitive,
      priority,
      expiry_date,
    } = req.body;

    
    const finalCategoryId = categoryId || null;
    const finalCategoryName = categoryName || null;
    const finalAddress = location || address;
    const finalContactInfo = contactInfo || contact_info;
    const finalReward = reward || 0; 
    const finalIsSensitive = isEmergency || is_sensitive;
    const finalStatus = status || "lost"; 

    
    let finalDate = null;
    if (lastSeenDate) {
      const dateTime = lastSeenTime
        ? `${lastSeenDate}T${lastSeenTime}`
        : lastSeenDate;
      finalDate = new Date(dateTime);
    } else if (lost_date) {
      finalDate = new Date(lost_date);
    } else if (found_date) {
      finalDate = new Date(found_date);
    }

    
    if (!title || !description || !finalAddress) {
      await transaction.rollback();
      return res.status(400).send({
        message: "Title, description, and location are required",
      });
    }

    
    if (!isValidStatus(finalStatus)) {
      await transaction.rollback();
      return res.status(400).send({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    
    longitude = parseFloat(longitude);
    latitude = parseFloat(latitude);

    
    if (req.files && req.files.length > 5) {
      await transaction.rollback();
      return res.status(400).send({ message: "Maximum 5 images allowed" });
    }

    const email = req.user.email;

    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      await transaction.rollback();
      return res.status(404).send({ message: "User not found" });
    }

    
    let category;
    if (finalCategoryId) {
      category = await Category.findByPk(finalCategoryId);
    } else if (finalCategoryName) {
      category = await Category.findOne({
        where: { name: finalCategoryName.toLowerCase() },
      });
    }

    if (!category) {
      await transaction.rollback();
      return res.status(404).send({
        message: "Category not found. Please select a valid category.",
      });
    }

    
    const itemData = {
      title,
      description,
      status: finalStatus,
      latitude,
      longitude,
      address: finalAddress,
      user_id: user.user_id,
      category_id: category.category_id,
    };

    
    
    
    
    

    
    const newItem = await Item.create(itemData, { transaction });

    
    let createdImages = [];
    if (req.files && req.files.length > 0) {
      const imagePromises = req.files.map((file) =>
        Image.create(
          {
            image_url: file.filename,
            item_id: newItem.item_id, 
          },
          { transaction }
        )
      );
      createdImages = await Promise.all(imagePromises);
    }

    
    await transaction.commit();

    
    const itemWithImages = await Item.findByPk(newItem.item_id, {
      include: [
        {
          model: Image,
          attributes: ["image_id", "image_url", "uploaded_at"],
        },
        {
          model: User,
          attributes: ["name", "email"],
        },
        {
          model: Category,
          attributes: ["name"],
        },
      ],
    });

    return res.status(201).send({
      message: "Item Created Successfully",
      item: itemWithImages,
      imagesUploaded: createdImages.length,
    });
  } catch (error) {
    
    await transaction.rollback();

    console.error("❌ uploadItem error:", error);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);

    
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const filePath = file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    console.error("Error creating item:", error);
    return res.status(500).send({
      message: "Error creating item",
      error: error.message,
    });
  }
};

const allItems = async (req, res) => {
  try {
    console.log("Fetching all items...");

    const {
      status,
      category,
      priority,
      limit = 50,
      offset = 0,
      include_expired = false,
    } = req.query;

    const whereConditions = {};

    
    if (status) whereConditions.status = status;
    if (priority) whereConditions.priority = priority;

    
    

    const includeConditions = [
      {
        model: User,
        attributes: ["name", "email", "phone"],
      },
      {
        model: Image,
        attributes: ["image_url"],
      },
      {
        model: Category,
        attributes: ["name", "icon_name", "color_code"],
      },
    ];

    
    if (category) {
      includeConditions[2].where = { name: category.toLowerCase() };
    }

    const items = await Item.findAll({
      where: whereConditions,
      include: includeConditions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]], 
    });

    console.log(`Found ${items.length} items in database`);

    const itemsWithDms = items.map((item) => {
      const itemData = item.toJSON();
      itemData.latitude = decimalToDms(itemData.latitude);
      itemData.longitude = decimalToDms(itemData.longitude, "lon");
      return itemData;
    });

    return res.status(200).send({
      items: itemsWithDms,
      count: itemsWithDms.length,
      filters: { status, category, priority },
    });
  } catch (error) {
    console.error("Error in allItems controller:", error);
    res
      .status(500)
      .send({ message: "Error fetching items", error: error.message });
  }
};

const itemByCategory = async (req, res) => {
  const { categoryName } = req.body;
  const category = await Category.findOne({
    where: { name: categoryName.toLowerCase() },
  });

  if (!category) return res.status(400).send({ message: "Invalid Category" });

  const items = await Item.findAll({
    where: { category_id: category.category_id },
    attributes: {
      exclude: ["item_id", "user_id", "category_id", "createdAt", "updatedAt"],
    },
    include: [
      {
        model: Image,
        attributes: ["image_url"],
      },
      {
        model: User,
        attributes: ["name"],
      },
      {
        model: Category,
        attributes: ["name"],
      },
    ],
  });

  if (items.length == 0) {
    return res
      .status(404)
      .send({ message: `No item found of category : ${categoryName}` });
  }
  return res
    .status(200)
    .send({ message: `Items of Category ${categoryName}`, items });
};

const itemByStatus = async (req, res) => {
  try {
    const { status } = req.body;

    
    if (!status) {
      return res.status(400).send({ message: "Status is required" });
    }

    
    if (!isValidStatus(status)) {
      return res.status(400).send({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const items = await Item.findAll({
      where: { status },
      attributes: {
        exclude: [
          "item_id",
          "user_id",
          "category_id",
          "createdAt",
          "updatedAt",
        ],
      },
      include: [
        {
          model: Image,
          attributes: ["image_url"],
        },
        {
          model: User,
          attributes: ["name"],
        },
        {
          model: Category,
          attributes: ["name"],
        },
      ],
    });

    if (items.length === 0) {
      return res.status(404).send({ message: `No ${status} items found` });
    }

    return res.status(200).send({
      message: `Found ${items.length} ${status} items`,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Error fetching items by status:", error);
    return res.status(500).send({
      message: "Error fetching items by status",
      error: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { item_id, status } = req.body;

    
    if (!item_id) {
      return res.status(400).send({ message: "Item ID is required" });
    }

    if (!status) {
      return res.status(400).send({ message: "Status is required" });
    }

    
    if (!isValidStatus(status)) {
      return res.status(400).send({
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    
    const existingItem = await Item.findByPk(item_id);
    if (!existingItem) {
      return res.status(404).send({ message: "Item not found" });
    }

    
    if (existingItem.status === status) {
      return res.status(400).send({
        message: `Item is already in '${status}' status`,
      });
    }

    
    
    
    
    
    
    

    
    const [affectedRows, [updatedItem]] = await Item.update(
      { status },
      { where: { item_id }, returning: true }
    );

    if (affectedRows === 0) {
      return res
        .status(404)
        .send({ message: "Item not found or no changes made" });
    }

    
    const itemWithDetails = await Item.findByPk(updatedItem.item_id, {
      include: [
        {
          model: Image,
          attributes: ["image_url"],
        },
        {
          model: User,
          attributes: ["name"],
        },
        {
          model: Category,
          attributes: ["name"],
        },
      ],
    });

    return res.status(200).send({
      message: `Item status updated to '${status}' successfully`,
      item: itemWithDetails,
    });
  } catch (error) {
    console.error("Error updating item status:", error);
    return res.status(500).send({
      message: "Error updating item status",
      error: error.message,
    });
  }
};

const updateItem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let {
      item_id,
      title,
      description,
      latitude,
      longitude,
      address,
      categoryName,
      status,
      lost_date,
      found_date,
      returned_date,
      reward_offered,
      contact_info,
      is_sensitive,
      priority,
      expiry_date,
    } = req.body;

    
    console.log("Received item_id:", item_id, "Type:", typeof item_id);
    if (!item_id) {
      await transaction.rollback();
      return res.status(400).send({ message: "Item ID is required" });
    }

    
    console.log("Looking for item with ID:", item_id);
    const existingItem = await Item.findOne({
      where: { item_id },
      include: [
        {
          model: User,
          attributes: ["email"],
        },
      ],
    });

    console.log("Found existing item:", existingItem ? "Yes" : "No");
    if (!existingItem) {
      await transaction.rollback();
      return res.status(404).send({ message: "Item not found" });
    }

    
    const userEmail = req.user.email;
    if (existingItem.User.email !== userEmail) {
      await transaction.rollback();
      return res
        .status(403)
        .send({ message: "You can only update your own items" });
    }

    
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (status !== undefined) updateData.status = status;
    if (reward_offered !== undefined)
      updateData.reward_offered = parseFloat(reward_offered) || 0;
    if (contact_info !== undefined) updateData.contact_info = contact_info;
    if (is_sensitive !== undefined)
      updateData.is_sensitive =
        is_sensitive === "true" || is_sensitive === true;
    if (priority !== undefined) updateData.priority = priority;

    
    if (lost_date !== undefined)
      updateData.lost_date = lost_date ? new Date(lost_date) : null;
    if (found_date !== undefined)
      updateData.found_date = found_date ? new Date(found_date) : null;
    if (returned_date !== undefined)
      updateData.returned_date = returned_date ? new Date(returned_date) : null;
    if (expiry_date !== undefined)
      updateData.expiry_date = expiry_date ? new Date(expiry_date) : null;

    
    if (latitude !== undefined && latitude !== "") {
      try {
        console.log("Converting latitude:", latitude);
        updateData.latitude = dmsToDecimal(latitude);
      } catch (coordError) {
        console.error("Error converting latitude:", coordError);
        
        const numLat = parseFloat(latitude);
        if (!isNaN(numLat)) {
          updateData.latitude = numLat;
        } else {
          await transaction.rollback();
          return res.status(400).send({
            message: "Invalid latitude format",
          });
        }
      }
    }
    if (longitude !== undefined && longitude !== "") {
      try {
        console.log("Converting longitude:", longitude);
        updateData.longitude = dmsToDecimal(longitude);
      } catch (coordError) {
        console.error("Error converting longitude:", coordError);
        
        const numLon = parseFloat(longitude);
        if (!isNaN(numLon)) {
          updateData.longitude = numLon;
        } else {
          await transaction.rollback();
          return res.status(400).send({
            message: "Invalid longitude format",
          });
        }
      }
    }

    
    if (categoryName !== undefined) {
      const category = await Category.findOne({
        where: { name: categoryName.toLowerCase() },
      });
      if (!category) {
        await transaction.rollback();
        return res.status(404).send({ message: "Category not found" });
      }
      updateData.category_id = category.category_id;
    }

    
    if (req.files && req.files.length > 0) {
      
      const currentImageCount = await Image.count({
        where: { item_id },
        transaction,
      });

      
      if (currentImageCount + req.files.length > 5) {
        await transaction.rollback();
        
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
        return res.status(400).send({
          message: `Total images cannot exceed 5. Current: ${currentImageCount}, Trying to add: ${req.files.length}`,
        });
      }

      
      const imagePromises = req.files.map((file) =>
        Image.create(
          {
            image_url: file.filename,
            item_id: item_id,
          },
          { transaction }
        )
      );
      await Promise.all(imagePromises);
    }

    
    if (Object.keys(updateData).length > 0) {
      console.log("Updating item with data:", updateData);
      await Item.update(updateData, {
        where: { item_id },
        transaction,
      });
      console.log("Item updated successfully");
    } else {
      console.log("No fields to update in item data");
    }

    
    await transaction.commit();

    
    const updatedItem = await Item.findOne({
      where: { item_id },
      include: [
        {
          model: Image,
          attributes: ["image_id", "image_url", "uploaded_at"],
        },
        {
          model: User,
          attributes: ["user_id", "name", "email"],
        },
        {
          model: Category,
          attributes: ["name"],
        },
      ],
    });

    
    const itemData = updatedItem.toJSON();
    itemData.latitude = decimalToDms(itemData.latitude);
    itemData.longitude = decimalToDms(itemData.longitude, "lon");

    return res.status(200).send({
      message: "Item updated successfully",
      item: itemData,
    });
  } catch (error) {
    
    await transaction.rollback();

    
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    console.error("Error updating item:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      sql: error.sql || "No SQL",
      parameters: error.parameters || "No parameters",
    });
    return res.status(500).send({
      message: "Error updating item",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

const getItemById = async (req, res) => {
  const { item_id } = req.params;

  if (!item_id) {
    return res.status(400).send({ message: "Item ID is required" });
  }

  const item = await Item.findOne({
    where: { item_id },
    include: [
      {
        model: Image,
        attributes: ["image_id", "image_url", "uploaded_at"],
      },
      {
        model: User,
        attributes: ["user_id", "name", "email"],
      },
      {
        model: Category,
        attributes: ["name"],
      },
    ],
  });

  if (!item) {
    return res.status(404).send({ message: "Item not found" });
  }

  
  const itemData = item.toJSON();
  itemData.latitude = decimalToDms(itemData.latitude);
  itemData.longitude = decimalToDms(itemData.longitude, "lon");

  return res.status(200).send({ item: itemData });
};

const myItems = async (req, res) => {
  const email = req.user.email;

  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  const userItems = await Item.findAll({
    where: { user_id: user.user_id },
    include: [
      {
        model: Image,
        attributes: ["image_id", "image_url", "uploaded_at"],
      },
      {
        model: User,
        attributes: ["name", "email"],
      },
      {
        model: Category,
        attributes: ["name"],
      },
    ],
    order: [["createdAt", "DESC"]], 
  });

  
  const itemsWithDms = userItems.map((item) => {
    const itemData = item.toJSON();
    itemData.latitude = decimalToDms(itemData.latitude);
    itemData.longitude = decimalToDms(itemData.longitude, "lon");
    return itemData;
  });

  return res.status(200).send({
    message: `Found ${userItems.length} items`,
    count: userItems.length,
    items: itemsWithDms,
  });
};


const getStatusInfo = async (req, res) => {
  try {
    const statusInfo = {
      availableStatuses: VALID_STATUSES,
      statusTransitions: {
        lost: getValidStatusTransitions("lost"),
        found: getValidStatusTransitions("found"),
        returned: getValidStatusTransitions("returned"),
      },
      statusDescriptions: {
        lost: "Item is reported as lost and needs to be found",
        found: "Item has been found and is waiting to be returned",
        returned: "Item has been successfully returned to owner",
      },
    };

    return res.status(200).send({
      message: "Status information retrieved successfully",
      data: statusInfo,
    });
  } catch (error) {
    console.error("Error getting status info:", error);
    return res.status(500).send({
      message: "Error retrieving status information",
      error: error.message,
    });
  }
};


const getHomepageStats = async (req, res) => {
  try {
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalItems,
      totalUsers,
      resolvedItems,
      totalConversations,
      totalReviews,
      avgRating,
      totalTags,
      activeUsersMonth,
    ] = await Promise.all([
      Item.count(),
      User.count(),
      Item.count({ where: { status: "returned" } }),
      Conversation.count(),
      UserReview.count(),
      UserReview.findOne({
        attributes: [
          [
            sequelize.fn(
              "COALESCE",
              sequelize.fn("AVG", sequelize.col("rating")),
              0
            ),
            "avg_rating",
          ],
        ],
        raw: true,
      }),
      Tag.count(),
      Item.count({
        attributes: [
          [
            sequelize.fn(
              "COUNT",
              sequelize.fn("DISTINCT", sequelize.col("user_id"))
            ),
            "active_users",
          ],
        ],
        where: {
          created_at: { [Op.gte]: thirtyDaysAgo },
        },
        raw: true,
      }),
    ]);

    const stats = [
      {
        total_items: totalItems,
        total_users: totalUsers,
        resolved_items: resolvedItems,
        total_conversations: totalConversations,
        total_reviews: totalReviews,
        avg_rating: avgRating?.avg_rating || 0,
        total_tags: totalTags,
        active_users_month: activeUsersMonth,
      },
    ];

    
    const data = stats[0];

    
    const itemsFound = await Item.count({ where: { status: "found" } });
    const itemsLost = await Item.count({ where: { status: "lost" } });

    const successRate =
      data.total_items > 0
        ? Math.round((data.resolved_items / data.total_items) * 100)
        : 0;

    
    const uniqueAddresses = await Item.count({
      distinct: true,
      col: "address",
      where: {
        address: {
          [Op.ne]: null,
        },
      },
    });

    const enhancedStats = {
      
      itemsReunited: data.resolved_items,
      activeUsers: data.total_users,
      successRate,
      cities: uniqueAddresses || 1,

      
      totalItems: data.total_items,
      itemsFound,
      itemsLost,
      totalConversations: parseInt(data.total_conversations || 0),
      totalReviews: parseInt(data.total_reviews || 0),
      averageRating: data.avg_rating
        ? parseFloat(data.avg_rating).toFixed(1)
        : 0,
      totalTags: parseInt(data.total_tags || 0),
      activeUsersThisMonth: parseInt(data.active_users_month || 0),

      breakdown: {
        lost: itemsLost,
        found: itemsFound,
        returned: data.resolved_items,
      },
    };

    return res.status(200).send({
      message: "Enhanced homepage statistics retrieved successfully",
      stats: enhancedStats,
    });
  } catch (error) {
    console.error("Error getting homepage stats:", error);
    return res.status(500).send({
      message: "Error retrieving homepage statistics",
      error: error.message,
    });
  }
};


const addSampleData = async (req, res) => {
  try {
    
    const sampleUsers = await User.bulkCreate(
      [
        {
          name: "John Doe",
          email: "john@example.com",
          password_hash: "hashedpassword123",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
          password_hash: "hashedpassword456",
        },
        {
          name: "Bob Wilson",
          email: "bob@example.com",
          password_hash: "hashedpassword789",
        },
      ],
      {
        ignoreDuplicates: true,
        returning: true,
      }
    );

    
    const sampleCategories = await Category.bulkCreate(
      [
        { name: "electronics" },
        { name: "jewelry" },
        { name: "bags" },
        { name: "keys" },
      ],
      {
        ignoreDuplicates: true,
        returning: true,
      }
    );

    
    const users = await User.findAll({ limit: 3 });
    const categories = await Category.findAll({ limit: 4 });

    
    const sampleItems = [
      {
        title: "iPhone 15 Pro",
        description: "Black iPhone 15 Pro found at downtown mall",
        status: "returned",
        latitude: 40.7128,
        longitude: -74.006,
        address: "Downtown Mall, New York",
        user_id: users[0].user_id,
        category_id: categories[0].category_id,
      },
      {
        title: "Gold Wedding Ring",
        description: "Lost gold wedding ring at Central Park",
        status: "returned",
        latitude: 40.7829,
        longitude: -73.9654,
        address: "Central Park, New York",
        user_id: users[1].user_id,
        category_id: categories[1].category_id,
      },
      {
        title: "Leather Wallet",
        description: "Brown leather wallet found at coffee shop",
        status: "found",
        latitude: 40.7507,
        longitude: -73.9934,
        address: "Manhattan, New York",
        user_id: users[0].user_id,
        category_id: categories[2].category_id,
      },
      {
        title: "Car Keys",
        description: "Toyota car keys lost near subway station",
        status: "lost",
        latitude: 40.7282,
        longitude: -73.7949,
        address: "Queens, New York",
        user_id: users[2].user_id,
        category_id: categories[3].category_id,
      },
      {
        title: "MacBook Pro",
        description: "Silver MacBook Pro returned to owner",
        status: "returned",
        latitude: 40.75,
        longitude: -73.9857,
        address: "Times Square, New York",
        user_id: users[1].user_id,
        category_id: categories[0].category_id,
      },
    ];

    await Item.bulkCreate(sampleItems, { ignoreDuplicates: true });

    const finalStats = await getHomepageStats(req, res);
  } catch (error) {
    console.error("Error adding sample data:", error);
    return res.status(500).send({
      message: "Error adding sample data",
      error: error.message,
    });
  }
};

export {
  uploadItem,
  allItems,
  itemByCategory,
  itemByStatus,
  updateStatus,
  updateItem,
  getItemById,
  myItems,
  getStatusInfo,
  getHomepageStats,
  addSampleData,
};
