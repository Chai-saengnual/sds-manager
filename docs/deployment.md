# SDS Manager — Deployment Guide

## Deployment Options

### Option 1: Vercel (Recommended)

**Best for:** Fast deployment, serverless, global CDN

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-org/sds-manager.git
   git push -u origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   Add all required variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `OPENAI_API_KEY`
   - Storage credentials

4. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically

5. **Database Setup**
   - Create PostgreSQL database (Supabase, Neon, or Railway)
   - Run migrations: `vercel env pull .env.local && npx prisma db push`
   - Seed data: `pnpm db:seed`

### Option 2: Docker

**Best for:** Self-hosted, full control

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Option 3: Railway

**Best for:** Easy PostgreSQL + App hosting

1. Create Railway account
2. Add PostgreSQL database
3. Deploy from GitHub
4. Set environment variables
5. Run migrations

### Option 4: AWS (ECS/EC2)

**Best for:** Enterprise, full AWS integration

1. **EC2 Instance**
   - Launch Ubuntu 22.04 instance
   - Install Docker
   - Clone repository
   - Run with Docker Compose

2. **ECS/Fargate**
   - Build Docker image
   - Push to ECR
   - Create ECS task definition
   - Configure load balancer

## Database Options

### Supabase (Recommended for Vercel)

1. Create project at [supabase.com](https://supabase.com)
2. Get connection string from Settings > Connection String
3. Use in `DATABASE_URL`

### Neon

1. Create project at [neon.tech](https://neon.tech)
2. Get connection string
3. Use in `DATABASE_URL`

### Railway

1. Create PostgreSQL database
2. Get connection string from connection details
3. Use in `DATABASE_URL`

## Storage Options

### Supabase Storage (Recommended)

1. Create bucket `sds-documents`
2. Set public or configure RLS
3. Add credentials to env vars

### AWS S3

1. Create S3 bucket
2. Configure CORS
3. Create IAM user with access
4. Add credentials

## Environment Variables Reference

### Required

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-32-char-secret
```

### Optional

```env
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=sds-documents
```

## Domain & SSL

### Vercel
- Auto-assigned `.vercel.app` domain
- Custom domain with auto SSL

### Docker/Other
- Use nginx or Caddy for reverse proxy
- Let's Encrypt for free SSL

## Monitoring

### Vercel Analytics
- Built-in analytics dashboard
- Performance monitoring

### Sentry
1. Create Sentry account
2. Install: `npm install @sentry/nextjs`
3. Add DSN to env vars

## CI/CD

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Backup Strategy

### Database
- Use daily automated backups (Supabase/Neon)
- Or pg_dump to S3

### File Storage
- Enable versioning on S3/Supabase
- Set up lifecycle policies

## Security Checklist

- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Enable rate limiting
- [ ] Set up CORS properly
- [ ] Use HTTPS everywhere
- [ ] Regular security updates
- [ ] Monitor access logs
- [ ] Enable database encryption
- [ ] Use secrets manager for API keys

## Troubleshooting

### 500 Error on Deploy

1. Check environment variables
2. Verify database connection
3. Check build logs
4. Review function logs

### Database Connection Failed

1. Verify DATABASE_URL format
2. Check connection pooling
3. Ensure IP whitelist (if applicable)

### Build Failed

1. Check TypeScript errors
2. Verify all dependencies installed
3. Clear `.next` cache