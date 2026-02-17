import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller';

const router = Router();
const productsController = new ProductsController();

// GET /api/v1/products - Get all products with filtering
router.get('/', productsController.getProducts.bind(productsController));

// GET /api/v1/products/low-stock - Get low stock products
router.get('/low-stock', productsController.getLowStockProducts.bind(productsController));

// GET /api/v1/products/out-of-stock - Get out of stock products
router.get('/out-of-stock', productsController.getOutOfStockProducts.bind(productsController));

// GET /api/v1/products/:id - Get product by ID
router.get('/:id', productsController.getProductById.bind(productsController));

// POST /api/v1/products - Create new product
router.post('/', productsController.createProduct.bind(productsController));

// PUT /api/v1/products/:id - Update product
router.put('/:id', productsController.updateProduct.bind(productsController));

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', productsController.deleteProduct.bind(productsController));

// POST /api/v1/products/:id/quantity - Update product quantity directly
router.post('/:id/quantity', productsController.updateQuantity.bind(productsController));

// POST /api/v1/products/:id/adjust - Adjust product quantity with history
router.post('/:id/adjust', productsController.adjustQuantity.bind(productsController));

// GET /api/v1/products/:id/history - Get product transaction history
router.get('/:id/history', productsController.getProductHistory.bind(productsController));

export default router;