const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categori');

// Ruta para obtener todas las categorías
router.get('/', categoryController.getAllCategories);
// Ruta para obtener todas las categorías
router.post('/', categoryController.createCategory);

module.exports = router;
