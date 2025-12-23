// routes/ai.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const aiController = require('../controller/aiController');

router.post('/suggestTasks', verifyToken, aiController.suggestTasks);
router.post('/chat', verifyToken, aiController.chatWithAI);

module.exports = router;