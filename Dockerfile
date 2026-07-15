################################################################################
# Base image
FROM node:22-alpine AS base
WORKDIR /app

################################################################################
# Dependencies stage
FROM base AS dependencies
# Copy package files
COPY package*.json ./
# Install dependencies
RUN npm i

################################################################################
# Build stage
FROM dependencies AS build
# Copy the rest of the source code
COPY . .
# Build the application
# RUN npm run build

################################################################################
# Production stage
FROM base AS production
# Copy the built application
# COPY --from=build /app/.output .output
# Set the command to run the server
# CMD ["node", ".output/server/index.mjs"]
CMD ["node", "src/app.js"]