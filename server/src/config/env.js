import dotenv from 'dotenv';

dotenv.config();

const read = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}. Copy .env.example to .env and fill it in.`);
  }
  return value;
};

export const env = {
  nodeEnv: read('NODE_ENV', 'development'),
  port: Number(read('PORT', '5000')),
  mongoUri: read('MONGO_URI'),
  jwtSecret: read('JWT_SECRET'),
  jwtExpiresIn: read('JWT_EXPIRES_IN', '7d'),
  clientOrigin: read('CLIENT_ORIGIN', 'http://localhost:5173'),
};

export const isProduction = env.nodeEnv === 'production';
