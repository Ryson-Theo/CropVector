// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const rateLimiter = require('./utils/rateLimiter');
const { verifyTransporter } = require('./config/mail');
const fetch = global.fetch || require('node-fetch');
require('dotenv').config({ debug: false, quiet: true });

const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const machineryRoutes = require('./routes/machineryRoutes');
const messageRoutes = require('./routes/messageRoutes');
const postRoutes = require('./routes/postRoutes');
const alertRoutes = require('./routes/alertRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const reportRoutes = require('./routes/reportRoutes');
const recommendRoutes = require('./routes/recommendRoutes');
const adminCropRoutes = require('./routes/adminCropRoutes');
const expertRoutes = require('./routes/expertRoutes');
const exportRoutes = require('./routes/exportRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const homeGardenRoutes = require('./routes/homeGardenRoutes');

const Farmer = require('./models/Farmer');
const Buyer = require('./models/Buyer');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/', rateLimiter);

const startupCheckCoordinates = {
  latitude: process.env.STARTUP_CHECK_LAT || '12.9716',
  longitude: process.env.STARTUP_CHECK_LON || '77.5946'
};

// Simple in-memory cache for mandi readiness to avoid repeated startup rate-limits
const mandiCheckCache = { ts: 0, ok: false };
const MANDI_CHECK_TTL = 60 * 1000; // 60 seconds
const checkKaegroSoilService = async () => {
  const { latitude, longitude } = startupCheckCoordinates;
  const url = `https://www.kaegro.com/farms/api/soil?lat=${latitude}&lon=${longitude}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Kaegro soil service returned ${resp.status}`);
  }
  await resp.json();
};

const checkOpenMeteoWeatherService = async () => {
  const { latitude, longitude } = startupCheckCoordinates;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=rain_sum,temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=UTC`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`OpenMeteo weather service returned ${resp.status}`);
  }
  await resp.json();
};

const checkMandiPricingService = async () => {
  const now = Date.now();
  if (mandiCheckCache.ts && (now - mandiCheckCache.ts) < MANDI_CHECK_TTL) {
    if (mandiCheckCache.ok) return;
    // fall through to re-check if cached result was negative
  }

  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    throw new Error('DATA_GOV_API_KEY is not configured, skipping Mandi pricing readiness check');
  }

  const url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&filters[commodity]=rice`;

  // Retry with exponential backoff on 429 up to maxRetries
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(url);
    if (resp.ok) {
      mandiCheckCache.ts = Date.now();
      mandiCheckCache.ok = true;
      await resp.json();
      return;
    }

    if (resp.status === 403) {
      mandiCheckCache.ts = Date.now();
      mandiCheckCache.ok = false;
      throw new Error('Mandi pricing service returned 403 (unauthorized or sample key not authorized)');
    }

    if (resp.status === 429) {
      // Rate limited — if we can retry, wait and retry; otherwise propagate specific 429 error
      if (attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt); // 1s, 2s
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      mandiCheckCache.ts = Date.now();
      mandiCheckCache.ok = false;
      throw new Error('Mandi pricing service returned 429 (rate limited)');
    }

    // Other HTTP errors
    mandiCheckCache.ts = Date.now();
    mandiCheckCache.ok = false;
    throw new Error(`Mandi pricing service returned ${resp.status}`);
  }
};

