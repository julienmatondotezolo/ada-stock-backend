import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { 
  StockCategory, 
  StockProduct, 
  StockHistory, 
  StockLocation, 
  StockAlert,
  CreateStockCategoryDto,
  UpdateStockCategoryDto,
  CreateStockProductDto,
  UpdateStockProductDto,
  StockTransactionDto,
  StockQueryParams,
  StockSummary,
  CategorySummary
} from '../models';

// Load environment variables
dotenv.config();

export class SupabaseStockService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  }

  // Stock Categories CRUD
  async getCategories(includeInactive: boolean = false): Promise<StockCategory[]> {
    let query = this.supabase
      .from('stock_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  }

  async getCategoryById(id: string): Promise<StockCategory | null> {
    const { data, error } = await this.supabase
      .from('stock_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching category:', error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }

    return data;
  }

  async createCategory(categoryData: CreateStockCategoryDto): Promise<StockCategory> {
    const { data, error } = await this.supabase
      .from('stock_categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  }

  async updateCategory(id: string, categoryData: UpdateStockCategoryDto): Promise<StockCategory> {
    const { data, error } = await this.supabase
      .from('stock_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }

  async deleteCategory(id: string): Promise<void> {
    // Check if category has products
    const { data: products } = await this.supabase
      .from('stock_products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (products && products.length > 0) {
      throw new Error('Cannot delete category with existing products');
    }

    const { error } = await this.supabase
      .from('stock_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  // Stock Products CRUD
  async getProducts(params: StockQueryParams = {}): Promise<StockProduct[]> {
    let query = this.supabase
      .from('stock_products')
      .select(`
        *,
        category:stock_categories(*)
      `);

    // Apply filters
    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }

    if (params.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    if (params.low_stock_only) {
      query = query.lte('current_quantity', 'minimum_stock');
    }

    if (params.out_of_stock_only) {
      query = query.eq('current_quantity', 0);
    }

    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }

    // Apply sorting
    const sortBy = params.sort_by || 'name';
    const sortOrder = params.sort_order === 'desc' ? false : true;
    query = query.order(sortBy, { ascending: sortOrder });

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
      if (params.offset) {
        query = query.range(params.offset, params.offset + params.limit - 1);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return data || [];
  }

  async getProductById(id: string): Promise<StockProduct | null> {
    const { data, error } = await this.supabase
      .from('stock_products')
      .select(`
        *,
        category:stock_categories(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return data;
  }

  async createProduct(productData: CreateStockProductDto): Promise<StockProduct> {
    const { data, error } = await this.supabase
      .from('stock_products')
      .insert([productData])
      .select(`
        *,
        category:stock_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return data;
  }

  async updateProduct(id: string, productData: UpdateStockProductDto): Promise<StockProduct> {
    const { data, error } = await this.supabase
      .from('stock_products')
      .update(productData)
      .eq('id', id)
      .select(`
        *,
        category:stock_categories(*)
      `)
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return data;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('stock_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  // Stock History/Transactions
  async recordTransaction(transactionData: StockTransactionDto): Promise<StockHistory> {
    // Get current product quantity
    const product = await this.getProductById(transactionData.product_id);
    if (!product) {
      throw new Error('Product not found');
    }

    const previousQuantity = product.current_quantity;
    const newQuantity = previousQuantity + transactionData.quantity_change;

    if (newQuantity < 0) {
      throw new Error('Cannot reduce quantity below zero');
    }

    // Create history record
    const historyData = {
      ...transactionData,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      total_cost: transactionData.unit_cost ? transactionData.unit_cost * Math.abs(transactionData.quantity_change) : null,
    };

    const { data: historyRecord, error: historyError } = await this.supabase
      .from('stock_history')
      .insert([historyData])
      .select(`
        *,
        product:stock_products(*)
      `)
      .single();

    if (historyError) {
      console.error('Error creating history record:', historyError);
      throw new Error(`Failed to create history record: ${historyError.message}`);
    }

    // Update product quantity
    await this.updateProduct(transactionData.product_id, {
      current_quantity: newQuantity
    });

    return historyRecord;
  }

  async getProductHistory(productId: string, limit: number = 50): Promise<StockHistory[]> {
    const { data, error } = await this.supabase
      .from('stock_history')
      .select(`
        *,
        product:stock_products(*)
      `)
      .eq('product_id', productId)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching product history:', error);
      throw new Error(`Failed to fetch product history: ${error.message}`);
    }

    return data || [];
  }

  async getRecentTransactions(limit: number = 20): Promise<StockHistory[]> {
    const { data, error } = await this.supabase
      .from('stock_history')
      .select(`
        *,
        product:stock_products(name, unit)
      `)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent transactions:', error);
      throw new Error(`Failed to fetch recent transactions: ${error.message}`);
    }

    return data || [];
  }

  // Stock Alerts
  async getAlerts(unreadOnly: boolean = false): Promise<StockAlert[]> {
    let query = this.supabase
      .from('stock_alerts')
      .select(`
        *,
        product:stock_products(name, unit)
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching alerts:', error);
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }

    return data || [];
  }

  async markAlertAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('stock_alerts')
      .update({ is_read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking alert as read:', error);
      throw new Error(`Failed to mark alert as read: ${error.message}`);
    }
  }

  async resolveAlert(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('stock_alerts')
      .update({ 
        is_resolved: true, 
        is_read: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error resolving alert:', error);
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }
  }

  // Dashboard Summary
  async getStockSummary(): Promise<StockSummary> {
    const [
      productsResult,
      categoriesResult,
      alertsResult,
      transactionsResult
    ] = await Promise.all([
      this.supabase.from('stock_products').select('current_quantity, minimum_stock, cost_price'),
      this.supabase.from('stock_categories').select('id').eq('is_active', true),
      this.supabase.from('stock_alerts').select('id').eq('is_read', false).eq('is_resolved', false),
      this.supabase.from('stock_history').select('id').gte('transaction_date', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const products = productsResult.data || [];
    const outOfStock = products.filter(p => p.current_quantity === 0).length;
    const lowStock = products.filter(p => p.current_quantity > 0 && p.current_quantity <= p.minimum_stock).length;
    const totalValue = products.reduce((sum, p) => sum + (p.current_quantity * (p.cost_price || 0)), 0);

    return {
      total_products: products.length,
      total_categories: categoriesResult.data?.length || 0,
      out_of_stock: outOfStock,
      low_stock: lowStock,
      total_value: totalValue,
      recent_transactions: transactionsResult.data?.length || 0,
      unread_alerts: alertsResult.data?.length || 0
    };
  }

  async getCategorySummaries(): Promise<CategorySummary[]> {
    const { data, error } = await this.supabase
      .from('stock_categories')
      .select(`
        id,
        name,
        stock_products(current_quantity, minimum_stock, cost_price)
      `)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching category summaries:', error);
      throw new Error(`Failed to fetch category summaries: ${error.message}`);
    }

    return (data || []).map(category => {
      const products = category.stock_products || [];
      const outOfStock = products.filter(p => p.current_quantity === 0).length;
      const lowStock = products.filter(p => p.current_quantity > 0 && p.current_quantity <= p.minimum_stock).length;
      const totalValue = products.reduce((sum, p) => sum + (p.current_quantity * (p.cost_price || 0)), 0);

      return {
        category_id: category.id,
        category_name: category.name,
        total_products: products.length,
        out_of_stock: outOfStock,
        low_stock: lowStock,
        total_value: totalValue
      };
    });
  }
}