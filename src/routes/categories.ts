import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller';

const router = Router();
const categoriesController = new CategoriesController();

// GET /api/v1/categories - Get all categories
router.get('/', categoriesController.getCategories.bind(categoriesController));

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', categoriesController.getCategoryById.bind(categoriesController));

// POST /api/v1/categories - Create new category
router.post('/', categoriesController.createCategory.bind(categoriesController));

// PUT /api/v1/categories/:id - Update category
router.put('/:id', categoriesController.updateCategory.bind(categoriesController));

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', categoriesController.deleteCategory.bind(categoriesController));

// GET /api/v1/categories/:id/summary - Get category summary
router.get('/:id/summary', categoriesController.getCategorySummary.bind(categoriesController));

export default router;