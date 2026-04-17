# Stage 1: Build the application
FROM node:20-slim AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Define build arguments for secure key injection
ARG VITE_GEMINI_API_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_DATABASE_URL
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_DIRECTIONS_API_KEY
ARG VITE_GOOGLE_GEOCODING_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN

# Set environment variables for the build process
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_DATABASE_URL=$VITE_FIREBASE_DATABASE_URL
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_DIRECTIONS_API_KEY=$VITE_GOOGLE_DIRECTIONS_API_KEY
ENV VITE_GOOGLE_GEOCODING_API_KEY=$VITE_GOOGLE_GEOCODING_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN

# Copy the rest of the application code
COPY . .

# Explicitly create .env.production using build args to ensure Vite bakes them in
RUN echo "VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY" > .env.production && \
    echo "VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY" >> .env.production && \
    echo "VITE_FIREBASE_DATABASE_URL=$VITE_FIREBASE_DATABASE_URL" >> .env.production && \
    echo "VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID" >> .env.production && \
    echo "VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY" >> .env.production && \
    echo "VITE_GOOGLE_DIRECTIONS_API_KEY=$VITE_GOOGLE_DIRECTIONS_API_KEY" >> .env.production && \
    echo "VITE_GOOGLE_GEOCODING_API_KEY=$VITE_GOOGLE_GEOCODING_API_KEY" >> .env.production && \
    echo "VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN" >> .env.production

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
