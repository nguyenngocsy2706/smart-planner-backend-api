const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    // Đã sửa lỗi tham chiếu: Mongoose sử dụng req.user (là ObjectId được gán trong Middleware)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: Date,
    // ✅ SỬA LỖI ENUM: Thêm giá trị viết hoa để tương thích với dữ liệu đang gửi từ App
    priority: {
        type: String,
        enum: ["low", "medium", "high", "Low", "Medium", "High"],
        default: "medium"
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    completed: { type: Boolean, default: false }
}, { timestamps: true }); // Thêm timestamps

module.exports = mongoose.model("Task", TaskSchema);