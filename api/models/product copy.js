// const mongoose = require('mongoose');

// const productSchema = mongoose.Schema({
//     _id: mongoose.Schema.Types.ObjectId,
//     sku: { type: String, required: true }, // Código SKU del producto
//     name: { type: String, required: true }, // Nombre del producto
//     description: { type: String, required: true }, // Descripción del producto
//     brand: { type: String, required: true }, // Marca del producto
//     color: { type: String, required: false }, // Color del producto
//     size: { type: String, required: false }, // Tamaño del producto
//     material: { type: String, required: false }, // Material del producto
//     gender: { type: String, required: true }, // Género al que se dirige el producto (hombre, mujer, unisex, etc.)
//     ageGroup: { type: String, required: false }, // Grupo de edad al que se dirige el producto (niños, adultos, etc.)
//     quantity: { type: Number, required: true }, // Cantidad disponible en inventario
//     price: { type: Number, required: true }, // Precio del producto
//     category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Referencia a la categoría del producto
//     images: [String], // Lista de URLs de imágenes del producto
//     status: { type: String, required: true }, // Estado del producto (disponible, agotado, en oferta, etc.)
//     weight: { type: Number, required: false }, // Peso del producto
//     createdAt: { type: Date, default: Date.now }, // Fecha de creación del producto
//     updatedAt: { type: Date, default: Date.now }, // Fecha de última actualización del producto
//     promotions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' }], // Promociones aplicables al producto
//     discounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Discount' }], // Descuentos aplicables al producto
//     specialOffers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SpecialOffer' }], // Ofertas especiales para el producto
//     sales: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sale' }], // Historial de ventas del producto
//     paymentMethods: [{ type: String }], // Métodos de pago aceptados para el producto
//     shippingMethods: [{ type: String }], // Métodos de envío disponibles para el producto
//     shoeAttributes: { // Atributos específicos para zapatos
//         soleType: { type: String, required: false }, // Tipo de suela
//         heelHeight: { type: Number, required: false }, // Altura del tacón
//         // Otros atributos específicos de zapatos pueden agregarse aquí
//     },
//     tags: [{ type: String }] // Etiquetas adicionales para facilitar la búsqueda y navegación
// }, { versionKey: false });

// module.exports = mongoose.model('Product', productSchema);
