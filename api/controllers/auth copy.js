require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const webpush = require('web-push');

const crypto = require('crypto');
const MAX_LOGIN_ATTEMPTS = 5; // Define el número máximo de intentos de inicio de sesión permitidos antes de bloquear la cuenta del usuario

"use strict";
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER,
    pass: process.env.PASSMAIL,
  },
});

// Configurar las claves VAPID
const vapidKeys = {
  publicKey: "BFYtOg9-LQWHmObZKXm4VIV2BImn5nBrhz4h37GQpbdj0hSBcghJG7h-wldz-fx9aTt7oaqKSS3KXhA4nXf32pY",
  privateKey: "daiRV8XPPoeSHC4nZ5Hj6yHr98saYGlysFAuEJPypa0"
};



webpush.setVapidDetails(
  'mailto:austins0271142@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function generateVerificationCode() {
  // Generar un código de verificación de 4 dígitos
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function saveVerificationCode(user, verificationCode) {
  try {
    console.log('Usuario antes de guardar:', user);
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 5 * 60 * 1000; // Válido por 5 minutos
    await user.save();
    console.log('Usuario después de guardar:', user);
  } catch (error) {
    console.error('Error al guardar el código de verificación:', error);
  }
}



async function sendRecoveryEmailWithCode(user, verificationCode) {
  const mailOptions = {
    from: '"Pastelería Austin\'s" <austins0271142@gmail.com>',
    to: user.email,
    subject: 'Recuperación de Contraseña - Pastelería Austin\'s',
    html: `
      <div style="background-color: #f5f5f5; padding: 20px; font-family: 'Arial', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; padding: 20px;">
            <img src="https://static.wixstatic.com/media/64de7c_4d76bd81efd44bb4a32757eadf78d898~mv2_d_1765_2028_s_2.png" alt="Austin's Logo" style="max-width: 100px;">
          </div>
          <div style="text-align: center; padding: 20px;">
            <h2 style="font-size: 24px; color: #333;">Recuperación de Contraseña</h2>
            <p style="color: #555; font-size: 16px;">Hemos recibido una solicitud para restablecer tu contraseña. Utiliza el siguiente código para completar el proceso:</p>
            <p style="font-size: 32px; color: #ff5733; font-weight: bold;">${verificationCode}</p>
          </div>
          <p style="text-align: center; color: #777; font-size: 14px;">Si no has solicitado este cambio, por favor ignora este correo electrónico.</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}



exports.requestPasswordRecovery = async (req, res) => {
  try {
    const { email, subscription } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const verificationCode = generateVerificationCode();

    // Guardar el código de verificación en el usuario
    await saveVerificationCode(user, verificationCode);

    // Enviar correo de recuperación de contraseña con el código de verificación
    await sendRecoveryEmailWithCode(user, verificationCode);

    // Verificar que haya una suscripción antes de enviar la notificación
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'La suscripción no es válida.' });
    }


    const payload = {
      notification: {
        title: 'Recuperación de Contraseña',
        body: `Código de verificación: ${verificationCode}`,
        icon: "https://static.wixstatic.com/media/64de7c_4d76bd81efd44bb4a32757eadf78d898~mv2_d_1765_2028_s_2.png",
        vibrate: [200, 100, 200],
        sound: 'https://res.cloudinary.com/dfd0b4jhf/video/upload/v1710830978/sound/kjiefuwbjnx72kg7ouhb.mp3',
        priority: 'high',

      }
    };

    webpush.sendNotification(subscription, JSON.stringify(payload))
      .then(() => {
        console.log('Notificación de bienvenida enviada con éxito');
      })
      .catch(err => {
        console.error('Error al enviar notificación de bienvenida:', err);
      });
    res.status(200).json({ message: 'Correo de recuperación de contraseña enviado correctamente..' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

exports.verifyCodeAndResetPassword = async (req, res) => {
  try {
    const { email, verificationCode, newPassword } = req.body;
    console.log(email, verificationCode, newPassword)
    const user = await User.findOne({ email, verificationCode });

    if (!user || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Código de verificación no válido o ha expirado.' });
    }

    // Actualizar la contraseña y limpiar el código de verificación
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.loginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    res.status(200).json({ message: 'Contraseña restablecida con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.', details: error.message || error, stack: error.stack });
  }

};



exports.verificationcode = async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Buscar al usuario por correo electrónico y código de verificación
    const user = await User.findOne({ email, verificationCode });

    if (!user || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Código de verificación no válido o ha expirado.' });
    }

    // await user.save();
    res.status(200).json({ message: 'Código de verificación verificado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};



exports.signUpAndVerifyEmail = async (req, res, next) => {
  try {

    const { email, securityQuestion, securityAnswer, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: `El correo ${email} se encuentra registrado`,
      });
    }
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // Crear nuevo usuario
    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      email: req.body.email,
      password: hashedPassword,
      name: req.body.name,
      maternalLastname: req.body.maternalLastname,
      paternalLastname: req.body.paternalLastname,
      document: req.body.document,
      status: 'INACTIVE',
      securityQuestion,
      securityAnswer,
      phone, // Agregando el campo de teléfono

    });

    // Guardar el usuario en la base de datos
    await user.save();

    // Generar token de verificación
    const verificationToken = generateVerificationToken(user);

    // Guardar el token de verificación en el usuario
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // Válido por 24 horas
    await user.save();

    console.log(process.env.USER,
      process.env.PASSMAIL,);
    const mailOptions = {
      from: '"Pastelería Austin\'s" <austins0271142@gmail.com>',
      to: user.email,
      subject: 'Verificación de Correo Electrónico - Pastelería Austin\'s',
      html: `
        <div style="background-color: #f5f5f5; padding: 20px; font-family: 'Arial', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; padding: 20px;">
              <img src="https://static.wixstatic.com/media/64de7c_4d76bd81efd44bb4a32757eadf78d898~mv2_d_1765_2028_s_2.png" alt="Austin's Logo" style="max-width: 100px;">
            </div>
            <div style="text-align: center; padding: 20px;">
              <h2 style="font-size: 24px; color: #333;">¡Gracias por registrarte en Pastelería Austin's!</h2>
              <p style="color: #555; font-size: 16px;">Haz clic en el siguiente enlace para verificar tu correo electrónico y comenzar a disfrutar de nuestros servicios:</p>
              <a href="https://austin-b.onrender.com/auth/verify/${verificationToken}" style="display: inline-block; padding: 10px 20px; background-color: #ff5733; color: #fff; text-decoration: none; border-radius: 5px;">Verificar correo electrónico</a>
            </div>
            <p style="text-align: center; color: #777; font-size: 14px;">Si no has solicitado este correo, puedes ignorarlo de manera segura.</p>
          </div>
        </div>
      `,
    };


    await transporter.sendMail(mailOptions);

    // Responder con éxito y el usuario creado
    res.status(201).json({ message: 'Usuario creado correctamente. Se ha enviado un correo de verificación.' });
  } catch (err) {
    // Manejar errores
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

function generateVerificationToken(savedUser) {
  const secretKey = process.env.JWT_KEY;
  const expiresIn = '24h';

  const payload = {
    userId: savedUser._id,
  };
  const verificationToken = jwt.sign(payload, secretKey, { expiresIn });
  return verificationToken;
}

exports.verifyEmail = async (req, res) => {
  try {
    const token = req.params.token;

    // Buscar al usuario por el token de verificación
    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      // Token no válido o usuario no encontrado
      return res.redirect('https://austins.vercel.app/auth/error-verificacion');
    }

    if (user.emailVerificationExpires < Date.now()) {
      // Token expirado
      return res.status(400).json({ message: 'El token de verificación ha expirado.' });
    }

    // Actualizar el estado del usuario a "ACTIVE" (o el estado correspondiente)
    user.status = 'ACTIVE';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();


    // Generar token de autenticación
    const payload = {
      email: user.email,
      id: user._id,
      name: user.name,
      lastname: user.lastname,
      rol: user.rol
    };
    const authToken = jwt.sign(
      payload,
      process.env.JWT_KEY,
      { expiresIn: '5h' }
    );
    // Redirigir al usuario con el token de autenticación incluido en la URL
    // return res.redirect(`http://localhost:4200/auth/success?token=${authToken}`);
    return res.redirect(`https://austins.vercel.app/auth/success?token=${authToken}`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
};


exports.signIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: `El correo ${email} no se encuentra registrado` });
    }

    // Verificar si la cuenta está activa
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'La cuenta no está activa. Por favor, contacta al administrador.' });
    }

    // Verificar si la cuenta está bloqueada temporalmente
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return res.status(403).json({ message: 'La cuenta está bloqueada temporalmente. Por favor, inténtalo de nuevo más tarde.' });
    }


    // Utilizar una promesa para bcrypt.compare
    const result = await new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    if (result) {
      // Restablecer el contador de intentos de inicio de sesión fallidos
      user.loginAttempts = 0;
      user.lockoutUntil = null; // Restablecer el bloqueo temporal
      await user.save();
      // Generar y devolver el token de autenticación
      const token = generateAuthToken(user);
      return res.status(200).json({ token });
    } else {
      // Incrementar el contador de intentos de inicio de sesión fallidos
      user.loginAttempts++;
      await user.save();
      // Verificar si se ha excedido el límite de intentos de inicio de sesión
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Bloquear temporalmente la cuenta por un periodo de tiempo (por ejemplo, 30 minutos)
        const lockoutDuration = 30 * 60 * 1000; // 30 minutos en milisegundos
        user.lockoutUntil = new Date(Date.now() + lockoutDuration);
        await user.save();

        const mailOptions = {
          from: '"Pastelería Austin\'s" <austins0271142@gmail.com>',
          to: user.email,
          subject: 'Notificación de Bloqueo Temporal de Cuenta - Pastelería Austin\'s',
          html: `
            <div style="background-color: #f5f5f5; padding: 20px; font-family: 'Arial', sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; padding: 20px;">
                  <img src="https://static.wixstatic.com/media/64de7c_4d76bd81efd44bb4a32757eadf78d898~mv2_d_1765_2028_s_2.png" alt="Austin's Logo" style="max-width: 100px;">
                </div>
                <div style="text-align: center; padding: 0 20px;">
                  <h2 style="font-size: 24px; color: #333; margin-bottom: 20px;">¡Hola ${user.name}!</h2>
                  <p style="color: #555; font-size: 16px; margin-bottom: 15px;">Hemos detectado varios intentos fallidos de inicio de sesión en tu cuenta de Pastelería Austin's.</p>
                  <p style="color: #555; font-size: 16px; margin-bottom: 15px;">Por razones de seguridad, hemos bloqueado temporalmente tu cuenta. Por favor, espera un momento y luego intenta iniciar sesión nuevamente.</p>
                  <p style="color: #555; font-size: 16px; margin-bottom: 25px;">Si has olvidado tu contraseña, puedes restablecerla haciendo clic <a href="https://austins.vercel.app/auth/Recupera" style="color: #ff5733; text-decoration: none;">aquí</a>.</p>
                </div>
                <p style="text-align: center; color: #777; font-size: 14px; margin-top: 20px; margin-bottom: 0;">Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
                <p style="text-align: center; color: #777; font-size: 14px; margin-top: 5px;">Si no has solicitado este correo, puedes ignorarlo de manera segura.</p>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);



        return res.status(403).json({ message: 'Se ha excedido el límite de intentos de inicio de sesión. La cuenta ha sido bloqueada temporalmente.' });
      } else {
        return res.status(404).json({ message: 'La contraseña ingresada es incorrecta' });
      }
    }
  } catch (error) {
    console.error('Error en la autenticación:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};



function generateAuthToken(user) {
  if (!user) {
    throw new Error('No se ha encontrado ningún usuario');
  }

  const payload = {
    email: user.email,
    id: user._id,
    name: user.name,
    lastname: user.lastname,
    rol: user.rol
    // Otros datos del usuario que desees incluir en el token
  };

  const secretKey = process.env.JWT_KEY;
  const expiresIn = '5h'; // El token expira en 5 horas, puedes ajustar esto según tus necesidades

  return jwt.sign(payload, secretKey, { expiresIn });
}



// exports.consulta_us_tel_correo = async (req, res) => {
//   let query = req.body.query;

//   // Verifica si query no es una cadena
//   if (typeof query !== 'string') {
//     // Si no es una cadena, intenta convertirlo en una cadena
//     query = query.toString();
//   }

  
//   try {
//     // Realiza la búsqueda combinada
//     const users = await User.find({
//       $or: [
//         { email: query },
//         { name: { $regex: query, $options: 'i' } }, // Búsqueda de nombre sin importar mayúsculas o minúsculas
//         { phone: query }
//       ]
//     });

//     if (users.length === 0) {
//       return res.status(404).json({ message: 'Usuarios no encontrados' });
//     }

//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.consulta_us_tel_correo = async (req, res) => {
  let query = req.body.query;

  // Verifica si query no es una cadena
  if (typeof query !== 'string') {
    // Si no es una cadena, intenta convertirlo en una cadena
    query = query.toString();
  }

  try {
    // Realiza la búsqueda combinada, incluyendo la condición de inactividad
    const users = await User.find({
      $or: [
        { email: query },
        { name: { $regex: query, $options: 'i' } }, // Búsqueda de nombre sin importar mayúsculas o minúsculas
        { phone: query }
      ],
      status: 'ACTIVE' // Agrega esta condición para filtrar usuarios inactivos
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado ' });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// exports.verfifica_respueta = async (req, res) => {
//   const { username, selectedQuestion, answer } = req.body;

//   try {
//     // Buscar al usuario por el nombre de usuario o correo electrónico
//     const user = await User.findOne({ $or: [{ email: username }, { username: username } , { phone: username }] });

//     // Verificar si se encontró el usuario y la pregunta coincide con la guardada en la base de datos
//     if (user && user.securityQuestion === selectedQuestion && user.securityAnswer === answer) {
//       // Aquí puedes generar una nueva contraseña aleatoria y guardarla en la base de datos
//       // Por simplicidad, aquí simplemente se devuelve un mensaje de éxito
//       return res.json({ success: true, message: 'Contraseña recuperada exitosamente' });
//     } else {
//       return res.status(400).json({ success: false, message: ' respuesta incorrecta' });
//     }
//   } catch (error) {
//     console.error('Error al recuperar la contraseña:', error);
//     return res.status(500).json({ success: false, message: 'Error interno del servidor' });
//   }
// };

exports.verfifica_respueta = async (req, res) => {
  const { username, selectedQuestion, answer } = req.body;

  try {
    let user;

    // Buscar al usuario por correo electrónico
    user = await User.findOne({ email: username });
    if (user) {
      return handleResponse(res, user, selectedQuestion, answer);
    }

    // Buscar al usuario por nombre de usuario
    user = await User.findOne({ name: username });
    if (user) {
      return handleResponse(res, user, selectedQuestion, answer);
    }

    // Buscar al usuario por número de teléfono
    user = await User.findOne({ phone: username });
    console.log(username);
    console.log(user);
    if (user) {
      return handleResponse(res, user, selectedQuestion, answer);
    }

    // Si no se encuentra ningún usuario con ninguno de los tipos de entrada
    return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
  } catch (error) {
    console.error('Error al recuperar la contraseña:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Función para verificar la respuesta de seguridad
async function handleResponse(res, user, selectedQuestion, answer) {
  if (user.securityQuestion === selectedQuestion && user.securityAnswer === answer) {
    return res.json({ success: true, message: 'Contraseña recuperada exitosamente' ,user});
  } else {
    return res.status(400).json({ success: false, message: 'Respuesta incorrecta' });
  }
}



exports.cambiarContrasena = async (req, res) => {
  const { userId } = req.body; // Suponiendo que estás enviando el ID del usuario desde el cliente
  const { newPassword } = req.body;

  try {
    // Buscar al usuario por ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Actualizar la contraseña del usuario
    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Contraseña cambiada exitosamente' });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
