const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const secret = process.env.JWT_SECRET;
const expiresIn = '1d';
const User = require("../models/User");

class AuthController {
    async register(req, res, next) { // Thêm next
        const { name, email, password } = req.body;

        try {
            const exists = await User.findOne({ email });
            if (exists)
                return res.status(400).json({ success: false, message: "Email đã tồn tại" });

            const user = await User.create({ name, email, password });

            const userResponse = user.toObject();
            delete userResponse.password;

            const userPayload = { id: user._id };
            const token = jwt.sign(userPayload, secret, { expiresIn });

            res.status(201).json({
                success: true,
                token,
                user: userResponse,
                data: userResponse
            });
        } catch (err) {
            next(err);
        }
    }

    // ...
    async login(req, res, next) { // Thêm next
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email }).select('+password');

            if (!user)
                return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" });

            const match = await bcrypt.compare(password, user.password);

            if (!match)
                return res.status(401).json({ success: false, message: "Email hoặc mật khẩu không đúng" }); // Tránh nói rõ lỗi là mật khẩu sai

            const userPayload = { id: user._id };
            const token = jwt.sign(userPayload, secret, { expiresIn });

            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                token: token,
                user: userResponse // Có thể trả về thông tin user (trừ mật khẩu)
            });
        } catch (err) {
            next(err); // Chuyển lỗi đến middleware xử lý lỗi
        }
    }

    async savePushToken(req, res) {
        try {
            const userId = req.userId; // ID người dùng từ JWT
            const { pushToken } = req.body;

            await User.findByIdAndUpdate(userId, { expoPushToken: pushToken });

            res.status(200).json({ success: true, message: "Push token saved." });
        } catch (error) {
            console.error("Lỗi lưu Push Token:", error);
            res.status(500).json({ success: false, message: "Server error." });
        }
    }

    async me(req, res, next) {
        try {
            const userId = req.userId || req.user; // middleware có thể đặt req.user hoặc req.userId
            if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

            const user = await User.findById(userId).select('-password');
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            res.status(200).json({ success: true, user });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AuthController();