import {
	ServerUnaryCall,
	UntypedHandleCall,
	UntypedServiceImplementation,
} from '@grpc/grpc-js';

import { HelloReply, HelloRequest } from '../proto-generated/helloworld_pb';
import { prisma } from '../config/db-client';
import { StubTableNode } from '@prisma/client';

/** MUST add function service declaration here, before implementing it in`HelloWorldService` */
interface IHelloWorldService extends UntypedServiceImplementation {
	sayHello(
		call: ServerUnaryCall<HelloRequest, HelloReply>,
		callback: Function,
	): Promise<void>;
}

class HelloWorldService implements IHelloWorldService {
	[name: string]: UntypedHandleCall;

	public async sayHello(
		call: ServerUnaryCall<HelloRequest, HelloReply>,
		callback: Function,
	): Promise<void> {
		// Message response from gRPC
		const reply = new HelloReply();

		// Calling table repository through prisma client
		const table: StubTableNode | null = await prisma.stubTableNode.findFirst();

		// Setting message response
		reply.setMessage(
			`Hello ${call.request.getName()} from gRPC using table: ${table?.name}`,
		);
		// Instead of return we use callback for gRPC
		callback(null, reply);
	}
}

export default new HelloWorldService();
