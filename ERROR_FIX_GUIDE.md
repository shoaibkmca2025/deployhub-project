# DeployHub "Failed to fetch" Error Fix

## 🔍 Problem Analysis
The "Failed to fetch" error on the DeployHub signup page indicates a connection issue between the frontend and backend.

## 🛠️ Solution Steps

### 1. Check Service Status
```bash
# Check if backend is running
netstat -an | findstr ":4000"

# Check if frontend is running  
netstat -an | findstr ":5173"
```

### 2. Start Services Manually
```bash
# Start backend
cd backend
npm run server:dev

# Start frontend (in another terminal)
cd frontend  
npm run web:dev
```

### 3. Test API Connection
Open `api-test.html` in your browser to test the API connection directly.

### 4. Common Fixes

#### Fix A: CORS Configuration
The backend CORS might not include the frontend URL. Update `backend/server/src/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://10.136.64.168:5173',  // Add your IP
    /^http:\/\/10\.136\.64\.168:\d+$/
  ],
  credentials: true
}));
```

#### Fix B: Environment Variables
Create `frontend/web/.env`:
```
VITE_SERVER_ORIGIN=http://localhost:4000
```

#### Fix C: Network Configuration
If accessing via IP address, update the API configuration in `frontend/web/src/ui/api.ts`:

```javascript
const serverOrigin = (import.meta as any).env?.VITE_SERVER_ORIGIN || 
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : `http://${location.hostname}:4000`);
```

### 5. Docker Deployment (Alternative)
If manual setup doesn't work, use Docker:

```bash
# Install Docker Desktop first, then:
npm run dev
```

## 🚨 Quick Fix Commands

```bash
# Stop all Node processes
taskkill /f /im node.exe

# Start services
cd backend && npm run server:dev &
cd frontend && npm run web:dev &

# Test connection
curl http://localhost:4000/api/status
```

## 🔧 Debug Steps

1. **Check Browser Console**: Open Developer Tools → Console for error details
2. **Check Network Tab**: See if requests are being made and what responses you get
3. **Test API Directly**: Use the `api-test.html` file
4. **Check Firewall**: Ensure ports 4000 and 5173 are not blocked

## 📋 Expected Behavior

- Backend should respond to `http://localhost:4000/api/status`
- Frontend should load at `http://localhost:5173`
- Signup should work without "Failed to fetch" error

## 🎯 Success Indicators

- ✅ Backend server shows "DeployHub server listening on http://0.0.0.0:4000"
- ✅ Frontend loads without console errors
- ✅ Signup form submits successfully
- ✅ User gets redirected to dashboard
