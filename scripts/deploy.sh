#!/bin/bash
set -e
cd `dirname $0`/..

npm run build
cp build/index.html build/200.html
surge -p build -d gre-jardin.surge.sh
