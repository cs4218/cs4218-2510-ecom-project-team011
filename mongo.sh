#!/bin/bash

# download the json files and put it under schema dir

docker rm -f ecom-db 2>/dev/null || true
docker run -d \
  --name ecom-db -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secret \
  --mount type=bind,source=$PWD/schema,target=/schema,readonly \
  mongo:latest &&
echo Loaded container
docker exec -it ecom-db ./schema/import.sh
