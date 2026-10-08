import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${uri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('[DB] Connected successfully to external/local MongoDB instance.');
      return;
    } catch (err) {
      console.warn(`[DB] Local MongoDB connection at ${uri} failed (${err.message}).`);
      console.log('[DB] Starting embedded MongoDB instance with MongoMemoryServer for standalone zero-config operation...');
    }
  }

  try {
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'inventory_management'
      }
    });
    const memoryUri = mongoMemoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] Connected successfully to embedded MongoDB instance at: ${memoryUri}`);
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
