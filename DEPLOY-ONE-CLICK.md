# رابط ثابت — خطوة واحدة

## الرابط المباشر للنشر (Vercel)

افتح هذا الرابط وسجّل دخول GitHub ثم اضغط Deploy:

**https://vercel.com/import/git?s=https://github.com/BASEM242006/mediqueue-clinic**

### متغيرات البيئة (مهم)

| المتغير | القيمة |
|---------|--------|
| `DATABASE_URL` | من [neon.tech](https://neon.tech) → Connection string |
| `JWT_SECRET` | أي نص عشوائي طويل |
| `NEXT_PUBLIC_APP_URL` | `https://اسم-مشروعك.vercel.app` |
| `NEXT_PUBLIC_API_URL` | **فارغ** |

بعد أول نشر، من جهازك:

```bash
set DATABASE_URL=رابط_neon
npx prisma db push
npm run db:seed
```

---

## مستودع GitHub

https://github.com/BASEM242006/mediqueue-clinic
