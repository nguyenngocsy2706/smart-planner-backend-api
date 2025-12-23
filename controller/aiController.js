const { startChatSession, generateStructuredContent } = require('../config/gemini');
const logger = require('../utils/logger');
const Category = require('../models/Category');

const TASK_SCHEMA = {
    type: "array",
    items: {
        type: "object",
        properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string" },
            priority: {
                type: "string",
                enum: ["High", "Medium", "Low"]
            }
        },
        required: ["title", "description", "category", "priority"]
    }
};

class AIController {

    async suggestTasks(req, res, next) {
        try {
            const { input } = req.body;
            const userId = req.userId;

            const userCategories = await Category.find({ user: userId });

            if (!userCategories.length) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng tạo ít nhất một danh mục trước."
                });
            }

            const categoryMap = {};
            userCategories.forEach(c => {
                categoryMap[c.name.toLowerCase()] = c._id.toString();
            });

            const categoryNames = userCategories.map(c => c.name).join(', ');

            const prompt = `
Bạn là AI quản lý công việc.

Danh mục hợp lệ:
${categoryNames}

Input người dùng:
"${input}"

Yêu cầu:
- Trả về danh sách Task
- category PHẢI đúng tên danh mục
- priority ∈ High | Medium | Low

ONLY return valid JSON.
Do not explain.
Do not use markdown.
`;

            const aiTasks = await generateStructuredContent(
                prompt,
                TASK_SCHEMA,
                'gemini-2.5-flash'
            );

            const tasks = Array.isArray(aiTasks)
                ? aiTasks.map(task => {
                    const categoryId = categoryMap[task.category?.toLowerCase()];
                    if (!categoryId) return null;

                    return {
                        ...task,
                        category: categoryId,
                        userId,
                        isAIGenerated: true,
                    };
                }).filter(Boolean)
                : [];

            res.status(200).json({
                success: true,
                data: tasks
            });

        } catch (err) {
            logger.error('❌ suggestTasks failed: %o', err);
            next(err);
        }
    }

    async chatWithAI(req, res, next) {
        try {
            const { message, history } = req.body;

            const chat = startChatSession(history, 'gemini-2.5-flash');
            const response = await chat.sendMessage(message);

            res.status(200).json({
                success: true,
                message: response.response.text(),
                fullHistory: await chat.getHistory(),
            });

        } catch (err) {
            logger.error('❌ chatWithAI failed: %o', err);
            next(err);
        }
    }
}

module.exports = new AIController();
