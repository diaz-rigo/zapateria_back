const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchase');

// Actualizar el estado del envío
router.put('/actualizar-estado-envio', purchaseController.updateShipmentStatus);

// Obtener el historial del envío
router.get('/historial-envio/:codigoPedido', purchaseController.getShipmentHistory);

// Obtener la última actualización
router.get('/ultima-actualizacion/:codigoPedido', purchaseController.getLastUpdate);





// ? --------------------   RUTAS ADMIN---------------------------
// Obtener todas las compras
router.get('/', purchaseController.getAllPurchases);

// Actualizar el estado del envío de una compra
router.put('/actualizar-estado', purchaseController.adminUpdateShipmentStatus);

// Obtener los detalles de una compra específica
router.get('/:codigoPedido', purchaseController.getPurchaseDetails);

// Eliminar una compra
router.delete('/:codigoPedido', purchaseController.deletePurchase);
module.exports = router;
