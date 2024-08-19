const Purchase = require("../models/purchase");
const Product = require("../models/product");
const transporter = require("../middlewares/nodemailer"); // Asegúrate de que el transporter esté correctamente configurado
// const BASE_URL = "http://localhost:4200"; // Cargar la URL base desde la variable de entorno
const BASE_URL = "https://zapaterias-huejutla.vercel.app"; // Cargar la URL base desde la variable de entorno

const enviarCorreo = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log('📧 Correo electrónico enviado con éxito a:', mailOptions.to);
  } catch (error) {
    console.error('❌ Error al enviar correo electrónico:', error);
    throw error;
  }
};

exports.update_purchase_status = async (req, res) => {
  const { token } = req.body;

  try {
    // Buscar la compra utilizando el token de la sesión de Stripe
    const purchase = await Purchase.findOne({ stripeSessionId: token });

    if (!purchase) {
      return res.status(404).json({ message: 'Compra no encontrada. 🚫' });
    }

    // Verificar si el estado de la compra ya está marcado como "Pagado"
    if (purchase.estadoEnvio === 'Pagado') {
      return res.json({ message: 'La compra ya está marcada como pagada. ✅' });
    }

    // Actualizar el estado de la compra
    purchase.estadoEnvio = 'Pagado';
    purchase.historialEnvio.push({
      estado: 'Pagado',
      fechaCambio: new Date(),
    });
    purchase.actualizacionReciente = new Date();

    // Decrementar el stock de cada producto en la compra
    for (const item of purchase.productos) {
      // Buscar el producto por ID y variante
      const product = await Product.findOne({ 'variants._id': item.variantId });
      if (product) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          // Decrementar el stock de la variante
          const sizeStock = variant.sizeStock.find(stock => stock.size === item.size);
          if (sizeStock) {
            sizeStock.stock -= item.cantidad;
            await product.save();
          } else {
            console.error('❗ Tamaño no encontrado en stock:', item.size);
          }
        } else {
          console.error('❗ Variante no encontrada:', item.variantId);
        }
      } else {
        console.error('❗ Producto no encontrado:', item.id);
      }
    }

    await purchase.save();

    // Enviar correo electrónico
    const mailOptions = {
      from: '"Zapatería Huejutla" <noreply@zapateriahuejutla.com>',
      to: purchase.datoscliente.email,
      subject: '🎉 ¡Tu pedido ha sido pagado! - Zapatería Huejutla',
      html: `
        <div style="background-color: #f5f7f9; padding: 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; padding: 20px;">
              <img src="https://res.cloudinary.com/dkfaglomz/image/upload/v1712038934/public/snucbs5916vwdiksyfwx.png" alt="Logo de Zapatería Huejutla" style="max-width: 120px; border-radius: 8px;">
            </div>
            <div style="text-align: center; padding: 20px;">
              <p style="color: #0033cc; font-size: 18px; font-weight: bold;">¡Gracias por elegir Zapatería Huejutla! 🛍️</p>
              <p style="color: #0033cc; font-size: 20px; font-weight: bold;">Hola ${purchase.datoscliente.name}, tu pedido ha sido pagado exitosamente. 🎊</p>
              <p style="color: #0092DF; font-size: 24px; font-weight: bold;">Código de Pedido: ${purchase.codigoPedido} 🎁</p>
              <p style="color: #0033cc; font-size: 16px;">Detalles de tu compra:</p>
              <ul style="color: #0033cc; font-size: 16px; padding-left: 20px; text-align: left; list-style-type: none; margin: 0;">
                ${purchase.productos.map(producto => `
                  <li style="margin-bottom: 15px; display: flex; align-items: center;">
                    <img src="${producto.image}" alt="${producto.name}" style="max-width: 60px; height: auto; margin-right: 15px; vertical-align: middle;">
                    <span>${producto.name} - ${producto.cantidad} x ${producto.precio.toFixed(2)} MXN</span>
                  </li>
                `).join('')}
                <li style="margin-top: 15px;"><strong>Total Neto: ${purchase.totalneto} MXN</strong></li>
              </ul>
              <p style="color: #0033cc; font-size: 16px; margin-top: 20px;">Para consultar el estado de tu pedido, sigue estos pasos:</p>
              <ol style="color: #0033cc; font-size: 16px; padding-left: 20px;">
                <li>Visita nuestro <a href="${BASE_URL}" style="color: #0092DF; text-decoration: none;">sitio web 🌐</a>.</li>
                <li>Dirígete a la sección de "Seguimiento de Pedidos" o "Mis Pedidos".</li>
                <li>Introduce el número de pedido proporcionado arriba.</li>
                <li>Consulta el estado actualizado de tu pedido.</li>
              </ol>
            </div>
            <p style="text-align: center; color: #777; font-size: 14px; padding: 20px 0;">¡Esperamos que disfrutes de tu compra! Si necesitas asistencia, no dudes en contactarnos. 👠👞</p>
            <div style="text-align: center; padding: 20px; background-color: #00923F; border-radius: 0 0 10px 10px; color: #ffffff;">
              <p style="font-size: 16px; margin: 0;">¡Gracias por comprar en Zapatería Huejutla!</p>
            </div>
          </div>
        </div>
      `,
    };

    await enviarCorreo(mailOptions);

    res.json({ message: '✅ Estado de compra actualizado exitosamente, stock decrementado y correo enviado.' });
  } catch (error) {
    console.error('❌ Error al actualizar el estado de compra:', error);
    res.status(500).json({ message: 'Error interno del servidor. 🚨' });
  }
};


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
  