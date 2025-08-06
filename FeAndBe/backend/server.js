const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const swapRoutes = require('./routes/swapRoutes');
const lpRoutes = require('./routes/lpRoutes');
const crossChainRoutes = require('./routes/crossChainRoutes');
const chainRoutes = require('./routes/chainRoutes');
const pairRoutes = require('./routes/pairRoutes');
const eventRoutes = require('./routes/eventRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const balanceRoutes = require('./routes/balanceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/swaps', swapRoutes);
app.use('/api/liquidity', lpRoutes);
app.use('/api/cross-chain', crossChainRoutes);
app.use('/api/chains', chainRoutes);
app.use('/api/pairs', pairRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/balances', balanceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Multi-chain DEX Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;