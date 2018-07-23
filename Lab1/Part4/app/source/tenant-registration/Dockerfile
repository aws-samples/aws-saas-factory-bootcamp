#Base Image is Amazon Linux
FROM amazonlinux:latest
# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh
#Install Dependencies
RUN     yum install git -y
RUN		yum groupinstall "Development Tools" -y
# nvm environment variables
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 7.1.0
RUN curl --retry 5 --silent -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash
# install node and npm
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default
RUN source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default
# add node and npm to path so the commands are available
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
# confirm installation
RUN node -v
RUN npm -v
#Install Code
RUN mkdir /app/
COPY ./src/ /app/tenant-registration/
COPY ./shared-modules/ /app/shared-modules/
#------------------
#Shared Modules Setup
WORKDIR /app/shared-modules/dynamodb-helper
RUN cd /app/shared-modules/dynamodb-helper
RUN npm install
WORKDIR /app/shared-modules/token-manager
RUN cd /app/shared-modules/token-manager
RUN npm install
WORKDIR /app/shared-modules/config-helper
RUN cd /app/shared-modules/config-helper
RUN npm install
#-------------------
#Setup Working Directory
WORKDIR /app/tenant-registration/
#Set Sevice Config Directory
ENV NODE_CONFIG_DIR=../shared-modules/config-helper/config/
#Install App
RUN cd /app/tenant-registration/
RUN npm install
#Start App
CMD ["node", "/app/tenant-registration/server.js"]
#expose a port
EXPOSE 3004