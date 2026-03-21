FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# ⬇️ ganti ini
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist
COPY public ./public

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "dist/server.js"]