# Commands to Run Frontend and Backend

## Frontend (NPM)

### Start Frontend
```powershell
cd C:\Users\sachi\Downloads\git\frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3001
```

**If port 3000 is busy**, it will automatically use port 3001.

---

## Backend (Python/FastAPI)

### Prerequisites
- MongoDB running locally on `mongodb://localhost:27017`
- Python 3.x installed
- Dependencies installed: `pip install -r requirements.txt`

### Start Backend
```powershell
cd C:\Users\sachi\Downloads\git\backend
python -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
```

**Expected Output:**
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
2026-01-24 HH:MM:SS - server - INFO - Application startup: MongoDB client connected
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Check if Backend is Running
```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -ErrorAction SilentlyContinue
```

---

## Frontend Environment Variables

**File**: `frontend/.env`

```env
REACT_APP_SUPABASE_URL=https://trupjfpqowtcnujnpkiy.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_aTQN093a5Qgg1YoLxeY3Sw_fzqw2BxZ
REACT_APP_SUPABASE_REDIRECT=http://localhost:3001
REACT_APP_BACKEND_URL=http://localhost:8000
```

---

## Backend Environment Variables

**File**: `backend/.env`

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
SUPABASE_URL="https://trupjfpqowtcnujnpkiy.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_aTQN093a5Qgg1YoLxeY3Sw_fzqw2BxZ"
```

---

## Testing OAuth Flow

### 1. Open Frontend
```
http://localhost:3001
```

### 2. Open Developer Console
```
Press F12 → Click "Console" tab
```

### 3. Click Login with Google
- Watch console for debugging logs
- Complete Google login
- Check if redirected to home page

### 4. Check Console Output
Look for:
```
=== LOGIN DEBUG START ===
...logs...
=== AuthCallback DEBUG START ===
...logs...
```

---

## Troubleshooting

### Frontend won't start
```powershell
# Clear node_modules and reinstall
rm -r C:\Users\sachi\Downloads\git\frontend\node_modules
cd C:\Users\sachi\Downloads\git\frontend
npm install
npm start
```

### Port 3001 still in use
```powershell
# Kill process on port 3001
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Stop-Process -Force
```

### MongoDB Connection Error
```powershell
# Install MongoDB Community Edition:
# https://www.mongodb.com/try/download/community

# Or start using Docker:
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Supabase Configuration Error
- Verify `REACT_APP_SUPABASE_ANON_KEY` is set in `frontend/.env`
- Verify `SUPABASE_ANON_KEY` is set in `backend/.env`
- Check Supabase project settings: https://app.supabase.com/

---

## Common URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3001 | User login & events |
| Backend | http://localhost:8000 | API endpoints |
| Backend Docs | http://localhost:8000/docs | FastAPI Swagger UI |
| MongoDB | mongodb://localhost:27017 | Database |
| Supabase | https://trupjfpqowtcnujnpkiy.supabase.co | OAuth provider |

---

## Next Steps

1. **Test locally** with the debugging enabled
2. **Identify the exact failure point** in the OAuth flow
3. **Fix the issue** (in frontend, backend, or Supabase config)
4. **Deploy to production**:
   - Frontend → Vercel (https://campus-events-pied.vercel.app)
   - Backend → Railway (https://railway.com/project/703434e2-bb78-4c66-8c66-480fa623dfd0)
5. **Update environment variables** in each platform

---

**Last Updated**: January 24, 2026
