FROM node:slim
WORKDIR /app
COPY package.json .
RUN npm install
COPY . ./
EXPOSE 3001
CMD ["node", "sim_v2.js"]