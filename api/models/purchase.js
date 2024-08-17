const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  totalneto: Number,
  tipoEntrega: String,
  productos: [{
    id: String,
    variantId: String,
    name: String,
    precio: Number,
    cantidad: Number,
    image: String,
    size: Number,
    color: String
  }],
  datoscliente: {
    name: String,
    maternalLastname: String,
    paternalLastname: String,
    phone: String,
    email: String
  },
  direccion: {
    municipio: String,
    localidad: String,
    especificacion: String
  },
  success_url: String,
  stripeSessionId: String,
  codigoPedido: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Purchase', purchaseSchema);
