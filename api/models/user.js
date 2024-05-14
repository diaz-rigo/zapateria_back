const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: { type: String, required: true },
    rol: { type: String, required: true, default: 'CLIENT' },
    name: { type: String, required: true },
    maternalLastname: { type: String },
    paternalLastname: { type: String },
    phone: { type: String },
    status: { type: String, required: true, default: 'INACTIVE' },
    address: { type: String },
    city: { type: String },
    postalCode: { type: String },
    country: { type: String },
    securityQuestion: { type: String },
    securityAnswer: { type: String },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },  // Agrega este campo para la fecha de expiración del código de verificación
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    verificationCode: { type: String },  // Agrega este campo para el código de verificación
    verificationCodeExpires: { type: Date },  // Agrega este campo para la fecha de expiración del código de verificación
    loginAttempts: { type: Number, default: 0 },  // Contador de intentos de inicio de sesión fallidos
    lockoutUntil: { type: Date },  // Fecha hasta la cual la cuenta está bloqueada temporalmente
}, { versionKey: false });

module.exports = mongoose.model('User', userSchema);
