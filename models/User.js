// Cài đặt: npm install bcryptjs
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Import bcrypt

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    expoPushToken: {
        type: String,
        required: false, // Không bắt buộc vì người dùng có thể từ chối thông báo
    },
}, { timestamps: true }); // Thêm timestamps để có createdAt, updatedAt

// Sử dụng pre-save hook để băm mật khẩu trước khi lưu
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Thêm method để so sánh mật khẩu (sẽ dùng trong authController)
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);