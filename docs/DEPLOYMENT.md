# Deployment Guide

This guide covers deploying the Fantasy Football Dashboard to various platforms.

## 🚀 Vercel Deployment

### Prerequisites
- Vercel account
- PostgreSQL database (Neon, Supabase, or other)
- Environment variables configured

### Environment Variables Required

Add these environment variables in your Vercel dashboard:

**CRITICAL: Do NOT include quotes around the values in Vercel dashboard**

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database?schema=public

# NextAuth.js
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# OAuth Providers (Optional - only if you want Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Prisma (automatically set)
PRISMA_GENERATE_DATAPROXY=true
```

### Environment Variable Formatting

**Important**: When setting environment variables in Vercel, enter the values directly without quotes. The Vercel dashboard will handle the values correctly.

**Correct format in Vercel dashboard:**
- DATABASE_URL: `postgresql://username:password@host:port/database?sslmode=require&channel_binding=require`
- NEXTAUTH_SECRET: `your-secret-key-here`
- NEXTAUTH_URL: `https://yourdomain.com`

**Incorrect format (will cause authentication failures):**
- DATABASE_URL: `"postgresql://username:password@host:port/database?sslmode=require&channel_binding=require"`
- NEXTAUTH_SECRET: `"your-secret-key-here"`
- NEXTAUTH_URL: `"https://yourdomain.com"`

### Deployment Steps

1. **Connect Repository**: Link your GitHub repository to Vercel

2. **Configure Build Settings**: 
   - Framework Preset: **Next.js**
   - Build Command: `npm run vercel-build` (automatically configured via `vercel.json`)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Set Environment Variables**: Add all required environment variables in Vercel dashboard

4. **Deploy**: Click "Deploy" button

### Prisma Configuration

The project is configured to automatically generate Prisma Client during Vercel builds:

- **`package.json`**: Includes `prisma generate` in build scripts
- **`vercel.json`**: Specifies custom build command and Prisma environment
- **`postinstall` script**: Ensures Prisma Client is generated after dependency installation

### Build Process

The build process follows this sequence:
1. `npm install` - Install dependencies
2. `prisma generate` - Generate Prisma Client (via postinstall)
3. `prisma generate && next build --turbopack` - Generate client again and build Next.js

### Local Development vs. Production

**For Local Development (Windows):**
- Use `npm run build:local` to skip Prisma generation if you encounter file permission issues
- This is a Windows-specific workaround and won't affect production deployment

**For Production (Vercel):**
- Use `npm run build` or `npm run vercel-build` (automatically configured)
- Prisma Client generation is handled automatically during the build process

### Troubleshooting

#### Authentication 500 Errors (Most Common Issue)

If you're experiencing 500 errors during authentication (signup/signin), the most common cause is incorrect environment variable formatting:

**Problem**: Quotes around environment variables in Vercel
- **Symptom**: 500 errors on `/api/auth/register` and signin endpoints
- **Cause**: Prisma cannot parse connection strings that include quotes
- **Error message**: "the URL must start with the protocol `postgresql://` or `postgres://`"

**Solution**: Remove quotes from all environment variables in Vercel dashboard
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Edit each variable to remove surrounding quotes
4. Redeploy your application

**Example of the fix:**
- **Before**: `"postgresql://user:pass@host:port/db?sslmode=require"`
- **After**: `postgresql://user:pass@host:port/db?sslmode=require`

#### "Prisma Client not generated" Error
This error occurs when Prisma Client isn't properly generated during build. Our configuration should prevent this, but if it occurs:

1. Verify `PRISMA_GENERATE_DATAPROXY=true` is set in environment variables
2. Check that `vercel.json` is properly configured
3. Ensure `prisma` is in `devDependencies` in `package.json`

#### Database Connection Issues
1. Verify `DATABASE_URL` is correctly formatted (without quotes)
2. Ensure database is accessible from Vercel's regions
3. Check that database provider supports external connections
4. For cloud databases like Neon, ensure SSL parameters are included: `?sslmode=require&channel_binding=require`

#### Build Timeout
If builds time out:
1. Consider using Vercel Pro for longer build times
2. Optimize dependencies and build process
3. Check for unnecessary large files in the build

#### Local Windows Prisma Issues
If you encounter `EPERM: operation not permitted` errors on Windows during local builds:
1. Use `npm run build:local` to skip Prisma generation locally
2. This is a Windows-specific file permission issue, not a code problem
3. Production deployment on Vercel will work correctly with the full build process
4. The issue is related to Windows file locking, not the application code

#### NextAuth Build Errors
If you encounter "Failed to collect page data for /api/auth/[...nextauth]" errors:
1. Ensure environment variables are properly set (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. The NextAuth configuration is now build-friendly and handles missing environment variables gracefully
3. Google OAuth provider is only enabled when credentials are available
4. Production builds will work correctly with proper environment variable configuration

## 🐳 Docker Deployment (Alternative)

For Docker deployment, you would need to:

1. Create a `Dockerfile`
2. Configure multi-stage build
3. Include Prisma generate step
4. Set up proper environment variables

## 📊 Database Providers

### Recommended Providers for Vercel
- **Neon**: Serverless PostgreSQL, excellent Vercel integration
- **Supabase**: Full-featured PostgreSQL with additional services
- **PlanetScale**: MySQL-compatible serverless database
- **Vercel Postgres**: Native Vercel database solution

### Connection String Format
```
postgresql://username:password@host:port/database?schema=public
```

## 🔧 Post-Deployment

After successful deployment:

1. **Verify Database Connection**: Check logs for any database connection errors
2. **Test Authentication**: Ensure NextAuth.js is working properly
3. **Check API Routes**: Verify `/api/players` endpoint
4. **Monitor Performance**: Watch for any caching or performance issues

## 📝 Notes

- Vercel automatically handles SSL/TLS certificates
- The application uses server-side caching for performance
- All sensitive data is handled through environment variables
- The build process is optimized for Vercel's infrastructure

---

*For more technical details, see the [Documentation Index](./README.md)*
