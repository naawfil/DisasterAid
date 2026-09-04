import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Singleton Pattern (GoF, Creational).
 *
 * The whole process must share one database connection: opening a second pool
 * would waste sockets and let two parts of the app disagree about connection
 * state. The constructor returns the existing instance if one exists, and the
 * connection itself is created lazily on the first connect() call.
 */
class Database {
  static #instance = null;

  constructor() {
    if (Database.#instance) return Database.#instance;
    this.connection = null;
    Database.#instance = this;
  }

  static getInstance() {
    if (!Database.#instance) new Database();
    return Database.#instance;
  }

  async connect() {
    if (this.connection) return this.connection;

    mongoose.set('strictQuery', true);
    this.connection = await mongoose.connect(env.mongoUri);
    console.log(`[db] connected to ${mongoose.connection.name}`);
    return this.connection;
  }

  async disconnect() {
    if (!this.connection) return;
    await mongoose.disconnect();
    this.connection = null;
    console.log('[db] disconnected');
  }
}

export default Database.getInstance();
