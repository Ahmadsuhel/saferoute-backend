FROM node:20-alpine

# OpenSSL install karo — Prisma ke liye zaroori
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]