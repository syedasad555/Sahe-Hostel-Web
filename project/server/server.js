import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB, { sequelize } from './config/db.js';
import { validateProductionEnv } from './config/validateEnv.js';
import { ensureUploadsDir, UPLOADS_DIR } from './config/uploadsDir.js';
import studentRoutes from './routes/studentRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import authRoutes from './routes/authRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import outingRoutes from './routes/outingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import scheduleMealReportEmails from './utils/scheduler.js';

validateProductionEnv();
ensureUploadsDir();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? path.resolve(process.env.PUBLIC_DIR)
  : path.resolve(__dirname, '../public');

const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS) || 10000;

function buildCorsOptions() {
  return {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

const app = express();

app.use(cors(buildCorsOptions()));
app.options('*', cors(buildCorsOptions()));
app.use(express.json());

app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch {
    return res.status(503).json({
      status: 'unavailable',
      database: 'disconnected',
    });
  }
});

app.use('/api/students', studentRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/outing', outingRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

if (isProduction && fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, { index: false }));

  app.get('*', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
} else if (!isProduction) {
  app.get('/', (_req, res) => {
    res.send('SAHE Hostelers API is running...');
  });
}

const PORT = Number(process.env.PORT) || 5000;

let server;
let shuttingDown = false;

const shutdown = (signal) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log(`${signal} received — shutting down gracefully...`);

  const forceTimer = setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  if (!server) {
    clearTimeout(forceTimer);
    process.exit(0);
    return;
  }

  server.close(async () => {
    try {
      await sequelize.close();
      clearTimeout(forceTimer);
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error.message);
      process.exit(1);
    }
  });
};

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    if (isProduction) {
      console.log(`Serving uploads from ${UPLOADS_DIR}`);
      if (fs.existsSync(PUBLIC_DIR)) {
        console.log(`Serving frontend from ${PUBLIC_DIR}`);
      } else {
        console.warn(`Frontend directory not found at ${PUBLIC_DIR}`);
      }
    }
  });

  if (isProduction) {
    scheduleMealReportEmails();
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err?.message || err}`);
  shutdown('unhandledRejection');
});

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
