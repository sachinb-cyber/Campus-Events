# Campus Events - Deployment Guide

## Current Deployment Status
- **Frontend**: Deployed on Vercel (https://campus-events-pied.vercel.app)
- **Backend**: Deployed on Railway (https://campus-events-production.up.railway.app)
- **Database**: MongoDB (production instance)

---

## Frontend Deployment (Vercel)

### Prerequisites
1. Vercel account (free tier available)
2. GitHub repository with frontend code
3. Environment variables configured

### Environment Variables Required
```
REACT_APP_SUPABASE_URL=https://trupjfpqowtcnujnpkiy.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_aTQN093a5Qgg1YoLxeY3Sw_fzqw2BxZ
REACT_APP_SUPABASE_REDIRECT=https://campus-events-pied.vercel.app/auth/callback
REACT_APP_BACKEND_URL=https://campus-events-production.up.railway.app
```

### Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "deployment ready"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect React project

3. **Configure Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all variables from "Environment Variables Required" section above
   - Make sure to add them for Production environment

4. **Build Configuration**
   - Build Command: `npm run build` (already configured in package.json)
   - Output Directory: `build` (already configured in vercel.json)

5. **Deploy**
   - Vercel will automatically deploy on every push to main
   - Or manually trigger deployment from dashboard

### Supabase OAuth Configuration
**CRITICAL**: Update Supabase OAuth redirect URLs:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add these Redirect URLs:
   - `https://campus-events-pied.vercel.app/auth/callback` (production)
   - `http://localhost:3001/auth/callback` (local development)
3. Make sure to save

---

## Backend Deployment (Railway)

### Prerequisites
1. Railway account (free tier available)
2. GitHub repository with backend code
3. MongoDB Atlas account for database

### Environment Variables Required
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=campus_events_prod
CORS_ORIGINS=https://campus-events-pied.vercel.app,http://localhost:3001
ADMIN_EMAILS=admin1@example.com,admin2@example.com
SUPER_ADMIN_EMAILS=superadmin@example.com
ADMIN_LOGIN_EMAIL=admin@rcpit.edu
ADMIN_LOGIN_PASSWORD=SecurePassword123!
SUPER_ADMIN_EMAIL=superadmin@college.edu
SUPER_ADMIN_PASSWORD=SecurePassword456!
SUPABASE_URL=https://trupjfpqowtcnujnpkiy.supabase.co
SUPABASE_ANON_KEY=sb_publishable_aTQN093a5Qgg1YoLxeY3Sw_fzqw2BxZ
```

### Deployment Steps

1. **Set up MongoDB Atlas**
   - Go to mongodb.com
   - Create MongoDB Atlas account (free tier)
   - Create a cluster
   - Create a database user (NOT your Atlas login)
   - Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority`
   - Add IP whitelist (for development, use 0.0.0.0/0)

2. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "backend deployment ready"
   git push origin main
   ```

3. **Connect to Railway**
   - Go to railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select repository

4. **Configure Environment Variables**
   - In Railway → Project → Variables
   - Add all variables from "Environment Variables Required" section
   - Railway will automatically detect Python and use railway.toml

5. **Deploy**
   - Railway automatically deploys when code is pushed to main
   - Monitor logs: Project → Deployments → View Logs

### Start Command
The `railway.toml` file contains:
```toml
[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port $PORT"
```
This is automatically used by Railway. The $PORT variable is provided by Railway.

---

## Database Setup (MongoDB)

### For Production
1. Create MongoDB Atlas account at mongodb.com
2. Create a free cluster
3. Create a database user (username/password)
4. Get connection string
5. Add to backend environment variables as `MONGO_URL`

### For Development (Local)
Already using local MongoDB. Connection:
```
MONGO_URL=mongodb://localhost:27017
```

---

## Changes Needed for Deployment

### Current Issues to Fix

#### 1. **Backend CORS Configuration**
- ✅ Already configured in `backend/server.py`
- Update `CORS_ORIGINS` env variable for production

#### 2. **Environment Variables**
- Create `.env.production` files for both frontend and backend
- Set correct backend URL in frontend `.env`
- Set correct database URL in backend `.env`

#### 3. **Frontend Build**
- ✅ Already configured
- Run `npm run build` to create production build
- Vercel handles this automatically

#### 4. **Backend Dependencies**
- ✅ All dependencies in `requirements.txt`
- Railway will install automatically

#### 5. **Supabase Configuration**
- ✅ CRITICAL: Update OAuth redirect URLs in Supabase
- Add production URL: `https://campus-events-pied.vercel.app/auth/callback`

---

## Deployment Checklist

### Before Deployment
- [ ] All environment variables configured
- [ ] Supabase OAuth URLs updated
- [ ] MongoDB connection string working
- [ ] CORS origins list includes production frontend URL
- [ ] Git repository is clean and committed
- [ ] Test locally with production URLs (update .env temporarily)

### Frontend (Vercel)
- [ ] GitHub account connected to Vercel
- [ ] Repository imported to Vercel
- [ ] Environment variables added in Vercel dashboard
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Deploy

### Backend (Railway)
- [ ] GitHub account connected to Railway
- [ ] Repository imported to Railway
- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Environment variables added in Railway dashboard
- [ ] `railway.toml` exists in root of backend folder
- [ ] Deploy

### Post-Deployment
- [ ] Test login with Google OAuth
- [ ] Verify token exchange works
- [ ] Check home page redirects after login
- [ ] Test API endpoints from frontend
- [ ] Monitor logs for errors

---

## Common Issues & Solutions

### CORS Errors
**Problem**: "Access to fetch blocked by CORS policy"
**Solution**: 
- Check backend `CORS_ORIGINS` environment variable includes frontend URL
- Make sure backend is using HTTPS in production

### OAuth Redirect Not Working
**Problem**: Redirect loop or "Invalid redirect URI"
**Solution**:
- Update Supabase OAuth redirect URLs to match frontend URL
- Frontend URL must match exactly (case-sensitive)
- For vercel: `https://campus-events-pied.vercel.app/auth/callback`

### Database Connection Failed
**Problem**: "Failed to connect to MongoDB"
**Solution**:
- Check `MONGO_URL` is correct
- For MongoDB Atlas, add IP to whitelist (0.0.0.0/0 for testing)
- Verify database user password in connection string

### Token Exchange Failing
**Problem**: "Failed to exchange token"
**Solution**:
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in backend env vars
- Check that Supabase keys match between frontend and backend
- Monitor backend logs for detailed error

---

## Monitoring & Maintenance

### View Logs
- **Frontend (Vercel)**: Dashboard → Logs → Function Logs
- **Backend (Railway)**: Project → Deployments → View Logs

### Update Environment Variables
- **Vercel**: Settings → Environment Variables → Edit and redeploy
- **Railway**: Variables → Edit and redeploy

### Rollback
- **Vercel**: Deployments → Select previous deployment → Promote
- **Railway**: Deployments → Select previous deployment → Activate

---

## Cost Estimates

- **Vercel**: Free tier (up to 100GB bandwidth/month)
- **Railway**: Free tier ($5/month credit, usually sufficient for small apps)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Supabase**: Free tier (2GB storage, 50k monthly active users)

---

## Additional Resources

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Supabase Docs: https://supabase.com/docs
