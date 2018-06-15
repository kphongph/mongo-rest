# base image
FROM node:9.6.1

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
COPY app.js /usr/src/app/app.js
COPY route.js /usr/src/app/route.js
COPY wait-for-it.sh /usr/src/app/wait-for-it.sh
RUN npm install --silent
