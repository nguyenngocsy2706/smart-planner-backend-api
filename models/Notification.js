const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
    message: { type: String, required: true },
    time: { type: Date, required: true },

    sentAt: { type: Date, default: null },

    type: {
        type: String,
        enum: ['TASK_REMINDER', 'SCHEDULE_REMINDER', 'GENERAL'],
        default: 'GENERAL'
    },
    isSent: { type: Boolean, default: false },

    isRead: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);