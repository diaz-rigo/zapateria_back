const sendEmail = require("../middlewares/nodemailer"); // Asume que tienes una función para enviar correos

const emailController = {};

emailController.sendEmail = async (req, res) => {
    try {
        const { to, subject, text } = req.body;

        if (!to || !subject || !text) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        await sendEmail({ to, subject, text });

        res.status(200).json({ message: 'Correo enviado exitosamente' });
    } catch (error) {
        console.error('Error al enviar el correo:', error);
        res.status(500).json({ message: 'Error al enviar el correo' });
    }
};

module.exports = emailController;
