import { NotificationChannel } from '@prisma/client';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';

type NotifyInput = {
  userId: string;
  appointmentId?: string;
  title: string;
  titleAr?: string;
  body: string;
  bodyAr?: string;
  channels?: NotificationChannel[];
};

export async function notifyUser(input: NotifyInput) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) return;

  const channels =
    input.channels ??
    ([
      NotificationChannel.PUSH,
      NotificationChannel.SMS,
      NotificationChannel.EMAIL,
      NotificationChannel.WHATSAPP,
    ] as NotificationChannel[]);

  for (const channel of channels) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        appointmentId: input.appointmentId,
        title: input.title,
        titleAr: input.titleAr,
        body: input.body,
        bodyAr: input.bodyAr,
        channel,
        sentAt: new Date(),
      },
    });

    try {
      await dispatchChannel(channel, user, input);
    } catch (err) {
      console.error(`[Notification] ${channel} failed:`, err);
    }

    return notification;
  }
}

async function dispatchChannel(
  channel: NotificationChannel,
  user: { email: string | null; phone: string; fcmToken: string | null },
  input: NotifyInput
) {
  switch (channel) {
    case NotificationChannel.EMAIL:
      if (user.email && process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM ?? 'noreply@clinic.app',
          to: user.email,
          subject: input.title,
          text: input.body,
        });
      } else if (user.email) {
        console.log(`[Email stub] ${user.email}: ${input.title}`);
      }
      break;
    case NotificationChannel.SMS:
      if (process.env.TWILIO_ACCOUNT_SID) {
        // Twilio integration placeholder
        console.log(`[SMS] ${user.phone}: ${input.body}`);
      } else {
        console.log(`[SMS stub] ${user.phone}: ${input.body}`);
      }
      break;
    case NotificationChannel.WHATSAPP:
      if (process.env.WHATSAPP_API_URL) {
        console.log(`[WhatsApp] ${user.phone}: ${input.body}`);
      } else {
        console.log(`[WhatsApp stub] ${user.phone}: ${input.body}`);
      }
      break;
    case NotificationChannel.PUSH:
      if (user.fcmToken && process.env.FIREBASE_PROJECT_ID) {
        console.log(`[Push] ${user.fcmToken}: ${input.title}`);
      } else {
        console.log(`[Push stub] user ${user.phone}: ${input.title}`);
      }
      break;
  }
}

export async function notifyQueueAlert(
  userId: string,
  appointmentId: string,
  patientsAhead: number,
  locale: string
) {
  const isAr = locale === 'ar';
  await notifyUser({
    userId,
    appointmentId,
    title: isAr ? 'اقترب دورك!' : 'Almost your turn!',
    titleAr: 'اقترب دورك!',
    body: isAr
      ? `يتبقى ${patientsAhead} مريض قبل دورك. يرجى التوجه للعيادة.`
      : `Only ${patientsAhead} patient(s) ahead. Please head to the clinic.`,
    bodyAr: `يتبقى ${patientsAhead} مريض قبل دورك.`,
    channels: [NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.WHATSAPP],
  });
}
