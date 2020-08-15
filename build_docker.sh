#!/bin/bash
DIRECTORY=$(cd `dirname $0` && pwd)
NAME=icecast_exporter
if [ ! -z $(docker ps -a -q -f name=$NAME) ]; then
    docker rm -f $(docker ps -a -q -f name=$NAME)
fi
docker build . -t "$NAME"