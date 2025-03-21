import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { GreeterService } from './proto-generated/helloworld_grpc_pb';
import HelloWorldService from './services/helloworld-service';
import { ReflectionService } from '@grpc/reflection';
import path from 'path';
import { prisma } from './config/db-client';
import dotenv from 'dotenv';
async function main() {
	const PROTOS_BASE = path.join('src', 'protos');
	const PORT = 50051;

	dotenv.config();

	console.log(process.env.DATABASE_URL);
	/**
	 * THIS LIST NEEDS TO BE UPDATED WITH ALL PROTO FILES
	 */
	const protoFiles = ['helloworld.proto'];

	const server = new grpc.Server();
	await prisma.$connect();

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
			console.log(`gRPC listening on ${port}`);
		},
	);
}

main();
