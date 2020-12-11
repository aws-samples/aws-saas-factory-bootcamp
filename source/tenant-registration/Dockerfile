FROM public.ecr.aws/bitnami/node:10-prod

WORKDIR /usr/src/app
RUN mkdir tenant-registration shared-modules

COPY shared-modules shared-modules/
COPY package*.json server.js tenant-registration/

RUN cd shared-modules && for SHARED_MODULE in $(ls -d ./*); do cd $SHARED_MODULE && npm install && cd ..; done
RUN cd tenant-registration && npm install

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/usr/src/app/shared-modules/config-helper/config/

CMD ["node", "./tenant-registration/server.js"]

EXPOSE 3004