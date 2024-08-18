const Purchase = require("../models/purchase");

// Actualizar el estado del envío y el historial
// const updateShipmentStatus = async (req, res) => {
exports.updateShipmentStatus = async (req, res) => {

    const { codigoPedido, nuevoEstado, trackingNumber, courier } = req.body;

    try {
        // Buscar la compra por codigoPedido
        const purchase = await Purchase.findOne({ codigoPedido });

        if (!purchase) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        // Actualizar el estado del envío
        purchase.estadoEnvio = nuevoEstado;
        purchase.trackingNumber = trackingNumber || purchase.trackingNumber; // Actualiza el número de seguimiento si se proporciona
        purchase.courier = courier || purchase.courier; // Actualiza el proveedor de envío si se proporciona

        // Agregar el cambio de estado al historial
        purchase.historialEnvio.push({
            estado: nuevoEstado,
            fechaCambio: new Date()
        });

        // Actualizar la fecha de la última modificación
        purchase.actualizacionReciente = new Date();

        // Guardar los cambios
        await purchase.save();

        res.status(200).json({ message: 'Estado del envío actualizado', purchase });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado del envío', error });
    }
};



// Obtener el historial del envío
// const getShipmentHistory = async (req, res) => {
exports.getShipmentHistory = async (req, res) => {

    const { codigoPedido } = req.params;

    try {
        // Buscar la compra por codigoPedido
        const purchase = await Purchase.findOne({ codigoPedido });

        if (!purchase) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        res.status(200).json({ historialEnvio: purchase.historialEnvio });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el historial de envío', error });
    }
};
// Obtener la última actualización del pedido
// const getLastUpdate = async (req, res) => {
exports.getLastUpdate = async (req, res) => {

    const { codigoPedido } = req.params;

    try {
        // Buscar la compra por codigoPedido
        const purchase = await Purchase.findOne({ codigoPedido });

        if (!purchase) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        res.status(200).json({ actualizacionReciente: purchase.actualizacionReciente });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la última actualización', error });
    }
};


// const getAllPurchases = async (req, res) => {
exports.getAllPurchases = async (req, res) => {

    try {
        const purchases = await Purchase.find(); // Puedes agregar filtros según sea necesario
        res.status(200).json(purchases);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las compras', error });
    }
};
exports.adminUpdateShipmentStatus = async (req, res) => {

    // const adminUpdateShipmentStatus = async (req, res) => {
    const { codigoPedido, nuevoEstado, trackingNumber, courier } = req.body;

    try {
        const purchase = await Purchase.findOne({ codigoPedido });

        if (!purchase) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        purchase.estadoEnvio = nuevoEstado;
        purchase.trackingNumber = trackingNumber || purchase.trackingNumber;
        purchase.courier = courier || purchase.courier;

        purchase.historialEnvio.push({
            estado: nuevoEstado,
            fechaCambio: new Date()
        });

        purchase.actualizacionReciente = new Date();

        await purchase.save();

        res.status(200).json({ message: 'Estado del envío actualizado', purchase });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado del envío', error });
    }
};

exports.getPurchaseDetails = async (req, res) => {

    //   const getPurchaseDetails = async (req, res) => {
    const { codigoPedido } = req.params;

    try {
        const purchase = await Purchase.findOne({ codigoPedido });

        if (!purchase) {
            return res.status(404).json({ message: 'Compra no encontrada' });
        }

        res.status(200).json(purchase);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los detalles de la compra', error });
    }
};
exports.deletePurchase = async (req, res) => {

// const deletePurchase = async (req, res) => {
    const { codigoPedido } = req.params;
  
    try {
      const purchase = await Purchase.findOneAndDelete({ codigoPedido });
  
      if (!purchase) {
        return res.status(404).json({ message: 'Compra no encontrada' });
      }
  
      res.status(200).json({ message: 'Compra eliminada exitosamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al eliminar la compra', error });
    }
  };
  