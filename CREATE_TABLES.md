# Create AdaStock Database Tables

Since you don't see products in the database, the tables haven't been created yet. Here's how to create them:

## Option 1: Use Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Your Project → SQL Editor
3. **Copy and paste this SQL**, then click "Run":

```sql
-- Create Categories Table
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

-- Create Products Table  
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

-- Insert Default Categories
INSERT INTO stock_categories (id, name, name_nl, name_fr, name_en, color, sort_order) VALUES
(1, 'vegetables', 'Groenten', 'Légumes', 'Vegetables', '#22c55e', 1),
(2, 'fruits', 'Fruit', 'Fruits', 'Fruits', '#f59e0b', 2),
(3, 'dairy', 'Zuivel', 'Produits laitiers', 'Dairy', '#3b82f6', 3),
(4, 'meat', 'Vlees', 'Viande', 'Meat', '#ef4444', 4),
(5, 'seafood', 'Zeevruchten', 'Fruits de mer', 'Seafood', '#06b6d4', 5),
(6, 'drygoods', 'Droge waren', 'Produits secs', 'Dry Goods', '#a855f7', 6),
(7, 'oils', 'Oliën', 'Huiles', 'Oils & Vinegars', '#eab308', 7),
(8, 'herbs', 'Kruiden', 'Herbes', 'Herbs & Spices', '#10b981', 8),
(9, 'beverages', 'Dranken', 'Boissons', 'Beverages', '#8b5cf6', 9),
(10, 'other', 'Overig', 'Autre', 'Other', '#6b7280', 10)
ON CONFLICT (id) DO NOTHING;
```

## Option 2: Use Table Editor (Alternative)

1. **Go to**: Your Project → Table Editor
2. **Create New Table**: "stock_categories"
   - Add columns: id (int8), name (text), name_nl (text), name_fr (text), name_en (text), color (text), sort_order (int4), created_at (timestamptz)
3. **Create New Table**: "stock_products" 
   - Add columns: id (int8), category_id (int8), name (text), unit (text), current_quantity (numeric), minimum_stock (numeric), created_at (timestamptz), updated_at (timestamptz)
4. **Add Foreign Key**: stock_products.category_id → stock_categories.id

## After Creating Tables

1. **Restart the backend server** (it will detect the tables automatically)
2. **Refresh the frontend** - you should now see "0 products" instead of sample products
3. **Add a new product** - it will save to the database and persist
4. **Check Supabase Table Editor** - you'll see your products there

## Verify Setup

Test the API endpoints:
- `GET /api/v1/categories` → Should return 10 categories
- `GET /api/v1/products` → Should return empty array `[]`
- `POST /api/v1/products` → Should create and save to database

Once tables are created, the app will only show real database products!