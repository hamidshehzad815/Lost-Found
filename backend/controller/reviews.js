


import { UserReview, UserTrustScore, User, Item } from "../models/Index.js";
import { Op } from "sequelize";


const createReview = async (req, res) => {
  try {
    const { reviewed_user_id, item_id, rating, comment } = req.body;
    const reviewerId = req.user.id;

    
    if (!reviewed_user_id || !item_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "reviewed_user_id, item_id, and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    
    if (reviewed_user_id == reviewerId) {
      return res.status(400).json({
        success: false,
        message: "Cannot review yourself",
      });
    }

    
    const item = await Item.findByPk(item_id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    
    const existingReview = await UserReview.findOne({
      where: {
        reviewer_id: reviewerId,
        reviewed_user_id,
        item_id,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this user for this item",
      });
    }

    
    const review = await UserReview.create({
      reviewer_id: reviewerId,
      reviewed_user_id,
      item_id,
      rating,
      comment,
      is_verified: false, 
    });

    
    await updateUserTrustScore(reviewed_user_id);

    
    const reviewWithData = await UserReview.findByPk(review.id, {
      include: [
        {
          model: User,
          as: "Reviewer",
          attributes: ["id", "name", "profile_picture"],
        },
        {
          model: User,
          as: "ReviewedUser",
          attributes: ["id", "name", "profile_picture"],
        },
        {
          model: Item,
          attributes: ["id", "title", "status"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: reviewWithData,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};


const getUserReviews = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const reviews = await UserReview.findAndCountAll({
      where: { reviewed_user_id: user_id },
      include: [
        {
          model: User,
          as: "Reviewer",
          attributes: ["id", "name", "profile_picture"],
        },
        {
          model: Item,
          attributes: ["id", "title", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    
    const avgRating = await UserReview.aggregate("rating", "avg", {
      where: { reviewed_user_id: user_id },
    });

    const ratingCounts = await UserReview.findAll({
      where: { reviewed_user_id: user_id },
      attributes: [
        "rating",
        [
          UserReview.sequelize.fn("COUNT", UserReview.sequelize.col("rating")),
          "count",
        ],
      ],
      group: ["rating"],
      raw: true,
    });

    res.status(200).json({
      success: true,
      message: "User reviews retrieved successfully",
      data: {
        reviews: reviews.rows,
        statistics: {
          total_reviews: reviews.count,
          average_rating: parseFloat(avgRating || 0).toFixed(1),
          rating_distribution: ratingCounts,
        },
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(reviews.count / limit),
          has_more: reviews.count > offset + reviews.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user reviews",
      error: error.message,
    });
  }
};


const getReviewsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const reviews = await UserReview.findAndCountAll({
      where: { reviewer_id: userId },
      include: [
        {
          model: User,
          as: "ReviewedUser",
          attributes: ["id", "name", "profile_picture"],
        },
        {
          model: Item,
          attributes: ["id", "title", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      message: "Reviews by user retrieved successfully",
      data: {
        reviews: reviews.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(reviews.count / limit),
          total_reviews: reviews.count,
          has_more: reviews.count > offset + reviews.rows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting reviews by user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reviews by user",
      error: error.message,
    });
  }
};


const updateReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const { rating, comment } = req.body;
    const reviewerId = req.user.id;

    const review = await UserReview.findOne({
      where: {
        id: review_id,
        reviewer_id: reviewerId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to edit it",
      });
    }

    const updateData = {};
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }
      updateData.rating = rating;
    }
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    await review.update(updateData);

    
    if (rating !== undefined) {
      await updateUserTrustScore(review.reviewed_user_id);
    }

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};


const deleteReview = async (req, res) => {
  try {
    const { review_id } = req.params;
    const reviewerId = req.user.id;

    const review = await UserReview.findOne({
      where: {
        id: review_id,
        reviewer_id: reviewerId,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    const reviewedUserId = review.reviewed_user_id;
    await review.destroy();

    
    await updateUserTrustScore(reviewedUserId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};


const getUserTrustScore = async (req, res) => {
  try {
    const { user_id } = req.params;

    let trustScore = await UserTrustScore.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "profile_picture", "is_verified"],
        },
      ],
    });

    if (!trustScore) {
      
      trustScore = await UserTrustScore.create({
        user_id,
        trust_score: 50, 
        total_reviews: 0,
        average_rating: 0,
        successful_transactions: 0,
        response_rate: 0,
        verification_level: "none",
      });

      
      trustScore = await UserTrustScore.findOne({
        where: { user_id },
        include: [
          {
            model: User,
            attributes: ["id", "name", "profile_picture", "is_verified"],
          },
        ],
      });
    }

    res.status(200).json({
      success: true,
      message: "User trust score retrieved successfully",
      data: trustScore,
    });
  } catch (error) {
    console.error("Error getting user trust score:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user trust score",
      error: error.message,
    });
  }
};


const updateUserTrustScore = async (userId) => {
  try {
    
    const reviewStats = await UserReview.findOne({
      where: { reviewed_user_id: userId },
      attributes: [
        [
          UserReview.sequelize.fn("COUNT", UserReview.sequelize.col("id")),
          "total_reviews",
        ],
        [
          UserReview.sequelize.fn("AVG", UserReview.sequelize.col("rating")),
          "average_rating",
        ],
      ],
      raw: true,
    });

    const totalReviews = parseInt(reviewStats.total_reviews) || 0;
    const averageRating = parseFloat(reviewStats.average_rating) || 0;

    
    let trustScore = 50; 

    if (totalReviews > 0) {
      
      const ratingFactor = (averageRating - 3) * 12.5; 

      
      const volumeFactor = Math.min(totalReviews * 2, 25); 

      trustScore = Math.max(0, Math.min(100, 50 + ratingFactor + volumeFactor));
    }

    
    let verificationLevel = "none";
    if (trustScore >= 80) verificationLevel = "high";
    else if (trustScore >= 60) verificationLevel = "medium";
    else if (trustScore >= 40) verificationLevel = "low";

    
    await UserTrustScore.upsert({
      user_id: userId,
      trust_score: Math.round(trustScore),
      total_reviews: totalReviews,
      average_rating: averageRating,
      verification_level: verificationLevel,
      last_updated: new Date(),
    });
  } catch (error) {
    console.error("Error updating user trust score:", error);
  }
};


const getTopRatedUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topUsers = await UserTrustScore.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "profile_picture", "is_verified"],
        },
      ],
      order: [["trust_score", "DESC"]],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      message: "Top rated users retrieved successfully",
      data: topUsers,
    });
  } catch (error) {
    console.error("Error getting top rated users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get top rated users",
      error: error.message,
    });
  }
};

export {
  createReview,
  getUserReviews,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getUserTrustScore,
  updateUserTrustScore,
  getTopRatedUsers,
};
