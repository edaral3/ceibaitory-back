FROM node:23.11.0-slim
WORKDIR /app
COPY . ./
EXPOSE 3000
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
