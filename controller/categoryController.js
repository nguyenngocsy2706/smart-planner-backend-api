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

    const insertedCategories = await Category.insertMany(categoriesToInsert);

    console.log(`[Database] Đã tạo ${insertedCategories.length} danh mục mặc định cho User: ${userId}`);

    return insertedCategories;
}

class CategoryController {
    async addCategory(req, res, next) {
        try {
            const userId = req.userId; // Giả định req.userId đã được gắn trong middleware

            const { name, color } = req.body;

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

    async getCategories(req, res, next) {
        try {
            const userId = req.userId;

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

    async getCategory(req, res, next) {
        try {
            const userId = req.userId;

            let category = await Category.findOne({ _id: req.params.id, user: userId });

            if (!category) {
                return res.status(404).json({ message: "Không tìm thấy danh mục này." });
            }

            return res.status(200).json({
                success: true,
                data: category
            });
        } catch (err) {
            next(err);
        }
    }

    async updateCategory(req, res, next) {
        try {
            const categoryId = req.params.id;
            const userId = req.userId;

            const category = await Category.findOneAndUpdate(
                { _id: categoryId, user: userId },
                req.body,
                { new: true, runValidators: true }
            );

            if (!category) {
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

    async deleteCategory(req, res, next) {
        try {
            const categoryId = req.params.id;
            const userId = req.userId;

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