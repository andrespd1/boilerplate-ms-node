import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
	globalForPrisma.prisma || new PrismaClient({ errorFormat: 'pretty' });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDbWithRetry(maxRetries = 5, delayMs = 2000) {
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			await prisma.$connect();
			console.log('Database connected successfully.');
			return;
		} catch (error) {
			console.error(`Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
			if (attempt === maxRetries) {
				throw new Error(
					`Failed to connect to the database after ${maxRetries} attempts.`,
				);
			}
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
}
