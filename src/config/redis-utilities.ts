import { getCache, setCache } from './redis-client';

/**
 * 1) Attempt to retrieve a cached message from Redis.
 * 2) If not found, call `func()` to generate a fresh message,
 *    store it, and return it.
 *
 * @param key          The Redis key to check/store
 * @param func         A function that returns (or resolves to) a protobuf message
 * @param messageType  The class with `deserializeBinary()` for retrieval
 * @param ttlSeconds   Optional expiration time in seconds
 * @returns            The protobuf message (either cached or newly computed)
 */
export async function getAndSetCache<
	T extends { serializeBinary(): Uint8Array },
>(
	key: string,
	messageType: { deserializeBinary(data: Uint8Array): T },
	func: () => Promise<T> | T,
	ttlSeconds?: number,
): Promise<T> {
	// 1) Try to get from cache
	const cached = await getCache<T>(key, messageType);
	if (cached) {
		return cached;
	}

	// 2) Cache miss -> compute fresh
	const fresh = await func();
	await setCache(key, fresh, ttlSeconds);
	return fresh;
}
