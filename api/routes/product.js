const express = require("express");
const router = express.Router();

const multer = require('multer');
const upload = require('../middlewares/upload');
// const upload = require('../middlewares/upload');
const ProductController = require('../controllers/product');

router.post("/upload-images", upload.array('images', 10), ProductController.uploadImagesToCloudinary);
router.post("/upload-textures", upload.array('textures', 10), ProductController.uploadTexturecloudinary);

router.post("/upload-textures", upload.fields([{ name: 'textures'}]), ProductController.uploadTexturecloudinary);

// Ruta para actualizar las imágenes de un producto por su ID
router.get("/search", ProductController.getSearch);
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.get);
router.put("/:productId/images", ProductController.updateProductImagesById);
router.post("/", ProductController.create);

router.delete("/:id", ProductController.delete);
router.put("/:id", ProductController.update);

module.exports = router;
