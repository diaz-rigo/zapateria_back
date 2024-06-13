const validateProductInput = (req, res, next) => {
    const { name, brand, category, material, variants } = req.body;

    const requiredFields = ['name', 'brand', 'category', 'material', 'variants'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    try {
        variants.forEach(variant => {
            if (typeof variant.color !== 'string' || typeof variant.texture !== 'string' || !Array.isArray(variant.sizeStock)) {
                throw new Error('Each variant must have color (string), texture (string), and an array of sizeStock.');
            }
            if (!Array.isArray(variant.images) || !variant.images.every(image => typeof image === 'string')) {
                throw new Error('Images must be an array of strings.');
            }
            variant.sizeStock.forEach(sizeStock => {
                if (typeof sizeStock.size !== 'number' || typeof sizeStock.stock !== 'number' || typeof sizeStock.price !== 'number') {
                    throw new Error('Each sizeStock must have size, stock, and price as numbers.');
                }
            });
        });
        next();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = validateProductInput;
