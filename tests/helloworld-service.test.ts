import { ServerUnaryCall } from '@grpc/grpc-js';
import { HelloRequest, HelloReply } from '../src/proto-generated/helloworld_pb';
import { prisma } from '../src/config/db-client';
import HelloWorldService from '../src/services/helloworld-service';

// Mock the Prisma client so we can control its return values
jest.mock('../src/config/db-client', () => ({
	prisma: {
		stubTableNode: {
			findFirst: jest.fn(),
		},
	},
}));

describe('HelloWorldService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should say hello with the table name if found', async () => {
		// Arrange
		const mockName = 'Test User';
		const mockTableName = 'MyTable';

		// Simulate what Prisma would return
		(prisma.stubTableNode.findFirst as jest.Mock).mockResolvedValue({
			name: mockTableName,
		});

		// Create a fake gRPC call object with the request
		const request = new HelloRequest();
		request.setName(mockName);

		// We use a partial object as ServerUnaryCall
		const call = { request } as unknown as ServerUnaryCall<
			HelloRequest,
			HelloReply
		>;

		// We'll track the callback result in a mock function
		const callback = jest.fn();

		// Act
		await HelloWorldService.sayHello(call, callback);

		// Assert
		expect(prisma.stubTableNode.findFirst).toHaveBeenCalledTimes(1);
		expect(callback).toHaveBeenCalledTimes(1);

		// callback is called with (error, reply)
		const [error, reply] = callback.mock.calls[0];
		expect(error).toBeNull();
		// `reply` should be a HelloReply
		expect(reply.getMessage()).toBe(
			`Hello ${mockName} from gRPC using table: ${mockTableName}`,
		);
	});

	it('should say hello with table: undefined if no record is found', async () => {
		// Arrange
		const mockName = 'Empty Table';
		(prisma.stubTableNode.findFirst as jest.Mock).mockResolvedValue(null);

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
		expect(callback).toHaveBeenCalledTimes(1);

		const [error, reply] = callback.mock.calls[0];
		expect(error).toBeNull();
		expect(reply.getMessage()).toBe(
			`Hello ${mockName} from gRPC using table: undefined`,
		);
	});
});
