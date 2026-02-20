// Quick CORS fix for AdaStock backend
import express from 'express';
import cors from 'cors';

const app = express();

// Enhanced CORS configuration
const allowedOrigins = [
    'http://localhost:3100',
    'http://localhost:3200', 
    'http://localhost:3000', 
    'http://192.168.0.188:3100',
    'http://192.168.0.188:3200',
    'http://192.168.0.188',
    'http://192.168.0.188:3000',
    'https://ada-stock.vercel.app',
    'https://ada-stock-tawny.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Alternative: Manual CORS headers for extra compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

console.log('CORS configuration applied for origins:', allowedOrigins);