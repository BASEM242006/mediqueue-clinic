# MediQueue — Doctor & Clinic Management System

Full-stack clinic management with **online appointment booking**, **real-time queue tracking** (Socket.io), OTP phone auth, multi-role dashboards, and bilingual (EN/AR) UI.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Backend | Express 5, Socket.io, Prisma |
| Database | PostgreSQL |
| Auth | JWT + OTP (phone) |
| Notifications | Email, SMS, WhatsApp, Push (stubs + production hooks) |

## Features

- **Patients**: OTP login, browse doctors by specialty, book slots, live queue from home, cancel/reschedule, medical file uploads
- **Doctors**: Today's appointments, call next patient, prescriptions, schedule/vacation, analytics
- **Reception**: Walk-in booking, check-in, queue control, QR tickets
- **Admin**: Clinics/branches, users, reports, system settings, RBAC
- **TV Display**: `/display` — large-format queue screen for waiting areas

## Quick start

### 1. PostgreSQL

```bash
docker compose up -d
```

### 2. Environment

```bash
cp .env.example .env
```

### 3. Install & database

```bash
npm install
cd server && npm install && cd ..
npm run db:push
npm run db:seed
```

### 4. Run (two terminals)

```bash
npm run dev:all
```

- Web: http://localhost:3000  
- API: http://localhost:4000  

### Demo logins (OTP shown in API console in dev)

| Role | Phone |
|------|-------|
| Patient | +966500000301 |
| Doctor | +966500000201 |
| Reception | +966500000101 |
| Admin | +966500000100 |

Use any 6-digit OTP in development (actual code is logged by the API).

## Project structure

```
├── prisma/           # Schema + seed
├── server/           # Express API + Socket.io
├── src/
│   ├── app/          # Next.js pages (patient, doctor, reception, admin, display)
│   ├── components/   # UI, queue tracker, layouts
│   ├── lib/          # API client, i18n, socket
│   └── store/        # Zustand auth + app state
```

## Production deployment

1. Set strong `JWT_SECRET` and production `DATABASE_URL`
2. Configure SMTP, Twilio, WhatsApp API, Firebase in `.env`
3. Build API: `cd server && npm run build && npm start`
4. Build web: `npm run build && npm start`
5. Use a reverse proxy (nginx) for WebSocket upgrade on `/socket.io`

## Queue flow

1. Patient books online → status `CONFIRMED`
2. Reception/patient **check-in** → queue number assigned, Socket.io broadcast
3. Doctor/reception **call next** → patient notified (push/SMS/WhatsApp stubs)
4. Patient tracks at `/patient/queue/[appointmentId]` without refreshing
5. Clinic TV at `/display?doctorId=...&branchId=...`

## Deploy (fixed link)

**One-click Vercel (permanent URL):**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/git?s=https://github.com/BASEM242006/mediqueue-clinic)

See [DEPLOY-ONE-CLICK.md](./DEPLOY-ONE-CLICK.md) for Arabic instructions and environment variables.

**GitHub:** https://github.com/BASEM242006/mediqueue-clinic

## License

Private / project use.
