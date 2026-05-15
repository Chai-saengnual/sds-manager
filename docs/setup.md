# SDS Manager — Setup Guide

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or use Supabase/Neon for cloud)
- pnpm (recommended) or npm/yarn
- Git

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-org/sds-manager.git
cd sds-manager
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database (local or cloud)
DATABASE_URL="postgresql://postgres:password@localhost:5432/sds_manager"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret"

# OpenAI (required for AI features)
OPENAI_API_KEY="sk-your-openai-key"

# Storage (choose one)
# Option A: Supabase (recommended for quick start)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
NEXT_PUBLIC_STORAGE_PROVIDER="supabase"

# Option B: AWS S3
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="sds-documents"
# NEXT_PUBLIC_STORAGE_PROVIDER="s3"
```

### 3. Database Setup

```bash
# Push schema to database
pnpm db:push

# Seed demo data
pnpm db:seed
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Login

```
Email: admin@sdsmanager.com
Password: admin123
```

## Docker Setup

### Quick Start with Docker Compose

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Build and run the app
- Expose the app on port 3000

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
# Build for production
npm run build

# Run standalone server
node server.js
```

## Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings > API
3. Create a storage bucket named `sds-documents`
4. Set bucket to public or configure Row Level Security
5. Update environment variables

## OpenAI Setup

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add to environment variables
3. (Optional) Set usage limits to prevent unexpected charges

## Troubleshooting

### Database Connection Issues

```bash
# Check DATABASE_URL format
DATABASE_URL="postgresql://user:password@host:port/database"

# Test connection
npx prisma db push
```

### Prisma Client Not Generated

```bash
npx prisma generate
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## Next Steps

1. Create categories for your products
2. Upload SDS PDFs for your chemicals
3. Run AI analysis to extract data
4. Set up email notifications
5. Configure user roles and permissions