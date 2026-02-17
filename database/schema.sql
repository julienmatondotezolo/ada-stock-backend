-- Ada Stock Management Database Schema
-- For L'Osteria Restaurant Stock Management System

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
    color VARCHAR(7) DEFAULT '#22c55e', -- Ada Green
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
    unit VARCHAR(20) NOT NULL DEFAULT 'pcs', -- kg, g, L, ml, pcs, pack, bottle, can, box, bag, bunch, jar
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

-- Stock Transactions/History Table
CREATE TABLE IF NOT EXISTS stock_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'IN', 'OUT', 'ADJUSTMENT', 'WASTE', 'TRANSFER'
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
    
    -- Metadata for different transaction types
    metadata JSONB
);

-- Stock Locations Table (optional for multi-location tracking)
CREATE TABLE IF NOT EXISTS stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    location_type VARCHAR(50), -- 'storage', 'kitchen', 'bar', 'freezer', 'fridge'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Product Locations (for tracking products across multiple locations)
CREATE TABLE IF NOT EXISTS stock_product_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(product_id, location_id),
    CONSTRAINT check_location_quantity CHECK (quantity >= 0)
);

-- Stock Alerts Table
CREATE TABLE IF NOT EXISTS stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES stock_products(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL, -- 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCK', 'EXPIRING'
    alert_level VARCHAR(10) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_products_category ON stock_products(category_id);
CREATE INDEX IF NOT EXISTS idx_stock_products_sku ON stock_products(sku);
CREATE INDEX IF NOT EXISTS idx_stock_products_barcode ON stock_products(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_products_active ON stock_products(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(transaction_date);
CREATE INDEX IF NOT EXISTS idx_stock_history_type ON stock_history(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_unread ON stock_alerts(is_read) WHERE is_read = false;

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_stock_categories_updated_at BEFORE UPDATE ON stock_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_products_updated_at BEFORE UPDATE ON stock_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_locations_updated_at BEFORE UPDATE ON stock_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_product_locations_updated_at BEFORE UPDATE ON stock_product_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create stock alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for low stock
    IF NEW.current_quantity <= NEW.minimum_stock AND NEW.current_quantity > 0 THEN
        INSERT INTO stock_alerts (product_id, alert_type, alert_level, message)
        VALUES (
            NEW.id,
            'LOW_STOCK',
            'WARNING',
            'Product "' || NEW.name || '" is running low. Current: ' || NEW.current_quantity || ' ' || NEW.unit || ', Minimum: ' || NEW.minimum_stock || ' ' || NEW.unit
        );
    END IF;
    
    -- Check for out of stock
    IF NEW.current_quantity = 0 THEN
        INSERT INTO stock_alerts (product_id, alert_type, alert_level, message)
        VALUES (
            NEW.id,
            'OUT_OF_STOCK',
            'CRITICAL',
            'Product "' || NEW.name || '" is out of stock!'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for stock level alerts
CREATE TRIGGER stock_level_alert_trigger 
    AFTER UPDATE OF current_quantity ON stock_products
    FOR EACH ROW 
    WHEN (NEW.current_quantity != OLD.current_quantity)
    EXECUTE FUNCTION check_stock_levels();

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