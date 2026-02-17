-- Create the tables directly in Supabase SQL Editor
-- Copy and paste this into the Supabase SQL tab

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stock Categories Table
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

-- Stock Products Table
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

-- Stock History Table
CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL,
    quantity_change DECIMAL(10,2) NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL,
    new_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_number VARCHAR(100),
    notes TEXT,
    performed_by VARCHAR(100),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Insert default categories
INSERT INTO stock_categories (name, name_nl, name_fr, name_en, description, color, sort_order) VALUES
('vegetables', 'Groenten', 'Légumes', 'Vegetables', 'Fresh vegetables and produce', '#22c55e', 1),
('fruits', 'Fruit', 'Fruits', 'Fruits', 'Fresh fruits', '#f59e0b', 2),
('dairy', 'Zuivel', 'Produits laitiers', 'Dairy', 'Milk, cheese, yogurt, butter', '#3b82f6', 3),
('meat', 'Vlees', 'Viande', 'Meat', 'Fresh meat and poultry', '#ef4444', 4),
('seafood', 'Zeevruchten', 'Fruits de mer', 'Seafood', 'Fish and seafood', '#06b6d4', 5),
('drygoods', 'Droge waren', 'Produits secs', 'Dry Goods', 'Pasta, rice, flour, grains', '#a855f7', 6),
('oils', 'Oliën', 'Huiles', 'Oils & Vinegars', 'Cooking oils and vinegars', '#eab308', 7),
('herbs', 'Kruiden', 'Herbes', 'Herbs & Spices', 'Fresh herbs and dried spices', '#10b981', 8),
('beverages', 'Dranken', 'Boissons', 'Beverages', 'Drinks and beverages', '#8b5cf6', 9),
('frozen', 'Diepvries', 'Surgelés', 'Frozen', 'Frozen products', '#14b8a6', 10),
('other', 'Overig', 'Autre', 'Other', 'Other items', '#6b7280', 11)
ON CONFLICT (name) DO NOTHING;