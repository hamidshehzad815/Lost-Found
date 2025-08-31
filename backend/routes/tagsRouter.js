


import express from "express";
import auth from "../middleware/auth.js";
import {
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
} from "../controller/tags.js";

const router = express.Router();


router.get("/", getAllTags);


router.get("/popular", getPopularTags);


router.get("/category/:category_id", getTagsByCategory);


router.get("/search/items", searchItemsByTags);


router.post("/", auth, createTag);


router.get("/item/:item_id", getItemTags);


router.post("/item/add", auth, addTagsToItem);


router.post("/item/remove", auth, removeTagsFromItem);


router.put("/:tag_id", auth, updateTag);


router.delete("/:tag_id", auth, deleteTag);

export default router;
