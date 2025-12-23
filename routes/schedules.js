const express = require("express");
const scheduleController = require('../controller/scheduleController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.post("/", verifyToken, scheduleController.addSchedule);

router.get("/", verifyToken, scheduleController.getAllSchedules);

router.get("/:id", verifyToken, scheduleController.getSchedule);

router.put("/:id", verifyToken, scheduleController.updateSchedule);

router.delete("/:id", verifyToken, scheduleController.deleteSchedule);

module.exports = router;
