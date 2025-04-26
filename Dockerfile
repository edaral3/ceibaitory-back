FROM node:20.11.1
COPY . ./
EXPOSE 3000
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
