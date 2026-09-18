const Product = require('../../models/product');
const cloudinary = require('../../config/cloudinary');
const mongoose = require('mongoose');

const validateProductId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: 'Invalid product id'
    });
    return false;
  }

  return true;
};

//Create 
const createProduct = async (req, res) => {
  try {
    const { name, price, quantity, category } = req.body;
    const uploadResult = req.file
      ? await uploadToCloudinary(req.file)
      : null;

    const image = uploadResult?.secure_url || null;

    if (!name || !price || !quantity || !category) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const product = await Product.create({
      name,
      price,
      quantity,
      category,
      image
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

const uploadToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'revinsight/products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(file.buffer);
  });

//Get products
const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    const productsWithUrls = products.map(product => ({
      ...product.toObject(),
      image: product.image || null
    }));

    res.status(200).json({
      success: true,
      count: total,
      products: productsWithUrls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    if (!validateProductId(req.params.id, res)) return;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const imageUrl = product.image || null;

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        image: imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    if (!validateProductId(req.params.id, res)) return;

    const { name, price, quantity, category } = req.body;

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, quantity, category },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    if (!validateProductId(req.params.id, res)) return;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
};