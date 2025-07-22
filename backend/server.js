const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./Routes/auth');
const eventRoutes = require('./Routes/event');
const expenseRoutes = require('./Routes/expenses');
const taskRoutes = require('./Routes/tasks');
const errorHandler = require('./Middleware/errorHandler');
const logger = require('./utils/logger');


const app = express();
const PORT = process.env.PORT || 3001;
app.use('/uploads', express.static('uploads'));
app.use('/api/upload', require('./routes/upload'));

// Security Middleware
app.use(helmet());
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use(limiter);

// CORS Setup
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    credentials: true
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventease', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => logger.info('Connected to MongoDB'))
  .catch((err) => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tasks', taskRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;
