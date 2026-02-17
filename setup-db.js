const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupDatabase() {
  console.log('🚀 Setting up AdaStock database...');
  
  try {
    // Insert categories directly - Supabase will create the table if it doesn't exist
    console.log('📝 Creating categories...');
    
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
      const { data, error } = await supabase
        .from('stock_categories')
        .upsert(category, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error with category ${category.name}:`, error.message);
      } else {
        console.log(`✅ ${category.name_nl} ready`);
      }
    }
    
    // Test query
    console.log('🧪 Testing database...');
    const { data: testData, error: testError } = await supabase
      .from('stock_categories')
      .select('*')
      .limit(3);
    
    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log(`✅ Database working! Found ${testData.length} categories`);
      testData.forEach(cat => console.log(`   - ${cat.name_nl}`));
    }
    
    // Check if products table exists
    console.log('📝 Checking products table...');
    const { data: productTest, error: productError } = await supabase
      .from('stock_products')
      .select('*')
      .limit(1);
    
    if (productError) {
      console.log('❌ Products table needs to be created in Supabase dashboard');
      console.log('Please create stock_products table manually or use SQL editor');
    } else {
      console.log('✅ Products table exists and ready');
    }
    
    console.log('🎉 Database setup completed!');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

setupDatabase().then(() => process.exit(0)).catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});