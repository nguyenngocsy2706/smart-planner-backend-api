const Category = require("../models/Category");

const DEFAULT_CATEGORIES_DATA = [
    { name: 'Công việc', color: '#3b82f6' },
    { name: 'Cá nhân', color: '#f59e0b' },
    { name: 'Mua sắm', color: '#10b981' },
];

async function createDefaultCategories(userId) {
    const categoriesToInsert = DEFAULT_CATEGORIES_DATA.map(cat => ({
        ...cat,
        user: userId, // Dùng 'user' thay vì 'userId' cho nhất quán
    }));

    // BƯỚC QUAN TRỌNG: Gọi Mongoose để lưu vào DB
    const insertedCategories = await Category.insertMany(categoriesToInsert);

    console.log(`[Database] Đã tạo ${insertedCategories.length} danh mục mặc định cho User: ${userId}`);

    return insertedCategories;
}

class CategoryController {
    // 1. POST /categories - Tạo Category cho người dùng hiện tại
    async addCategory(req, res, next) {
        try {
            // Lấy userId từ JWT đã xác thực
            const userId = req.userId; // Giả định req.userId đã được gắn trong middleware

            // Chỉ lấy các trường được phép từ body
            const { name, color } = req.body;

            // Gán cứng người sở hữu
            const category = await Category.create({
                name,
                color,
                user: userId
            });

            return res.status(201).json({
                success: true,
                data: category
            });
        } catch (err) {
            next(err);
        }
    }

    // 2. GET /categories - Lấy Category CỦA NGƯỜI DÙNG HIỆN TẠI
    async getCategories(req, res, next) {
        try {
            // ✅ LẤY userId TỪ AUTHENTICATION (req.userId)
            const userId = req.userId;

            // Truy vấn Categories chỉ thuộc về người dùng này
            let categories = await Category.find({ user: userId });

            if (categories.length === 0) {
                console.log(`User ${userId} chưa có danh mục. Bắt đầu tạo mặc định...`);
                // Tạo và gán lại biến categories
                categories = await createDefaultCategories(userId);
            }

            return res.status(200).json({
                success: true,
                data: categories
            });
        } catch (err) {
            next(err);
        }
    }

    // 2. GET /categories - Lấy Category CỦA NGƯỜI DÙNG HIỆN TẠI
    async getCategory(req, res, next) {
        try {
            // ✅ LẤY userId TỪ AUTHENTICATION (req.userId)
            const userId = req.userId;

            // Truy vấn Categories chỉ thuộc về người dùng này
            let category = await Category.findOne({ _id: req.params.id, user: userId });

            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục này." });
            }

            return res.status(200).json({
                success: true,
                data: { category }
            });
        } catch (err) {
            next(err);
        }
    }

    // 3. PUT /categories/:id - Cập nhật Category (Yêu cầu kiểm tra sở hữu)
    async updateCategory(req, res, next) {
        try {
            const categoryId = req.params.id;
            const userId = req.userId;

            // ✅ AUTHORIZATION: Tìm theo Category ID VÀ User ID
            const category = await Category.findOneAndUpdate(
                { _id: categoryId, user: userId },
                req.body,
                { new: true, runValidators: true }
            );

            if (!category) {
                // Nếu Category không tồn tại HOẶC không thuộc về người dùng
                return res.status(404).json({
                    success: false,
                    message: "Danh mục không tồn tại hoặc bạn không có quyền truy cập"
                });
            }

            return res.status(200).json({
                success: true,
                data: category
            });

        } catch (error) {
            next(error);
        }
    }

    // 4. DELETE /categories/:id - Xóa Category (Yêu cầu kiểm tra sở hữu)
    async deleteCategory(req, res, next) {
        try {
            const categoryId = req.params.id;
            const userId = req.userId;

            // ✅ AUTHORIZATION: Tìm và xóa theo Category ID VÀ User ID
            const deleted = await Category.findOneAndDelete({
                _id: categoryId,
                user: userId
            });

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Danh mục không tồn tại hoặc bạn không có quyền xóa"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Deleted successfully"
            });

        } catch (err) {
            next(err);
        }
    }

}

module.exports = new CategoryController();