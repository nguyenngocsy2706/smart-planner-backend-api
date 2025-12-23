const Schedule = require("../models/Schedule");
const Notification = require("../models/Notification");

const calculateReminderTime = (startTime) => {
    return new Date(startTime.getTime() - (15 * 60 * 1000));
};

class ScheduleController {

    async addSchedule(req, res, next) {
        try {
            const userId = req.userId;
            const { title, startTime, endTime, location, categoryId } = req.body;

            const schedule = await Schedule.create({
                title, startTime, endTime, location, categoryId,
                user: userId
            });

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

    async getAllSchedules(req, res, next) {
        try {
            const userId = req.userId;
            const schedules = await Schedule.find({ user: userId }).populate('categoryId');

            res.status(200).json({
                success: true,
                data: schedules
            });
        } catch (error) {
            next(error);
        }
    }

    async getSchedule(req, res, next) {
        try {
            const userId = req.userId;
            const schedule = await Schedule.findOne({ _id: req.params.id, user: userId }).populate('categoryId');

            if (!schedule) {
                return res.status(404).json({ message: "Không tìm thấy lịch trình này." });
            }
            res.status(200).json({
                success: true,
                data: schedule
            });
        } catch (error) {
            next(error);
        }
    }

    async updateSchedule(req, res, next) {
        try {
            const scheduleId = req.params.id;
            const userId = req.userId;

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

            if (req.body.startTime) {
                await Notification.deleteMany({ schedule: scheduleId, user: userId });

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

    async deleteSchedule(req, res, next) {
        try {
            const scheduleId = req.params.id;
            const userId = req.userId;

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