FROM public.ecr.aws/docker/library/node:16-slim

WORKDIR /usr/src/app
RUN mkdir tenant-manager shared-modules

COPY shared-modules shared-modules/
COPY package*.json server.js tenant-manager/

RUN cd shared-modules && for SHARED_MODULE in $(ls -d ./*); do cd $SHARED_MODULE && npm install && cd ..; done
RUN cd tenant-manager && npm install

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/usr/src/app/shared-modules/config-helper/config/

CMD ["node", "./tenant-manager/server.js"]

EXPOSE 3003