#!/bin/bash

# Generate self-signed SSL certificates for Morphorama
# For production, replace with Let's Encrypt certificates

set -e

DOMAIN=${1:-localhost}
SSL_DIR="./nginx/ssl"

echo "Generating self-signed SSL certificate for $DOMAIN..."

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/key.pem" \
  -out "$SSL_DIR/cert.pem" \
  -subj "/C=SE/ST=State/L=City/O=Morphorama/OU=IT/CN=$DOMAIN"

chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo "✅ SSL certificate generated successfully!"
echo "   Certificate: $SSL_DIR/cert.pem"
echo "   Key: $SSL_DIR/key.pem"
echo ""
echo "⚠️  This is a self-signed certificate for development."
echo "   For production, use Let's Encrypt:"
echo "   certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
