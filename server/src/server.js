import app from './app.js';
import database from './config/database.js';
import { env } from './config/env.js';
import { registerObservers } from './services/observers/index.js';

const start = async () => {
  try {
    await database.connect();

    // Wire the Observer pattern once, at boot.
    registerObservers();

    const server = app.listen(env.port, () => {
      console.log(`[api] DisasterAid listening on http://localhost:${env.port}/api`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[api] ${signal} received, shutting down`);
      server.close(async () => {
        await database.disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[api] failed to start:', error.message);
    process.exit(1);
  }
};

start();
