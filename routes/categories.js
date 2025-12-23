const express = require("express");
const categoryController = require("../controller/categoryController");
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Add category
router.post("/", verifyToken, categoryController.addCategory);

// Get all categories for the CURRENT user
router.get("/", verifyToken, categoryController.getCategories);

router.get("/:id", verifyToken, categoryController.getCategory);
// Update category (Cần kiểm tra ownership trong Controller)
router.put("/:id", verifyToken, categoryController.updateCategory);

// Delete category (Cần kiểm tra ownership trong Controller)
router.delete("/:id", verifyToken, categoryController.deleteCategory);

module.exports = router;
