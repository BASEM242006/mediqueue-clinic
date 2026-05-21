import {
  PrismaClient,
  UserRole,
  DayOfWeek,
  AppointmentStatus,
  QueueStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicalFile.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctorVacation.deleteMany();
  await prisma.doctorSchedule.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.clinic.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.systemSetting.deleteMany();

  const specialties = await Promise.all([
    prisma.specialty.create({
      data: { slug: 'cardiology', name: 'Cardiology', nameAr: 'أمراض القلب', icon: 'heart' },
    }),
    prisma.specialty.create({
      data: { slug: 'dermatology', name: 'Dermatology', nameAr: 'الجلدية', icon: 'sparkles' },
    }),
    prisma.specialty.create({
      data: { slug: 'pediatrics', name: 'Pediatrics', nameAr: 'طب الأطفال', icon: 'baby' },
    }),
    prisma.specialty.create({
      data: { slug: 'orthopedics', name: 'Orthopedics', nameAr: 'العظام', icon: 'bone' },
    }),
    prisma.specialty.create({
      data: { slug: 'general', name: 'General Medicine', nameAr: 'طب عام', icon: 'stethoscope' },
    }),
  ]);

  const clinic = await prisma.clinic.create({
    data: {
      slug: 'mediqueue-main',
      name: 'MediQueue Medical Center',
      nameAr: 'مركز ميديكيو الطبي',
      description: 'Premium multi-specialty clinic with real-time queue tracking.',
      address: '123 Healthcare Blvd, Medical District',
      addressAr: '١٢٣ شارع الرعاية الصحية، الحي الطبي',
      city: 'Riyadh',
      phone: '+966500000001',
      email: 'info@mediqueue.app',
    },
  });

  const branchMain = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      slug: 'main',
      name: 'Main Branch',
      nameAr: 'الفرع الرئيسي',
      address: '123 Healthcare Blvd, Floor 2',
      addressAr: '١٢٣ شارع الرعاية الصحية، الطابق ٢',
      phone: '+966500000002',
      latitude: 24.7136,
      longitude: 46.6753,
    },
  });

  const branchNorth = await prisma.branch.create({
    data: {
      clinicId: clinic.id,
      slug: 'north',
      name: 'North Branch',
      nameAr: 'الفرع الشمالي',
      address: '45 North Avenue',
      addressAr: '٤٥ شارع الشمال',
      phone: '+966500000003',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      phone: '+966500000100',
      email: 'admin@mediqueue.app',
      name: 'System Admin',
      nameAr: 'مدير النظام',
      role: UserRole.SUPER_ADMIN,
      locale: 'en',
    },
  });

  const receptionUser = await prisma.user.create({
    data: {
      phone: '+966500000101',
      name: 'Sara Reception',
      nameAr: 'سارة الاستقبال',
      role: UserRole.RECEPTIONIST,
    },
  });

  await prisma.staff.create({
    data: {
      userId: receptionUser.id,
      clinicId: clinic.id,
      branchId: branchMain.id,
      title: 'Head Receptionist',
    },
  });

  const doctorUsers = await Promise.all([
    prisma.user.create({
      data: {
        phone: '+966500000201',
        email: 'dr.ahmed@mediqueue.app',
        name: 'Dr. Ahmed Al-Rashid',
        nameAr: 'د. أحمد الراشد',
        role: UserRole.DOCTOR,
      },
    }),
    prisma.user.create({
      data: {
        phone: '+966500000202',
        email: 'dr.fatima@mediqueue.app',
        name: 'Dr. Fatima Hassan',
        nameAr: 'د. فاطمة حسن',
        role: UserRole.DOCTOR,
      },
    }),
    prisma.user.create({
      data: {
        phone: '+966500000203',
        name: 'Dr. Omar Khalil',
        nameAr: 'د. عمر خليل',
        role: UserRole.DOCTOR,
      },
    }),
  ]);

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        userId: doctorUsers[0].id,
        specialtyId: specialties[0].id,
        clinicId: clinic.id,
        branchId: branchMain.id,
        bio: 'Board-certified cardiologist with 15 years of experience.',
        bioAr: 'استشاري أمراض قلب مع ١٥ سنة خبرة.',
        consultationFee: 350,
        avgDurationMin: 20,
        licenseNumber: 'CARD-001',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[1].id,
        specialtyId: specialties[1].id,
        clinicId: clinic.id,
        branchId: branchMain.id,
        bio: 'Expert in cosmetic and medical dermatology.',
        bioAr: 'خبيرة في الجلدية التجميلية والطبية.',
        consultationFee: 280,
        avgDurationMin: 15,
        licenseNumber: 'DERM-002',
      },
    }),
    prisma.doctor.create({
      data: {
        userId: doctorUsers[2].id,
        specialtyId: specialties[2].id,
        clinicId: clinic.id,
        branchId: branchNorth.id,
        bio: 'Pediatric specialist focused on child wellness.',
        bioAr: 'أخصائي أطفال يركز على صحة الطفل.',
        consultationFee: 250,
        avgDurationMin: 18,
        licenseNumber: 'PED-003',
      },
    }),
  ]);

  const days: DayOfWeek[] = [
    DayOfWeek.SUNDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
  ];

  for (const doctor of doctors) {
    for (const day of days) {
      await prisma.doctorSchedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
        },
      });
    }
  }

  const patientUser = await prisma.user.create({
    data: {
      phone: '+966500000301',
      email: 'patient@demo.app',
      name: 'Layla Patient',
      nameAr: 'ليلى المريضة',
      role: UserRole.PATIENT,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      userId: patientUser.id,
      gender: 'female',
      bloodType: 'O+',
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctors[0].id,
      branchId: branchMain.id,
      date: today,
      startTime: '10:00',
      endTime: '10:30',
      status: AppointmentStatus.CHECKED_IN,
      fee: 350,
      queueNumber: 3,
      type: 'ONLINE',
    },
  });

  await prisma.queueEntry.create({
    data: {
      appointmentId: appointment.id,
      doctorId: doctors[0].id,
      branchId: branchMain.id,
      position: 3,
      status: QueueStatus.WAITING,
      estimatedWaitMin: 40,
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'avg_wait_per_patient', value: '15' },
      { key: 'queue_alert_threshold', value: '2' },
      { key: 'appointment_reminder_minutes', value: '30' },
      { key: 'enable_whatsapp', value: 'true' },
      { key: 'enable_sms', value: 'true' },
      { key: 'enable_email', value: 'true' },
      { key: 'enable_push', value: 'true' },
    ],
  });

  console.log('Seed complete.');
  console.log('Demo accounts (OTP: any 6 digits in dev, code shown in API logs):');
  console.log('  Patient:   +966500000301');
  console.log('  Doctor:    +966500000201');
  console.log('  Reception: +966500000101');
  console.log('  Admin:     +966500000100');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
