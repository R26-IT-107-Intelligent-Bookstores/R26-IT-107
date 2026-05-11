FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p public/avatars

EXPOSE 3001

CMD ["node", "src/app.js"]
