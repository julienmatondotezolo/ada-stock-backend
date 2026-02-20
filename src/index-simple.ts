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
    'https://ada-stock.vercel.app',
    'https://ada-stock-tawny.vercel.app',
    'https://ada-planning.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional CORS headers for compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3100',
    'http://localhost:3200', 
    'http://localhost:3000', 
    'http://192.168.0.188:3100',
    'http://192.168.0.188:3200',
    'http://192.168.0.188',
    'http://192.168.0.188:3000',
    'https://ada-stock.vercel.app',
    'https://ada-stock-tawny.vercel.app',
    'https://ada-planning.vercel.app'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  next();
});

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

// =====================================================
// STAFF ENDPOINTS (WORKING - RESTORE ONLY THESE)
// =====================================================

// Staff Management Endpoints
app.get(API_PREFIX + '/staff', async (req, res) => {
  try {
    const { active_only, position } = req.query;
    
    let query = supabaseClient
      .from('staff')
      .select('*')
      .order('first_name');
    
    if (active_only === 'true') {
      query = query.eq('status', 'active');
    }
    
    if (position) {
      query = query.eq('position', position);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Staff GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch staff',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================
// STAFF CRUD ENDPOINTS (COMPLETE)
// =====================================================

app.post(API_PREFIX + '/staff', async (req, res) => {
  try {
    const { first_name, last_name, name, email, phone, position, hourly_rate } = req.body;
    
    // Support both name and first_name/last_name
    const firstName = first_name || (name ? name.split(' ')[0] : '');
    const lastName = last_name || (name ? name.split(' ').slice(1).join(' ') : '');
    
    const { data, error } = await supabaseClient
      .from('staff')
      .insert([{
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        position,
        hourly_rate: parseFloat(hourly_rate) || 0,
        status: 'active',
        hire_date: new Date().toISOString().split('T')[0],
        default_hours_per_week: 35
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data: data,
      message: 'Staff member created successfully'
    });
  } catch (error) {
    console.error('Staff CREATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create staff member',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put(API_PREFIX + '/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, name, email, phone, position, hourly_rate, status, is_active } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) {
      updateData.first_name = name.split(' ')[0];
      updateData.last_name = name.split(' ').slice(1).join(' ');
    }
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (position !== undefined) updateData.position = position;
    if (hourly_rate !== undefined) updateData.hourly_rate = parseFloat(hourly_rate);
    if (status !== undefined) updateData.status = status;
    if (is_active !== undefined) updateData.status = is_active ? 'active' : 'inactive';
    
    const { data, error } = await supabaseClient
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data,
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    console.error('Staff UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update staff member',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete(API_PREFIX + '/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseClient
      .from('staff')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  } catch (error) {
    console.error('Staff DELETE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete staff member',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================
// SCHEDULES ENDPOINTS (SAFE STUBS)
// =====================================================

app.get(API_PREFIX + '/schedules', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    let query = supabaseClient
      .from('schedules')
      .select('*')
      .eq('restaurant_id', 'losteria-deerlijk')
      .order('start_date', { ascending: false });
    
    // If year/month provided, filter by date range
    if (year && month) {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      query = query.gte('start_date', startDate).lte('end_date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Schedules GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch schedules',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post(API_PREFIX + '/schedules', async (req, res) => {
  try {
    const { name, year, month } = req.body;
    
    // Calculate start_date and end_date from year/month
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabaseClient
      .from('schedules')
      .insert([{
        restaurant_id: 'losteria-deerlijk',
        name: name || `Planning ${month}/${year}`,
        start_date: startDate,
        end_date: endDate,
        status: 'draft',
        total_shifts: 0,
        total_hours: 0,
        notification_sent: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data: data,
      message: 'Schedule created successfully'
    });
  } catch (error) {
    console.error('Schedule CREATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put(API_PREFIX + '/schedules/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { notify_staff, notification_message } = req.body;
    
    const { data, error } = await supabaseClient
      .from('schedules')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        notification_sent: notify_staff || false,
        notification_message: notification_message || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // TODO: Add staff notification logic here if notify_staff is true
    
    res.json({
      success: true,
      data: data,
      message: 'Schedule published successfully'
    });
  } catch (error) {
    console.error('Schedule PUBLISH error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to publish schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================
// SHIFTS ENDPOINTS (SAFE STUBS)
// =====================================================

app.get(API_PREFIX + '/shifts', async (req, res) => {
  try {
    const { date, staff_id, week } = req.query;
    
    let query = supabaseClient
      .from('shifts')
      .select(`
        *,
        staff(*)
      `)
      .order('scheduled_date')
      .order('start_time');
    
    // Apply filters using correct column names
    if (date) {
      query = query.eq('scheduled_date', date);
    }
    
    if (staff_id) {
      query = query.eq('staff_member_id', staff_id);
    }
    
    if (week) {
      // Calculate week start and end dates
      const weekStart = new Date(week);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      query = query.gte('scheduled_date', weekStart.toISOString().split('T')[0])
                  .lte('scheduled_date', weekEnd.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Shifts query error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} shifts in database`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Shifts GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shifts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post(API_PREFIX + '/shifts', async (req, res) => {
  try {
    const { scheduled_date, staff_member_id, start_time, end_time, position, break_duration, notes } = req.body;
    
    const { data, error } = await supabaseClient
      .from('shifts')
      .insert([{
        staff_member_id,
        scheduled_date,
        start_time,
        end_time,
        position: position || 'server',
        break_duration: break_duration || 30,
        status: 'scheduled',
        is_overtime: false,
        notes: notes || null
      }])
      .select(`
        *,
        staff(*)
      `)
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data: data,
      message: 'Shift created successfully'
    });
  } catch (error) {
    console.error('Shift CREATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create shift',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put(API_PREFIX + '/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, staff_member_id, start_time, end_time, position, break_duration, status, notes } = req.body;
    
    const updateData: any = {};
    if (scheduled_date !== undefined) updateData.scheduled_date = scheduled_date;
    if (staff_member_id !== undefined) updateData.staff_member_id = staff_member_id;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (position !== undefined) updateData.position = position;
    if (break_duration !== undefined) updateData.break_duration = break_duration;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    
    const { data, error } = await supabaseClient
      .from('shifts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        staff(*)
      `)
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data,
      message: 'Shift updated successfully'
    });
  } catch (error) {
    console.error('Shift UPDATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update shift',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.delete(API_PREFIX + '/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseClient
      .from('shifts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Shift deleted successfully'
    });
  } catch (error) {
    console.error('Shift DELETE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete shift',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post(API_PREFIX + '/shifts/bulk', async (req, res) => {
  try {
    const { shifts } = req.body;
    
    const shiftsData = (shifts || []).map((shift: any) => ({
      staff_member_id: shift.staff_member_id,
      scheduled_date: shift.scheduled_date || shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      position: shift.position || 'server',
      break_duration: shift.break_duration || 30,
      status: 'scheduled',
      is_overtime: false,
      notes: shift.notes || null
    }));
    
    const { data, error } = await supabaseClient
      .from('shifts')
      .insert(shiftsData)
      .select(`
        *,
        staff(*)
      `);
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      data: data,
      message: 'Bulk shifts created successfully'
    });
  } catch (error) {
    console.error('Bulk shift CREATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk shifts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.put(API_PREFIX + '/shifts/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_member_id, notify_staff } = req.body;
    
    const { data, error } = await supabaseClient
      .from('shifts')
      .update({
        staff_member_id,
        status: 'assigned'
      })
      .eq('id', id)
      .select(`
        *,
        staff(*)
      `)
      .single();
    
    if (error) throw error;
    
    // TODO: Add notification logic here if notify_staff is true
    
    res.json({
      success: true,
      data: data,
      message: 'Shift assigned successfully'
    });
  } catch (error) {
    console.error('Shift ASSIGN error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign shift',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================
// TEMPLATES ENDPOINTS (SAFE STUBS)
// =====================================================

app.get(API_PREFIX + '/templates', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Templates endpoint available - implementation pending'
    });
  } catch (error) {
    console.error('Templates GET error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post(API_PREFIX + '/templates', async (req, res) => {
  try {
    const { name, position, day_of_week, start_time, end_time } = req.body;
    
    const fakeTemplate = {
      id: 'temp-template-' + Date.now(),
      name,
      position,
      day_of_week: parseInt(day_of_week),
      start_time,
      end_time,
      active: true,
      created_at: new Date().toISOString()
    };
    
    res.status(201).json({
      success: true,
      data: fakeTemplate,
      message: 'Template created (temporary implementation)'
    });
  } catch (error) {
    console.error('Template CREATE error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// =====================================================
// REPORTS ENDPOINTS (SAFE STUBS)
// =====================================================

app.get(API_PREFIX + '/reports/hours', async (req, res) => {
  try {
    const { period, date, staff_id } = req.query;
    
    res.json({
      success: true,
      data: {
        total_hours: 0,
        regular_hours: 0,
        overtime_hours: 0,
        staff_breakdown: [],
        period: period,
        date: date,
        staff_id: staff_id
      },
      message: 'Hours report generated (temporary implementation)'
    });
  } catch (error) {
    console.error('Hours Report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate hours report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get(API_PREFIX + '/reports/coverage', async (req, res) => {
  try {
    const { date, position } = req.query;
    
    res.json({
      success: true,
      data: {
        total_coverage: 100,
        understaffed_periods: [],
        overstaffed_periods: [],
        date: date,
        position: position
      },
      message: 'Coverage report generated (temporary implementation)'
    });
  } catch (error) {
    console.error('Coverage Report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate coverage report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Ada Planning & Stock Management API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET /health',
      `GET ${API_PREFIX}/health`,
      `GET ${API_PREFIX}/test-db`,
      // Stock Management
      `GET ${API_PREFIX}/categories`,
      `GET ${API_PREFIX}/products`,
      // Staff Management (Full CRUD)
      `GET ${API_PREFIX}/staff`,
      `POST ${API_PREFIX}/staff`,
      `PUT ${API_PREFIX}/staff/:id`,
      `DELETE ${API_PREFIX}/staff/:id`,
      // Schedule Management
      `GET ${API_PREFIX}/schedules`,
      `POST ${API_PREFIX}/schedules`,
      `PUT ${API_PREFIX}/schedules/:id/publish`,
      // Shift Management
      `GET ${API_PREFIX}/shifts`,
      `POST ${API_PREFIX}/shifts`,
      `PUT ${API_PREFIX}/shifts/:id`,
      `DELETE ${API_PREFIX}/shifts/:id`,
      `POST ${API_PREFIX}/shifts/bulk`,
      `PUT ${API_PREFIX}/shifts/:id/assign`,
      // Templates
      `GET ${API_PREFIX}/templates`,
      `POST ${API_PREFIX}/templates`,
      // Reports
      `GET ${API_PREFIX}/reports/hours`,
      `GET ${API_PREFIX}/reports/coverage`
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