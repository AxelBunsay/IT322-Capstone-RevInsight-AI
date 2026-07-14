const Product = require('../../models/product');

//Create 
const createProduct = async (req, res) => {
  try {
    const { name, price, quantity, category } = req.body;
    const image = req.file ? req.file.filename : null;

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

//Get products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const host = req.get('host');
    const baseUrl = `${req.protocol}://${host}`;

    const productsWithUrls = products.map(product => ({
      ...product.toObject(),
      image: product.image ? `${baseUrl}/${product.image}` : null
    }));

    res.status(200).json({
      success: true,
      count: products.length,
      products: productsWithUrls
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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const host = req.get('host');
    const baseUrl = `${req.protocol}://${host}`;
    const imageUrl = product.image ? `${baseUrl}/${product.image}` : null;

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