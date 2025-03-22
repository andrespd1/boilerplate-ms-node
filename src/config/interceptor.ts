import * as grpc from '@grpc/grpc-js';

function validateAuthMetadata(metadata: grpc.Metadata) {
	//TODO: Implement your own logic here
	return true;
}

export function authInterceptor(
	methodDescriptor: grpc.ServerMethodDefinition<any, any>,
	call: grpc.ServerInterceptingCallInterface,
) {
	const listener = new grpc.ServerListenerBuilder()
		.withOnReceiveMetadata((metadata, next) => {
			if (validateAuthMetadata(metadata)) {
				next(metadata);
			} else {
				call.sendStatus({
					code: grpc.status.UNAUTHENTICATED,
					details: 'Auth metadata not correct',
				});
			}
		})
		.build();
	const responder = new grpc.ResponderBuilder()
		.withStart((next) => {
			next(listener);
		})
		.build();
	return new grpc.ServerInterceptingCall(call, responder);
}
