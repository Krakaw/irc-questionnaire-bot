FROM node:10.9-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python icu-dev && \
  export PYTHON=$(which python2) && \
  npm config set python $(which python2) && \
  npm install --quiet node-gyp -g &&\
  npm install --quiet --only=production && \
  apk del native-deps



#RUN npm install
# If you are building your code for production
#RUN npm install --only=production

# Bundle app source
COPY . .

CMD [ "npm", "run", "start" ]