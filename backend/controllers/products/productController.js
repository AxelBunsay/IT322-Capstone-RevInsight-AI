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

const createProduct = async (req, res) => {
  try {
    const { name, price, quantity, category } = req.body;
    const uploadResult = req.file
      ? await uploadToCloudinary(req.file)
      : null;

    if (!name || price === undefined || quantity === undefined || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, quantity, and category are required'
      });
    }

    const product = await Product.create({
      name,
      price,
      quantity,
      category,
      image: uploadResult?.secure_url || null
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

const getProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      count: total,
      products: products.map(product => ({
        ...product.toObject(),
        image: product.image || null
      })),
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

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        image: product.image || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!validateProductId(req.params.id, res)) return;

    const { name, price, quantity, category } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, quantity, category },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

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

const deleteProduct = async (req, res) => {
  try {
    if (!validateProductId(req.params.id, res)) return;

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

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