import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { seedInitialData } from './utils/seedAdmin.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[IMS Backend] Server running on port ${PORT}`);
      console.log(`[IMS Backend] API base URL: http://0.0.0.0:${PORT}/api`);
    });
  } catch (err) {
    console.error('[IMS Backend] Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
