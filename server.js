import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './server/app.js';
import { connectDB } from './server/config/db.js';
import { seedInitialData } from './server/utils/seedAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const startFullStackApp = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Seed initial admin & business defaults
    await seedInitialData();

    // 3. Mount Frontend (Vite in dev, static dist in production)
    if (!isProduction) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: process.env.DISABLE_HMR !== 'true',
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[IMS Dev] Vite middleware mounted for React client.');
    } else {
      const distPath = path.resolve(__dirname, 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.resolve(distPath, 'index.html'));
        });
        console.log('[IMS Prod] Serving production build from /dist.');
      }
    }

    // 4. Start HTTP Server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`[IMS] Full-Stack Inventory Management System is LIVE!`);
      console.log(`[IMS] Server listening on: http://localhost:${PORT}`);
      console.log(`[IMS] REST API Endpoint:   http://localhost:${PORT}/api`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('[IMS Fatal] Server startup failed:', err);
    process.exit(1);
  }
};

startFullStackApp();
