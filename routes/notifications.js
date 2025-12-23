const express = require("express");
const notificationController = require('../controller/notificationController'); // Import Controller
const { verifyToken } = require('../middleware/auth'); // Import middleware xác thực
const router = express.Router();


// 1. GET /api/v1/notifications
// Lấy danh sách thông báo của người dùng hiện tại (ID lấy từ Token)
router.get("/", verifyToken, notificationController.getNotifications);

// 2. PUT /api/v1/notifications/:id
// Cập nhật trạng thái thông báo (ví dụ: đánh dấu là đã đọc)
router.put("/:id", verifyToken, notificationController.markAsRead);

// 3. DELETE /api/v1/notifications/:id
// Xóa thông báo
router.delete("/:id", verifyToken, notificationController.deleteNotification);

module.exports = router;