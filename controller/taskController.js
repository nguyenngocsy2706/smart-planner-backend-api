const Task = require("../models/Task");
// ✅ KHẮC PHỤC LỖI: Import Model Notification
const Notification = require('../models/Notification');

class TaskController {

    // 1. GET /tasks - Lấy Task CỦA NGƯỜI DÙNG HIỆN TẠI
    async getTask(req, res, next) {
        try {
            // LẤY userId TỪ AUTHENTICATION (req.userId)
            const userId = req.userId; // Dùng req.userId từ middleware auth

            const tasks = await Task.find({ user: userId }); // Giả định trường trong DB là 'user'

            return res.status(200).json({
                success: true,
                data: tasks
            });
        } catch (err) {
            next(err);
        }
    }

    async getTaskDetail(req, res, next) {
        try {
            const taskId = req.params.id;

            const userId = req.userId;

            const task = await Task.findOne({
                _id: taskId,
                user: userId
            });

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task không tồn tại hoặc bạn không có quyền truy cập."
                });
            }

            return res.status(200).json({
                success: true,
                data: task
            });
        } catch (err) {
            next(err);
        }
    }

    async addTask(req, res, next) {
        try {
            const userId = req.userId;

            // Đảm bảo Task được tạo có người sở hữu là userId
            const task = await Task.create({
                ...req.body,
                user: userId // Gán cứng người sở hữu từ Token JWT
            });

            // ✅ TẠO THÔNG BÁO NHẮC NHỞ (Chỉ khi có dueDate)
            if (task.dueDate) {
                // Tính toán thời gian nhắc nhở (ví dụ: 24 giờ trước DueDate)
                const reminderTime = new Date(task.dueDate.getTime() - (24 * 60 * 60 * 1000));

                // Đảm bảo rằng reminderTime là hợp lệ và chưa quá khứ
                if (reminderTime > new Date()) {
                    await Notification.create({
                        user: userId,
                        task: task._id, // Liên kết với Task
                        message: `Nhiệm vụ "${task.title}" cần hoàn thành trước ngày mai!`,
                        time: reminderTime,
                        type: 'TASK_REMINDER'
                    });
                }
            }

            return res.status(201).json({
                success: true,
                data: task
            });

        } catch (err) {
            // Lỗi ở đây có thể là lỗi Validation (Mongoose) hoặc lỗi Server
            next(err);
        }
    }

    // 3. PUT /tasks/:id - Cập nhật Task (Yêu cầu kiểm tra sở hữu)
    async updateTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const userId = req.userId;

            // BƯỚC AUTHORIZATION: Kiểm tra Task thuộc về ai
            const task = await Task.findOneAndUpdate(
                { _id: taskId, user: userId }, // Tìm theo Task ID VÀ User ID
                req.body,
                { new: true, runValidators: true } // runValidators đảm bảo schema được validate
            );

            if (!task) {
                // Nếu Task không tồn tại HOẶC không thuộc về người dùng, trả về 404/403
                return res.status(404).json({
                    success: false,
                    message: "Task không tồn tại hoặc bạn không có quyền truy cập"
                });
            }

            // Gợi ý: Nếu DueDate thay đổi, cần cập nhật/xóa thông báo nhắc nhở cũ

            return res.status(200).json({
                success: true,
                data: task
            });
        } catch (err) {
            next(err);
        }
    }

    // 4. DELETE /tasks/:id - Xóa Task (Yêu cầu kiểm tra sở hữu)
    async deleteTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const userId = req.userId;

            // BƯỚC AUTHORIZATION: Tìm và xóa Task theo cả Task ID VÀ User ID
            const deleted = await Task.findOneAndDelete({
                _id: taskId,
                user: userId
            });

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Task không tồn tại hoặc bạn không có quyền xóa"
                });
            }

            // Gợi ý: Xóa luôn thông báo nhắc nhở liên quan đến Task này
            await Notification.deleteMany({ task: taskId, user: userId });


            return res.status(200).json({
                success: true,
                message: "Deleted successfully"
            });

        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TaskController();