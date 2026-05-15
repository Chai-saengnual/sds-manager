# SDS Manager — Safety Data Sheet Management System

A production-ready, full-stack web application for managing Safety Data Sheets (SDS/MSDS) for industrial chemicals and maintenance products.

## Features

- **Dashboard** — Real-time statistics, charts, dark/light theme
- **SDS Record Management** — Full CRUD with PDF upload, multi-language support
- **Smart Search & Filter** — Search by name, hazard, category, part number
- **Multiple Views** — Gallery card, tile, and table/list views
- **AI Integration** — PDF analysis, auto-fill, summaries, update recommendations
- **AI Update Agent** — Scans records for expired reviews, duplicates, missing data
- **Email Notifications** — Configurable expiration reminders (30/60/90 days)
- **Audit Logging** — Complete change history and user action tracking
- **Admin Panel** — User roles, categories, system settings
- **Export** — Excel, CSV, PDF compliance reports
- **Multi-language** — English and Thai fully supported
- **QR Codes** — Quick access to SDS documents
- **PWA Support** — Offline-capable progressive web app

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL, Prisma ORM |
| Auth | NextAuth.js (credentials + OAuth) |
| Storage | AWS S3 / Supabase Storage |
| AI | OpenAI API (GPT-4) |
| Email | Resend / Nodemailer |
| Charts | Recharts |
| Tables | TanStack Table |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm / npm / yarn
- OpenAI API key
- Supabase account (or AWS S3)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sds-manager.git
cd sds-manager

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your credentials
# DATABASE_URL=postgresql://...
# OPENAI_API_KEY=sk-...
# NEXTAUTH_SECRET=your-secret

# Push database schema
pnpm db:push

# Seed demo data
pnpm db:seed

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sds_manager

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key

# OpenAI
OPENAI_API_KEY=sk-...

# Storage (choose one)
# Option A: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Option B: AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=sds-documents

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Documentation

- [Setup Guide](./docs/setup.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/schema.md)
- [AI Features](./docs/ai-features.md)
- [Deployment](./docs/deployment.md)

## Project Structure

```
sds-manager/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── sds/
│   │   │   ├── admin/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── sds/
│   │   │   ├── upload/
│   │   │   ├── ai/
│   │   │   └── export/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── dashboard/
│   │   ├── sds/
│   │   └── admin/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── openai.ts
│   │   ├── storage.ts
│   │   └── utils.ts
│   ├── hooks/
│   ├── types/
│   └── locales/          # i18n (en, th)
├── public/
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker-compose up -d
```

See [deployment guide](./docs/deployment.md) for detailed instructions.

## License

MIT