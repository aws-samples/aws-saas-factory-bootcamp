mkdir build
tar -cf - --exclude={node_modules,shared-modules/dynamodb-helper/node_modules,shared-modules/token-manager/node_modules,shared-modules/config-helper/node_modules} Dockerfile package.json server.js -C .. shared-modules | (cd build && tar xvf -)

cd build
docker image build -t auth-manager -f Dockerfile .