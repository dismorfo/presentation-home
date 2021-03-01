FROM node:13.13.0-alpine AS build_box

WORKDIR /app
COPY package*.json ./
RUN NODE_ENV=dev npm install
COPY . /app
RUN npm run build

# Make final image
FROM node:13.13.0-alpine

WORKDIR /app
COPY index.js ./
COPY package*.json ./
COPY --from=build_box /app/dist ./dist
RUN npm install --production

EXPOSE 80
CMD [ "npm", "start" ]


