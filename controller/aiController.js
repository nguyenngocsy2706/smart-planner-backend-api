const {
    generateStructuredContent,
    chatWithAI,
} = require("../config/ai");

const logger = require("../utils/logger");
const Category = require("../models/Category");

class AIController {
    async suggestTasks(req, res, next) {
        try {
            const { input } = req.body;
            const userId = req.userId;

            const userCategories = await Category.find({ user: userId });

            if (!userCategories.length) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng tạo ít nhất một danh mục trước.",
                });
            }

            const categoryMap = {};
            userCategories.forEach((c) => {
                categoryMap[c.name.toLowerCase()] = c._id.toString();
            });

            const categoryNames = userCategories.map((c) => c.name).join(", ");

            const prompt = `
Bạn là AI quản lý công việc thông minh.

Danh mục hợp lệ:
${categoryNames}

Người dùng nhập:
"${input}"

YÊU CẦU BẮT BUỘC:
- Trả về TỐI THIỂU 3 task, TỐI ĐA 6 task
- Các task phải có trình tự hợp lý
- Mỗi task PHẢI có:
  - title: ngắn gọn, mô tả hành động
  - description: mô tả chi tiết hơn
  - category: đúng 1 trong danh mục đã cho
  - priority: low | medium | high
  - dueDate:
      - Là ngày hợp lý trong tương lai
      - Gần hạn nếu task quan trọng
      - Định dạng ISO 8601 (ví dụ: 2025-12-25T10:00:00.000Z)

- Chỉ trả về JSON hợp lệ.
- Không giải thích.
- Không markdown.
- CHỈ trả về JSON ARRAY

Ví dụ output hợp lệ:
[
  {
    "title": "...",
    "description": "...",
    "category": "Tên danh mục",
    "dueDate": "2025-12-27T09:00:00.000Z",
    "priority": "Medium"
  }
]`
                ;


            const aiTasks = await generateStructuredContent(prompt);

            const tasks = Array.isArray(aiTasks)
                ? aiTasks
                    .map((task) => {
                        // Tìm ID dựa trên tên danh mục AI trả về
                        const categoryId = categoryMap[task.category?.toLowerCase()];

                        // Nếu AI trả về tên danh mục không có trong DB, hãy gán danh mục đầu tiên của user làm mặc định
                        const finalCategory = categoryId || userCategories[0]._id.toString();

                        return {
                            title: task.title,
                            description: task.description,
                            priority: task.priority || "Medium",
                            category: finalCategory, // Trả về ID để lưu vào DB
                            categoryName: task.category, // Trả thêm tên để Frontend hiển thị đẹp
                            dueDate: task.dueDate || new Date().toISOString(), // Đảm bảo luôn có ngày
                            userId,
                            isAIGenerated: true,
                        };
                    })
                : [];

            res.json({
                success: true,
                data: tasks,
            });
        } catch (err) {
            logger.error("suggestTasks failed: %o", err);
            next(err);
        }
    }

    async chat(req, res, next) {
        try {
            const { message, history } = req.body;

            const result = await chatWithAI(message, history || []);

            res.json({
                success: true,
                message: result.reply,
                history: result.history,
            });
        } catch (err) {
            logger.error("chat failed: %o", err);
            next(err);
        }
    }
}

module.exports = new AIController();
