#!/bin/bash
# -----------------------------------------------------------------------------
# setup.sh
#
# A script for local development to streamline:
#   1. Installing dependencies
#   2. Generating gRPC proto files
#   3. Managing the local database schema (via Prisma)
#   4. Starting the dev server
#
# Commands:
#   init     : Install deps and generate proto files (build phase)
#   db       : Run db push (with retry) after the DB container is up
#   proto    : (Optional) re-generate gRPC proto files
#   start    : Start the dev server
# -----------------------------------------------------------------------------

usage() {
  echo "Usage: $0 {init|db|proto|start}"
  exit 1
}

# -----------------------------------------------------------------------------
# DB PUSH WITH RETRY
# -----------------------------------------------------------------------------
db_push_with_retry() {
  local max_attempts=5
  local attempt=1
  local delay=3

  while [ $attempt -le $max_attempts ]; do
    echo "Attempt $attempt of $max_attempts: Running 'npx prisma db push'..."
    if npx prisma db push; then
      echo "Prisma db push succeeded."
      return
    else
      echo "Prisma db push failed."
    fi
    echo "Retrying in $delay seconds..."
    sleep $delay
    attempt=$(( attempt + 1 ))
  done

  echo "Prisma db push failed after $max_attempts attempts."
  exit 1
}

if [ $# -ne 1 ]; then
  usage
fi

case "$1" in
  init)
    echo "=== INIT: Installing dependencies ==="
    npm install

    echo "=== INIT: Generating proto files ==="
    mkdir -p ./src/proto-generated
    npx grpc_tools_node_protoc \
      -I=./src/protos \
      --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
      --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
      --js_out=import_style=commonjs,binary:./src/proto-generated \
      --ts_out=service=grpc-node,mode=grpc-js:./src/proto-generated \
      --grpc_out=grpc_js:./src/proto-generated \
      ./src/protos/*.proto

    echo "=== INIT: Done. You can now run '$0 db' after the DB is up, then '$0 start'. ==="
    ;;

  db)
    echo "=== DB: Attempting database schema push (retry logic) ==="
    db_push_with_retry
    ;;

  proto)
    echo "=== PROTO: Generating proto files ==="
    mkdir -p ./src/proto-generated
    npx grpc_tools_node_protoc \
      -I=./src/protos \
      --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
      --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
      --js_out=import_style=commonjs,binary:./src/proto-generated \
      --ts_out=service=grpc-node,mode=grpc-js:./src/proto-generated \
      --grpc_out=grpc_js:./src/proto-generated \
      ./src/protos/*.proto

    echo "=== PROTO: Done generating gRPC files. ==="
    ;;

  start)
    echo "=== START: Running 'db push' then 'npm run dev' ==="
    db_push_with_retry
    exec npm run dev
    ;;

  *)
    usage
    ;;
esac

exit 0
