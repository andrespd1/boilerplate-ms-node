# Microservice Boilerplate (Node.js + TypeScript)

Welcome to the **Microservice Boilerplate** repository. This template is designed to streamline the creation of new Node.js microservices using TypeScript, incorporating:

- **gRPC** for high-performance communication
- **Prisma** as the database ORM
- **Redis** for caching or messaging

## Creating a New Service from This Template

When you generate a new microservice from this repository, follow these steps to tailor it to your project:

1. **Rename the Service**
   - Update all references from `boilerplate-ms-node` to your desired service name (e.g., `user-service`).
   - Common places to check:
     - `package.json` (`name` field)
     - `package-lock.json` (`name` field)

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Setup and Usage: Docker Compose](#setup-and-usage-docker-compose)
3. [Setup and Usage: Without Docker](#setup-and-usage-no-docker)
4. [Debugging](#debugging)
5. [Scripts Overview](#scripts-overview)
6. [Testing and Coverage](#testing-and-coverage)
7. [Environment Variables](#environment-variables)

---

## Project Structure

```
boilerplate-ms-node/
├─ .vscode/
├─ prisma/
├─ src/
│ ├─ config/
│ ├─ enums/
│ ├─ proto-generated/ # Generated artifacts
│ ├─ protos/ # .proto files
│ ├─ repositories/
│ ├─ services/
│ ├─ utilities/
│ └─ index.ts
└─ tests/

```

---

## (RECOMMENDED) Setup and Usage: Docker Compose

1. **Clone the Repository**

   ```bash
   git clone <repository_url>
   cd boilerplate-ms-node
   ```

2. **Build and Run via Command Line**  
   If you’re not using VSCode, you can build and run the containers directly from a terminal:
   ```bash
   docker compose up --build -d
   ```
   This command will build the Docker images, then run them in detached mode.

### Environment Variables

- **Local `.env` File**  
  Docker Compose will automatically use environment variables from your local `.env` file (located in the same directory as the `docker-compose.yml`), ensuring the service and its dependencies share the same configuration.

## Setup and Usage: Without Docker

1. **Clone the repository** (or create a new one using this template).

   ```bash
   git clone <repository_url>
   cd boilerplate-ms-node
   ```

2. **Run** `setup.sh init`:

   - Installs all dependencies (`npm i`).
   - Compiles `.proto` files and place generated code into `src/proto-generated`

3. **Configuration**:

   - Ensure you have the necessary environment variables set (see [Environment Variables](#environment-variables)).
   - You will need to create .env file for setting these.

4. **Run** `setup.sh db` to manage your Prisma schema:

   - Performs a `db push` schema.
   - Generates the Prisma Client.

5. **Development**:
   - `npm run dev` (or your designated dev script) for local development.
   - Check the Winston logs to ensure correct logging.

---

## Debugging

- **VSCode Debug Attach**  
  If you need to debug the application while it’s running in Docker, open the **Run and Debug** panel in VSCode, select **“docker-compose: attach”**, and start debugging.

- **Hot Reload and Debugger Attachments**  
  Since the service runs in “dev” mode with hot reload, **any time you make code changes** the containers restart to pick up those changes. This can **disconnect** the debugger, so you may need to re-attach after each hot reload event.

---

## Scripts Overview

- **`./setup.sh init`**
  Installs dependencies and sets up protobuf.

- **`./setup.sh proto`**
  Generates gRPC services/messages from `.proto` files.

- **`./setup.sh db`**
  Manages Prisma DB migration/synchronization, generates the client.

- **`npm run test`**
  Runs all tests in the `tests/` folder.

- **`npm run coverage`**
  Runs all tests with coverage.

---

## Testing and Coverage

- All tests reside in `tests/`.
- **Coverage** should remain above **85%**. Check coverage by:

```
npm run coverage
```

---

## Environment Variables

Make sure to set the following environment variables for smooth operation:

- `DATABASE_URL_NODE`: Connection string for your database.
- `REDIS_HOST`: Host address for Redis.
- `REDIS_PORT`: Port used by Redis.
- `REDIS_PASSWORD`: Password for Redis (if applicable).
- `LOG_LEVEL`: Winston log level (e.g., `info`, `debug`, `error`).
- `NODE_ENV`: Environment identifier (e.g., `development`, `production`).

---
