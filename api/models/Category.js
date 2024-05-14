const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true }, // Versión amigable para SEO del nombre de la categoría
    image: { type: String, required: false }, // URL de la imagen representativa de la categoría

    createdAt: { type: Date, default: Date.now }, // Fecha de creación de la categoría
    updatedAt: { type: Date, default: Date.now }, // Fecha de última actualización de la categoría
    status: { type: String, default: "Active" }, // Estado de la categoría (activo, inactivo, etc.)
    icon: { type: String, required: false } // URL del ícono representativo de la categoría
}, { versionKey: false });

module.exports = mongoose.model('Category', categorySchema);