const checkExternalDependencies = async () => {
  const checks = [
    {
      label: 'Kaegro soil and remote sensing',
      task: checkKaegroSoilService,
      prefix: '[EXTERNAL]'
    },
    {
      label: 'OpenMeteo weather service',
      task: checkOpenMeteoWeatherService,
      prefix: '[EXTERNAL]'
    },
    {
      label: 'Mandi pricing service',
      task: checkMandiPricingService,
      prefix: '[EXTERNAL]'
    },
    {
      label: 'Mail system',
      task: verifyTransporter,
      prefix: '[MAIL]'
    }
  ];

  const results = await Promise.allSettled(checks.map((check) => check.task()));
  results.forEach((result, index) => {
    const { label, prefix } = checks[index];
    if (result.status === 'fulfilled') {
      console.log(`${prefix} INFO: ${label} connectivity verified.`);
      return;
    }

    if (label === 'Mandi pricing service') {
      if (result.reason?.message?.includes('DATA_GOV_API_KEY')) {
        console.warn(`${prefix} WARN: ${label} readiness check skipped. ${result.reason.message}`);
        return;
      }

      if (result.reason?.message?.includes('403')) {
        console.warn(`${prefix} WARN: ${label} readiness check could not be completed. ${result.reason.message}. Use a valid API key for live pricing verification.`);
        return;
      }

      if (result.reason?.message?.includes('429') || result.reason?.message?.toLowerCase().includes('rate limited')) {
        console.warn(`${prefix} WARN: ${label} readiness check rate-limited. ${result.reason.message}. Proceeding without live pricing verification.`);
        return;
      }
    }

    console.error(`${prefix} ERROR: ${label} connectivity check failed.`, result.reason?.message || result.reason);
  });
};

// Upload directories
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./uploads/diseases')) fs.mkdirSync('./uploads/diseases');
if (!fs.existsSync('./uploads/posts')) fs.mkdirSync('./uploads/posts');

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Disposition', 'inline');
    const ext = path.extname(filePath).toLowerCase();
    if (!ext) res.setHeader('Content-Type', 'image/jpeg');
  }
}));

// ------------------ API ROUTES ------------------
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/machinery', machineryRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', postRoutes);
app.use('/api', alertRoutes);
app.use('/api', fieldRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/admin', adminCropRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api', resourceRoutes);
app.use('/api/home-garden', homeGardenRoutes);

// ------------------ SOCKET.IO ------------------
const http = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(http, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// Multi-tab support
const onlineUsers = new Map(); // userId => Set(socketId)

io.on('connection', (socket) => {
  // User comes online
  socket.on('user-online', async (userId) => {
    if (!userId) return;

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Only mark online in DB if first socket
    if (onlineUsers.get(userId).size === 1) {
      await Farmer.findOneAndUpdate({ userId }, { isOnline: true, lastSeen: Date.now() });
      await Buyer.findOneAndUpdate({ userId }, { isOnline: true, lastSeen: Date.now() });
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: Date.now() });
    }

    io.emit('presence-update', { userId, status: 'online' });
  });

  // Sending message
  socket.on('send-message', (message) => {
    const receiverSockets = onlineUsers.get(message.receiverId);
    if (receiverSockets) {
      for (const sid of receiverSockets) {
        io.to(sid).emit('receive-message', message);
      }
    }
  });

  // User disconnects
  socket.on('disconnect', async () => {
    for (let [userId, socketSet] of onlineUsers.entries()) {
      if (socketSet.has(socket.id)) {
        socketSet.delete(socket.id);

        // Only mark offline if no sockets left
        if (socketSet.size === 0) {
          onlineUsers.delete(userId);

          await Farmer.findOneAndUpdate({ userId }, { isOnline: false, lastSeen: Date.now() });
          await Buyer.findOneAndUpdate({ userId }, { isOnline: false, lastSeen: Date.now() });
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: Date.now() });

          io.emit('presence-update', { userId, status: 'offline' });
        }
        break;
      }
    }
  });
});

// ------------------ GLOBAL ERROR HANDLING ------------------
process.on('uncaughtException', (err) => {
  // Uncaught exception occurred
});

process.on('unhandledRejection', (reason, promise) => {
  // Unhandled rejection occurred
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    await connectDB();
    console.log('[DB] INFO: Database connection established.');
    console.log(`[ENV] INFO: Running in ${ENV} mode.`);

    await checkExternalDependencies();

    const server = http.listen(PORT);

    server.on('listening', () => {
      console.log(`[SERVER] INFO: Server listening on port ${PORT}.`);
      console.log('[SERVER] INFO: System initialized and ready to accept requests.');
    });

    server.on('error', (err) => {
      console.error('[SERVER] ERROR: Server failed to start.', err);
      process.exit(1);
    });
  } catch (err) {
    console.error('[DB] ERROR: Database connection failed. Exiting.', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, io };