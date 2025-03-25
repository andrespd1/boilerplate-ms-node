import * as winston from 'winston';

const { combine, timestamp, json, colorize, align, printf } = winston.format;

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL ?? 'info',
	format: combine(
		colorize({ all: true }),
		timestamp({
			format: 'YYYY-MM-DD hh:mm:ss.SSS A',
		}),
		align(),
	),
	// TODO: Change service name
	defaultMeta: { service: 'boilerplate' },
});

if (process.env.NODE_ENV !== 'prd') {
	logger.add(
		new winston.transports.Console({
			format: winston.format.simple(),
		}),
	);
}

export default logger;
