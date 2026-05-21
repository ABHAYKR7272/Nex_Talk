require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const path       = require('path');
const fs         = require('fs');
const connectDB  = require('./config/database');
const socketManager = require('./socket/socketManager');

const authRoutes    = require('./routes/authRoutes');
const userRoutes    = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

connectDB();

const app    = express();
const server = http.createServer(app);

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile, curl) or from allowed list
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io accessible in routes
app.set('io', io);

// ── Middleware ────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Uploads dir ───────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(path.join(uploadDir, 'avatars'))) fs.mkdirSync(path.join(uploadDir, 'avatars'), { recursive: true });
app.use('/uploads', express.static(uploadDir));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/messages', messageRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, time: new Date(), version: '2.0' }));

// ── Socket ────────────────────────────────────────────────
socketManager(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀  NexTalk v2.0 running on port ${PORT}`);
  console.log(`📡  WebSocket ready`);
  console.log(`🌐  Allowed origins: ${allowedOrigins.join(', ')}\n`);
});
