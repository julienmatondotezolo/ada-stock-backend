import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupDatabase() {
  console.log('🚀 Setting up Ada Stock database...');

  try {
    // Create categories table
    console.log('📝 Creating stock_categories table...');
    const { error: categoriesError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS stock_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      `
    });

    if (categoriesError) {
      console.log('⚠️ Categories table might already exist or other issue:', categoriesError.message);
    }

    // Create products table
    console.log('📝 Creating stock_products table...');
    const { error: productsError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS stock_products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          category_id UUID NOT NULL REFERENCES stock_categories(id) ON DELETE RESTRICT,
          name VARCHAR(200) NOT NULL,
          name_nl VARCHAR(200),
          name_fr VARCHAR(200),
          name_en VARCHAR(200),
          description TEXT,
          sku VARCHAR(100),
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
      `
    });

    if (productsError) {
      console.log('⚠️ Products table might already exist or other issue:', productsError.message);
    }

    // Insert default categories
    console.log('📚 Inserting default categories...');
    const categories = [
      { name: 'vegetables', name_nl: 'Groenten', name_fr: 'Légumes', name_en: 'Vegetables', description: 'Fresh vegetables and produce', color: '#22c55e', sort_order: 1 },
      { name: 'fruits', name_nl: 'Fruit', name_fr: 'Fruits', name_en: 'Fruits', description: 'Fresh fruits', color: '#f59e0b', sort_order: 2 },
      { name: 'dairy', name_nl: 'Zuivel', name_fr: 'Produits laitiers', name_en: 'Dairy', description: 'Milk, cheese, yogurt, butter', color: '#3b82f6', sort_order: 3 },
      { name: 'meat', name_nl: 'Vlees', name_fr: 'Viande', name_en: 'Meat', description: 'Fresh meat and poultry', color: '#ef4444', sort_order: 4 },
      { name: 'seafood', name_nl: 'Zeevruchten', name_fr: 'Fruits de mer', name_en: 'Seafood', description: 'Fish and seafood', color: '#06b6d4', sort_order: 5 },
      { name: 'drygoods', name_nl: 'Droge waren', name_fr: 'Produits secs', name_en: 'Dry Goods', description: 'Pasta, rice, flour, grains', color: '#a855f7', sort_order: 6 },
      { name: 'oils', name_nl: 'Oliën', name_fr: 'Huiles', name_en: 'Oils & Vinegars', description: 'Cooking oils and vinegars', color: '#eab308', sort_order: 7 },
      { name: 'herbs', name_nl: 'Kruiden', name_fr: 'Herbes', name_en: 'Herbs & Spices', description: 'Fresh herbs and dried spices', color: '#10b981', sort_order: 8 },
      { name: 'beverages', name_nl: 'Dranken', name_fr: 'Boissons', name_en: 'Beverages', description: 'Drinks and beverages', color: '#8b5cf6', sort_order: 9 },
      { name: 'frozen', name_nl: 'Diepvries', name_fr: 'Surgelés', name_en: 'Frozen', description: 'Frozen products', color: '#14b8a6', sort_order: 10 },
      { name: 'other', name_nl: 'Overig', name_fr: 'Autre', name_en: 'Other', description: 'Other items', color: '#6b7280', sort_order: 11 }
    ];

    const { data: insertedCategories, error: insertError } = await supabase
      .from('stock_categories')
      .upsert(categories, { onConflict: 'name' })
      .select();

    if (insertError) {
      console.error('❌ Error inserting categories:', insertError);
    } else {
      console.log(`✅ Inserted ${insertedCategories?.length} categories`);
    }

    // Insert sample products
    console.log('🍅 Inserting sample products...');
    
    // Get category IDs
    const { data: existingCategories } = await supabase
      .from('stock_categories')
      .select('id, name');

    if (existingCategories && existingCategories.length > 0) {
      const categoryMap: { [key: string]: string } = {};
      existingCategories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      const sampleProducts = [
        {
          category_id: categoryMap['vegetables'],
          name: 'Tomaten / Tomates / Tomatoes',
          name_nl: 'Tomaten',
          name_fr: 'Tomates', 
          name_en: 'Tomatoes',
          unit: 'kg',
          current_quantity: 5,
          minimum_stock: 10,
          description: 'Fresh tomatoes for cooking'
        },
        {
          category_id: categoryMap['dairy'],
          name: 'Mozzarella',
          unit: 'pcs',
          current_quantity: 8,
          minimum_stock: 5,
          description: 'Mozzarella cheese'
        },
        {
          category_id: categoryMap['drygoods'],
          name: 'Pasta',
          unit: 'kg',
          current_quantity: 25,
          minimum_stock: 15,
          description: 'Dried pasta'
        },
        {
          category_id: categoryMap['oils'],
          name: 'Olijfolie / Huile d\'olive / Olive Oil',
          name_nl: 'Olijfolie',
          name_fr: 'Huile d\'olive',
          name_en: 'Olive Oil',
          unit: 'L',
          current_quantity: 2,
          minimum_stock: 5,
          description: 'Extra virgin olive oil'
        },
        {
          category_id: categoryMap['herbs'],
          name: 'Basilicum / Basilic / Basil',
          name_nl: 'Basilicum',
          name_fr: 'Basilic',
          name_en: 'Basil',
          unit: 'bunch',
          current_quantity: 12,
          minimum_stock: 8,
          description: 'Fresh basil leaves'
        },
        {
          category_id: categoryMap['drygoods'],
          name: 'Bloem / Farine / Flour',
          name_nl: 'Bloem',
          name_fr: 'Farine',
          name_en: 'Flour',
          unit: 'kg',
          current_quantity: 18,
          minimum_stock: 20,
          description: 'All-purpose flour'
        },
        {
          category_id: categoryMap['dairy'],
          name: 'Parmesan',
          unit: 'pcs',
          current_quantity: 0,
          minimum_stock: 3,
          description: 'Parmesan cheese'
        },
        {
          category_id: categoryMap['herbs'],
          name: 'Oregano',
          unit: 'pack',
          current_quantity: 1,
          minimum_stock: 5,
          description: 'Dried oregano'
        }
      ];

      const { data: insertedProducts, error: productsInsertError } = await supabase
        .from('stock_products')
        .insert(sampleProducts)
        .select();

      if (productsInsertError) {
        console.error('❌ Error inserting products:', productsInsertError);
      } else {
        console.log(`✅ Inserted ${insertedProducts?.length} sample products`);
      }
    }

    console.log('🎉 Database setup complete!');
    console.log('📡 Backend should now work properly at http://localhost:3055');
    console.log('🧪 Test with: curl http://localhost:3055/api/v1/categories');

  } catch (error) {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();