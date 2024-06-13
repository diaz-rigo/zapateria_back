const express = require("express");
const router = express.Router();

const multer = require('multer');

// const upload = require('../middlewares/upload');
const ProductController = require('../controllers/product');
// Configuración de Multer para almacenamiento temporal

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  const upload = multer({ storage });
  
// Rutas para subir imágenes y texturas
router.post("/upload-images", upload.array('images', 10), ProductController.uploadImagesToCloudinary);
router.post("/upload-textures", upload.array('textures', 10), ProductController.uploadTexturecloudinary);

//   router.post("/upload-images", upload.array('images', 10), (req, res) => {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No se recibieron archivos.' });
//     }
  
//     const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
//     res.status(200).json(imageUrls);
//   });
  
//   router.post("/upload-textures", upload.array('textures', 10), (req, res) => {
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No se recibieron archivos.' });
//     }
  
//     const textureUrls = req.files.map(file => `/uploads/${file.filename}`);
//     res.status(200).json(textureUrls);
//   });
  
  // Ruta para subir texturas
//   router.post("/upload-textures", upload.array('textures', 10), (req, res) => {
//     console.log('Archivos recibidos:', req.files);
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: 'No se recibieron archivos.' });
//     }
//     // Aquí, manejar la subida de archivos
//     res.send('Archivos recibidos correctamente');
//   });







// Ruta para subir imágenes a Cloudinary
// router.post("/upload-images", upload.array('images'), ProductController.uploadImagesToCloudinary);

// Ruta para subir texturas a Cloudinary
router.post("/upload-textures", upload.fields([{ name: 'textures'}]), ProductController.uploadTexturecloudinary);

// Ruta para actualizar las imágenes de un producto por su ID
router.get("/search", ProductController.getSearch);
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.get);
router.put("/:productId/images", ProductController.updateProductImagesById);
router.post("/", ProductController.create);

router.delete("/:id", ProductController.delete);

module.exports = router;
