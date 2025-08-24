# NextAuth.js Setup Guide

This guide covers setting up NextAuth.js for both local development and production deployment.

## 🏗️ **Current Implementation**

Your app currently supports:
- **Credentials Provider**: Email/password authentication
- **Google OAuth**: Optional Google sign-in (when configured)
- **Prisma Adapter**: Database integration for user management
- **JWT Strategy**: Stateless session management

## 🔧 **Local Development Setup**

### 1. Create `.env.local` File

Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fantasyfootball?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-for-local-development-only"

# Google OAuth (Optional)
# GOOGLE_CLIENT_ID="your-google-client-id"
# GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Database Setup

1. **Install PostgreSQL** locally or use a cloud service
2. **Create database**: `fantasyfootball`
3. **Run Prisma migrations**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

### 3. Test Local Authentication

1. **Start development server**: `npm run dev`
2. **Visit**: `http://localhost:3000/signin`
3. **Test credentials**: Use any email/password (will be created on first use)

## 🚀 **Production Setup (Vercel)**

### 1. Environment Variables in Vercel Dashboard

Set these in your Vercel project settings:

```bash
# Required
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-production-secret-key"

# Optional (Google OAuth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Database Provider Setup

**Recommended: Neon (PostgreSQL)**
1. Create account at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string to `DATABASE_URL`
4. Run migrations in production:
   ```bash
   npx prisma migrate deploy
   ```

**Alternative: Supabase**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Use connection string from Database settings

### 3. Google OAuth Setup (Optional)

1. **Google Cloud Console**:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Authorized Redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google (for local testing)
   ```

3. **Copy credentials** to environment variables

## 🔐 **Security Best Practices**

### 1. NEXTAUTH_SECRET Generation

Generate a strong secret:
```bash
# Option 1: Use openssl
openssl rand -base64 32

# Option 2: Use node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use online generator
# https://generate-secret.vercel.app/32
```

### 2. Environment Variable Security

- ✅ **Never commit** `.env.local` to Git
- ✅ **Use different secrets** for development and production
- ✅ **Rotate secrets** periodically in production
- ✅ **Limit database access** to necessary IPs only

## 🧪 **Testing Authentication**

### 1. Local Testing

```bash
# Start dev server
npm run dev

# Test sign-in page
curl http://localhost:3000/signin

# Test API endpoint
curl http://localhost:3000/api/auth/session
```

### 2. Production Testing

1. **Deploy to Vercel**
2. **Check build logs** for any auth-related errors
3. **Test sign-in flow** in production
4. **Verify session persistence** across page reloads

## 🐛 **Troubleshooting**

### Common Issues

#### 1. "Invalid redirect URI" (Google OAuth)
- Check redirect URIs in Google Cloud Console
- Ensure `NEXTAUTH_URL` matches your domain exactly

#### 2. "Database connection failed"
- Verify `DATABASE_URL` format
- Check database accessibility from Vercel
- Ensure database is running and accessible

#### 3. "JWT secret not configured"
- Set `NEXTAUTH_SECRET` environment variable
- Use strong, unique secret for production

#### 4. "Prisma client not generated"
- Ensure `prisma` is in `devDependencies`
- Check Vercel build logs for Prisma errors
- Verify `vercel.json` configuration

### Debug Mode

Enable debug logging in development:
```typescript
// Already configured in your setup
debug: process.env.NODE_ENV === "development"
```

## 📱 **Component Usage**

### Protected Routes

```tsx
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'

export default function ProtectedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") return <div>Loading...</div>
  
  if (!session) {
    router.push('/signin')
    return null
  }

  return <div>Welcome {session.user.email}!</div>
}
```

### Sign Out

```tsx
import { signOut } from 'next-auth/react'

<button onClick={() => signOut({ callbackUrl: '/' })}>
  Sign Out
</button>
```

## 🔄 **Migration from Local to Production**

1. **Database**: Set up production database
2. **Environment**: Configure Vercel environment variables
3. **Deploy**: Push code and deploy to Vercel
4. **Test**: Verify authentication flows work
5. **Monitor**: Watch for any auth-related errors

## 📚 **Additional Resources**

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

---

*This guide covers the essential setup for NextAuth.js in your Fantasy Football Dashboard.*
