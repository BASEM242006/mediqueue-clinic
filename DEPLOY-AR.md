# نشر الموقع برابط ثابت (مجاني)

## التشغيل على جهازك (الآن)

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

افتح: **http://localhost:3000**

> أمر `npm run dev` يشغّل الموقع + قاعدة البيانات معاً. لا تحتاج Docker.

---

## رابط ثابت على الإنترنت (Vercel — مجاني)

### 1) قاعدة بيانات سحابية (Neon — مجاني)

1. ادخل [neon.tech](https://neon.tech) وأنشئ حساباً مجانياً
2. أنشئ مشروعاً (Project) جديداً
3. انسخ رابط الاتصال `postgresql://...`

### 2) تعديل المشروع لـ PostgreSQL (للنشر فقط)

في `prisma/schema.prisma` غيّر:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3) نشر على Vercel

1. ادخل [vercel.com](https://vercel.com) وسجّل بحساب GitHub
2. ارفع المشروع إلى GitHub (أو استورد المجلد من Vercel)
3. عند إنشاء المشروع أضف متغيرات البيئة:

| الاسم | القيمة |
|--------|--------|
| `DATABASE_URL` | رابط Neon الذي نسخته |
| `JWT_SECRET` | أي نص طويل عشوائي |
| `NEXT_PUBLIC_APP_URL` | `https://اسم-مشروعك.vercel.app` |
| `NEXT_PUBLIC_API_URL` | اتركه **فارغاً** |

4. اضغط Deploy

بعد دقائق ستحصل على رابط ثابت مثل:

**`https://mediqueue-clinic.vercel.app`**

---

## حسابات تجريبية

| الدور | رقم الجوال |
|--------|------------|
| مريض | +966500000301 |
| طبيب | +966500000201 |
| استقبال | +966500000101 |
| مدير | +966500000100 |

في وضع التطوير يظهر رمز OTP في الطرفية (Terminal).
