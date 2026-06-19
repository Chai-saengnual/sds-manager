# SDS Manager

Production-ready Safety Data Sheet (SDS) management system. Next.js 15 + Supabase Postgres + Prisma.

## ✨ Features

- **Dashboard** — real-time stats, recent activity, category distribution, compliance score
- **SDS CRUD** — full create / edit / delete with bilingual EN+TH names, hazard summary, GHS classes, supplier, manufacturer
- **Smart search & filter** — search by name, hazard, category, part number; filter by flammable / status / overdue / missing PDF
- **3 view modes** — gallery cards, tiles, table
- **Multi-language UI** — full English / Thai (react-i18next)
- **Auth** — NextAuth.js credentials with role-based access (Admin / Editor / Viewer)
- **AI analysis** — OpenAI integration for hazard extraction, duplicate detection, update recommendations (optional)
- **Email reminders** — Resend integration for upcoming follow-ups (optional)
- **Audit logging** — every change tracked with user, IP, before/after diff
- **Export** — XLSX / CSV / PDF
- **QR codes** — print-ready QR for each SDS record
- **Cron jobs** — auto-flag outdated / expired records (Vercel cron-ready)

## 🛠 Tech stack

| Layer        | Tech                                  |
| ------------ | ------------------------------------- |
| Framework    | Next.js 15 (App Router, RSC)          |
| Database     | Supabase Postgres + Prisma 6          |
| Auth         | NextAuth.js v5                        |
| Storage      | Supabase Storage (PDFs)               |
| Email        | Resend                                |
| AI           | OpenAI (optional)                     |
| UI           | shadcn-style + Tailwind + Radix       |
| Tables       | TanStack-style DataTable              |
| Charts       | lucide-react icons (recharts-ready)   |
| i18n         | react-i18next (EN + TH)               |

## 🚀 Quick start

### 1. Supabase setup (5 min)

1. Create a project at https://supabase.com/dashboard
2. **Settings → Database → Connection string → URI** → copy as `DATABASE_URL`
3. **Settings → API** → copy URL + anon key + service role key
4. **Storage → New bucket** → name: `sds-documents`, public: on (or set up RLS)

### 2. Local dev

```bash
pnpm install
cp .env.example .env.local
# fill in DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXTAUTH_SECRET (openssl rand -base64 32), etc.

pnpm db:push     # apply schema to Supabase
pnpm db:seed     # seed admin/editor/viewer + 41 built-in SDS records + categories
pnpm dev         # http://localhost:3000
```

### 3. Deploy to Vercel

1. Push to GitHub (this repo is already connected to Vercel)
2. Vercel → New Project → import `Chai-saengnual/sds-manager`
3. **Environment variables** → paste from `.env.example` (use production values)
4. **Build command**: `prisma generate && next build` (Vercel auto-detects Prisma)
5. Deploy

### 4. Optional: enable cron

`vercel.json` includes a daily cron at 02:00 UTC that flags outdated records and sends reminders. Set `CRON_SECRET` to protect the endpoint.

## 🔐 Demo accounts (after seed)

| Role   | Email                       | Password   |
| ------ | --------------------------- | ---------- |
| Admin  | admin@sdsmanager.com        | admin123   |
| Editor | editor@sdsmanager.com       | admin123   |
| Viewer | viewer@sdsmanager.com       | admin123   |

**Change passwords before production.**

## 📁 Project structure

```
prisma/
  schema.prisma      # User, SdsRecord, Category, AuditLog, Notification, UploadedFile, AiAnalysisResult
  seed.ts            # 41 built-in SDS records + demo accounts
src/
  app/
    (auth)/login     # NextAuth credentials
    (dashboard)/     # Protected: dashboard, sds list, sds detail, sds/new, sds/[id]/edit
    admin/           # Admin: users, settings, audit-logs
    api/             # REST endpoints
  components/
    header, theme-*, language-switcher
    ui/              # shadcn-style primitives
  lib/
    prisma, auth, audit, email, export, openai, storage, utils
  hooks/
  locales/           # en.json, th.json, i18n.ts
  types/
docs/
```

## 🌍 Bilingual

UI is fully translated (EN/TH) with `react-i18next`. Data model supports both English and Thai product names (`productNameEn`, `productNameTh`).

## 🔄 Vercel cron (optional)

`vercel.json` configures a daily job at 02:00 UTC that:
- Flags records older than 365 days as `isOutdated`
- Marks records past follow-up date as `EXPIRED`
- Sends email reminders via Resend

Set `CRON_SECRET` in env for endpoint security.

## 📜 License

MIT
