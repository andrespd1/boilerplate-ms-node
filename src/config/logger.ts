import * as winston from 'winston';

const { combine, timestamp, align, printf } = winston.format;

const loggerFormatter = printf(({ level, message, timestamp, ...meta }) => {
  return `[${level?.toUpperCase()}] ${timestamp}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    loggerFormatter,
    align(),
  ),
});

if (process.env.NODE_ENV !== 'prd') {
  logger.add(new winston.transports.Console());
}

export default logger;
