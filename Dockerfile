FROM node:22-alpine AS deps
RUN npm install -g npm@latest
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY prisma ./prisma/
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist
COPY prisma ./prisma/
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]
