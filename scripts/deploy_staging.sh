#!/bin/bash
set -e
server=$1

cd `dirname $0`/..

ssh $server << 'ENDSSH'
cd komplianx-backend
git checkout .
git checkout staging
git pull origin staging
npm install
npm run db:migrate
pm2 restart backend

ENDSSH
