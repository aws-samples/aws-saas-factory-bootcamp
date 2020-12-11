FROM public.ecr.aws/bitnami/node:10-prod

WORKDIR /usr/src/app
RUN mkdir product-manager shared-modules

COPY shared-modules shared-modules/
COPY package*.json server.js product-manager/

RUN cd shared-modules && for SHARED_MODULE in $(ls -d ./*); do cd $SHARED_MODULE && npm install && cd ..; done
RUN cd product-manager && npm install

ENV NODE_ENV=production
ENV NODE_CONFIG_DIR=/usr/src/app/shared-modules/config-helper/config/

CMD ["node", "./product-manager/server.js"]

EXPOSE 3006