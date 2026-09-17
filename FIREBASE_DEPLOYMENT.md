# Firebase Hosting & Production Deployment Guide — NEXUS

This guide provides instructions for deploying **NEXUS — AI Student Operating System** to **Firebase Hosting** and configuring your production backend.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Browser                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│   Firebase Hosting    │             │   NEXUS API Backend   │
│   (Vite + React SPA)  │             │ (Cloud Run / Render)  │
│  - Edge CDN           │             │  - Express + TS       │
│  - PWA precache       │             │  - MongoDB Atlas      │
│  - Instant SSL        │             │  - AI / LeetCode / GH │
└───────────────────────┘             └───────────────────────┘
```

NEXUS is designed as a high-performance decoupled architecture:
1. **Frontend (Single Page Application)**: Hosted on **Firebase Hosting** for global CDN performance, zero maintenance, and automatic SSL.
2. **Backend API**: Can be hosted on **Google Cloud Run** (which natively routes via `firebase.json` rewrites), or any container/Node host like **Render**, **Railway**, or **Fly.io**.

---

## 2. Prerequisites

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. **Log in to Firebase**:
   ```bash
   firebase login
   ```
3. **Ensure you have a Firebase Project** created in the [Firebase Console](https://console.firebase.google.com/).

---

## 3. Link Your Firebase Project

In the project root directory (`student osAI/`), run:

```bash
firebase use --add
```
Select your Firebase project from the list, or set it directly in `.firebaserc`:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

---

## 4. Frontend Deployment (Firebase Hosting)

### Step 1: Set Backend API URL (Optional)
If your backend is hosted separately (e.g. on Render or Cloud Run):
Create `client/.env.production`:
```env
VITE_API_URL=https://your-api-domain.com
```
*(If you are routing `/api` through Firebase Hosting rewrites or Cloud Run on the same domain, leave this empty and it will automatically default to `/api`.)*

### Step 2: Build & Deploy
Run the pre-configured deployment command from the project root:
```bash
npm run deploy:hosting
```
Or manually:
```bash
npm run build:client
firebase deploy --only hosting
```

Your app is now live at:
`https://<your-firebase-project-id>.web.app` or `https://<your-firebase-project-id>.firebaseapp.com`

---

## 5. Backend Deployment Options

### Option A: Google Cloud Run (Recommended for Firebase)
Google Cloud Run pairs directly with Firebase Hosting without needing separate domain configurations or CORS setup.

1. **Build and submit container** using Google Cloud SDK:
   ```bash
   cd server
   gcloud builds submit --tag gcr.io/<your-firebase-project-id>/nexus-server
   ```
2. **Deploy container to Cloud Run**:
   ```bash
   gcloud run deploy nexus-server \
     --image gcr.io/<your-firebase-project-id>/nexus-server \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production,MONGODB_URI="your-mongodb-atlas-uri",JWT_SECRET="your-strong-random-secret",CLIENT_URL="https://<your-firebase-project-id>.web.app"
   ```
3. **Connect Firebase Hosting to Cloud Run**:
   Uncomment or add the Cloud Run rewrite in `firebase.json`:
   ```json
   {
     "hosting": {
       "public": "client/dist",
       "rewrites": [
         {
           "source": "/api/**",
           "run": {
             "serviceId": "nexus-server",
             "region": "us-central1"
           }
         },
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```
   Deploy hosting again: `firebase deploy --only hosting`. Now `/api` calls route directly to Cloud Run on the same domain!

### Option B: Render / Railway / Fly.io / VPS
You can also deploy the backend using the included `server/Dockerfile`:
1. Push your repository to GitHub.
2. In [Render](https://render.com) or [Railway](https://railway.app), create a new **Web Service** pointing to the `server/` directory.
3. Configure the Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default assigned by platform)
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Random 64-char string
   - `CLIENT_URL`: `https://<your-firebase-project-id>.web.app`
   - `GEMINI_API_KEY` / `GROQ_API_KEY`: Your AI API keys
4. Set `VITE_API_URL=https://<your-backend-service>.onrender.com` in `client/.env.production` and run `npm run deploy:hosting`.

---

## 6. Database Maintenance & Cleanup

To wipe and reset the MongoDB Atlas database for a clean production start at any time:
```bash
npm run clean:db
```
This utility purges all test documents across all 15 database collections, leaving the database ready for real user registration.
