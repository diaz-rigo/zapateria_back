const express = require('express');
const app = express();
require('dotenv').config()
const morgan = require('morgan');
const mongoose = require('mongoose');
function logRequest(req, res, next) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
}
const productRoutes = require('./api/routes/product');
const authRoutes = require('./api/routes/auth');
const userRoutes = require('./api/routes/user');
const categoriRoutes = require('./api/routes/categori');

// const url = 'mongodb+srv://rd209422:' +  process.env.MONGO_ATLAS_PW   + '@cluster0.reakihy.mongodb.net/huejutla'
const url =
  "mongodb+srv://rd209422:Cf3fSt1hdv9rf8Ud@cluster0.reakihy.mongodb.net/huejutla";
    mongoose.connect(url, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Conexión ak MongoDB exitosa');
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err.message);
  });
mongoose.Promise = global.Promise;

app.use(morgan('dev'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
        return res.status(200).json({})
    }
    next();
}); 

app.use('/uploads', express.static('uploads'));
app.use(express.json());
// Middleware de registro

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/product', productRoutes);
app.use('/categori', categoriRoutes);


app.use((req, res, next) => {
    const error = new Error(' error Not found 12 01 2024');
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    })
});
module.exports = app;