const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const boardRoutes = require('./routes/board.routes');
const columnRoutes = require('./routes/column.routes');
const cardRoutes = require('./routes/card.routes');
const activityRoutes = require('./routes/activity.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS — allow the Vite dev client
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/boards/:boardId/activity', activityRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
