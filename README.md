# AdaStock Backend

Express.js REST API for AdaStock restaurant stock management system with Supabase PostgreSQL integration.

## Features

- 🚀 **Express.js API** - Fast, scalable Node.js backend
- 🐘 **PostgreSQL** - Robust database with Supabase integration
- 🔐 **Security** - Helmet, CORS, input validation
- 📊 **Complete CRUD** - Products, Categories, Stock History
- 🔄 **Partial Updates** - Efficient PUT endpoints for quantity updates
- 📈 **Dashboard Stats** - Real-time inventory analytics
- 🌐 **Cross-Origin** - Configured for frontend and network access
- 📝 **Comprehensive Logging** - Morgan HTTP logging + custom error handling
- 🏥 **Health Checks** - Service status and database connectivity monitoring
- 🐳 **Docker Ready** - Containerized for easy VPS deployment

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (via Supabase)
- **Language:** TypeScript
- **ORM:** Supabase Client
- **Security:** Helmet, CORS
- **Logging:** Morgan
- **Process Manager:** PM2 (production)

## API Endpoints

### Products
- `GET /api/v1/products` - List products with filtering
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product (partial updates supported)
- `DELETE /api/v1/products/:id` - Delete product
- `POST /api/v1/products/:id/quantity` - Update quantity only

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/:id` - Update category
- `DELETE /api/v1/categories/:id` - Delete category

### Health & Monitoring
- `GET /health` - Service health check
- `GET /api/v1/test-db` - Database connectivity test

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase account)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ada-stock-backend

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```bash
# Development Environment
NODE_ENV=development
PORT=3055

# Supabase Configuration (L'Osteria Database)
SUPABASE_URL=https://dxxtxdyrovawugvvrhah.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CORS Configuration
CORS_ORIGINS=http://localhost:3200,http://192.168.0.188:3200

# API Settings
API_PREFIX=/api/v1
MAX_REQUEST_SIZE=10mb
LOG_LEVEL=debug
```

### Database Setup

The backend requires these PostgreSQL tables in Supabase:

1. **Run the SQL schema** in Supabase SQL Editor:
   - Copy content from `EXECUTE_IN_SUPABASE.sql`
   - Paste in https://supabase.com/dashboard/project/[your-project]/sql
   - Execute the script

2. **Verify tables created:**
   - `stock_categories`
   - `stock_products`
   - `stock_history`
   - `stock_locations`

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run start` - Start production server
- `npm run start:prod` - Start with production environment
- `npm run build` - Compile TypeScript (if using compiled version)

## Production Deployment

### VPS Deployment (Automated)

The repository includes an automated deployment script for your VPS:

```bash
# Deploy to VPS (adastock.mindgen.app)
./deploy.sh
```

The script will:
1. Package the application
2. Upload to VPS (46.224.93.79)
3. Install dependencies
4. Start with PM2
5. Verify deployment

### Manual VPS Deployment

```bash
# SSH to VPS
ssh root@46.224.93.79

# Create app directory
mkdir -p /root/app/adasstock
cd /root/app/adasstock

# Upload files (from local machine)
rsync -avz . root@46.224.93.79:/root/app/adasstock/

# Install and start (on VPS)
npm ci --only=production
pm2 start npm --name "adasstock-backend" -- start
pm2 save
```

### Environment Configuration

Production environment (`.env.production`):

```bash
NODE_ENV=production
PORT=3001

# Production Supabase (same as development)
SUPABASE_URL=https://dxxtxdyrovawugvvrhah.supabase.co
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Production CORS (Vercel frontend)
CORS_ORIGINS=https://adasstock.vercel.app,https://adastock.mindgen.app

LOG_LEVEL=info
TRUST_PROXY=true
```

### Nginx Configuration

Your VPS should have nginx configured for `adastock.mindgen.app`:

```nginx
server {
    listen 443 ssl;
    server_name adastock.mindgen.app;

    ssl_certificate /etc/letsencrypt/live/adastock.mindgen.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/adastock.mindgen.app/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Docker Deployment

```bash
# Build image
docker build -t adasstock-backend .

# Run container
docker run -d \
  --name adasstock-backend \
  -p 3001:3001 \
  --env-file .env.production \
  adasstock-backend
```

## API Documentation

### Product Object

```json
{
  "id": "uuid",
  "category_id": "uuid",
  "name": "Product Name",
  "unit": "kg",
  "current_quantity": 25,
  "minimum_stock": 5,
  "cost_price": 12.50,
  "is_active": true,
  "created_at": "2026-02-17T12:00:00Z",
  "updated_at": "2026-02-17T12:00:00Z",
  "category": {
    "id": "uuid",
    "name": "vegetables",
    "name_nl": "Groenten",
    "name_fr": "Légumes",
    "name_en": "Vegetables"
  }
}
```

### Query Parameters

**Products Filtering:**
- `category_id` - Filter by category
- `search` - Search in name/SKU
- `low_stock_only` - Only products below minimum stock
- `out_of_stock_only` - Only products with 0 quantity
- `sort_by` - Sort field (name, quantity, etc.)
- `sort_order` - asc/desc
- `limit` - Maximum results
- `offset` - Pagination offset

### Error Responses

```json
{
  "success": false,
  "error": "Validation error",
  "message": "Current quantity cannot be negative"
}
```

## Database Schema

### Stock Categories
- Multi-language names (Dutch/French/English)
- Color coding and icons
- Sort ordering
- Active/inactive status

### Stock Products
- Full product information
- Category relationships
- Quantity tracking
- Cost price and supplier info
- Multi-language support

### Stock History
- Transaction logging
- Stock movements (IN/OUT/ADJUSTMENT)
- Audit trail with timestamps
- User attribution

## Monitoring & Logging

### Health Checks

- `GET /health` - Service status
- `GET /api/v1/test-db` - Database connectivity

### Logging

- **Development:** Detailed logs with debug level
- **Production:** Info level with error tracking
- **HTTP:** Morgan logging for all requests

### Error Handling

- Comprehensive error catching
- Database constraint validation
- Foreign key relationship checks
- Input sanitization and validation

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Update API documentation
4. Test with real database connections
5. Ensure CORS configuration works with frontend

## Support

For deployment issues:
- **VPS:** Check PM2 status with `pm2 list`
- **Database:** Verify Supabase connection
- **SSL:** Ensure certbot certificates are valid
- **Domain:** Check DNS configuration

---

Built for L'Osteria Deerlijk restaurant management system.