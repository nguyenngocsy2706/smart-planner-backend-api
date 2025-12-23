const Schedule = require("../models/Schedule");
const Notification = require("../models/Notification"); // ✅ IMPORT Notification Model

// Hàm hỗ trợ để tính thời gian nhắc nhở (ví dụ: 15 phút trước khi sự kiện bắt đầu)
const calculateReminderTime = (startTime) => {
    // Trừ đi 15 phút (15 * 60 * 1000 milliseconds)
    return new Date(startTime.getTime() - (15 * 60 * 1000));
};

class ScheduleController {

    // 1. POST /schedules - Tạo lịch trình và thông báo
    async addSchedule(req, res, next) {
        try {
            const userId = req.userId;
            const { title, startTime, endTime, location, categoryId } = req.body;

            const schedule = await Schedule.create({
                title, startTime, endTime, location, categoryId,
                user: userId
            });

            // ✅ LOGIC MỚI: TẠO NOTIFICATION
            if (schedule.startTime) {
                const reminderTime = calculateReminderTime(schedule.startTime);

                await Notification.create({
                    user: userId,
                    schedule: schedule._id, // Giả định trường liên kết là 'schedule'
                    message: `Lịch trình "${schedule.title}" sẽ bắt đầu sau 15 phút!`,
                    time: reminderTime,
                    type: 'SCHEDULE_REMINDER'
                });
            }

            return res.status(201).json({
                success: true,
                data: schedule
            });
        } catch (error) {
            next(error);
        }
    }

    // 2. GET /schedules - Lấy lịch trình CỦA NGƯỜI DÙNG HIỆN TẠI
    async getAllSchedules(req, res, next) {
        try {
            const userId = req.userId;
            const schedules = await Schedule.find({ user: userId });

            res.status(200).json({
                success: true,
                data: schedules
            });
        } catch (error) {
            next(error);
        }
    }

    // 2. GET /schedules - Lấy lịch trình CỦA NGƯỜI DÙNG HIỆN TẠI
    async getSchedule(req, res, next) {
        try {
            const userId = req.userId;
            const schedule = await Schedule.findOne({ _id: req.params.id, user: userId });

            if (!schedule) {
                return res.status(404).json({ message: "Không tìm thấy lịch trình này." });
            }
            res.status(200).json({
                success: true,
                data: { schedule }
            });
        } catch (error) {
            next(error);
        }
    }

    // 3. PUT /schedules/:id - Cập nhật lịch trình và thông báo
    async updateSchedule(req, res, next) {
        try {
            const scheduleId = req.params.id;
            const userId = req.userId;

            // 1. Cập nhật Schedule
            const schedule = await Schedule.findOneAndUpdate(
                { _id: scheduleId, user: userId },
                req.body,
                { new: true, runValidators: true }
            );

            if (!schedule) {
                return res.status(404).json({
                    success: false,
                    message: "Lịch trình không tồn tại hoặc bạn không có quyền truy cập"
                });
            }

            // 2. ✅ LOGIC MỚI: Xóa thông báo cũ và tạo thông báo mới nếu thời gian thay đổi
            if (req.body.startTime) {
                // Xóa thông báo cũ liên kết với Schedule này
                await Notification.deleteMany({ schedule: scheduleId, user: userId });

                // Tạo thông báo mới dựa trên thời gian mới
                const reminderTime = calculateReminderTime(schedule.startTime);
                await Notification.create({
                    user: userId,
                    schedule: schedule._id,
                    message: `Lịch trình "${schedule.title}" đã được cập nhật, sẽ bắt đầu sau 15 phút!`,
                    time: reminderTime,
                    type: 'SCHEDULE_REMINDER'
                });
            }

            return res.status(200).json({
                success: true,
                data: schedule
            });
        } catch (err) {
            next(err);
        }
    }

    // 4. DELETE /schedules/:id - Xóa lịch trình và thông báo liên quan
    async deleteSchedule(req, res, next) {
        try {
            const scheduleId = req.params.id;
            const userId = req.userId;

            // 1. Xóa Schedule
            const deleted = await Schedule.findOneAndDelete({
                _id: scheduleId,
                user: userId
            });

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Lịch trình không tồn tại hoặc bạn không có quyền xóa"
                });
            }

            // 2. ✅ LOGIC MỚI: Xóa tất cả Notifications liên kết
            await Notification.deleteMany({ schedule: scheduleId, user: userId });

            return res.status(200).json({
                success: true,
                message: "Deleted successfully"
            });

        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ScheduleController();