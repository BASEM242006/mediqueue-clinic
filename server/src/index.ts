import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import doctorRoutes from './routes/doctors.js';
import clinicRoutes from './routes/clinics.js';
import patientRoutes from './routes/patients.js';
import adminRoutes from './routes/admin.js';
import receptionRoutes from './routes/reception.js';
import { createAppointmentRoutes } from './routes/appointments.js';
import { createQueueRoutes, registerQueueSockets } from './routes/queue.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.API_PORT ?? 4000);
const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
app.use(express.json());

const uploadDir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MediQueue Clinic API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/clinics', clinicRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/appointments', createAppointmentRoutes(io));
app.use('/api/queue', createQueueRoutes(io));

registerQueueSockets(io);

httpServer.listen(PORT, () => {
  console.log(`MediQueue API running on http://localhost:${PORT}`);
});
