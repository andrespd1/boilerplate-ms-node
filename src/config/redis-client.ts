import Redis from 'ioredis';
import { Buffer } from 'buffer';

/** Helper to encode a Uint8Array to a base64 string. */
function toBase64(u8: Uint8Array): string {
  return Buffer.from(u8).toString('base64');
}

/** Helper to decode a base64 string back into a Uint8Array. */
function fromBase64(b64: string): Uint8Array {
  return Buffer.from(b64, 'base64');
}

/**
 * Configure the Redis client.
 * You can remove the logs or adjust them as you like.
 */
const redisHost = process.env.REDIS_HOST ?? '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const redisPassword = process.env.REDIS_PASSWORD ?? undefined;

let redisClient: Redis | null = null;

export function initRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
    });
  }
}

/**
 * Store a protobuf message in Redis in base64-encoded binary form.
 *
 * @param key         The Redis key to store under.
 * @param message     Any protobuf-like object with a `serializeBinary()` method
 * @param ttlSeconds  Optional expiration time in seconds
 * @returns           The same message you passed in (for convenience)
 */
export async function setCache<T extends { serializeBinary(): Uint8Array }>(
  key: string,
  message: T,
  ttlSeconds?: number,
): Promise<T> {
  // Convert the protobuf to raw bytes -> base64
  const bin = message.serializeBinary();
  const b64 = toBase64(bin);

  if (ttlSeconds) {
    await redisClient?.set(key, b64, 'EX', ttlSeconds);
  } else {
    await redisClient?.set(key, b64);
  }
  return message;
}

/**
 * Retrieve a protobuf message from Redis, given its class so we can deserialize.
 *
 * @param key          The Redis key to read
 * @param messageType  The class (constructor) that has a `.deserializeBinary()` static method.
 * @returns            An instance of `messageType` if found, or `null` if not found.
 */
export async function getCache<T>(
  key: string,
  messageType: { deserializeBinary(data: Uint8Array): T },
): Promise<T | null> {
  const b64 = await redisClient?.get(key);
  if (!b64) {
    return null; // Key doesn't exist
  }

  // Convert from base64 -> bytes -> message instance
  const bin = fromBase64(b64);
  const message = messageType.deserializeBinary(bin);
  return message;
}

/**
 * Delete a key from Redis. Returns the number of keys removed (0 or 1).
 */
export async function deleteCache(key: string): Promise<number | undefined> {
  return redisClient?.del(key);
}
