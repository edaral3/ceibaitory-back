FROM node:18.12.0
COPY . ./
EXPOSE 3000
RUN npm install
RUN npm run build
CMD ["npm", "run", "start"]
