


import express from "express";
import auth from "../middleware/auth.js";
import {
  createReview,
  getUserReviews,
  getReviewsByUser,
  updateReview,
  deleteReview,
  getUserTrustScore,
  getTopRatedUsers,
} from "../controller/reviews.js";

const router = express.Router();


router.post("/", auth, createReview);


router.get("/user/:user_id", getUserReviews);


router.get("/my-reviews", auth, getReviewsByUser);


router.put("/:review_id", auth, updateReview);


router.delete("/:review_id", auth, deleteReview);


router.get("/trust-score/:user_id", getUserTrustScore);


router.get("/top-users", getTopRatedUsers);

export default router;
