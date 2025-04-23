FROM node:18.12.0
EXPOSE 3000
COPY . ./
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
