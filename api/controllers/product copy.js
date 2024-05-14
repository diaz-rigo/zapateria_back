const mongoose = require("mongoose");
const Product = require("../models/product");
const path = require('path');
const fs = require('fs');
const cloudinary = require('../utils/cloudinary'); // Importa la configuración de Cloudinary

exports.deleteImage = async (req, res, next) => {
  const productId = req.params.id;
  const imageName = req.params.imageName;

  try {
    const product = await Product.findById(productId).exec();

    if (!product) {
      return res.status(404).json({ message: "Error: Product not found" });
    }

    const sanitize = str => str.replace(/~|%7E/g, '');

    const imageUrlParts = product.images.map(image => {
      const parts = image.split('/');
      return sanitize(parts[parts.length - 1]);
    });

    console.log("Image URL Parts:", imageUrlParts);

    console.log("Requested Image Name:", imageName);

    // Sanitizar imageName para comparación
    const sanitizedImageName = sanitize(imageName);

    // Buscar si sanitizedImageName está en imageUrlParts
    const foundIndex = imageUrlParts.findIndex(part => sanitize(part) === sanitizedImageName);

    // Comparar si se encontró el nombre de imagen
    if (foundIndex !== -1) {
      console.log("Las URLs de imagen coinciden.");
      console.log("Índice donde se encontró:", foundIndex);

      // Obtener el URL completo de la imagen encontrada
      const imageUrl = product.images[foundIndex];
      console.log("URL completo de la imagen:", imageUrl);
    } else {
      console.log("Las URLs de imagen NO coinciden.");
    }

    if (foundIndex === -1) {
      return res.status(404).json({ message: "Error: Image not found for this product", imageName, productImages: product.images });
    }

    // Obtener la categoría y el ID del producto
    const category = product.category;
    const productIdFromURL = req.params.id;
    const publicId = `${category}/${productIdFromURL}/${imageName.split('.')[0]}`;

    console.log("Public ID:", publicId);

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      console.log(result.result);
      return res.status(500).json({ message: "Error deleting image from Cloudinary" });
    }

    // Remover la imagen del array de imágenes del producto
    product.images.splice(foundIndex, 1);
    // Guardar los cambios en el producto
    await product.save();

    res.status(201).json({
      success: true,
      message: "Image deleted successfully from Cloudinary",
    });

  } catch (error) {
    console.log(error);
    next(error);
  }
};




