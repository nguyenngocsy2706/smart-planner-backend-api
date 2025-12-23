const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: {
        type: Date,
        default: Date.now
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high", "Low", "Medium", "High"],
        default: "medium"
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    completed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);