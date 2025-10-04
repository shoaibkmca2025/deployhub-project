# 🔗 Quick Reference: Connect Services on Render

## ⚡ Quick Steps

### 1. Get Your URLs
- Backend: `https://deployhub-backend.onrender.com`
- Frontend: `https://deployhub-frontend.onrender.com`

### 2. Configure Backend
**Go to Backend Service → Environment Tab:**
```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://deployhub-frontend.onrender.com
```

### 3. Configure Frontend
**Go to Frontend Service → Environment Tab:**
```
VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com
```

### 4. Test Connection
- Backend: `https://deployhub-backend.onrender.com/health`
- Frontend: `https://deployhub-frontend.onrender.com`
- Try signup - should work without errors

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Check FRONTEND_URL matches actual frontend URL |
| "Failed to fetch" | Check VITE_SERVER_ORIGIN matches actual backend URL |
| Services not talking | Verify both services are "Live" in Render dashboard |
| Env vars not working | Save changes and wait for redeploy |

## ✅ Success Check
- Backend health check: 200 OK
- Frontend loads: No console errors
- Signup works: No "Failed to fetch" errors
- Dashboard accessible: User can access main app
