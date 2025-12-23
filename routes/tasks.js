const express = require("express");
const taskController = require('../controller/taskController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Create
router.post("/", verifyToken, taskController.addTask);

// Lấy tất cả tasks CỦA NGƯỜI DÙNG HIỆN TẠI (ID được lấy từ Token)
router.get("/", verifyToken, taskController.getTask);

//Lấy chi tiết Task theo ID
router.get("/:id", verifyToken, taskController.getTaskDetail);

// Update task (Cần kiểm tra Task ID và User ID trong Controller)
router.put("/:id", verifyToken, taskController.updateTask);

// Delete task (Cần kiểm tra Task ID và User ID trong Controller)
router.delete("/:id", verifyToken, taskController.deleteTask);

module.exports = router;
