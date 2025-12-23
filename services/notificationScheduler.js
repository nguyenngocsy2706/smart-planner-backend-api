const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification'); // Đã import Notification Model
const User = require('../models/User'); // Đã import User Model (để lấy Token)

const expo = new Expo();

async function sendPushNotifications(messages) {
    if (messages.length === 0) return;

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            console.log(`[Push] Đã gửi thành công lô ${tickets.length}/${messages.length} tin nhắn.`);
        } catch (error) {
            console.error('Lỗi khi gửi Push Notification Chunk:', error);
        }
    }
}

/**
 * Tác vụ kiểm tra và gửi thông báo định kỳ.
 */
async function checkAndSendNotifications() {
    console.log(`[Scheduler] Kiểm tra thông báo lúc: ${new Date().toLocaleString()}`);

    // 1. Tìm các thông báo đã đến hạn và chưa được gửi
    const now = new Date();
    const notificationsToSend = await Notification.find({
        time: { $lte: now },
        isSent: false,
    })
        .populate('user');

    if (notificationsToSend.length === 0) {
        return;
    }

    const messages = [];
    const notificationIdsToUpdate = [];

    for (const notification of notificationsToSend) {
        // Bảo vệ từng notification để một lỗi không làm hỏng cả lô
        try {
            const user = notification.user;

            if (!user) {
                console.warn(`[Scheduler] Bỏ qua thông báo ID: ${notification._id} vì người dùng liên kết không tồn tại (đã bị xóa?).`);
                // Có thể xóa notification cũ nếu cần: await Notification.findByIdAndDelete(notification._id);
                continue;
            }

            const pushToken = user.expoPushToken;

            if (pushToken && Expo.isExpoPushToken(pushToken)) {
                messages.push({
                    to: pushToken,
                    sound: 'default',
                    title: notification.message.length > 30 ? 'Lời nhắc mới!' : 'SmartPlanner Reminder',
                    body: notification.message,
                    data: {
                        notificationId: notification._id,
                        type: notification.type
                    },
                });
                notificationIdsToUpdate.push(notification._id);
            } else {
                console.warn(`[Scheduler] Token không hợp lệ hoặc không tồn tại cho User ${user._id}.`);
            }
        } catch (err) {
            console.error('[Scheduler] Lỗi khi xử lý notification', notification._id, err);
            // Tiếp tục vòng lặp với notification tiếp theo
            continue;
        }
    }

    // 3. Gửi tất cả thông báo thu thập được
    if (messages.length > 0) {
        await sendPushNotifications(messages);
    }

    // 4. Đánh dấu các thông báo đã được gửi
    if (notificationIdsToUpdate.length > 0) {
        await Notification.updateMany(
            { _id: { $in: notificationIdsToUpdate } },
            { $set: { isSent: true, sentAt: new Date() } }
        );
        console.log(`[Scheduler] Đã gửi và cập nhật ${notificationIdsToUpdate.length} thông báo.`);
    }
}

/**
 * Bắt đầu chạy Scheduler.
 */
exports.startScheduler = () => {
    // Chạy tác vụ mỗi 5 phút (*/5 phút * giờ * ngày * tháng * năm)
    cron.schedule('*/5 * * * *', checkAndSendNotifications);
    console.log('✅ Scheduler đã khởi động: kiểm tra thông báo 5 phút/lần.');
};