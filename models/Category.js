const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Đã sửa tên
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#000000" },
}, { timestamps: true }); // Thêm timestamps

module.exports = mongoose.model("Category", CategorySchema);
