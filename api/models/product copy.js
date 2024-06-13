const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema for size and stock including price
const sizeStockSchema = new Schema({
    size: { type: Number, required: true },
    stock: { type: Number, required: true },
    price: { type: Number, required: true } // Adding price for each size
});

// Schema for product variants
const variantSchema = new Schema({
    color: { type: String, required: true },
    texture: { type: String, required: true },
    sizeStock: [sizeStockSchema], // Array of objects that contain size, stock, and price
    images: { type: [String] } // URLs to images
});

// Main product schema
const productSchema = new Schema({
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true }, // e.g., "sneakers", "boots", "sandals"
    material: { type: String, required: true },
    description: { type: String },
    dateAdded: { type: Date, default: Date.now },
    isFeatured: { type: Boolean, default: false },
    ratings: {
        average: { type: Number, default: 0 },
        reviews: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'User' },
                rating: { type: Number, required: true },
                comment: { type: String }
            }
        ]
    },
    variants: [variantSchema] // Embeds the variants schema
});

// Create and export the Product model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
