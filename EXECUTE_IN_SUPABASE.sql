-- 🏗️ EXECUTE THIS SQL IN SUPABASE SQL EDITOR  
-- 🔗 Go to: https://supabase.com/dashboard/project/dxxtxdyrovawugvvrhah/sql
-- 📋 Copy and paste this entire content, then click "Run"

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stock Categories Table
CREATE TABLE IF NOT EXISTS stock_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES stock_categories(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    name_nl VARCHAR(200),
    name_fr VARCHAR(200),
    name_en VARCHAR(200),
    description TEXT,
    sku VARCHAR(100) UNIQUE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Stock Locations Table
CREATE TABLE IF NOT EXISTS stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    location_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Alerts Table
CREATE TABLE IF NOT EXISTS stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL,
    alert_level VARCHAR(10) DEFAULT 'INFO',
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_products_category ON stock_products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_products_sku ON stock_products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_products_active ON stock_products(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(transaction_date);

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
('canned', 'Ingeblikt', 'Conserves', 'Canned', 'Canned and preserved goods', '#f97316', 11),
('other', 'Overig', 'Autre', 'Other', 'Other items', '#6b7280', 12)
ON CONFLICT (name) DO NOTHING;

-- Insert default locations
INSERT INTO stock_locations (name, description, location_type) VALUES
('Main Storage', 'Primary storage area', 'storage'),
('Kitchen', 'Kitchen area', 'kitchen'),
('Bar', 'Bar area', 'bar'),
('Refrigerator', 'Main refrigerator', 'fridge'),
('Freezer', 'Main freezer', 'freezer'),
('Dry Storage', 'Dry goods storage', 'storage')
ON CONFLICT (name) DO NOTHING;