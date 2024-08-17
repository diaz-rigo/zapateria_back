const mongoose = require("mongoose");
const Stripe = require('stripe');
const stripe = new Stripe('sk_test_51PopFl02tsjptClZ7smkQseepxegVq3YsUI5aOdEsG1JkVlSL75h3tUXe5p3DY7SmIvObK5WTwrRRtZ7caJMNud800VTMuIDtG');

const User = require("../models/user");

const isValidURL = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Helper function to calculate total from line_items
const calculateLineItemsTotal = (line_items) => {
  return line_items.reduce((acc, item) => acc + item.price_data.unit_amount * item.quantity, 0);
};

exports.createSession = async (req, res) => {
  try {
    const { totalneto, tipoEntrega, productos, datoscliente, instruction, success_url, cancel_url } = req.body;

    // Convertir totalneto a número en centavos
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

    // Verificar el total de line_items
    const line_items_total = calculateLineItemsTotal(line_items);

    // Ajustar el total si es necesario
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

    console.log('Detalles de line_items:', JSON.stringify(line_items, null, 2));
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: "payment",
      line_items,
      success_url:  "https://zapaterias-huejutla.vercel.app/payment/order-success?token={CHECKOUT_SESSION_ID}",
      cancel_url: "https://zapaterias-huejutla.vercel.app/payment/order-detail?deliveryOption=inStore",
      customer_email: datoscliente.email,
      metadata: {
        tipoEntrega,
        instruction,
        empresa: "Austins",
      },
    });

    let user = await User.findOne({ email: datoscliente.email });

    if (!user) {
      user = new User({
        _id: new mongoose.Types.ObjectId(),
        name: datoscliente.name,
        paternalLastname: datoscliente.paternalLastname,
        maternalLastname: datoscliente.maternalLastname,
        phone: datoscliente.phone,
        email: datoscliente.email,
        rol: 'GUEST',
        password: 'contraseñaPorDefecto',
      });
      await user.save();
    }

    return res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

exports.createSession2 = async (req, res) => {
  try {
    const { totalneto, tipoEntrega, productos, datoscliente, instruction, codigoDeSeguimiento, cancel_url } = req.body;

    // Convertir totalneto a número en centavos
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

    // Verificar el total de line_items
    const line_items_total = calculateLineItemsTotal(line_items);

    // Ajustar el total si es necesario
    if (line_items_total !== totalNetoAmount) {
      line_items.push({
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Total Ajustado',
          },
          unit_amount: totalNetoAmount - line_items_total,
        },
        quantity: 1,
      });
    }

    console.log('Detalles de line_items:', JSON.stringify(line_items, null, 2));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: "payment",
      line_items,
      success_url: "https://zapaterias-huejutla.vercel.app/payment/order-success?token={CHECKOUT_SESSION_ID}",
      cancel_url: cancel_url || "https://zapaterias-huejutla.vercel.app/payment/order-detail?deliveryOption=inStore",
      customer_email: datoscliente.email,
      metadata: {
        tipoEntrega,
        instruction,
        codigoDeSeguimiento,
        empresa: "Austins",
      },
    });

    // Agregar manejo de usuario como en createSession si es necesario

    return res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
