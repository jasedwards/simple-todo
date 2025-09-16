/**
 * Simple Todo Backend Application
 * @description Express.js backend with authentication system
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRoutes } from './auth/auth.routes';
import { getSecurityMiddleware, sanitizeInput, errorHandler } from './middleware/security';
import { initializeAuditTable, isDevelopment } from './config/supabase';

// Load environment variables
dotenv.config();

// Server configuration
const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

/**
 * Creates and configures the Express application
 * @function createApp
 * @description Sets up Express app with all middleware and routes
 * @returns {express.Application} Configured Express app
 */
function createApp(): express.Application {
  const app = express();

  // Trust proxy for proper IP detection (required for rate limiting)
  app.set('trust proxy', 1);

  // Apply security middleware first
  const securityMiddleware = getSecurityMiddleware();
  securityMiddleware.forEach(middleware => app.use(middleware as any));

  // CORS configuration
  const corsOptions = {
    origin: isDevelopment
      ? ['http://localhost:4200', 'http://localhost:3000'] // Allow Angular dev server
      : [process.env.FRONTEND_URL || 'https://your-domain.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 hours
  };
  app.use(cors(corsOptions));

  // Request logging
  const logFormat = isDevelopment ? 'dev' : 'combined';
  app.use(morgan(logFormat));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Input sanitization
  app.use(sanitizeInput);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: '🚀 Simple Todo API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/health',
        auth: '/api/auth/*'
      },
      docs: 'See README.md for API documentation'
    });
  });

  // 404 handler for unmatched routes
  app.use('*', (req, res) => {
    res.status(404).json({
      message: 'Endpoint not found',
      code: 'NOT_FOUND',
      path: req.originalUrl
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Starts the server
 * @function startServer
 * @description Initializes the application and starts listening
 * @returns {Promise<void>}
 */
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Starting Simple Todo Backend...');

    // Initialize audit logging
    await initializeAuditTable();

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(port, host, () => {
      console.log(`✅ Server ready at http://${host}:${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Development mode: ${isDevelopment ? 'ON' : 'OFF'}`);
      console.log(`📝 API Documentation available at: http://${host}:${port}`);

      if (isDevelopment) {
        console.log(`🔒 HTTPS enforcement: DISABLED (dev mode)`);
        console.log(`⚡ Rate limiting: DISABLED (dev mode)`);
        console.log(`🧪 Authentication: MOCKED`);
      } else {
        console.log(`🔒 HTTPS enforcement: ENABLED`);
        console.log(`⚡ Rate limiting: ENABLED`);
        console.log(`🔐 Authentication: LIVE (Supabase)`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
