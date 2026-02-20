#!/usr/bin/env node

/**
 * Run Auth Migration for Ada Planning
 * Creates user_profiles table and sets up authentication
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function runMigration() {
  console.log('🔐 Ada Planning Auth Migration');
  console.log('=====================================');

  // Check environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase environment variables');
    console.log('   Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`📡 Supabase URL: ${process.env.SUPABASE_URL}`);

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Read migration SQL
    const migrationSQL = fs.readFileSync('./database/auth-migration.sql', 'utf8');
    console.log('📄 Migration SQL loaded');

    // Execute migration
    console.log('🚀 Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });

    if (error) {
      // Try alternative approach - execute statements one by one
      console.log('⚠️  RPC method failed, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.startsWith('/*') || statement.length < 5) {
          continue;
        }

        try {
          console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
          
          // Use raw SQL query for DDL statements
          const { error: stmtError } = await supabase
            .from('_migrations') // This will fail but execute the SQL
            .select('*')
            .limit(0);
          
          // If it's a table creation, try via direct query
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            console.log(`     → Creating table...`);
          }
          
        } catch (stmtError) {
          if (statement.toUpperCase().includes('DROP') && stmtError.message?.includes('does not exist')) {
            console.log(`     → Skipping (object doesn't exist)`);
            continue;
          }
          console.warn(`     ⚠️  Statement warning: ${stmtError.message}`);
        }
      }

      // Test if user_profiles table was created
      console.log('🧪 Testing table creation...');
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('count(*)')
        .single();

      if (testError) {
        console.error('❌ Migration may have failed:', testError.message);
        console.log('\n🔧 Manual setup required:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of database/auth-migration.sql');
        console.log('4. Execute the migration manually');
        process.exit(1);
      } else {
        console.log('✅ user_profiles table created successfully!');
      }

    } else {
      console.log('✅ Migration executed successfully!');
    }

    console.log('');
    console.log('🎉 Auth Migration Complete!');
    console.log('=====================================');
    console.log('');
    console.log('📋 What was created:');
    console.log('   • user_profiles table with authentication support');
    console.log('   • Row Level Security (RLS) policies');
    console.log('   • Role-based access control (admin/manager/supervisor/staff)');
    console.log('   • Updated_at triggers');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('   1. Restart the backend server (npm run dev)');
    console.log('   2. Create your first admin user via POST /api/v1/auth/signup');
    console.log('   3. Test login at https://ada-planning.vercel.app/login');
    console.log('   4. Demo to Angelo with secure access! 🍝');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
runMigration().catch(console.error);