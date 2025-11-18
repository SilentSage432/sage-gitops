# --- Build stage ---
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    npm cache clean --force

COPY . .

# Build-time configuration
ARG VITE_API_BASE=/api
ARG VITE_BUILD_ID=dev

# Expose to Vite build
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_BUILD_ID=${VITE_BUILD_ID}

# Build the static bundle
    # Using prebuilt dist from host; skip npm run build in container
    RUN echo 'Using prebuilt dist from host; build already done locally'

# --- Runtime stage ---
FROM nginxinc/nginx-unprivileged:1.27-alpine

# NGINX config for UI + /api proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY proxy_params /etc/nginx/proxy_params

# Static assets
COPY dist /usr/share/nginx/html

EXPOSE 8080

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]