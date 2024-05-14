const mongoose = require("mongoose");

const Category = require('../models/Category');

// Controlador para manejar operaciones relacionadas con categorías

// Obtener todas las categorías
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Obtener una categoría por su ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Crear una nueva categoría
exports.createCategory = async (req, res) => {
    const category = new Category({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        description: req.body.description,
        slug: req.body.slug,
        image: req.body.image,
        status: req.body.status,
        icon: req.body.icon
    });

    try {
        const newCategory = await category.save();
        res.status(201).json(newCategory);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Actualizar una categoría existente
exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }

        // Actualizar solo los campos proporcionados en el cuerpo de la solicitud
        Object.assign(category, req.body);

        await category.save();
        res.status(200).json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Eliminar una categoría
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        await category.remove();
        res.status(200).json({ message: 'Categoría eliminada correctamente' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
