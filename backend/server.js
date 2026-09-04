const path = require('path');
require('dotenv').config();

const aiRoutes = require('./routes/adminRoutes/ai');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const userRoutes = require('./routes/user');
const mechanicRoutes = require('./routes/mechanic');
const adminRoutes = require('./routes/adminRoutes/admin');
const productRoutes = require('./routes/adminRoutes/product');
const dashboardRoutes = require('./routes/adminRoutes/dashboard');
const chatRoutes = require('./routes/chat');

const cartRoutes = require('./routes/orderingRoutes/cart');
const orderRoutes = require('./routes/orderingRoutes/order');
const serviceRequestRoutes = require('./routes/serviceRequest');
const mechanicPartsRoutes = require('./routes/mechanicParts');
const paymentRoutes = require('./routes/payment');


const mongoose = require('mongoose');
const Admin = require('./models/adminModels/admin');
const app = express();

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be configured with at least 32 characters in production');
}

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5175'
].filter(Boolean);


app.use('/api/admin', aiRoutes);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(helmet());
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false
}));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
// serve uploaded files
app.use(express.static('uploads'));

// serve frontend static files from the workspace `frontend` folder
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));


const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/revinsight-ai';
const port = process.env.PORT || 5000;

const ensureAdminUser = async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.warn('Admin bootstrap skipped: ADMIN_USERNAME and ADMIN_PASSWORD are not configured');
    return;
  }

  try {
    const existingAdmin = await Admin.findOne({ username });
    if (!existingAdmin) {
      await Admin.create({ username, password });
      console.log(`Default admin created: ${username}`);
    } else {
      console.log(`Default admin already exists: ${username}`);
    }
  } catch (err) {
    console.error('Failed to create default admin:', err.message);
  }
};

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected');
    await ensureAdminUser();
  })
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/mechanic', mechanicPartsRoutes);
app.use('/api/payments', paymentRoutes);

// Catch-all for frontend routes (serve admin login for non-API requests)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendPath, 'Admin', 'adminLogin.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // Print mounted routes for easier debugging of running instance
  try {
    console.log('Registered routes (mounted):');
    if (app && app._router && Array.isArray(app._router.stack)) {
      app._router.stack.forEach(m => {
        try {
          if (m && m.route && m.route.path) {
            const methods = Object.keys(m.route.methods).join(',').toUpperCase();
            console.log(methods.padEnd(8), m.route.path);
            return;
          }

          // Mounted routers can expose their own stack under handle.stack
          const handleStack = m && m.handle && m.handle.stack;
          if (Array.isArray(handleStack)) {
            const mount = (m && m.regexp && m.regexp.source) ? m.regexp.source : '<router>';
            handleStack.forEach(r => {
              if (r && r.route && r.route.path) {
                const methods = Object.keys(r.route.methods).join(',').toUpperCase();
                console.log(methods.padEnd(8), `${mount} -> ${r.route.path}`);
              }
            });
            return;
          }
        } catch (innerE) {
          // ignore individual layer errors
        }
      });
    } else {
      console.log('No router stack available to print.');
    }
  } catch (e) {
    console.error('Error printing routes:', e && e.stack ? e.stack : e);
  }
});