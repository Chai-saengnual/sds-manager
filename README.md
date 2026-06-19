# SDS Manager

Production-ready Safety Data Sheet (SDS) management system. Next.js 15 + Supabase Postgres + Prisma.

## 🚀 Quick start (5 min)

### 1. Create Supabase project

1. Go to https://supabase.com/dashboard → New project
2. Wait for it to provision (~2 min)
3. **Settings → Database → Connection string → URI** → copy it
4. **Settings → API** → copy these 3:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - anon public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - service_role secret (`SUPABASE_SERVICE_ROLE_KEY`)

### 2. Push to Supabase

In your terminal:
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" npx prisma db push
```
This creates all the tables in your Supabase Postgres.

### 3. Set Vercel env vars

In Vercel dashboard → sds-manager → Settings → Environment Variables, add:

| Name | Value | Production? |
|------|-------|-------------|
| `DATABASE_URL` | your Supabase URI from step 1 | ✅ |
| `NEXTAUTH_URL` | `https://sds-manager-eosin.vercel.app` | ✅ |
| `NEXTAUTH_SECRET` | run: `openssl rand -base64 32` | ✅ |
| `AUTH_SECRET` | same as NEXTAUTH_SECRET | ✅ |
| `AUTH_TRUST_HOST` | `true` | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | ✅ |
| `CRON_SECRET` | any random string (optional) | ✅ |

Vercel will auto-redeploy.

### 4. Seed the database (one-time)

After Vercel redeploys, open in your browser:

```
https://sds-manager-eosin.vercel.app/api/seed
```

This creates:
- 3 demo users (admin / editor / viewer, all password `admin123`)
- 9 categories
- 41 built-in SDS records

You should see JSON like:
```json
{ "success": true, "users": 3, "categories": 9, "records": 41 }
```

### 5. Sign in

Go to https://sds-manager-eosin.vercel.app/login

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@sdsmanager.com | admin123 |
| Editor | editor@sdsmanager.com | admin123 |
| Viewer | viewer@sdsmanager.com | admin123 |

**⚠ Change passwords before production use.**

## 🛠 Tech stack

| Layer | Tech |
|------|------|
| Framework | Next.js 15 (App Router, RSC) |
| Database | Supabase Postgres + Prisma 6 |
| Auth | NextAuth.js v5 |
| Storage | Supabase Storage (PDFs) |
| Email | Resend (optional) |
| AI | OpenAI (optional) |
| UI | shadcn-style + Tailwind + Radix |
| i18n | react-i18next (EN + TH) |

## ✨ Features

- Dashboard with live stats, recent activity, category distribution, compliance score
- SDS CRUD with bilingual EN+TH names, hazard summary, GHS classes, supplier, manufacturer
- Smart search & filter (name, hazard, category, PN, flammable, status, overdue, missing PDF)
- 3 view modes: gallery, tile, table
- Full bilingual UI (EN/TH)
- Role-based access (Admin / Editor / Viewer)
- Audit logging
- Export XLSX / CSV / PDF
- QR codes
- Vercel cron for daily outdated-scan

## 🔄 Vercel cron

`vercel.json` configures a daily job at 02:00 UTC that flags outdated/expired records.

## 🔐 Optional: enable cron + email

Set `CRON_SECRET` and `RESEND_API_KEY` to enable the daily reminder emails.

## 📜 License

MIT
