import * as grpc from '@grpc/grpc-js';
import logger from './logger';

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

export function loggerInterceptor(
  methodDescriptor: grpc.ServerMethodDefinition<any, any>,
  call: grpc.ServerInterceptingCallInterface,
) {
  const listener = new grpc.ServerListenerBuilder()
    .withOnReceiveMessage((message, next) => {
      logger.info('Received message', {
        path: methodDescriptor?.path,
        body: message?.u,
      });
      next(message);
    })
    .build();
  const responder = new grpc.ResponderBuilder()
    .withStart((next) => {
      next(listener);
    })
    .withSendMessage((message, next) => {
      logger.info('Sending response', { path: methodDescriptor?.path });
      next(message);
    })
    .build();
  return new grpc.ServerInterceptingCall(call, responder);
}
