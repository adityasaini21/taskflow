const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // ensure env is loaded first

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'TaskFlow API running' })
);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 🔥 Important: explicitly log env values
const PORT = Number(process.env.PORT) || 5001; // fallback to 5001 instead of 5000
const MONGO_URI = process.env.MONGO_URI;

// Debug logs (remove later)
console.log("Using PORT:", PORT);
console.log("Mongo URI exists:", !!MONGO_URI);

// Connect DB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });