# Stage 1: Build the application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Variables are provided via dynamically created .env.production file.

# Copy the rest of the application code
COPY . .

# Build the app - Vite will bake the ENV variables into the static bundle
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (standard for Cloud Run)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
