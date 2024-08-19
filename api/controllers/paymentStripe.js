const mongoose = require("mongoose");
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE);

const User = require("../models/user");
const Purchase = require("../models/purchase");
const transporter = require("../middlewares/nodemailer");
// const BASE_URL = "http://localhost:4200"; // Cargar la URL base desde la variable de entorno
const BASE_URL = "https://zapaterias-huejutla.vercel.app"; // Cargar la URL base desde la variable de entorno

const isValidURL = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const generarCodigoPedido = () => {
  const longitud = 6;
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let codigoPedido = '';

  for (let i = 0; i < longitud; i++) {
    const caracterAleatorio = caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    codigoPedido += caracterAleatorio;
  }

  return codigoPedido;
};

const calculateLineItemsTotal = (line_items) => {
  return line_items.reduce((acc, item) => acc + item.price_data.unit_amount * item.quantity, 0);
};

const enviarCorreo = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log('Correo electrónico enviado con éxito:', mailOptions.to);
  } catch (error) {
    console.error('Error al enviar correo electrónico:', error);
    throw error;
  }
};
exports.createSession = async (req, res) => {
  try {
    const { totalneto, tipoEntrega, productos, datoscliente, instruction, success_url, cancel_url } = req.body;

    const totalNetoAmount = Math.round(parseFloat(totalneto) * 100);

    const line_items = productos.map(producto => {
      if (!isValidURL(producto.image)) {
        throw new Error(`URL de imagen no válida: ${producto.image}`);
      }

      return {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: producto.name,
            images: [producto.image]
          },
          unit_amount: producto.precio * 100,
        },
        quantity: producto.cantidad,
      };
    });

    const line_items_total = calculateLineItemsTotal(line_items);

    if (line_items_total !== totalNetoAmount) {
      line_items.push({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Total Envio',
          },
          unit_amount: totalNetoAmount - line_items_total,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: "payment",
      line_items,
      success_url: `${BASE_URL}/payment/order-success?token={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/payment/order-detail?deliveryOption=inStore`,
      customer_email: datoscliente.email,
      metadata: {
        tipoEntrega,
        instruction,
        empresa: "Zapatería Huejutla",
      },
    });
    
    const codigoPedido = generarCodigoPedido();

    // Buscar al usuario por email o teléfono
    let user = await User.findOne({ $or: [{ email: datoscliente.email }, { phone: datoscliente.phone }] });

    if (!user) {
      // Crear un nuevo usuario si no existe
      user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: datoscliente.name,
        paternalLastname: datoscliente.paternalLastname,
        maternalLastname: datoscliente.maternalLastname,
        phone: datoscliente.phone,
        email: datoscliente.email,
        rol: 'GUEST',
        password: 'contraseñaPorDefecto', // Puedes configurar esto según tus necesidades
      });
      await user.save();

      // Enviar un correo de bienvenida
  await enviarCorreo({
    to: user.email,
    subject: '¡Bienvenido a Zapatería Huejutla! - Activa tu cuenta y completa tu perfil',
    html: `
      <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 15px; box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; padding: 20px;">
            <img src="https://res.cloudinary.com/dkfaglomz/image/upload/v1712038934/public/snucbs5916vwdiksyfwx.png" alt="Logo de Zapatería Huejutla" style="max-width: 100px; border-radius: 8px;">
          </div>
          <div style="padding: 20px; text-align: center;">
            <h2 style="color: #0092DF; font-size: 24px; margin-bottom: 20px;">¡Hola ${user.name}!</h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Te damos la bienvenida a Zapatería Huejutla. Tus datos han sido registrados exitosamente.
              Nos alegra que hayas confiado en nosotros para realizar tu compra.
            </p>
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Para activar tu cuenta y completar tu perfil, haz clic en el siguiente enlace:
            </p>
            <a href="${BASE_URL}/activate-account?user=${user._id}" style="background-color: #0092DF; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-bottom: 20px;">Activar Cuenta</a>
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Al activar tu cuenta, podrás realizar un seguimiento de tus pedidos y disfrutar de más beneficios como cliente registrado.
            </p>
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              ¡Gracias por ser parte de nuestra comunidad! Si necesitas asistencia, no dudes en contactarnos.
            </p>
          </div>
          <div style="text-align: center; padding: 20px; background-color: #00923F; border-radius: 0 0 15px 15px; color: #ffffff;">
            <p style="font-size: 16px; margin: 0;">Zapatería Huejutla - Siempre a tu servicio 👞👠</p>
          </div>
        </div>
      </div>
    `,
  });

    }

    // Crear la compra y asociarla al usuario
    const purchase = new Purchase({
      _id: new mongoose.Types.ObjectId(),
      totalneto: parseFloat(totalneto),
      tipoEntrega,
      productos,
      datoscliente,
      codigoPedido,
      user: user._id,  // Guarda el ID del usuario
      direccion: req.body.direccion,
      success_url: session.url,
      stripeSessionId: session.id,
      estadoEnvio: 'Pendiente', 
      historialEnvio: [{
        estado: 'Pendiente',
        fechaCambio: new Date()
      }],
      actualizacionReciente: new Date(),
    });
    await purchase.save();
    const mailOptionsSeguimiento = {
      from: '"Zapatería Huejutla" <noreply@zapateriahuejutla.com>',
      to: datoscliente.email,
      subject: '¡Tu pedido ha sido solicitado! - Zapatería Huejutla',
      html: `
        <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 15px; box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; padding: 20px;">
              <img src="https://res.cloudinary.com/dkfaglomz/image/upload/v1712038934/public/snucbs5916vwdiksyfwx.png" alt="Logo de Zapatería Huejutla" style="max-width: 100px; border-radius: 8px;">
            </div>
            <div style="text-align: center; padding: 20px;">
              <p style="color: #0033cc; font-size: 16px; font-weight: bold;">¡Gracias por confiar en Zapatería Huejutla!</p>
              <p style="color: #0033cc; font-size: 18px; font-weight: bold;">Hola ${datoscliente.name}, tu pedido ha sido solicitado con éxito.</p>
              <p style="color: #0092DF; font-size: 22px; font-weight: bold;">Código de Pedido: ${codigoPedido} 🎉</p>
              <p style="color: #0033cc; font-size: 16px;">Detalles de tu compra:</p>
              <span style="margin-left: auto;">Envío: ${((totalNetoAmount - line_items_total) / 100).toFixed(2)} MXN</span>
              <ul style="color: #0033cc; font-size: 16px; padding-left: 20px; text-align: left; list-style-type: none; margin: 0;">
                ${productos.map(producto => `
                  <li style="margin-bottom: 10px; display: flex; align-items: center;">
                    <img src="${producto.image}" alt="${producto.name}" style="max-width: 50px; height: auto; margin-right: 10px; vertical-align: middle;">
                    <span>${producto.name} - ${producto.cantidad} x ${producto.precio.toFixed(2)} MXN</span>
                  </li>
                `).join('')}
                <li style="margin-top: 10px;"><strong>Total Neto: ${totalneto} MXN</strong></li>
              </ul>
              <p style="color: #0033cc; font-size: 16px; margin-top: 20px;">Sigue estos pasos para consultar el estado de tu pedido:</p>
              <ol style="color: #0033cc; font-size: 16px; padding-left: 20px;">
                <li>Visita nuestro <a href="${BASE_URL}" style="color: #0092DF; text-decoration: none;">sitio web 🌐</a>.</li>
                <li>Dirígete a la sección de "Seguimiento de Pedidos" o "Mis Pedidos".</li>
                <li>Introduce el número de pedido proporcionado arriba.</li>
                <li>Consulta el estado actualizado de tu pedido.</li>
              </ol>
            </div>
            <p style="text-align: center; color: #777; font-size: 14px; padding: 20px 0;">¡Esperamos que disfrutes de tu compra! Si necesitas asistencia, contacta con nuestro equipo de soporte. 👠👞</p>
            <div style="text-align: center; padding: 20px; background-color: #00923F; border-radius: 0 0 15px 15px; color: #ffffff;">
              <p style="font-size: 16px; margin: 0;">Gracias por comprar en Zapatería Huejutla</p>
            </div>
          </div>
        </div>
      `,
    };
    
    

    await enviarCorreo(mailOptionsSeguimiento);
    return res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};



exports.createSession2 = async (req, res) => {

};