exports.updateImage = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const category = req.params.category;

    // Utiliza await para esperar la resolución de la promesa
    const response = await Product.findById(_id).exec();
    console.log('product find', response);

    if (!response) {
      return res.status(404).json({ message: "Error: Product not found" });
    }

    let images = response.images;

    console.log('find', images);
    console.log(`req.position: ${req.body.position}, req.file: ${req.file.originalname}`);
    console.log('carpeta', req.file.path);

    if (req.body.position === 0 || (req.body.position && req.file)) {
      // const result = await cloudinary.uploader.upload(req.file.path, {
      //   folder: `${category}/${_id}`,
      //   public_id: req.file.originalname
      // });
      const path = require('path');

      // Dentro de tu función updateImage antes de cargar en Cloudinary
      const fileName = path.parse(req.file.originalname).name;
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `${category}/${_id}`,
        public_id: fileName // Usar el nombre de archivo sin la extensión
      });


      // Elimina la imagen temporal del servidor
      fs.unlinkSync(req.file.path);

      const cloudinaryUrl = result.secure_url;
      const body = {
        position: req.body.position,
        image: cloudinaryUrl
      };

      if (images.length > body.position) {
        console.log('if', images);
        images[body.position] = body.image;
      } else {
        console.log('else', images);
        images.push(body.image);
      }
    } else {
      return res.status(400).json({ message: "Error: Invalid request" });
    }

    console.log('set', images);

    // Utiliza await para esperar la resolución de la actualización
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: _id },
      { $set: { images: images } },
      { new: true }
    ).exec();

    console.log('update', images);

    res.status(200).json({
      image: updatedProduct
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}





exports.getAll = (req, res, next) => {
  Product.find({ status: "ACTIVE" })
    .exec()
    .then(docs => {
      res.status(200).json(docs);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
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


exports.create = (req, res, next) => {
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    sku: req.body.sku,
    name: req.body.name,
    description: req.body.description,
    unit: req.body.unit,
    expiration: req.body.expiration,
    model: req.body.model,
    quantity: req.body.quantity,
    price: req.body.price,
    category: req.body.category,
    maker: req.body.maker,
    images: req.body.images || [],
    status: 'ACTIVE',
    weight: req.body.weight || null,
    ingredients: req.body.ingredients || [],
    allergens: req.body.allergens || [],
    nutritionalInformation: req.body.nutritionalInformation || null,
    isFeatured: req.body.isFeatured || false,
    isVegetarian: req.body.isVegetarian || false,
    isGlutenFree: req.body.isGlutenFree || false,
    createdAt: new Date() // La fecha y hora de creación se asigna automáticamente al momento de crear el producto
  });

  product.save()
    .then(result => {
      res.status(201).json(result);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};





exports.updateProductStatus = (req, res, next) => {
  const productId = req.params.productId;
  const newStatus = req.body.status; // Se espera que el nuevo estado esté en el cuerpo de la solicitud

  Product.findByIdAndUpdate(productId, { status: newStatus })
    .then(updatedProduct => {
      res.status(200).json(updatedProduct); // Devuelve el producto actualizado
    })
    .catch(error => {
      res.status(500).json({ error: "Error al actualizar el estado del producto" });
    });
  // En caso de éxito, enviar una respuesta 200 OK
  res.status(200).json({ message: "Estado del producto actualizado exitosamente" });
  // En caso de error, enviar una respuesta de error, por ejemplo:
  res.status(500).json({ error: "Error al actualizar el estado del producto" });
};



exports.update = (req, res, next) => {
  const _id = req.params.id;
  const body = {
    sku: req.body.sku,
    name: req.body.name,
    description: req.body.description,
    unit: req.body.unit,
    expiration: req.body.expiration,
    model: req.body.model,
    quantity: req.body.quantity,
    price: req.body.price,
    category: req.body.category,
    maker: req.body.maker,
    images: req.body.images, // Puedes añadir esta línea si también permites editar imágenes
    status: req.body.status, // Asumiendo que hay un campo para el estado del producto (ACTIVE o INACTIVE)
    weight: req.body.weight,
    ingredients: req.body.ingredients,
    allergens: req.body.allergens,
    nutritionalInformation: req.body.nutritionalInformation,
    isFeatured: req.body.isFeatured,
    isVegetarian: req.body.isVegetarian,
    isGlutenFree: req.body.isGlutenFree,
    // Agrega otros campos del formulario según sea necesario
  };

  Product.findOneAndUpdate({ _id: _id }, { $set: body }, { new: true })
    .exec()
    .then(doc => {
      if (!doc) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.status(200).json(doc);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};

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


exports.getByCategory = (req, res, next) => {
  Product.find({ category: req.params.id })
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

exports.getAllPaginate = (req, res, next) => {
  const skip = parseInt(req.body.skip) || 0;
  const limit = parseInt(req.body.limit) || 10;
  const query = {};

  const filters = req.body.filters;
  if (filters) {
    if (filters.name) {
      query.name = new RegExp(filters.name, 'i');
    }
    if (filters.sku) {
      query.sku = new RegExp(filters.sku, 'i');
    }
    if (filters.category) {
      query.category = filters.category;
    }
    if (filters.priceMin && filters.priceMax) {
      query.price = { $gte: parseFloat(filters.priceMin), $lte: parseFloat(filters.priceMax) };
    }
    if (filters.maker) {
      query.maker = filters.maker;
    }
  }
  // Ordenar por fecha de creación en orden descendente (DESC)
  const sort = { createdAt: -1 };

  Product.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort)
    .exec()
    .then(docs => {
      // Mapear los documentos para incluir el campo createdAt en la respuesta
      const response = docs.map(doc => {
        return {
          ...doc._doc,
          createdAt: doc.createdAt // Agregar el campo createdAt a cada documento
        };
      });
      res.status(200).json(response);
    })
    .catch(err => {
      res.status(500).json({ error: err });
    });
};
