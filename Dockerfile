FROM node:18.12.0
WORKDIR /app
COPY . ./
RUN npm install
EXPOSE 3000
ENTRYPOINT node ./src/index.ts
