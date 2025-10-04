# DeployHub Render Deployment Guide

## 🚀 Complete Guide to Deploy DeployHub on Render

### Prerequisites
- GitHub repository with your DeployHub code
- Render account (free tier available)
- Git knowledge

---

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create production environment file:**
   Create `frontend/web/.env.production` with:
   ```
   VITE_SERVER_ORIGIN=https://your-backend-service.onrender.com
   ```

### Step 2: Deploy Backend Service

1. **Go to Render Dashboard:**
   - Visit [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your DeployHub repository

3. **Configure Backend Service:**
   ```
   Name: deployhub-backend
   Environment: Node
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Build Command: npm install
   Start Command: npm start
   ```

4. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=4000
   ```

5. **Advanced Settings:**
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** Yes

6. **Click "Create Web Service"**

### Step 3: Deploy Frontend Service

1. **Create New Static Site:**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Select your DeployHub repository

2. **Configure Frontend Service:**
   ```
   Name: deployhub-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

3. **Environment Variables:**
   ```
   VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com
   ```
   (Replace with your actual backend URL)

4. **Click "Create Static Site"**

### Step 4: Update CORS Configuration

1. **Get your frontend URL from Render**
2. **Update backend CORS settings:**
   - Go to your backend service on Render
   - Add environment variable:
   ```
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ```

3. **Update the backend code** (already done in the updated version)

---

## 🔧 Service Configuration Details

### Backend Service (Web Service)
```yaml
Service Type: Web Service
Environment: Node
Build Command: npm install
Start Command: npm start
Port: 4000
Health Check: /health
Auto-Deploy: Yes
```

### Frontend Service (Static Site)
```yaml
Service Type: Static Site
Build Command: npm install && npm run build
Publish Directory: dist
Auto-Deploy: Yes
```

---

## 🌐 Environment Variables

### Backend Environment Variables
```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend-url.onrender.com
```

### Frontend Environment Variables
```
VITE_SERVER_ORIGIN=https://your-backend-url.onrender.com
```

---

## 📊 Monitoring & Health Checks

### Backend Health Check
- **URL:** `https://your-backend.onrender.com/health`
- **Expected Response:**
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

### Frontend Health Check
- **URL:** `https://your-frontend.onrender.com`
- **Expected:** DeployHub signup/login page loads

---

## 🔄 Auto-Deployment Setup

### GitHub Integration
1. **Connect GitHub repository to Render**
2. **Enable auto-deploy on main branch**
3. **Set up webhooks** (automatic with Render)

### Deployment Process
1. **Push to main branch**
2. **Render automatically builds and deploys**
3. **Services restart with new code**

---

## 💰 Cost Considerations

### Free Tier Limits
- **Backend:** 750 hours/month (sleeps after 15 min inactivity)
- **Frontend:** Unlimited static hosting
- **Bandwidth:** 100GB/month

### Paid Plans
- **Starter:** $7/month (always-on backend)
- **Standard:** $25/month (better performance)

---

## 🚨 Common Issues & Solutions

### Issue 1: CORS Errors
**Solution:** Update CORS configuration in backend with correct frontend URL

### Issue 2: Build Failures
**Solution:** Check build logs in Render dashboard

### Issue 3: Environment Variables Not Working
**Solution:** Ensure variables are set correctly in Render dashboard

### Issue 4: Services Not Communicating
**Solution:** Verify URLs in environment variables

---

## 🎯 Post-Deployment Checklist

- [ ] Backend service is running and healthy
- [ ] Frontend builds successfully
- [ ] Frontend loads without errors
- [ ] Signup/login works
- [ ] API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] Environment variables are set
- [ ] Auto-deploy is working

---

## 🔗 Service URLs

After deployment, you'll have:
- **Backend API:** `https://deployhub-backend.onrender.com`
- **Frontend App:** `https://deployhub-frontend.onrender.com`
- **Health Check:** `https://deployhub-backend.onrender.com/health`

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node)
- [Static Sites on Render](https://render.com/docs/static-sites)
- [Environment Variables](https://render.com/docs/environment-variables)

---

## ✅ Success Indicators

Your deployment is successful when:
1. ✅ Both services show "Live" status
2. ✅ Frontend loads the DeployHub signup page
3. ✅ Backend health check returns 200 OK
4. ✅ Signup form works without "Failed to fetch" errors
5. ✅ User can create account and access dashboard

**Happy deploying! 🚀**
