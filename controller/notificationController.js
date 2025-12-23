const Notification = require("../models/Notification");

class NotificationController {

    async getNotifications(req, res, next) {
        try {
            const userId = req.userId;

            const notifications = await Notification.find({
                user: userId,
            }).sort({ time: 1 });

            return res.status(200).json({
                success: true,
                count: notifications.length,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    async markAsRead(req, res, next) {
        try {
            const notificationId = req.params.id;
            const userId = req.userId;

            const updatedNotif = await Notification.findOneAndUpdate(
                { _id: notificationId, user: userId },
                { isRead: true },
                { new: true }
            );

            if (!updatedNotif) {
                return res.status(404).json({ success: false, message: "Thông báo không tồn tại hoặc không thuộc về bạn." });
            }

            return res.status(200).json({
                success: true,
                message: "Thông báo đã được đánh dấu là đã đọc.",
                data: updatedNotif
            });

        } catch (error) {
            next(error);
        }
    }

    async deleteNotification(req, res, next) {
        try {
            const notificationId = req.params.id;
            const userId = req.userId;

            const deleted = await Notification.findOneAndDelete({
                _id: notificationId,
                user: userId
            });

            if (!deleted) {
                return res.status(404).json({ success: false, message: "Thông báo không tồn tại hoặc không thuộc về bạn." });
            }

            return res.status(200).json({
                success: true,
                message: "Thông báo đã được xóa thành công."
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();