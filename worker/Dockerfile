# Build stage
FROM node:20-alpine AS builder

# Install ffmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

# Install ffmpeg for video processing
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create directories for uploads and temp files
RUN mkdir -p /app/uploads /app/temp && \
    chown -R node:node /app

# Switch to non-root user
USER node

# Start worker
CMD ["node", "dist/index.js"]
