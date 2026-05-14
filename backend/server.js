import "dotenv/config"
import express from 'express';
import db from './config/db.js';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import expenseRoutes from './routes/expenses.js';
import approvalRuleRoutes from './routes/approvalRules.js';
import analyticsRoutes from './routes/analytics.js';


// Initialize Express app
const app = express();
const server = http.createServer(app);

db()

const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(origin => origin.trim()) 
  : ['http://localhost:5173', 'http://localhost:5174'];

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

// Middleware
app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.use((req, _res, next) => { req.io = io; next(); });

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'Backend is live!' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approval-rules', approvalRuleRoutes);
app.use('/api/analytics', analyticsRoutes);

// Socket.io
const onlineUsers = new Map();
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
  });
  socket.on('disconnect', () => {
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) { onlineUsers.delete(uid); break; }
    }
  });
});

const PORT=process.env.PORT ||5000

server.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})