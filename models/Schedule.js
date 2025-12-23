const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Đã sửa tên
    title: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    location: String,
}, { timestamps: true }); // Thêm timestamps

module.exports = mongoose.model("Schedule", ScheduleSchema);
