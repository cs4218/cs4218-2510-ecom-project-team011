#!/bin/bash
dbName=test
username=admin
password=secret
folder=/schema

set -e

echo "Waiting for MongoDB to be ready..."
until mongosh "mongodb://admin:secret@localhost:27017/admin" --eval "db.runCommand({ ping: 1 })" >/dev/null 2>&1; do
  sleep 2
done
echo "MongoDB is set up"

mongoimport \
  --username $username --password $password --authenticationDatabase admin \
  --db $dbName --collection categories --file $folder/test.categories.json --jsonArray

mongoimport \
  --username $username --password $password --authenticationDatabase admin \
  --db $dbName --collection orders --file $folder/test.orders.json --jsonArray 

mongoimport \
  --username $username --password $password --authenticationDatabase admin \
  --db $dbName --collection products --file $folder/test.products.json --jsonArray

mongoimport \
  --username $username --password $password --authenticationDatabase admin \
  --db $dbName --collection users --file $folder/test.users.json --jsonArray
