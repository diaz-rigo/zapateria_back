const mongoose = require('mongoose');

const promotionSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type: String, required: true }, // Nombre de la promoción
    description: { type: String, required: true }, // Descripción de la promoción
    discountPercentage: { type: Number, required: true }, // Porcentaje de descuento de la promoción
    startDate: { type: Date, required: true }, // Fecha de inicio de la promoción
    endDate: { type: Date, required: true }, // Fecha de finalización de la promoción
    isActive: { type: Boolean, default: true }, // Indica si la promoción está activa o no
    // Otros campos relacionados con la promoción
}, { versionKey: false });

module.exports = mongoose.model('Promotion', promotionSchema);
