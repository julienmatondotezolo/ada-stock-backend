const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAfterFix() {
  console.log('🧪 Testing database after API reset...');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Test categories
    console.log('1️⃣ Testing categories...');
    const { data: categories, error: catError } = await supabase
      .from('stock_categories')
      .select('*')
      .limit(3);
      
    if (catError) {
      console.error('❌ Categories still failing:', catError.message);
      return false;
    } else {
      console.log(`✅ Categories working! Found ${categories.length} categories:`);
      categories.forEach(cat => console.log(`   - ${cat.name_nl}`));
    }
    
    // Test products
    console.log('\n2️⃣ Testing products...');
    const { data: products, error: prodError } = await supabase
      .from('stock_products')
      .select('*')
      .limit(3);
      
    if (prodError) {
      console.error('❌ Products still failing:', prodError.message);
      return false;
    } else {
      console.log(`✅ Products working! Found ${products.length} products`);
      if (products.length === 0) {
        console.log('   (No products yet - this is expected for fresh setup)');
      }
    }
    
    console.log('\n🎉 DATABASE IS READY!');
    console.log('✅ Backend server should work now');
    console.log('✅ Frontend should show 0 products instead of errors');
    
    return true;
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    return false;
  }
}

testAfterFix().then(success => {
  if (success) {
    console.log('\n🚀 Ready to test the app!');
    console.log('   Frontend: http://localhost:3200');
    console.log('   Backend: http://localhost:3055/api/v1/products');
  } else {
    console.log('\n❌ Still having issues. Try:');
    console.log('1. Double-check tables exist in Supabase Table Editor');
    console.log('2. Try API reset again and wait longer');
    console.log('3. Check RLS policies (may need to disable)');
  }
}).catch(console.error);