# Manual Deployment Guide for DeployHub

## Current Issue
The automatic Render deployment is not reflecting the latest changes. This guide provides manual steps to fix the deployment.

## Solution 1: Manual Deploy in Render Dashboard

### Step 1: Access Render Dashboard
1. Go to [render.com](https://render.com)
2. Log in to your account
3. Navigate to your DeployHub project

### Step 2: Manual Deploy Frontend
1. Find your **deployhub-frontend** service
2. Click on the service name
3. Go to the **"Deploys"** tab
4. Click **"Manual Deploy"**
5. Select **"Deploy latest commit"**
6. Wait for deployment to complete (2-5 minutes)

### Step 3: Manual Deploy Backend
1. Find your **deployhub-backend** service
2. Click on the service name
3. Go to the **"Deploys"** tab
4. Click **"Manual Deploy"**
5. Select **"Deploy latest commit"**
6. Wait for deployment to complete (2-5 minutes)

## Solution 2: Check Render Configuration

### Frontend Service Settings
- **Build Command**: `cd frontend/web && npm install && npm run build`
- **Publish Directory**: `frontend/web/dist`
- **Root Directory**: `.` (root of repository)
- **Branch**: `main`

### Backend Service Settings
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Root Directory**: `.` (root of repository)
- **Branch**: `main`

## Solution 3: Environment Variables

### Frontend Environment Variables
```
VITE_SERVER_ORIGIN=https://deployhub-backend.onrender.com
VITE_APP_NAME=DeployHub
VITE_APP_VERSION=1.0.0
```

### Backend Environment Variables
```
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://deployhub-frontend.onrender.com
```

## Solution 4: Verify Deployment

### After Manual Deploy:
1. **Wait 5-10 minutes** for deployment to complete
2. **Hard refresh** your frontend page (Ctrl+F5)
3. **Check for green banner** saying "✅ DEPLOYMENT SUCCESSFUL"
4. **Look for download buttons** and "Add Demo Agents" button
5. **Test demo agents** by clicking the button

## Solution 5: Alternative Deployment Method

If Render continues to have issues, you can:

1. **Delete and recreate** the services in Render
2. **Use the render.yaml** file for automatic setup
3. **Contact Render support** for assistance

## Expected Results After Fix

### Hardware Page Should Show:
- ✅ Green "DEPLOYMENT SUCCESSFUL" banner
- ✅ Download Windows Agent button
- ✅ Download Linux Agent button  
- ✅ Add Demo Agents button
- ✅ Clear instructions for device connection
- ✅ Demo devices when demo is activated

### Demo Agents Should Include:
- ✅ Demo Windows Agent (8 CPU cores, 16GB RAM)
- ✅ Demo Linux Server (4 CPU cores, 8GB RAM)
- ✅ Realistic system specifications
- ✅ Online status indicators

## Troubleshooting

### If Still Not Working:
1. **Check Render logs** for build errors
2. **Verify GitHub connection** in Render settings
3. **Try incognito/private browsing** to bypass cache
4. **Wait longer** for CDN cache to clear
5. **Contact Render support** with deployment logs

### Common Issues:
- **Build failures**: Check npm install and build commands
- **Environment variables**: Verify all required variables are set
- **Branch mismatch**: Ensure Render is tracking the correct branch
- **Cache issues**: Wait for CDN cache to clear or use incognito mode

## Success Indicators

You'll know the deployment is working when you see:
1. **Green deployment banner** on the hardware page
2. **Download buttons** for agent installation
3. **Demo agents button** that works
4. **Real-time device monitoring** functionality

The latest commit (29993bd) includes all fixes and should resolve the deployment issues.
