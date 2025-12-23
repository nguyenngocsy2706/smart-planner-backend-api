const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Truy cập bị từ chối. Không tìm thấy token.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);

        // ✅ QUAN TRỌNG: Gán ID người dùng (decoded.id) vào req.user (mà Mongoose cần)
        // JWT của bạn gán ID người dùng là 'id', dựa trên log: {"id":"69247346768658d6ec61da26"}
        req.user = decoded.id;
        req.userId = decoded.id; // Giữ lại req.userId cho các trường hợp khác

        next();

    } catch (err) {
        // Token không hợp lệ (sai Secret Key, hết hạn,...)
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};