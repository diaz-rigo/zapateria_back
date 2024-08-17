const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController'); // Asegúrate de que la ruta sea correcta

router.post('/send-email', emailController.sendEmail);

module.exports = router;
