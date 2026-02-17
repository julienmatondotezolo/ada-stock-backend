import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3055;
const API_PREFIX = '/api/v1';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3100',
    'http://localhost:3200', 
    'http://localhost:3000', 
    'http://192.168.0.188:3100',
    'http://192.168.0.188:3200',
    'http://192.168.0.188',
    'http://192.168.0.188:3000',
    'https://ada-stock.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Test Supabase connection
let supabaseClient: any = null;

try {
  supabaseClient = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  console.log('✅ Supabase client initialized');
} catch (error) {
  console.error('❌ Supabase initialization failed:', error);
}

// Health check at both locations
app.get('/health', async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supabase_url: process.env.SUPABASE_URL,
    port: PORT
  });
});

app.get(API_PREFIX + '/health', async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    supabase_url: process.env.SUPABASE_URL,
    port: PORT
  });
});

// Test database connection
app.get(API_PREFIX + '/test-db', async (req, res) => {
  try {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized');
    }

    // Try to query a simple table
    const { data, error } = await supabaseClient
      .from('stock_categories')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Database connection successful',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Categories endpoint - database only
app.get(API_PREFIX + '/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('stock_categories')
      .select('*')
      .order('sort_order');

    if (error && error.message.includes('does not exist')) {
      // Tables don't exist, return setup required message
      return res.json({
        success: true,
        data: [],
        count: 0,
        note: 'Database tables not created yet. Please create stock_categories table in Supabase.',
        requiresSetup: true
      });
    }

    if (error) {
      console.error('Categories GET error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        message: error.message,
        requiresSetup: error.message.includes('does not exist')
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Categories GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// No in-memory storage - database only

// Get all products
app.get(API_PREFIX + '/products', async (req, res) => {
  try {
    const { data, error } = await supabaseClient
      .from('stock_products')
      .select(`
        *,
        category:stock_categories(*)
      `)
      .order('name');

    if (error && error.message.includes('does not exist')) {
      // Tables don't exist, return empty array
      return res.json({
        success: true,
        data: [],
        count: 0,
        note: 'Database tables not created yet. Please create stock_products and stock_categories tables in Supabase.',
        requiresSetup: true
      });
    }

    if (error) {
      console.error('Products GET error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database query failed',
        message: error.message,
        requiresSetup: error.message.includes('does not exist')
      });
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Products GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create new product
app.post(API_PREFIX + '/products', async (req, res) => {
  try {
    const { name, category_id, unit, current_quantity, minimum_stock } = req.body;
    
    // Validate required fields
    if (!name || !category_id || !unit || current_quantity === undefined || minimum_stock === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, category_id, unit, current_quantity, minimum_stock'
      });
    }

    try {
      // Try database first
      const { data, error } = await supabaseClient
        .from('stock_products')
        .insert([{
          name,
          category_id,
          unit,
          current_quantity: parseInt(current_quantity),
          minimum_stock: parseInt(minimum_stock)
        }])
        .select(`
          *,
          category:stock_categories(*)
        `)
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        data: data,
        message: 'Product created successfully'
      });
    } catch (dbError) {
      console.error('Database error during product creation:', dbError);
      
      if (dbError.message && dbError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Database tables not created',
          message: 'Please create stock_products and stock_categories tables in Supabase.',
          requiresSetup: true
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create product in database',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update product quantity
app.post(API_PREFIX + '/products/:id/quantity', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: quantity'
      });
    }

    const newQuantity = parseInt(quantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a non-negative number'
      });
    }

    try {
      // Try database first
      const { data, error } = await supabaseClient
        .from('stock_products')
        .update({ current_quantity: newQuantity })
        .eq('id', id)
        .select(`
          *,
          category:stock_categories(*)
        `)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        message: 'Product quantity updated successfully'
      });
    } catch (dbError) {
      console.error('Database error during quantity update:', dbError);
      
      if (dbError.message && dbError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Database tables not created',
          message: 'Please create stock_products table in Supabase.',
          requiresSetup: true
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update quantity in database',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Update quantity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product quantity',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete product
app.delete(API_PREFIX + '/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // Try database first
      const { error } = await supabaseClient
        .from('stock_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (dbError) {
      console.error('Database error during product deletion:', dbError);
      
      if (dbError.message && dbError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Database tables not created',
          message: 'Please create stock_products table in Supabase.',
          requiresSetup: true
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to delete product from database',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update product (partial update allowed)
app.put(API_PREFIX + '/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, unit, current_quantity, minimum_stock } = req.body;
    
    // Build update object with only provided fields
    const updatedData = {};
    
    if (name !== undefined) {
      updatedData.name = name.trim();
    }
    if (category_id !== undefined) {
      updatedData.category_id = category_id;
    }
    if (unit !== undefined) {
      updatedData.unit = unit;
    }
    if (current_quantity !== undefined) {
      updatedData.current_quantity = parseInt(current_quantity);
    }
    if (minimum_stock !== undefined) {
      updatedData.minimum_stock = parseInt(minimum_stock);
    }

    // Validate that at least one field is provided
    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one field must be provided for update'
      });
    }

    // Validate quantities are non-negative if provided
    if (updatedData.current_quantity !== undefined && updatedData.current_quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Current quantity cannot be negative'
      });
    }

    if (updatedData.minimum_stock !== undefined && updatedData.minimum_stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Minimum stock cannot be negative'
      });
    }

    try {
      // Try database first
      const { data, error } = await supabaseClient
        .from('stock_products')
        .update(updatedData)
        .eq('id', id)
        .select(`
          *,
          category:stock_categories(*)
        `)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: data,
        message: 'Product updated successfully'
      });
    } catch (dbError) {
      console.error('Database error during product update:', dbError);
      
      if (dbError.message && dbError.message.includes('does not exist')) {
        return res.status(500).json({
          success: false,
          error: 'Database tables not created',
          message: 'Please create stock_products and stock_categories tables in Supabase.',
          requiresSetup: true
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to update product in database',
        message: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Ada Stock Management API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET /health',
      `GET ${API_PREFIX}/health`,
      `GET ${API_PREFIX}/test-db`,
      `GET ${API_PREFIX}/categories`,
      `GET ${API_PREFIX}/products`,
      `POST ${API_PREFIX}/products`,
      `PUT ${API_PREFIX}/products/:id`,
      `POST ${API_PREFIX}/products/:id/quantity`,
      `DELETE ${API_PREFIX}/products/:id`
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Ada Stock Management API Server Started (Simple)');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🧪 DB Test: http://localhost:${PORT}${API_PREFIX}/test-db`);
  console.log(`📁 Categories: http://localhost:${PORT}${API_PREFIX}/categories`);
});

export default app;