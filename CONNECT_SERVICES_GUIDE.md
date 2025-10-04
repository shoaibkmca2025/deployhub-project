# 🔗 Complete Guide: Connecting Both Services on Render

## 🎯 Goal: Connect Frontend and Backend Services

This guide will help you properly connect your deployed frontend and backend services so they can communicate with each other.

---

## 📋 Prerequisites
- ✅ Both services deployed on Render
- ✅ Backend service URL (e.g., `https://deployhub-backend.onrender.com`)
- ✅ Frontend service URL (e.g., `https://deployhub-frontend.onrender.com`)

---

## 🚀 Step-by-Step Connection Process

### Step 1: Get Your Service URLs

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Log in to your account

2. **Find Your Services**
   - Look for your backend service (e.g., `deployhub-backend`)
   - Look for your frontend service (e.g., `deployhub-frontend`)

3. **Copy the URLs**
   - Backend URL: `https://deployhub-backend.onrender.com`
   - Frontend URL: `https://deployhub-frontend.onrender.com`

### Step 2: Configure Backend Service

1. **Go to Backend Service**
   - Click on your backend service name
   - Go to "Environment" tab

2. **Add/Update Environment Variables**
   ```
   NODE_ENV=production
   PORT=4000
   FRONTEND_URL=https://deployhub-frontend.onrender.com
   ```

3. **Save Changes**
   - Click "Save Changes"
   - Service will automatically redeploy

### Step 3: Configure Frontend Service

1. **Go to Frontend Service**
   - Click on your frontend service name
   - Go to "Environment" tab

2. **Add/Update Environment Variables**
   ```
   VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com
   ```

3. **Save Changes**
   - Click "Save Changes"
   - Service will automatically redeploy

### Step 4: Verify CORS Configuration

1. **Check Backend CORS Settings**
   - The backend is already configured to accept requests from Render domains
   - CORS includes: `https://deployhub-frontend.onrender.com`

2. **If you have a different frontend URL, update the backend code:**
   - Go to your GitHub repository
   - Edit `backend/server/src/index.js`
   - Update the CORS origin to include your actual frontend URL

### Step 5: Test the Connection

1. **Test Backend Health**
   ```bash
   curl https://deployhub-backend.onrender.com/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-01-04T...",
     "agents": 0,
     "deployments": 0,
     "uptime": 123.45,
     "version": "1.0.0"
   }
   ```

2. **Test Frontend Loads**
   - Visit your frontend URL
   - Should see DeployHub signup page
   - No console errors

3. **Test API Connection**
   - Open browser developer tools (F12)
   - Go to Network tab
   - Try to sign up
   - Should see successful API calls to backend

---

## 🔧 Detailed Configuration

### Backend Service Configuration

**Service Type:** Web Service
**Environment:** Node
**Root Directory:** . (project root)
**Build Command:** `cd backend && npm install`
**Start Command:** `cd backend && npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://deployhub-frontend.onrender.com
```

### Frontend Service Configuration

**Service Type:** Static Site
**Root Directory:** . (project root)
**Build Command:** `cd frontend && npm install && npx vite build`
**Publish Directory:** `frontend/dist`

**Environment Variables:**
```
VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com
```

---

## 🧪 Testing Your Connection

### Test 1: Backend API
```bash
# Test health endpoint
curl https://deployhub-backend.onrender.com/health

# Test signup endpoint
curl -X POST https://deployhub-backend.onrender.com/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test 2: Frontend Connection
1. Open your frontend URL
2. Open browser developer tools (F12)
3. Go to Console tab
4. Look for any CORS or connection errors
5. Try to sign up - should work without errors

### Test 3: Full Application Flow
1. Visit frontend URL
2. Create a new account
3. Should redirect to dashboard
4. All features should work

---

## 🚨 Troubleshooting Common Issues

### Issue 1: CORS Errors
**Symptoms:** Browser shows CORS errors in console
**Solution:** 
- Check that `FRONTEND_URL` in backend matches your actual frontend URL
- Verify CORS configuration in `backend/server/src/index.js`

### Issue 2: "Failed to fetch" Errors
**Symptoms:** Frontend shows "Failed to fetch" when trying to sign up
**Solution:**
- Check that `VITE_SERVER_ORIGIN` in frontend matches your actual backend URL
- Verify backend is running and accessible

### Issue 3: Services Not Communicating
**Symptoms:** Frontend loads but can't connect to backend
**Solution:**
- Check environment variables are set correctly
- Verify both services are deployed and running
- Check Render logs for errors

### Issue 4: Environment Variables Not Working
**Symptoms:** Changes to environment variables don't take effect
**Solution:**
- Make sure to save changes in Render dashboard
- Wait for services to redeploy
- Check that variable names are correct

---

## 📊 Service Status Check

### Backend Service Status
- **URL:** `https://deployhub-backend.onrender.com`
- **Health Check:** `https://deployhub-backend.onrender.com/health`
- **Status:** Should show "Live" in Render dashboard

### Frontend Service Status
- **URL:** `https://deployhub-frontend.onrender.com`
- **Status:** Should show "Live" in Render dashboard
- **Build:** Should show "Build successful"

---

## ✅ Success Indicators

Your services are properly connected when:
- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without console errors
- ✅ Signup form works without "Failed to fetch" errors
- ✅ User can create account and access dashboard
- ✅ No CORS errors in browser console
- ✅ API calls succeed in Network tab

---

## 🎯 Final Verification

1. **Backend is accessible:** `https://deployhub-backend.onrender.com/health`
2. **Frontend loads:** `https://deployhub-frontend.onrender.com`
3. **Signup works:** No errors when creating account
4. **Dashboard accessible:** User can access main application

---

## 🚀 You're All Set!

Once both services are properly connected, your DeployHub application will be fully functional and accessible to users worldwide!

**Need help?** Check the troubleshooting section above or review the Render logs for any specific errors.
