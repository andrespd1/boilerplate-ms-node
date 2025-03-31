// Mock the Prisma client so we can control DB return values
jest.mock('../src/config/db-client', () => ({
	prisma: {
		stubTableNode: {
			findFirst: jest.fn(),
		},
	},
}));

// Mock the Redis functions (getCache, setCache, etc.)
jest.mock('../src/config/redis-client', () => ({
	getCache: jest.fn(),
	setCache: jest.fn(),
}));

import { prisma } from '../src/config/db-client';
import { getCache, setCache } from '../src/config/redis-client';
import { ServerUnaryCall } from '@grpc/grpc-js';
import HelloWorldService from '../src/services/helloworld-service';
import { HelloRequest, HelloReply } from '../src/proto-generated/helloworld_pb';

jest.resetModules();

describe('HelloWorldService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should say hello with the table name if found (cache miss)', async () => {
		// Arrange
		const mockName = 'Test User';
		const mockTableName = 'MyTable';

		// Simulate DB returning a record
		(prisma.stubTableNode.findFirst as jest.Mock).mockResolvedValue({
			name: mockTableName,
		});

		(getCache as jest.Mock).mockResolvedValue(null);

		// We can track setCache calls to see if it’s storing the newly computed HelloReply
		(setCache as jest.Mock).mockResolvedValue(null);

		// Create a fake gRPC call object with the request
		const request = new HelloRequest();
		request.setName(mockName);

		const call = { request } as unknown as ServerUnaryCall<
			HelloRequest,
			HelloReply
		>;
		const callback = jest.fn();

		// Act
		await HelloWorldService.sayHello(call, callback);

		// Assert
		// Prisma call should happen (because cache is empty)
		expect(prisma.stubTableNode.findFirst).toHaveBeenCalledTimes(1);
		// getCache was called to check if there's a cached value
		expect(getCache).toHaveBeenCalledTimes(1);
		// setCache was called to store the freshly computed reply
		expect(setCache).toHaveBeenCalledTimes(1);

		// Ensure callback was called once
		expect(callback).toHaveBeenCalledTimes(1);

		const [error, reply] = callback.mock.calls[0];
		expect(error).toBeNull();
		// The reply should incorporate the DB table name
		expect(reply.getMessage()).toBe(
			`Hello ${mockName} from gRPC using table: ${mockTableName}`,
		);
	});

	it('should say hello with table: undefined if no record is found (cache miss)', async () => {
		// Arrange
		const mockName = 'Empty Table';
		(prisma.stubTableNode.findFirst as jest.Mock).mockResolvedValue(null);

		// Cache miss again
		(getCache as jest.Mock).mockResolvedValue(null);
		(setCache as jest.Mock).mockResolvedValue(null);

		const request = new HelloRequest();
		request.setName(mockName);

		const call = { request } as unknown as ServerUnaryCall<
			HelloRequest,
			HelloReply
		>;
		const callback = jest.fn();

		// Act
		await HelloWorldService.sayHello(call, callback);

		// Assert
		expect(prisma.stubTableNode.findFirst).toHaveBeenCalledTimes(1);
		expect(getCache).toHaveBeenCalledTimes(1);
		expect(setCache).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledTimes(1);

		const [error, reply] = callback.mock.calls[0];
		expect(error).toBeNull();
		expect(reply.getMessage()).toBe(
			`Hello ${mockName} from gRPC using table: undefined`,
		);
	});

	it('should return cached HelloReply if cache hit occurs', async () => {
		// Arrange
		const mockName = 'Cached User';
		const cachedReply = new HelloReply();
		cachedReply.setMessage(
			`Hello ${mockName} from gRPC using table: fromCache`,
		);

		// Simulate a "cache hit": getCache returns an existing HelloReply
		(getCache as jest.Mock).mockResolvedValue(cachedReply);

		// DB call should NOT happen if we already have a cached HelloReply
		(prisma.stubTableNode.findFirst as jest.Mock).mockResolvedValue({
			name: 'ShouldNotMatter',
		});

		// setCache should NOT be called if we used the cached value
		(setCache as jest.Mock).mockResolvedValue(null);

		const request = new HelloRequest();
		request.setName(mockName);

		const call = { request } as unknown as ServerUnaryCall<
			HelloRequest,
			HelloReply
		>;
		const callback = jest.fn();

		// Act
		await HelloWorldService.sayHello(call, callback);

		// Assert
		// Because we had a cache hit, no DB call
		expect(prisma.stubTableNode.findFirst).not.toHaveBeenCalled();

		// getCache is called, but setCache is NOT
		expect(getCache).toHaveBeenCalledTimes(1);
		expect(setCache).not.toHaveBeenCalled();

		// Final callback
		expect(callback).toHaveBeenCalledTimes(1);
		const [error, reply] = callback.mock.calls[0];
		expect(error).toBeNull();
		expect(reply.getMessage()).toBe(
			`Hello ${mockName} from gRPC using table: fromCache`,
		);
	});

	it('should handle cache returning a partial or invalid object', async () => {
		// Sometimes we might get a partial or non-serialized object from the cache
		// For example, it could be a plain object instead of a real HelloReply
		// The service code may or may not handle it gracefully.
		// For demonstration, let's assume it leads to an incomplete message.

		const mockName = 'Corrupt Cache';

		// A plain object that does not have getMessage method etc.
		const partialObj = { message: 'Not a real HelloReply' };
		(getCache as jest.Mock).mockResolvedValue(partialObj);

		// If the code does not handle partial objects, it might produce
		// a fallback or an error. Let's see how it behaves:
		// (Pretend the DB is also set up)
		(prisma.stubTableNode.findFirst as jest.Mock).mockResolvedValue(null);

		const request = new HelloRequest();
		request.setName(mockName);

		const call = { request } as unknown as ServerUnaryCall<
			HelloRequest,
			HelloReply
		>;
		const callback = jest.fn();

		await HelloWorldService.sayHello(call, callback);

		expect(getCache).toHaveBeenCalledTimes(1);
		// If the code tries to handle partialObj, it might fail or
		// do something special. We can check the outcome:
		const [error, reply] = callback.mock.calls[0];
		expect(error).toBeNull();
		// If your code is not robust, we might see reply.getMessage() is "undefined"
		// Or maybe it triggered a DB call, etc.
		// Let's at least confirm there's no DB call if the code blindly trusts the cached object
		// This is your chance to define correct behavior for "invalid" cache data
	});
});
