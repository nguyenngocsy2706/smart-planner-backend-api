const express = require("express");
const notificationController = require('../controller/notificationController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();


router.get("/", verifyToken, notificationController.getNotifications);

router.put("/:id", verifyToken, notificationController.markAsRead);

router.delete("/:id", verifyToken, notificationController.deleteNotification);

module.exports = router;