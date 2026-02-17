const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  try {
    console.log('🚀 Creating AdaStock database tables...');
    
    // Create categories table
    console.log('📝 Creating stock_categories table...');
    const { error: categoriesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS stock_categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          name_nl VARCHAR(100),
          name_fr VARCHAR(100), 
          name_en VARCHAR(100),
          color VARCHAR(7) DEFAULT '#22c55e',
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (categoriesError) {
      console.error('❌ Error creating categories table:', categoriesError);
    } else {
      console.log('✅ Categories table created');
    }
    
    // Create products table
    console.log('📝 Creating stock_products table...');
    const { error: productsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS stock_products (
          id SERIAL PRIMARY KEY,
          category_id INTEGER REFERENCES stock_categories(id),
          name VARCHAR(200) NOT NULL,
          name_nl VARCHAR(200),
          name_fr VARCHAR(200),
          name_en VARCHAR(200),
          unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
          current_quantity DECIMAL(10,2) DEFAULT 0,
          minimum_stock DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (productsError) {
      console.error('❌ Error creating products table:', productsError);
    } else {
      console.log('✅ Products table created');
    }
    
    // Insert default categories
    console.log('📝 Inserting default categories...');
    const categories = [
      { id: 1, name: 'vegetables', name_nl: 'Groenten', name_fr: 'Légumes', name_en: 'Vegetables', color: '#22c55e', sort_order: 1 },
      { id: 2, name: 'fruits', name_nl: 'Fruit', name_fr: 'Fruits', name_en: 'Fruits', color: '#f59e0b', sort_order: 2 },
      { id: 3, name: 'dairy', name_nl: 'Zuivel', name_fr: 'Produits laitiers', name_en: 'Dairy', color: '#3b82f6', sort_order: 3 },
      { id: 4, name: 'meat', name_nl: 'Vlees', name_fr: 'Viande', name_en: 'Meat', color: '#ef4444', sort_order: 4 },
      { id: 5, name: 'seafood', name_nl: 'Zeevruchten', name_fr: 'Fruits de mer', name_en: 'Seafood', color: '#06b6d4', sort_order: 5 },
      { id: 6, name: 'drygoods', name_nl: 'Droge waren', name_fr: 'Produits secs', name_en: 'Dry Goods', color: '#a855f7', sort_order: 6 },
      { id: 7, name: 'oils', name_nl: 'Oliën', name_fr: 'Huiles', name_en: 'Oils & Vinegars', color: '#eab308', sort_order: 7 },
      { id: 8, name: 'herbs', name_nl: 'Kruiden', name_fr: 'Herbes', name_en: 'Herbs & Spices', color: '#10b981', sort_order: 8 },
      { id: 9, name: 'beverages', name_nl: 'Dranken', name_fr: 'Boissons', name_en: 'Beverages', color: '#8b5cf6', sort_order: 9 },
      { id: 10, name: 'other', name_nl: 'Overig', name_fr: 'Autre', name_en: 'Other', color: '#6b7280', sort_order: 10 }
    ];
    
    for (const category of categories) {
      const { error: insertError } = await supabase
        .from('stock_categories')
        .upsert(category, { onConflict: 'name' });
      
      if (insertError && !insertError.message.includes('duplicate key')) {
        console.error(`❌ Error inserting category ${category.name}:`, insertError);
      } else {
        console.log(`✅ Category ${category.name_nl} inserted/updated`);
      }
    }
    
    // Test the connection
    console.log('🧪 Testing database connection...');
    const { data: testCategories, error: testError } = await supabase
      .from('stock_categories')
      .select('*')
      .limit(3);
    
    if (testError) {
      console.error('❌ Database test failed:', testError);
    } else {
      console.log(`✅ Database test successful! Found ${testCategories.length} categories:`);
      testCategories.forEach(cat => {
        console.log(`   - ${cat.name_nl} (${cat.name})`);
      });
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('❌ Failed to create database tables:', error);
  }
}

// Run the script
createTables().then(() => {
  console.log('✨ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});