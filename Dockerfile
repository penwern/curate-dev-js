# Multi-stage build for JavaScript bundle
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY webpack.config.js ./

# Build the JavaScript bundle
RUN npm run build

# Production stage - serve the built files
FROM nginx:alpine

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create a simple nginx config for serving JS files with CORS
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    # Enable CORS for script tag embedding \
    add_header Access-Control-Allow-Origin *; \
    add_header Access-Control-Allow-Methods "GET, OPTIONS"; \
    add_header Access-Control-Allow-Headers "Content-Type"; \
    \
    # Serve static files \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ =404; \
        \
        # Cache control for JS files \
        location ~* \\.js$ { \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
            add_header Access-Control-Allow-Origin *; \
        } \
    } \
    \
    # Health check endpoint \
    location /health { \
        access_log off; \
        return 200 "healthy\\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 