require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const MAX_LOGIN_ATTEMPTS = 5;

exports.signIn = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: `El correo ${email} no está registrado` });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'La cuenta no está activa. Por favor, contacta al administrador.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (passwordMatch) {
      const token = generateAuthToken(user);
      return res.status(200).json({ token });
    } else {
      user.loginAttempts++;
      await user.save();
     
      return res.status(401).json({ message: 'Credenciales inválidas. Inténtalo de nuevo.' });
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
  const expiresIn = '5h';

  return jwt.sign(payload, secretKey, { expiresIn });
}

exports.signUpAndVerifyEmail = async (req, res, next) => {
  try {
    const { email, securityQuestion, securityAnswer, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: `El correo ${email} ya está registrado`,
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      _id: new mongoose.Types.ObjectId(),
      email,
      password: hashedPassword,
      name: req.body.name,
      maternalLastname: req.body.maternalLastname,
      paternalLastname: req.body.paternalLastname,
      document: req.body.document,
      status: 'INACTIVE',
      securityQuestion,
      securityAnswer,
      phone,
    });

    await user.save();

    res.status(201).json({ message: 'Usuario creado correctamente. Se ha enviado un correo de verificación.' });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
