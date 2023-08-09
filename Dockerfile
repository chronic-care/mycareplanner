FROM node:16.13.0 as builder

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
COPY yarn.lock ./
USER node
RUN yarn 

COPY --chown=node:node . .
RUN yarn build

EXPOSE 8000
CMD ["yarn", "start" ]