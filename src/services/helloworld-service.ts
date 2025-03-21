import {
	ServerUnaryCall,
	UntypedHandleCall,
	UntypedServiceImplementation,
} from '@grpc/grpc-js';

import { HelloReply, HelloRequest } from '../proto-generated/helloworld_pb';

/** MUST add function service declaration here, before implementing it in`HelloWorldService` */
interface IHelloWorldService extends UntypedServiceImplementation {
	sayHello(
		call: ServerUnaryCall<HelloRequest, HelloReply>,
		callback: Function,
	): void;
}

class HelloWorldService implements IHelloWorldService {
	[name: string]: UntypedHandleCall;

	public sayHello(
		call: ServerUnaryCall<HelloRequest, HelloReply>,
		callback: Function,
	): void {
		const reply = new HelloReply();
		reply.setMessage('Hello ' + call.request.getName());
		callback(null, reply);
	}
}

export default new HelloWorldService();
