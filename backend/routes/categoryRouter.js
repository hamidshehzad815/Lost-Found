import auth from "../middleware/auth.js";
import {
  addCategory,
  getAllCategories,
  initializeCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from "../controller/category.js";
import express from "express";

const router = express.Router();

router.post("/addCategory", auth, addCategory);
router.get("/allCategories", getAllCategories); 
router.get("/category/:category_id", getCategoryById);
router.put("/category/:category_id", auth, updateCategory);
router.delete("/category/:category_id", auth, deleteCategory);
router.post("/initializeCategories", initializeCategories); 

export default router;
