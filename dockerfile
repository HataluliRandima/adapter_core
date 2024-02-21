FROM  node:18-alpine

# create app dir
WORKDIR /app

#Install app deps
COPY package*.json ./

#Run npm install
RUN npm install

#Bundle app source current to work dir
COPY . .

EXPOSE 3001

CMD [ "npm", "start" ]