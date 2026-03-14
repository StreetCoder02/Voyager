const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const { initSockets } = require('./sockets/socketHandler');

dotenv.config();

const app = express();
const httpServer = createServer(app);

// In production, origins should be explicitly whitelisted.
// Using '*' here temporarily so the Vercel deployment can connect regardless of its generated URL.
const io = new Server(httpServer, {
  cors: {
    origin: '*', 
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Start listening for sockets and Simulation
initSockets(io);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Voyager Server running on port ${PORT}`);
});
