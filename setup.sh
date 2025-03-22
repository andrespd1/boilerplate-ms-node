#!/bin/bash

usage() {
  echo "Usage: $0 {init|generate-proto|prisma}"
  exit 1
}

# Require exactly one argument
if [ "$#" -ne 1 ]; then
  usage
fi

if [ "$1" == "init" ]; then
  echo "Running npm install..."
  npm install

  echo "Checking for protoc..."
  if ! command -v protoc &> /dev/null; then
    echo "protoc not found. Installing protoc..."
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
      echo "Detected Linux. Installing via apt-get..."
      if command -v sudo &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y protobuf-compiler
      else
        apt-get update && apt-get install -y protobuf-compiler
      fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
      echo "Detected macOS. Installing via Homebrew..."
      if command -v brew &> /dev/null; then
        brew install protobuf
      else
        echo "Homebrew not found. Please install Homebrew from https://brew.sh/."
        exit 1
      fi
    else
      echo "Unknown OS. Please install protoc manually."
      exit 1
    fi
  else
    echo "protoc is already installed."
  fi

elif [ "$1" == "generate-proto" ]; then
  echo "Generating proto files..."
  mkdir -p ./src/proto-generated
  npx grpc_tools_node_protoc \
    -I=./src/protos \
    --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts \
    --plugin=protoc-gen-grpc=./node_modules/.bin/grpc_tools_node_protoc_plugin \
    --js_out=import_style=commonjs,binary:./src/proto-generated \
    --ts_out=service=grpc-node,mode=grpc-js:./src/proto-generated \
    --grpc_out=grpc_js:./src/proto-generated \
    ./src/protos/*.proto

elif [ "$1" == "prisma" ]; then
  echo "Starting Prisma setup with retry logic..."
  max_attempts=5
  attempt=1
  delay=2

  if [ "$REMOTE_DB" == "true" ]; then
    echo "REMOTE_DB is true. Using 'npx prisma pull' to sync schema from remote database."
    while [ $attempt -le $max_attempts ]; do
      echo "Attempt $attempt: Trying 'npx prisma pull'..."
      if npx prisma pull; then
        echo "Prisma pull succeeded."
        break
      else
        echo "Prisma pull failed."
      fi
      echo "Retrying in ${delay} seconds..."
      sleep $delay
      attempt=$((attempt + 1))
    done
  else
    echo "REMOTE_DB is not true. Using 'npx prisma db push' to apply schema changes to the database."
    while [ $attempt -le $max_attempts ]; do
      echo "Attempt $attempt: Trying 'npx prisma db push'..."
      if npx prisma db push; then
        echo "Prisma db push succeeded."
        break
      else
        echo "Prisma db push failed."
      fi
      echo "Retrying in ${delay} seconds..."
      sleep $delay
      attempt=$((attempt + 1))
    done
  fi

  if [ $attempt -gt $max_attempts ]; then
    echo "Prisma command failed after $max_attempts attempts."
    exit 1
  fi

  echo "Starting the development server with 'npm run dev'..."
  # Use exec to ensure npm run dev receives signals directly (improves shutdown speed)
  exec npm run dev

else
  usage
fi

echo "Done."
exit 0
