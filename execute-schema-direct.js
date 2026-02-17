const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function executeSchema() {
  try {
    console.log('🚀 Executing Ada Stock Management Schema...');
    console.log('📡 Connected to:', process.env.SUPABASE_URL);
    
    // First, let's try to create a simple table to test if we can execute DDL
    console.log('🧪 Testing table creation...');
    
    const testTableSQL = `
      CREATE TABLE IF NOT EXISTS test_connection (
        id SERIAL PRIMARY KEY,
        test_field TEXT
      );
    `;
    
    // Try using raw SQL execution
    const { data: testData, error: testError } = await supabase
      .rpc('exec_sql', { query: testTableSQL });
    
    if (testError) {
      console.log('❌ Cannot execute raw SQL via rpc. Error:', testError.message);
      console.log('🔄 Trying direct table operations instead...');
      
      // Try direct table creation via REST API
      const createTableResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          query: testTableSQL
        })
      });
      
      if (!createTableResponse.ok) {
        console.log('❌ Direct table creation failed:', await createTableResponse.text());
        console.log('🎯 SOLUTION: Manual execution required');
        console.log('📋 Please execute the SQL schema manually in Supabase dashboard:');
        console.log('🔗 https://supabase.com/dashboard/project/dxxtxdyrovawugvvrhah/sql');
        return;
      }
    } else {
      console.log('✅ Test table created successfully');
    }
    
    // If we get here, we can execute SQL directly
    console.log('🏗️ Creating stock management tables...');
    
    const stockCategoriesSQL = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS stock_categories (
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
      );
    `;
    
    const { data: categoriesData, error: categoriesError } = await supabase
      .rpc('exec_sql', { query: stockCategoriesSQL });
      
    if (categoriesError) {
      console.log('❌ Failed to create stock_categories:', categoriesError.message);
    } else {
      console.log('✅ stock_categories table created');
    }
    
    // Create stock_products table
    const stockProductsSQL = `
      CREATE TABLE IF NOT EXISTS stock_products (
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
      );
    `;
    
    const { data: productsData, error: productsError } = await supabase
      .rpc('exec_sql', { query: stockProductsSQL });
      
    if (productsError) {
      console.log('❌ Failed to create stock_products:', productsError.message);
    } else {
      console.log('✅ stock_products table created');
    }
    
    // Insert default categories
    console.log('📂 Inserting default categories...');
    const categories = [
      { name: 'vegetables', name_nl: 'Groenten', name_fr: 'Légumes', name_en: 'Vegetables', description: 'Fresh vegetables and produce', color: '#22c55e', sort_order: 1 },
      { name: 'dairy', name_nl: 'Zuivel', name_fr: 'Produits laitiers', name_en: 'Dairy', description: 'Milk, cheese, yogurt, butter', color: '#3b82f6', sort_order: 3 },
      { name: 'meat', name_nl: 'Vlees', name_fr: 'Viande', name_en: 'Meat', description: 'Fresh meat and poultry', color: '#ef4444', sort_order: 4 },
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
    
    console.log('🎉 Schema execution completed!');
    
  } catch (err) {
    console.error('❌ Schema execution failed:', err.message);
    console.log('🎯 Manual execution required in Supabase dashboard');
  }
}

executeSchema();