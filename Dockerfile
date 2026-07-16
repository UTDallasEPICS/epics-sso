################################################################################
# Base image
FROM node:22-alpine AS base
WORKDIR /app

################################################################################
# Dependencies stage
FROM base AS dependencies

COPY package*.json ./
RUN npm i

################################################################################
# Production stage
FROM dependencies AS production

COPY . .

CMD ["node", "src/app.js"]
