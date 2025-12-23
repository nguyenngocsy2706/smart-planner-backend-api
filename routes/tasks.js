const express = require("express");
const taskController = require('../controller/taskController');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.post("/", verifyToken, taskController.addTask);

router.get("/", verifyToken, taskController.getTask);

router.get("/:id", verifyToken, taskController.getTaskDetail);

router.put("/:id", verifyToken, taskController.updateTask);

router.delete("/:id", verifyToken, taskController.deleteTask);

module.exports = router;
