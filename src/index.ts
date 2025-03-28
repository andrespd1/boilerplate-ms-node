import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { GreeterService } from './proto-generated/helloworld_grpc_pb';
import HelloWorldService from './services/helloworld-service';
import { ReflectionService } from '@grpc/reflection';
import path from 'path';
import dotenv from 'dotenv';
import { connectDbWithRetry } from './config/db-client';
import { authInterceptor, loggerInterceptor } from './config/grpc-interceptors';
import logger from './config/logger';

async function main() {
	const PROTOS_BASE = path.join('src', 'protos');
	const PORT = 50051;

	dotenv.config();

	/**
	 * THIS LIST NEEDS TO BE UPDATED WITH ALL PROTO FILES
	 */
	const protoFiles = ['helloworld.proto'];

	const server = new grpc.Server({
		interceptors: [authInterceptor, loggerInterceptor],
	});
	connectDbWithRetry();
	const packageDefinition = protoLoader.loadSync(
		protoFiles.map((p) => path.join(PROTOS_BASE, p)),
	);
	const reflection = new ReflectionService(packageDefinition);
	reflection.addToServer(server);

	/**
	 * ADD A NEW `.addService()` for each PROTO ADDED
	 */
	server.addService(GreeterService, HelloWorldService);

	server.bindAsync(
		`0.0.0.0:${PORT}`,
		grpc.ServerCredentials.createInsecure(),
		(err, port) => {
			if (err != null) {
				return console.error(err);
			}
			logger.info(`gRPC server listening on: ${port}`);
		},
	);
}

main();
