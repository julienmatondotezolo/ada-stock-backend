const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSchema() {
  try {
    console.log('🏗️ Creating Ada Stock Management Schema...');
    console.log('📡 Connected to:', process.env.SUPABASE_URL);
    
    // SQL Commands to execute sequentially
    const commands = [
      // Enable UUID extension
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      
      // Create stock_categories table
      `CREATE TABLE IF NOT EXISTS stock_categories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        name_nl VARCHAR(100),
        name_fr VARCHAR(100),
        name_en VARCHAR(100),
        description TEXT,
        color VARCHAR(7) DEFAULT '#22c55e',
        icon VARCHAR(50),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Create stock_products table
      `CREATE TABLE IF NOT EXISTS stock_products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        category_id UUID NOT NULL REFERENCES stock_categories(id) ON DELETE RESTRICT,
        name VARCHAR(200) NOT NULL,
        name_nl VARCHAR(200),
        name_fr VARCHAR(200),
        name_en VARCHAR(200),
        description TEXT,
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100),
        unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
        current_quantity DECIMAL(10,2) DEFAULT 0,
        minimum_stock DECIMAL(10,2) DEFAULT 0,
        maximum_stock DECIMAL(10,2),
        reorder_point DECIMAL(10,2),
        cost_price DECIMAL(10,2),
        supplier_info JSONB,
        storage_location VARCHAR(100),
        expiry_tracking BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT check_quantities CHECK (current_quantity >= 0 AND minimum_stock >= 0)
      );`,
      
      // Create stock_history table
      `CREATE TABLE IF NOT EXISTS stock_history (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
        transaction_type VARCHAR(20) NOT NULL,
        quantity_change DECIMAL(10,2) NOT NULL,
        previous_quantity DECIMAL(10,2) NOT NULL,
        new_quantity DECIMAL(10,2) NOT NULL,
        unit_cost DECIMAL(10,2),
        total_cost DECIMAL(10,2),
        reference_number VARCHAR(100),
        notes TEXT,
        performed_by VARCHAR(100),
        transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB
      );`,
      
      // Create stock_locations table
      `CREATE TABLE IF NOT EXISTS stock_locations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        location_type VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      // Create stock_alerts table
      `CREATE TABLE IF NOT EXISTS stock_alerts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
        alert_type VARCHAR(20) NOT NULL,
        alert_level VARCHAR(10) DEFAULT 'INFO',
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      );`
    ];
    
    // Execute each command
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const description = [
        'UUID Extension',
        'Categories Table', 
        'Products Table',
        'History Table',
        'Locations Table',
        'Alerts Table'
      ][i];
      
      console.log(`📋 ${i+1}/6: Creating ${description}...`);
      
      const { data, error } = await supabase.rpc('exec', { sql: command });
      if (error) {
        console.log(`❌ Failed to create ${description}:`, error.message);
      } else {
        console.log(`✅ ${description} created successfully`);
      }
    }
    
    // Insert default categories
    console.log('📂 Inserting default categories...');
    const categories = [
      { name: 'vegetables', name_nl: 'Groenten', name_fr: 'Légumes', name_en: 'Vegetables', description: 'Fresh vegetables and produce', color: '#22c55e', sort_order: 1 },
      { name: 'fruits', name_nl: 'Fruit', name_fr: 'Fruits', name_en: 'Fruits', description: 'Fresh fruits', color: '#f59e0b', sort_order: 2 },
      { name: 'dairy', name_nl: 'Zuivel', name_fr: 'Produits laitiers', name_en: 'Dairy', description: 'Milk, cheese, yogurt, butter', color: '#3b82f6', sort_order: 3 },
      { name: 'meat', name_nl: 'Vlees', name_fr: 'Viande', name_en: 'Meat', description: 'Fresh meat and poultry', color: '#ef4444', sort_order: 4 },
      { name: 'seafood', name_nl: 'Zeevruchten', name_fr: 'Fruits de mer', name_en: 'Seafood', description: 'Fish and seafood', color: '#06b6d4', sort_order: 5 },
      { name: 'drygoods', name_nl: 'Droge waren', name_fr: 'Produits secs', name_en: 'Dry Goods', description: 'Pasta, rice, flour, grains', color: '#a855f7', sort_order: 6 },
      { name: 'oils', name_nl: 'Oliën', name_fr: 'Huiles', name_en: 'Oils & Vinegars', description: 'Cooking oils and vinegars', color: '#eab308', sort_order: 7 },
      { name: 'herbs', name_nl: 'Kruiden', name_fr: 'Herbes', name_en: 'Herbs & Spices', description: 'Fresh herbs and dried spices', color: '#10b981', sort_order: 8 }
    ];
    
    for (const category of categories) {
      const { data, error } = await supabase
        .from('stock_categories')
        .upsert([category], { onConflict: 'name' });
      
      if (error) {
        console.log(`❌ Failed to insert category ${category.name}:`, error.message);
      } else {
        console.log(`✅ Category ${category.name} (${category.name_nl}) inserted`);
      }
    }
    
    // Insert default locations
    console.log('📍 Inserting default locations...');
    const locations = [
      { name: 'Main Storage', description: 'Primary storage area', location_type: 'storage' },
      { name: 'Kitchen', description: 'Kitchen area', location_type: 'kitchen' },
      { name: 'Bar', description: 'Bar area', location_type: 'bar' },
      { name: 'Refrigerator', description: 'Main refrigerator', location_type: 'fridge' },
      { name: 'Freezer', description: 'Main freezer', location_type: 'freezer' }
    ];
    
    for (const location of locations) {
      const { data, error } = await supabase
        .from('stock_locations')
        .upsert([location], { onConflict: 'name' });
      
      if (error) {
        console.log(`❌ Failed to insert location ${location.name}:`, error.message);
      } else {
        console.log(`✅ Location ${location.name} inserted`);
      }
    }
    
    console.log('🎉 Ada Stock Management Schema Created Successfully!');
    
    // Verify creation
    const { data: categories_count } = await supabase.from('stock_categories').select('*', { count: 'exact', head: true });
    const { data: locations_count } = await supabase.from('stock_locations').select('*', { count: 'exact', head: true });
    
    console.log(`📊 Final count: ${categories_count?.length || 0} categories, ${locations_count?.length || 0} locations`);
    
  } catch (err) {
    console.error('❌ Schema creation failed:', err.message);
  }
}

createSchema();