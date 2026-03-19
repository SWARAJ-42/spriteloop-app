FROM node:20

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Build Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]