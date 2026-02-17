// Stock Management Models
export interface StockCategory {
  id: string;
  name: string;
  name_nl?: string;
  name_fr?: string;
  name_en?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StockProduct {
  id: string;
  category_id: string;
  name: string;
  name_nl?: string;
  name_fr?: string;
  name_en?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  unit: string;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point?: number;
  cost_price?: number;
  supplier_info?: any;
  storage_location?: string;
  expiry_tracking?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  category?: StockCategory;
}

export interface StockHistory {
  id: string;
  product_id: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_number?: string;
  notes?: string;
  performed_by?: string;
  transaction_date?: string;
  created_at?: string;
  metadata?: any;
  
  // Joined data
  product?: StockProduct;
}

export interface StockLocation {
  id: string;
  name: string;
  description?: string;
  location_type?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StockProductLocation {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at?: string;
  
  // Joined data
  product?: StockProduct;
  location?: StockLocation;
}

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRING';
  alert_level: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  is_read?: boolean;
  is_resolved?: boolean;
  created_at?: string;
  resolved_at?: string;
  
  // Joined data
  product?: StockProduct;
}

// Request/Response DTOs
export interface CreateStockCategoryDto {
  name: string;
  name_nl?: string;
  name_fr?: string;
  name_en?: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
}

export interface UpdateStockCategoryDto extends Partial<CreateStockCategoryDto> {}

export interface CreateStockProductDto {
  category_id: string;
  name: string;
  name_nl?: string;
  name_fr?: string;
  name_en?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  unit: string;
  current_quantity: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point?: number;
  cost_price?: number;
  supplier_info?: any;
  storage_location?: string;
  expiry_tracking?: boolean;
}

export interface UpdateStockProductDto extends Partial<CreateStockProductDto> {}

export interface StockTransactionDto {
  product_id: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity_change: number;
  unit_cost?: number;
  reference_number?: string;
  notes?: string;
  performed_by?: string;
  metadata?: any;
}

export interface StockSummary {
  total_products: number;
  total_categories: number;
  out_of_stock: number;
  low_stock: number;
  total_value: number;
  recent_transactions: number;
  unread_alerts: number;
}

export interface CategorySummary {
  category_id: string;
  category_name: string;
  total_products: number;
  out_of_stock: number;
  low_stock: number;
  total_value: number;
}

// Query parameters
export interface StockQueryParams {
  category_id?: string;
  location_id?: string;
  is_active?: boolean;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean;
  search?: string;
  sort_by?: 'name' | 'quantity' | 'updated_at' | 'category';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}