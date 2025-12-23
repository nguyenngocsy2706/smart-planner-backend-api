const Task = require("../models/Task");
const Notification = require('../models/Notification');

class TaskController {

    async getTask(req, res, next) {
        try {
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

            const task = await Task.create({
                ...req.body,
                user: userId // Gán cứng người sở hữu từ Token JWT
            });

            if (task.dueDate) {
                const reminderTime = new Date(task.dueDate.getTime() - (24 * 60 * 60 * 1000));

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
            next(err);
        }
    }

    async updateTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const userId = req.userId;

            const task = await Task.findOneAndUpdate(
                { _id: taskId, user: userId }, // Tìm theo Task ID VÀ User ID
                req.body,
                { new: true, runValidators: true } // runValidators đảm bảo schema được validate
            );

            if (!task) {
                return res.status(404).json({
                    success: false,
                    message: "Task không tồn tại hoặc bạn không có quyền truy cập"
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

    async deleteTask(req, res, next) {
        try {
            const taskId = req.params.id;
            const userId = req.userId;

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