const Notification = require("../models/Notification");

class NotificationController {

    // GET /notifications - Lấy thông báo của người dùng hiện tại
    async getNotifications(req, res, next) {
        try {
            const userId = req.userId;

            // Lấy tất cả thông báo SẮP TỚI (chưa được gửi) hoặc CHƯA ĐỌC
            const notifications = await Notification.find({
                user: userId,
                // Ví dụ: Lấy những thông báo chưa được gửi (isSent=false) và sắp đến giờ
                // isSent: false, 
            }).sort({ time: 1 }); // Sắp xếp theo thời gian sớm nhất

            return res.status(200).json({
                success: true,
                count: notifications.length,
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    // PUT /notifications/:id - Đánh dấu thông báo đã xem/đã đọc
    async markAsRead(req, res, next) {
        try {
            const notificationId = req.params.id;
            const userId = req.userId;

            // ✅ AUTHORIZATION: Tìm và cập nhật theo ID VÀ User ID
            const updatedNotif = await Notification.findOneAndUpdate(
                { _id: notificationId, user: userId },
                { isRead: true }, // Giả định bạn thêm trường isRead: { type: Boolean, default: false } vào Model
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

    // DELETE /notifications/:id - Xóa thông báo
    async deleteNotification(req, res, next) {
        try {
            const notificationId = req.params.id;
            const userId = req.userId;

            // ✅ AUTHORIZATION: Tìm và xóa theo ID VÀ User ID
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