const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user');
const mechanicRoutes = require('./routes/mechanic');
const adminRoutes = require('./routes/adminRoutes/admin');
const productRoutes = require('./routes/adminRoutes/product');
const dashboardRoutes = require('./routes/adminRoutes/dashboard');

const cartRoutes = require('./routes/orderingRoutes/cart');
const orderRoutes = require('./routes/orderingRoutes/order');
const serviceRequestRoutes = require('./routes/serviceRequest');
const mechanicPartsRoutes = require('./routes/mechanicParts');


const mongoose = require('mongoose');
const Admin = require('./models/adminModels/admin');
const app = express();

// Middleware
app.use(cors());
// simple request logger for debugging
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.path);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// additional API request logger (prints headers + body for POST/PUT/DELETE)
app.use((req, res, next) => {
  try {
    if (req.path.startsWith('/api/')) {
      console.log('-> API Request:', req.method, req.path);
      console.log('   Host:', req.headers.host);
      // avoid noisy output for GETs
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        console.log('   Body:', JSON.stringify(req.body));
      }
    }
  } catch (e) { /* ignore logging errors */ }
  next();
});
// serve uploaded files
app.use(express.static('uploads'));

// serve frontend static files from the workspace `frontend` folder
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));


const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/revinsight-ai';
const port = process.env.PORT || 5000;

const ensureAdminUser = async () => {
  const username = process.env.ADMIN_USERNAME || 'Admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

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

app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/mechanic', mechanicPartsRoutes);

// Diagnostic: list registered routes (temporary)
app.get('/api/_routes', (req, res) => {
  try {
    const routes = [];
    app._router.stack.forEach(m => {
      if (m.route && m.route.path) {
        const methods = Object.keys(m.route.methods).join(',').toUpperCase();
        routes.push({ path: m.route.path, methods });
      } else if (m.name === 'router' && m.handle && m.handle.stack) {
        m.handle.stack.forEach(r => {
          if (r.route && r.route.path) {
            const methods = Object.keys(r.route.methods).join(',').toUpperCase();
            // If route was mounted with a path, include parent mount if available
            routes.push({ path: r.route.path, methods });
          }
        });
      }
    });
    res.json({ routes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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