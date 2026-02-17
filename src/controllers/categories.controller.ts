import { Request, Response } from 'express';
import { SupabaseStockService } from '../services/supabase';

export class CategoriesController {
  // GET /api/v1/categories
  async getCategories(req: Request, res: Response) {
    try {
      
      const includeInactive = req.query.include_inactive === 'true';
      const categories = await const stockService = new SupabaseStockService(); stockService.getCategories(includeInactive);
      
      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/categories/:id
  async getCategoryById(req: Request, res: Response) {
    try {
      
      const { id } = req.params;
      const category = await const stockService = new SupabaseStockService(); stockService.getCategoryById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Category not found'
        });
      }
      
      res.json({
        success: true,
        data: category
      });
    } catch (error) {
      console.error('Error in getCategoryById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/v1/categories
  async createCategory(req: Request, res: Response) {
    try {
      
      const categoryData = req.body;
      
      // Basic validation
      if (!categoryData.name || categoryData.name.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Category name is required'
        });
      }

      const category = await const stockService = new SupabaseStockService(); stockService.createCategory(categoryData);
      
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully'
      });
    } catch (error) {
      console.error('Error in createCategory:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Category name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // PUT /api/v1/categories/:id
  async updateCategory(req: Request, res: Response) {
    try {
      
      const { id } = req.params;
      const categoryData = req.body;
      
      // Check if category exists
      const existingCategory = await const stockService = new SupabaseStockService(); stockService.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Category not found'
        });
      }

      const category = await const stockService = new SupabaseStockService(); stockService.updateCategory(id, categoryData);
      
      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully'
      });
    } catch (error) {
      console.error('Error in updateCategory:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Category name already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/v1/categories/:id
  async deleteCategory(req: Request, res: Response) {
    try {
      
      const { id } = req.params;
      
      // Check if category exists
      const existingCategory = await const stockService = new SupabaseStockService(); stockService.getCategoryById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Category not found'
        });
      }

      await const stockService = new SupabaseStockService(); stockService.deleteCategory(id);
      
      res.json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteCategory:', error);
      
      if (error instanceof Error && error.message.includes('existing products')) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Cannot delete category with existing products'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/v1/categories/:id/summary
  async getCategorySummary(req: Request, res: Response) {
    try {
      
      const summaries = await const stockService = new SupabaseStockService(); stockService.getCategorySummaries();
      const { id } = req.params;
      
      const summary = summaries.find(s => s.category_id === id);
      
      if (!summary) {
        return res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Category not found'
        });
      }
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error in getCategorySummary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}