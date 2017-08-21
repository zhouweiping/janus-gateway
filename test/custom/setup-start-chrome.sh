#!/usr/bin/env bash

cp ./start-chrome-in-centos7.sh ../node_modules/travis-multirunner/
ln -sf ../travis-multirunner/start-chrome-in-centos7.sh ../node_modules/.bin/start-chrome
echo "Setup successfully."
