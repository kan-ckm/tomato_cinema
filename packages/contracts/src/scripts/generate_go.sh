#!/bin/bash
set -e

echo "Tạo protobuf Go (media)..."


protoc -I ./proto \
    --go_out=./gen/go \
    --go_opt=module=github.com/tomatocinema/contracts \
    --go-grpc_out=./gen/go \
    --go-grpc_opt=module=github.com/tomatocinema/contracts \
    ./proto/media.proto

echo "Go đã tạo xong!"