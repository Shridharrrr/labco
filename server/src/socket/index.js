const jwt = require('jsonwebtoken');
const boardHandlers = require('./boardHandlers');
const presenceHandlers = require('./presenceHandlers');

/**
 * Initialise Socket.io server.
 * @param {import('socket.io').Server} io
 */
const initSocket = (io) => {
  // --- JWT Auth middleware for socket handshake ---
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // { userId, email }
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.user.userId})`);

    presenceHandlers(io, socket);
    boardHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
