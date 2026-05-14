# Multi-stage build: dependencies are installed in the first stage.
FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Runtime stage: only required application files are copied.
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

EXPOSE 3000

CMD ["npm", "start"]
