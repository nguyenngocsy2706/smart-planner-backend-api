const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');
const User = require('../models/User');

const expo = new Expo();

/**
 * Gửi push notification qua Expo
 */
async function sendPushNotifications(messages) {
    if (!messages || messages.length === 0) return;

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(`[Push] Đã gửi ${ticketChunk.length} notification`);
        } catch (error) {
            console.error('[Push] Lỗi khi gửi notification:', error);
        }
    }
}

/**
 * Kiểm tra & gửi notification đến hạn
 */
async function checkAndSendNotifications() {
    const now = new Date(); // UTC
    console.log(
        `[Scheduler] Check lúc UTC: ${now.toISOString()} | Local: ${now.toLocaleString()}`
    );

    let notificationsToSend = [];

    try {
        notificationsToSend = await Notification.find({
            time: { $lte: now },   // so sánh UTC chuẩn
            isSent: false,
        }).populate('user');
    } catch (err) {
        console.error('[Scheduler] Lỗi query Notification:', err);
        return;
    }

    if (notificationsToSend.length === 0) {
        return;
    }

    const messages = [];
    const sentIds = [];

    for (const notification of notificationsToSend) {
        try {
            const user = notification.user;

            if (!user) {
                console.warn(
                    `[Scheduler] Skip notification ${notification._id} (user không tồn tại)`
                );
                continue;
            }

            const pushToken = user.expoPushToken;

            if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
                console.warn(
                    `[Scheduler] Token không hợp lệ cho user ${user._id}`
                );
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title: 'SmartPlanner Reminder',
                body: notification.message,
                data: {
                    notificationId: notification._id.toString(),
                    type: notification.type,
                },
            });

            sentIds.push(notification._id);
        } catch (err) {
            console.error(
                `[Scheduler] Lỗi xử lý notification ${notification._id}:`,
                err
            );
        }
    }

    if (messages.length > 0) {
        await sendPushNotifications(messages);
    }

    if (sentIds.length > 0) {
        await Notification.updateMany(
            { _id: { $in: sentIds } },
            {
                $set: {
                    isSent: true,
                    sentAt: new Date(),
                },
            }
        );
        console.log(`[Scheduler] Đã cập nhật ${sentIds.length} notification`);
    }
}

/**
 * Khởi động scheduler
 */
exports.startScheduler = () => {
    // ⏱ chạy mỗi 1 phút → gần realtime
    cron.schedule('* * * * *', checkAndSendNotifications);

    console.log(
        'Scheduler đã khởi động: kiểm tra thông báo mỗi 1 phút (UTC chuẩn)'
    );
};
