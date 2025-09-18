# FrontendService Dockerfile - Production Ready
# Author: Kode Creer <kode.creer@gmail.com>
# License: All rights reserved - Unlicensed

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration if exists, otherwise use default
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || echo "server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://mainservice:3000; \
        proxy_set_header Host \$host; \
        proxy_set_header X-Real-IP \$remote_addr; \
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto \$scheme; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S frontend -u 1001 -G nginx

# Set proper permissions
RUN chown -R frontend:nginx /usr/share/nginx/html && \
    chown -R frontend:nginx /var/cache/nginx && \
    chown -R frontend:nginx /var/log/nginx && \
    chown -R frontend:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R frontend:nginx /var/run/nginx.pid

USER frontend

# Expose port
EXPOSE 80

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]