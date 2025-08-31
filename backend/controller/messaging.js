


import { Conversation, Message, User, Item } from "../models/Index.js";
import { sendMessageNotification } from "../utils/emailService.js";
import { Op } from "sequelize";


const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ requester_id: userId }, { owner_id: userId }],
      },
      include: [
        {
          model: User,
          as: "Requester",
          attributes: ["id", "name", "email", "profile_picture"],
        },
        {
          model: User,
          as: "Owner",
          attributes: ["id", "name", "email", "profile_picture"],
        },
        {
          model: Item,
          attributes: ["id", "title", "description", "status"],
        },
        {
          model: Message,
          limit: 1,
          order: [["createdAt", "DESC"]],
          attributes: ["content", "createdAt"],
        },
      ],
      order: [["last_message_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: conversations,
    });
  } catch (error) {
    console.error("Error getting user conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get conversations",
      error: error.message,
    });
  }
};


const startConversation = async (req, res) => {
  try {
    const { item_id } = req.body;
    const requesterId = req.user.id;

    
    const item = await Item.findByPk(item_id, {
      include: [{ model: User, attributes: ["id", "name"] }],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    
    if (item.user_id === requesterId) {
      return res.status(400).json({
        success: false,
        message: "Cannot start conversation with yourself",
      });
    }

    
    const existingConversation = await Conversation.findOne({
      where: {
        item_id,
        requester_id: requesterId,
        owner_id: item.user_id,
      },
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: existingConversation,
      });
    }

    
    const conversation = await Conversation.create({
      item_id,
      requester_id: requesterId,
      owner_id: item.user_id,
      status: "active",
      last_message_at: new Date(),
    });

    
    const conversationWithData = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: User,
          as: "Requester",
          attributes: ["id", "name", "email", "profile_picture"],
        },
        {
          model: User,
          as: "Owner",
          attributes: ["id", "name", "email", "profile_picture"],
        },
        {
          model: Item,
          attributes: ["id", "title", "description", "status"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Conversation started successfully",
      data: conversationWithData,
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start conversation",
      error: error.message,
    });
  }
};


const getConversationMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    
    const conversation = await Conversation.findOne({
      where: {
        id: conversation_id,
        [Op.or]: [{ requester_id: userId }, { owner_id: userId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    const offset = (page - 1) * limit;

    const messages = await Message.findAndCountAll({
      where: { conversation_id },
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["id", "name", "profile_picture"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    
    await Message.update(
      { is_read: true },
      {
        where: {
          conversation_id,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: {
        messages: messages.rows.reverse(), 
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(messages.count / limit),
          total_messages: messages.count,
          has_more: messages.count > offset + messages.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get messages",
      error: error.message,
    });
  }
};


const sendMessage = async (req, res) => {
  try {
    const { conversation_id, content, message_type = "text" } = req.body;
    const senderId = req.user.id;

    
    const conversation = await Conversation.findOne({
      where: {
        id: conversation_id,
        [Op.or]: [{ requester_id: senderId }, { owner_id: senderId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    
    const message = await Message.create({
      conversation_id,
      sender_id: senderId,
      content,
      message_type,
      is_read: false,
    });

    
    await Conversation.update(
      {
        last_message_at: new Date(),
        status: "active",
      },
      { where: { id: conversation_id } }
    );

    
    const messageWithSender = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["id", "name", "profile_picture"],
        },
      ],
    });

    
    try {
      
      const fullConversation = await Conversation.findByPk(conversation_id, {
        include: [
          {
            model: User,
            as: "Requester",
            attributes: ["id", "name", "email"],
          },
          {
            model: User,
            as: "Owner",
            attributes: ["id", "name", "email"],
          },
          {
            model: Item,
            attributes: ["id", "title"],
          },
        ],
      });

      
      const recipient =
        senderId === fullConversation.requester_id
          ? fullConversation.Owner
          : fullConversation.Requester;

      if (recipient && recipient.email) {
        await sendMessageNotification(
          recipient.email,
          recipient.name,
          messageWithSender.Sender.name,
          fullConversation.Item.title
        );
        console.log(`✅ Message notification sent to ${recipient.email}`);
      }
    } catch (emailError) {
      console.error(`❌ Failed to send message notification:`, emailError);
      
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: messageWithSender,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};


const updateConversationStatus = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ["active", "archived", "blocked"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be: " + validStatuses.join(", "),
      });
    }

    
    const conversation = await Conversation.findOne({
      where: {
        id: conversation_id,
        [Op.or]: [{ requester_id: userId }, { owner_id: userId }],
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or access denied",
      });
    }

    await Conversation.update({ status }, { where: { id: conversation_id } });

    res.status(200).json({
      success: true,
      message: `Conversation ${status} successfully`,
    });
  } catch (error) {
    console.error("Error updating conversation status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update conversation status",
      error: error.message,
    });
  }
};


const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.count({
      include: [
        {
          model: Conversation,
          where: {
            [Op.or]: [{ requester_id: userId }, { owner_id: userId }],
          },
        },
      ],
      where: {
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: { unread_count: unreadCount },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

export {
  getUserConversations,
  startConversation,
  getConversationMessages,
  sendMessage,
  updateConversationStatus,
  getUnreadCount,
};
