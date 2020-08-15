FROM node:12


# Create app directory
WORKDIR /usr/src/app

COPY . .
RUN npm install
EXPOSE 9146
CMD [ "node", "index.js" ]