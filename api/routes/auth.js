// // auth.js

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth');


router.post("/sign-in", AuthController.signIn);

router.post("/sign-up-and-verify-email", AuthController.signUpAndVerifyEmail);

module.exports = router;