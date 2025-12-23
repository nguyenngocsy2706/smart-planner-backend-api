const express = require("express");
const router = express.Router();
const authController = require('../controller/authController')
const { verifyToken } = require("../middleware/auth");

// REGISTER
router.post("/register", authController.register);

// LOGIN
router.post("/login", authController.login);

router.post('/save-push-token', verifyToken, authController.savePushToken);
// GET CURRENT AUTHENTICATED USER
router.get('/me', verifyToken, authController.me);
module.exports = router;
