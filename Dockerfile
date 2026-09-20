# Stage 1: Build static assets
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
RUN npm install

# Copy project files and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with lightweight Nginx Alpine
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
