import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, attachPatient, type AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_FILE_SIZE_MB ?? 10)) * 1024 * 1024 },
});

router.use(authenticate, attachPatient);

router.get('/profile', async (req: AuthRequest & { patientId: string }, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.patientId },
    include: {
      user: true,
      medicalFiles: { orderBy: { uploadedAt: 'desc' } },
      appointments: {
        take: 10,
        orderBy: { date: 'desc' },
        include: { doctor: { include: { user: true, specialty: true } } },
      },
    },
  });
  res.json({ patient });
});

router.patch('/profile', async (req: AuthRequest & { patientId: string }, res) => {
  const { dateOfBirth, gender, bloodType, allergies, medicalNotes, name, nameAr, email } =
    req.body;

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, nameAr, email },
  });

  const patient = await prisma.patient.update({
    where: { id: req.patientId },
    data: {
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      bloodType,
      allergies,
      medicalNotes,
    },
    include: { user: true, medicalFiles: true },
  });

  res.json({ patient });
});

router.get('/files', async (req: AuthRequest & { patientId: string }, res) => {
  const files = await prisma.medicalFile.findMany({
    where: { patientId: req.patientId },
    orderBy: { uploadedAt: 'desc' },
  });
  res.json({ files });
});

router.post('/files', upload.single('file'), async (req: AuthRequest & { patientId: string }, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const baseUrl = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`;
  const file = await prisma.medicalFile.create({
    data: {
      patientId: req.patientId,
      fileName: req.file.originalname,
      fileUrl: `${baseUrl}/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      fileType: (req.body.fileType as string) ?? 'document',
      description: req.body.description,
    },
  });

  res.status(201).json({ file });
});

router.get('/notifications', async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ notifications });
});

router.patch('/notifications/:id/read', async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.id },
    data: { isRead: true },
  });
  res.json({ ok: true });
});

export default router;
