import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3055;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3100',
    'http://localhost:3000', 
    'http://192.168.0.188:3100'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use(API_PREFIX, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Ada Stock Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    api: {
      prefix: API_PREFIX,
      documentation: `${req.protocol}://${req.get('host')}${API_PREFIX}`,
      health: `${req.protocol}://${req.get('host')}${API_PREFIX}/health`
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    available_routes: {
      api: API_PREFIX,
      health: `${API_PREFIX}/health`,
      categories: `${API_PREFIX}/categories`,
      products: `${API_PREFIX}/products`,
      transactions: `${API_PREFIX}/transactions`,
      dashboard: `${API_PREFIX}/dashboard`
    }
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Ada Stock Management API Server Started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}${API_PREFIX}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}${API_PREFIX}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origins: ${corsOptions.origin}`);
  console.log('─────────────────────────────────────────────');
  console.log('📁 Available Endpoints:');
  console.log(`   GET    ${API_PREFIX}/health`);
  console.log(`   GET    ${API_PREFIX}/dashboard/summary`);
  console.log(`   GET    ${API_PREFIX}/categories`);
  console.log(`   GET    ${API_PREFIX}/products`);
  console.log(`   GET    ${API_PREFIX}/transactions/recent`);
  console.log('─────────────────────────────────────────────');
});

export default app;