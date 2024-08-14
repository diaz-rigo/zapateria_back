const mongoose = require("mongoose");
const Product = require("../models/product");
const path = require('path');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary'); // Importa la configuración de Cloudinary

// Function to update a product by ID
exports.update = async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = req.body;

        // Find the product by ID and update it with the new data
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
            new: true, // Return the updated document
            runValidators: true // Run schema validation on update
        });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.uploadImagesToCloudinary = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se han enviado imágenes.' });
    }

    const uploadedImages = [];
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'productos' });
        uploadedImages.push(result.secure_url);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error(`Error al subir ${file.originalname}:`, error);
      }
    });

    await Promise.all(uploadPromises);
    res.status(201).json({ images: uploadedImages });
  } catch (error) {
    console.error("Error al subir imágenes a Cloudinary:", error);
    res.status(500).json({ message: 'Ocurrió un error al subir las imágenes.', error });
  }
};

exports.uploadTexturecloudinary = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se han enviado texturas.' });
    }

    const uploadedTextures = [];
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, { folder: 'texturas' });
        uploadedTextures.push(result.secure_url);
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error(`Error al subir ${file.originalname}:`, error);
      }
    });

    await Promise.all(uploadPromises);
    res.status(201).json({ textures: uploadedTextures });
  } catch (error) {
    console.error("Error al subir texturas a Cloudinary:", error);
    res.status(500).json({ message: 'Ocurrió un error al subir las texturas.', error });
  }
};


exports.create = async (req, res, next) => {
  const { name, brand, category, material, description, images, variants } = req.body;

  // Imprimir los datos recibidos
  console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));

  try {
    // Validar campos obligatorios
    const requiredFields = ['name', 'brand', 'category', 'material', 'variants'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Establecer valores por defecto para variantes
    const defaultTexture = 'default texture';
    const defaultImages = ['default1.jpg', 'default2.jpg'];
    const validatedVariants = variants.map((variant, index) => {
      if (typeof variant.color !== 'string') {
        throw new Error(`Variant at index ${index} must have color as a string.`);
      }

      // Establecer valor por defecto para texture
      if (typeof variant.texture !== 'string' || variant.texture.trim().length === 0) {
        variant.texture = defaultTexture;
      }

      // Validar y establecer valor por defecto para images
      if (!Array.isArray(variant.images) || variant.images.some(image => typeof image !== 'string')) {
        variant.images = defaultImages;
      }

      // Validar sizeStock
      if (!Array.isArray(variant.sizeStock)) {
        throw new Error(`Variant at index ${index} must have an array of sizeStock.`);
      }
      variant.sizeStock.forEach((sizeStock, sizeIndex) => {
        if (typeof sizeStock.size !== 'number') {
          throw new Error(`sizeStock at index ${sizeIndex} in variant at index ${index} must have size as a number.`);
        }
        if (typeof sizeStock.stock !== 'number') {
          throw new Error(`sizeStock at index ${sizeIndex} in variant at index ${index} must have stock as a number.`);
        }
        if (typeof sizeStock.price !== 'number') {
          throw new Error(`sizeStock at index ${sizeIndex} in variant at index ${index} must have price as a number.`);
        }
      });

      return variant;
    });

    // Iniciar una transacción de base de datos
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Crear el producto
      const product = new Product({
        name,
        brand,
        category,
        material,
        description,
        images,
        variants: validatedVariants
      });

      // Guardar el producto en la base de datos
      await product.save({ session });

      // Confirmar la transacción
      await session.commitTransaction();
      session.endSession();

      // Imprimir el producto creado
      console.log('Producto creado:', product);

      // Responder con el ID del producto creado
      res.status(201).json({ productId: product._id, message: 'Product created successfully.' });
    } catch (error) {
      // Abortar la transacción si ocurre un error
      await session.abortTransaction();
      session.endSession();
      console.error('Error durante la transacción:', error.message);
      res.status(500).json({ error: 'An error occurred while creating the product.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error('Validation error:', error.message);
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
    const products = await Product.find().sort({ dateAdded: -1 }); // Ordenar por fecha de adición en orden descendente
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getSearch = async (req, res, next) => {
  const query = req.query.q; // Obtener el parámetro 'q' de la consulta GET

  try {
    // Realizar la búsqueda en MongoDB usando una expresión regular insensible a mayúsculas/minúsculas
    const resultados = await Product.find({ name: { $regex: new RegExp(query, 'i') } });

    if (resultados.length === 0) {
      return res.status(404).json({ error: 'No se encontraron productos que coincidan con la búsqueda' });
    }

    res.json(resultados); // Enviar resultados como JSON
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ error: 'Error al buscar productos' });
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