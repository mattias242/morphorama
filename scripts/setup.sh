#!/bin/bash

# Morphorama Initial Setup Script
# Prepares the environment for first-time deployment

set -e

echo "🎨 Morphorama Setup Script"
echo "=========================="
echo ""

# Check if .env exists
if [ -f .env ]; then
  echo "⚠️  .env file already exists. Skipping environment setup."
  echo "   If you want to reset, delete .env and run this script again."
else
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "✅ .env created. Please edit it with your actual credentials!"
  echo ""
fi

# Check for Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker not found. Please install Docker first:"
  echo "   https://docs.docker.com/get-docker/"
  exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose not found. Please install Docker Compose:"
  echo "   https://docs.docker.com/compose/install/"
  exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Generate SSL certificates
DOMAIN=${1:-localhost}
echo "🔐 Generating SSL certificates for $DOMAIN..."
./scripts/generate-ssl.sh "$DOMAIN"
echo ""

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p backend/uploads backend/temp nginx/ssl
touch backend/uploads/.gitkeep backend/temp/.gitkeep
echo "✅ Directories created"
echo ""

echo "================================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys and credentials"
echo "2. Start services: docker-compose up -d --build"
echo "3. Run migrations: docker-compose exec backend npm run migrate"
echo "4. Access: https://$DOMAIN"
echo ""
echo "For help, see README.md"
