import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import captureRoutes from './routes/captures';
import mapRoutes from './routes/map';
import path from 'path';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001');

app.use(cors());
app.use(express.json({ limit: '50mb' })); // screenshots are large

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/captures', captureRoutes);
app.use('/map', mapRoutes);

// Serve the viewer build if present
import fs from 'fs';
const viewerDist = path.resolve(__dirname, '../../viewer/dist');
if (fs.existsSync(viewerDist)) {
  app.use(express.static(viewerDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(viewerDist, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.json({ message: 'Viewer not built. Run: cd viewer && npm install && npm run dev (port 5174)' });
  });
}

app.listen(PORT, () => {
  console.log(`LG Companion backend running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set — analyses will fail.');
  }
});
