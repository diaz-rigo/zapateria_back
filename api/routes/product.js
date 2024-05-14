const express = require("express");
const router = express.Router();
const upload = require('../middlewares/upload');
const ProductController = require('../controllers/product');

// Ruta para subir imágenes a Cloudinary
router.post("/upload-images", upload.array('images'), ProductController.uploadImagesToCloudinary);
// Ruta para actualizar las imágenes de un producto por su ID
router.get("/", ProductController.getAll);
router.put("/:productId/images", ProductController.updateProductImagesById);
router.post("/", ProductController.create);

router.delete("/:id", ProductController.delete);

module.exports = router;
