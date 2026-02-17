const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function refreshSchema() {
  console.log('🔄 Attempting to refresh Supabase schema cache...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  try {
    // Method 1: Force schema refresh with REST API call
    console.log('1️⃣ Trying REST API schema refresh...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   REST API response:', response.status);
    
    // Method 2: Try to get schema info directly
    console.log('2️⃣ Checking schema via information_schema...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Query system tables to check if our tables exist
    const { data: tableCheck, error: tableError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('stock_categories', 'stock_products')
        ORDER BY table_name;
      `
    });
    
    if (tableError) {
      console.log('   System query not available, trying alternative...');
      
      // Method 3: Simple select with timeout
      console.log('3️⃣ Trying direct table access...');
      
      const promises = [
        supabase.from('stock_categories').select('count', { count: 'exact' }).single(),
        supabase.from('stock_products').select('count', { count: 'exact' }).single()
      ];
      
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        const tableName = index === 0 ? 'stock_categories' : 'stock_products';
        if (result.status === 'fulfilled' && !result.value.error) {
          console.log(`   ✅ ${tableName} table accessible`);
        } else if (result.value?.error) {
          console.log(`   ❌ ${tableName} error:`, result.value.error.message);
        }
      });
      
    } else {
      console.log('   ✅ Schema query successful:', tableCheck);
    }
    
    console.log('\n🕐 Waiting 10 seconds for cache refresh...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Test final access
    console.log('4️⃣ Testing final access...');
    const { data: finalTest, error: finalError } = await supabase
      .from('stock_categories')
      .select('*')
      .limit(1);
      
    if (finalError) {
      console.log('   ❌ Still having issues:', finalError.message);
      console.log('\n🔧 MANUAL SOLUTIONS:');
      console.log('1. Go to Supabase Dashboard → Settings → API');
      console.log('2. Click "Reset API" button');
      console.log('3. Wait 2-3 minutes');
      console.log('4. Restart backend server');
      console.log('5. If still failing, check RLS policies are disabled or set correctly');
    } else {
      console.log('   ✅ Success! Tables are now accessible');
      console.log('   Found categories:', finalTest.length);
    }
    
  } catch (error) {
    console.error('💥 Schema refresh failed:', error.message);
  }
}

refreshSchema().then(() => {
  console.log('\n✨ Schema refresh completed');
}).catch(error => {
  console.error('Script error:', error);
});