const mongoose = require("mongoose");
const Product = require("../models/product");
const path = require('path');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary'); // Importa la configuración de Cloudinary
// Función para subir imágenes a Cloudinary
exports.uploadImagesToCloudinary = async (req, res, next) => {
  try {
      if (!req.files || req.files.length === 0) {
          return res.status(400).json({ message: 'No se han enviado imágenes.' });
      }
      console.log(req.body)
      const uploadedImages = [];

      // Recorre todas las imágenes recibidas
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });

          // const result = await cloudinary.uploader.upload(file.path); // Sube la imagen a Cloudinary
          uploadedImages.push(result.secure_url); // Agrega la URL de la imagen subida al array
          fs.unlinkSync(file.path); // Elimina el archivo local después de subirlo a Cloudinary
      }

      res.status(201).json({ images: uploadedImages });
  } catch (error) {
      console.error("Error al subir imágenes a Cloudinary:", error);
      res.status(500).json({ message: 'Ocurrió un error al subir las imágenes.' });
  }
}
exports.create = async (req, res, next) => {
  const { sku, name, description, brand, color, size, material, gender, ageGroup, quantity, price, category, status, weight, tags, images } = req.body;

  try {
    // Validar datos de entrada
    const requiredFields = ['sku', 'name', 'description', 'brand', 'color', 'size', 'material', 'gender', 'ageGroup', 'quantity', 'price', 'category', 'status', 'weight', 'tags', 'images'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Iniciar una transacción de base de datos si es compatible
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Crear el producto
      const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        sku,
        name,
        description,
        brand,
        color,
        size,
        material,
        gender,
        ageGroup,
        quantity,
        price,
        category,
        status,
        weight,
        tags,
        images // Asigna las URLs de las imágenes al campo images
      });

      // Guardar el producto en la base de datos
      await product.save({ session });

      // Confirmar la transacción
      await session.commitTransaction();
      session.endSession();

      // Responder con el ID del producto creado
      res.status(201).json({ productId: product._id, message: 'Producto creado exitosamente.' });
    } catch (error) {
      // Abortar la transacción si ocurre un error
      await session.abortTransaction();
      session.endSession();
      console.log(error.message)
      throw error; // Relanzar el error para que sea manejado por el middleware de error
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error.message)
  }
};

exports.updateProductImagesById = async (req, res, next) => {
  const productId = req.params.productId;
  const images = req.body.images;

  try {
      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).json({ message: 'Producto no encontrado.' });
      }

      // Actualiza las imágenes del producto
      product.images = images;
      await product.save();

      res.status(200).json({ message: 'Imágenes del producto actualizadas correctamente.' });
  } catch (error) {
      console.error("Error al actualizar las imágenes del producto:", error);
      res.status(500).json({ message: 'Ocurrió un error al actualizar las imágenes del producto.' });
  }
}

exports.delete = (req, res, next) => {
  const _id = req.params.id;
  Product.deleteOne({ _id: _id })
    .exec()
    .then(result => {
      res.status(200).json({
        _id: _id,
      });
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};

exports.getAll = async (req, res, next) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
   
    res.status(500).json({ error: error.message });
  }
};
exports.get = (req, res, next) => {
  Product.findById(req.params.id)
    .exec()
    .then(doc => {
      if (!doc) {
        return res.status(404).json({ message: "Not found" });
      }
      res.status(200).json(doc);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};