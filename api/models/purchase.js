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
  estadoEnvio: { type: String, default: 'Pendiente' },
  historialEnvio: [{
    estado: String,
    fechaCambio: Date
  }],
  trackingNumber: String,
  courier: String,
  actualizacionReciente: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Referencia al modelo User
});

module.exports = mongoose.model('Purchase', purchaseSchema);
