FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./

RUN npm config set strict-ssl false && npm install

COPY . .

RUN ./node_modules/.bin/vite build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80