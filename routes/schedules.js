const express = require("express");
const scheduleController = require('../controller/scheduleController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Create schedule
router.post("/", verifyToken, scheduleController.addSchedule);

// ✅ Sửa: Get schedules by the CURRENT user
router.get("/", verifyToken, scheduleController.getAllSchedules);

router.get("/:id", verifyToken, scheduleController.getSchedule);

// Update schedule (Cần kiểm tra ownership trong Controller)
router.put("/:id", verifyToken, scheduleController.updateSchedule);

// Delete schedule (Cần kiểm tra ownership trong Controller)
router.delete("/:id", verifyToken, scheduleController.deleteSchedule);

module.exports = router;
