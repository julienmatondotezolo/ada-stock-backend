#!/bin/bash

# AdaStock Backend Deployment Script for VPS
# Domain: adastock.mindgen.app
# VPS: 46.224.93.79

set -e

echo "🚀 Starting AdaStock Backend deployment..."

VPS_HOST="root@46.224.93.79"
VPS_PASSWORD="9rK2mX5vLqW8nJ4zB1dP"
DOMAIN="adastock.mindgen.app"
APP_NAME="adasstock-backend"
APP_DIR="/root/app/adasstock"
BACKUP_DIR="/root/backups/adasstock"

echo "📦 Creating deployment package..."

# Create deployment directory
rm -rf deploy-temp
mkdir -p deploy-temp

# Copy files excluding deploy-temp directory to prevent recursion
rsync -av --exclude 'deploy-temp' --exclude 'node_modules' --exclude '.git' --exclude 'test-results' . deploy-temp/
cd deploy-temp

# Clean up development files
rm -rf node_modules
rm -rf .git
rm -rf deploy-temp
rm -rf test-results

# Copy production environment
cp .env.production .env

echo "📤 Uploading to VPS..."

# Create backup of current version
sshpass -p "$VPS_PASSWORD" ssh $VPS_HOST "mkdir -p $BACKUP_DIR && test -d $APP_DIR && cp -r $APP_DIR $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S) || echo 'No existing version to backup'"

# Upload files
sshpass -p "$VPS_PASSWORD" ssh $VPS_HOST "mkdir -p $APP_DIR"
sshpass -p "$VPS_PASSWORD" rsync -avz --exclude 'node_modules' --exclude '.git' . $VPS_HOST:$APP_DIR/

echo "🔧 Installing dependencies and starting service..."

sshpass -p "$VPS_PASSWORD" ssh $VPS_HOST << EOF
cd $APP_DIR

# Install dependencies
npm ci --only=production

# Stop existing service (if running)
pkill -f "adasstock-backend" || true
sleep 2

# Start new service with PM2 or nohup
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete $APP_NAME || true
    pm2 start npm --name "$APP_NAME" -- start
    pm2 save
else
    # Fallback to nohup
    nohup npm start > /var/log/adasstock-backend.log 2>&1 &
fi

# Test if service is running
sleep 3
curl -f http://localhost:3055/health && echo "✅ Service is running!" || echo "❌ Service failed to start"

EOF

cd ..
rm -rf deploy-temp

echo "🌐 Verifying domain access..."
sleep 5
curl -f https://$DOMAIN/health && echo "✅ Domain is accessible!" || echo "⚠️  Domain not yet accessible (may need DNS propagation)"

echo "🎉 Deployment completed!"
echo "🔗 API URL: https://$DOMAIN"
echo "🏥 Health Check: https://$DOMAIN/health"
echo "📚 API Documentation: https://$DOMAIN/api/v1"