const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRawSQL() {
  console.log('🧪 Testing raw SQL to bypass schema cache...');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Test 1: Check if tables exist using raw SQL
    console.log('1️⃣ Checking if tables actually exist...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'stock_%';` 
      });
    
    if (tablesError) {
      console.log('   Raw SQL not available via rpc');
    } else {
      console.log('   Tables found:', tables);
    }
    
    // Test 2: Try direct HTTP request to bypass JS client
    console.log('2️⃣ Testing direct HTTP request...');
    
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/stock_categories?limit=1`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   HTTP response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Direct HTTP worked! Categories:', data.length);
      
      // Test products too
      const prodResponse = await fetch(`${process.env.SUPABASE_URL}/rest/v1/stock_products?limit=1`, {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (prodResponse.ok) {
        const prodData = await prodResponse.json();
        console.log('   ✅ Products endpoint works too! Products:', prodData.length);
        console.log('\n🎉 TABLES EXIST! The issue is just the JS client schema cache.');
        console.log('\n🔧 SOLUTION: Manual API reset is required');
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ HTTP error:', errorText);
    }
    
  } catch (error) {
    console.error('💥 Raw SQL test failed:', error.message);
  }
}

testRawSQL().catch(console.error);