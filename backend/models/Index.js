// models/index.js
import sequelize from "../database/connectDatabase.js";
import { DataTypes } from "sequelize";

// Import all models
import UserModel from "./User.js";
import CategoryModel from "./Category.js";
import ItemModel from "./Item.js";
import ImageModel from "./Image.js";
import ReportModel from "./Report.js";
import ConversationModel from "./Conversation.js";
import MessageModel from "./Message.js";
import NotificationModel from "./Notification.js";
import UserPreferenceModel from "./UserPreference.js";
import SearchAlertModel from "./SearchAlert.js";
import ItemMatchModel from "./ItemMatch.js";
import UserReviewModel from "./UserReview.js";
import UserTrustScoreModel from "./UserTrustScore.js";
import TagModel from "./Tag.js";
import ItemTagModel from "./ItemTag.js";
import ItemAnalyticsModel from "./ItemAnalytics.js";

// Initialize all models
const User = UserModel(sequelize, DataTypes);
const Category = CategoryModel(sequelize, DataTypes);
const Item = ItemModel(sequelize, DataTypes);
const Image = ImageModel(sequelize, DataTypes);
const Report = ReportModel(sequelize, DataTypes);
const Conversation = ConversationModel(sequelize, DataTypes);
const Message = MessageModel(sequelize, DataTypes);
const Notification = NotificationModel(sequelize, DataTypes);
const UserPreference = UserPreferenceModel(sequelize, DataTypes);
const SearchAlert = SearchAlertModel(sequelize, DataTypes);
const ItemMatch = ItemMatchModel(sequelize, DataTypes);
const UserReview = UserReviewModel(sequelize, DataTypes);
const UserTrustScore = UserTrustScoreModel(sequelize, DataTypes);
const Tag = TagModel(sequelize, DataTypes);
const ItemTag = ItemTagModel(sequelize, DataTypes);
const ItemAnalytics = ItemAnalyticsModel(sequelize, DataTypes);

/* -------- Associations -------- */

// Core associations
User.hasMany(Item, { foreignKey: "user_id", onDelete: "CASCADE" });
Item.belongsTo(User, { foreignKey: "user_id" });

Category.hasMany(Item, { foreignKey: "category_id", onDelete: "SET NULL" });
Item.belongsTo(Category, { foreignKey: "category_id" });

Item.hasMany(Image, { foreignKey: "item_id", onDelete: "CASCADE" });
Image.belongsTo(Item, { foreignKey: "item_id" });

Item.hasMany(Report, { foreignKey: "item_id", onDelete: "CASCADE" });
Report.belongsTo(Item, { foreignKey: "item_id" });

User.hasMany(Report, { foreignKey: "reporter_id", onDelete: "CASCADE" });
Report.belongsTo(User, { foreignKey: "reporter_id" });

// Messaging associations
User.hasMany(Conversation, {
  as: "RequestedConversations",
  foreignKey: "requester_id",
});
User.hasMany(Conversation, {
  as: "OwnedConversations",
  foreignKey: "owner_id",
});
Item.hasMany(Conversation, { foreignKey: "item_id" });

Conversation.belongsTo(User, { as: "Requester", foreignKey: "requester_id" });
Conversation.belongsTo(User, { as: "Owner", foreignKey: "owner_id" });
Conversation.belongsTo(Item, { foreignKey: "item_id" });

Conversation.hasMany(Message, {
  foreignKey: "conversation_id",
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, { foreignKey: "conversation_id" });

User.hasMany(Message, { foreignKey: "sender_id" });
Message.belongsTo(User, { as: "Sender", foreignKey: "sender_id" });

// Notification associations
User.hasMany(Notification, { foreignKey: "user_id", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id" });

Item.hasMany(Notification, { foreignKey: "related_item_id" });
Notification.belongsTo(Item, {
  as: "RelatedItem",
  foreignKey: "related_item_id",
});

User.hasMany(Notification, {
  as: "RelatedNotifications",
  foreignKey: "related_user_id",
});
Notification.belongsTo(User, {
  as: "RelatedUser",
  foreignKey: "related_user_id",
});

// User preferences
User.hasOne(UserPreference, { foreignKey: "user_id", onDelete: "CASCADE" });
UserPreference.belongsTo(User, { foreignKey: "user_id" });

// Search alerts
User.hasMany(SearchAlert, { foreignKey: "user_id", onDelete: "CASCADE" });
SearchAlert.belongsTo(User, { foreignKey: "user_id" });

Category.hasMany(SearchAlert, { foreignKey: "category_id" });
SearchAlert.belongsTo(Category, { foreignKey: "category_id" });

// Item matches
Item.hasMany(ItemMatch, { as: "LostItemMatches", foreignKey: "lost_item_id" });
Item.hasMany(ItemMatch, {
  as: "FoundItemMatches",
  foreignKey: "found_item_id",
});

ItemMatch.belongsTo(Item, { as: "LostItem", foreignKey: "lost_item_id" });
ItemMatch.belongsTo(Item, { as: "FoundItem", foreignKey: "found_item_id" });

// Review system
User.hasMany(UserReview, { as: "GivenReviews", foreignKey: "reviewer_id" });
User.hasMany(UserReview, {
  as: "ReceivedReviews",
  foreignKey: "reviewed_user_id",
});
Item.hasMany(UserReview, { foreignKey: "item_id" });

UserReview.belongsTo(User, { as: "Reviewer", foreignKey: "reviewer_id" });
UserReview.belongsTo(User, {
  as: "ReviewedUser",
  foreignKey: "reviewed_user_id",
});
UserReview.belongsTo(Item, { foreignKey: "item_id" });

// Trust scores
User.hasOne(UserTrustScore, { foreignKey: "user_id", onDelete: "CASCADE" });
UserTrustScore.belongsTo(User, { foreignKey: "user_id" });

// Tags system
Category.hasMany(Tag, { foreignKey: "category_id", as: "tags" });
Tag.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// Many-to-many: Items <-> Tags
Item.belongsToMany(Tag, { through: ItemTag, foreignKey: "item_id" });
Tag.belongsToMany(Item, { through: ItemTag, foreignKey: "tag_id" });

// Analytics
Item.hasMany(ItemAnalytics, { foreignKey: "item_id", onDelete: "CASCADE" });
ItemAnalytics.belongsTo(Item, { foreignKey: "item_id" });

User.hasMany(ItemAnalytics, { foreignKey: "user_id" });
ItemAnalytics.belongsTo(User, { foreignKey: "user_id" });

export {
  sequelize,
  User,
  Category,
  Item,
  Image,
  Report,
  Conversation,
  Message,
  Notification,
  UserPreference,
  SearchAlert,
  ItemMatch,
  UserReview,
  UserTrustScore,
  Tag,
  ItemTag,
  ItemAnalytics,
};
