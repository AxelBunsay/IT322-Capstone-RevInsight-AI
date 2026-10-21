const jwt = require('jsonwebtoken');

const protect = (req, res, next ) => {
  try {
    let token;

    // token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Making sure the token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (decoded.role !== 'admin' || !decoded.id) {
        return res.status(403).json({
          success: false,
          message: 'Administrator access required'
        });
      }
      req.admin = { id: decoded.id };
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = { protect };