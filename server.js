require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");

const notificationScheduler = require('./services/notificationScheduler');

const app = express();

// Import routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const categoryRoutes = require("./routes/categories");
const scheduleRoutes = require("./routes/schedules");
const notificationRoutes = require("./routes/notifications");
const aiRoutes = require("./routes/ai");

const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const corsOptions = {
    origin: FRONTEND_URL === '*' ? '*' : FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: FRONTEND_URL === '*' ? false : true,
};

app.use(cors(corsOptions));


async function startServer() {
    try {
        await connectDB();
        console.log('Đã kết nối Database.');

        app.use("/auth", authRoutes);
        app.use("/tasks", taskRoutes);
        app.use("/categories", categoryRoutes);
        app.use("/schedules", scheduleRoutes);
        app.use("/notifications", notificationRoutes);
        app.use("/ai", aiRoutes);

        app.use((req, res, next) => {
            const error = new Error(`Không tìm thấy endpoint: ${req.originalUrl}`);
            error.status = 404;
            next(error);
        });

        app.use((err, req, res, next) => {
            console.error("Lỗi Server:", err);

            const statusCode = err.status || 500;

            res.status(statusCode).json({
                success: false,
                message: err.message || "Lỗi server nội bộ!",
                error: process.env.NODE_ENV === 'production' ? {} : err.message
            });
        });

        app.listen(PORT, () => {
            console.log(`Server đang chạy trên cổng ${PORT}`);

            notificationScheduler.startScheduler();
        });

    } catch (error) {
        console.error("Lỗi Server không thể khởi động:", error);
        process.exit(1);
    }
}

startServer();