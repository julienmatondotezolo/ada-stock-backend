const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyDatabase() {
  console.log('🔍 Verifying database connection and tables...');
  console.log('📡 Supabase URL:', process.env.SUPABASE_URL);
  
  try {
    // Test basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('_realtime_subscription')
      .select('*')
      .limit(0);
    
    if (connectionError && !connectionError.message.includes('does not exist')) {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }
    console.log('✅ Basic connection working');
    
    // Check if categories table exists
    console.log('\n2️⃣ Checking categories table...');
    const { data: categories, error: catError } = await supabase
      .from('stock_categories')
      .select('*')
      .limit(3);
      
    if (catError) {
      console.error('❌ Categories table error:', catError.message);
      if (catError.message.includes('does not exist')) {
        console.log('💡 Table may not exist or schema cache needs refresh');
      }
    } else {
      console.log(`✅ Categories table found! ${categories.length} categories exist`);
      categories.forEach(cat => console.log(`   - ${cat.name_nl || cat.name}`));
    }
    
    // Check if products table exists
    console.log('\n3️⃣ Checking products table...');
    const { data: products, error: prodError } = await supabase
      .from('stock_products')
      .select('*')
      .limit(3);
      
    if (prodError) {
      console.error('❌ Products table error:', prodError.message);
      if (prodError.message.includes('does not exist')) {
        console.log('💡 Table may not exist or schema cache needs refresh');
      }
    } else {
      console.log(`✅ Products table found! ${products.length} products exist`);
      if (products.length > 0) {
        products.forEach(prod => console.log(`   - ${prod.name}`));
      } else {
        console.log('   (No products yet - this is expected for new setup)');
      }
    }
    
    // Try to refresh schema cache by making a simple insert/delete
    console.log('\n4️⃣ Attempting to refresh schema cache...');
    
    if (!catError && !prodError) {
      console.log('✅ Both tables working - schema cache is fine');
      console.log('\n🎉 Database is ready! Backend should work now.');
    } else {
      console.log('\n🔧 SOLUTIONS:');
      console.log('1. Wait 1-2 minutes for Supabase schema cache to refresh');
      console.log('2. Go to Supabase Dashboard → Settings → API → Reset API');  
      console.log('3. Restart the backend server after waiting');
      console.log('4. If still failing, check table permissions in Supabase RLS settings');
    }
    
  } catch (error) {
    console.error('💥 Database verification failed:', error.message);
    console.log('\n🔧 Check:');
    console.log('1. Supabase URL and Service Role Key in .env');
    console.log('2. Tables were created successfully in Supabase SQL Editor');
    console.log('3. Service role has proper permissions');
  }
}

verifyDatabase().then(() => {
  console.log('\n✨ Verification completed');
}).catch(error => {
  console.error('Script error:', error);
});