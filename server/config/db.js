import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      // Local Windows Node DNS has an SRV resolution issue.
      // Convert mongodb+srv URI to a direct Atlas replica-set URI.
      if (uri.startsWith('mongodb+srv://')) {
        const url = new URL(uri);

        const username = url.username;
        const password = url.password;

        const database = url.pathname || '/InventoryManagementSystemWeb';

        uri =
          `mongodb://${username}:${password}` +
          `@ac-der8mgi-shard-00-00.y0ph0a0.mongodb.net:27017,` +
          `ac-der8mgi-shard-00-01.y0ph0a0.mongodb.net:27017,` +
          `ac-der8mgi-shard-00-02.y0ph0a0.mongodb.net:27017` +
          `${database}` +
          `?ssl=true&replicaSet=atlas-j2obqf-shard-0&authSource=admin&retryWrites=true&w=majority`;

        console.log('[DB] Using direct MongoDB Atlas replica-set connection.');
      }

      console.log('[DB] Attempting connection to MongoDB Atlas...');

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });

      console.log('[DB] Connected successfully to MongoDB Atlas.');
      return;
    } catch (err) {
      console.warn(`[DB] MongoDB Atlas connection failed: ${err.message}`);
      console.log('[DB] Starting embedded MongoDB instance as fallback...');
    }
  }

  try {
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'inventory_management',
      },
    });

    const memoryUri = mongoMemoryServer.getUri();

    await mongoose.connect(memoryUri);

    console.log(
      `[DB] Connected successfully to embedded MongoDB instance at: ${memoryUri}`
    );
  } catch (memErr) {
    console.error('[DB] Fatal error initializing MongoDB:', memErr);
    throw memErr;
  }
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();

    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('[DB] Error during disconnect:', err);
  }
};