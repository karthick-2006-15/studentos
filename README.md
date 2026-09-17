# studentos — NEXUS AI Student Operating System

A minimalist, high-performance personal operating system for college students combining academics, AI study planning, tasks, calendar, habits, LeetCode, GitHub, Spotify, and analytics.

---

## ⚡ Highlights

* **Cognitive Workload & Priority Engine**: Deterministic prioritization scoring based on academic weight, urgency, and cognitive load.
* **Course Materials & AI Document Parser**: Multi-modal handout extraction (PDF, DOCX, PPTX, Images) with syllabus schedule generation.
* **AI Study Planner**: Exam and CAT preparation schedules mapped conflict-free into your calendar.
* **Linear-Style Unified Tasks**: Keyboard-first task management with auto-rollover and course tagging.
* **Academic Calendar**: Month and Agenda views with lecture, assessment, and assignment overlays.
* **Coding Tracker**: Real-time LeetCode GraphQL synchronization, topic breakdown, AI weakness detection, and GitHub commit tracking.
* **Daily Habits**: Minimalist dot-matrix consistency tracker with current & best streaks.
* **5 Minimalist Themes**: Obsidian, Midnight, Carbon, Forest, and Paper with instant switching.
* **Persistent Spotify & Focus Synth**: Integrated audio controls with Web Audio focus synth (40Hz Gamma, Lofi, Rain).
* **Google Sign-In & JWT Auth**: Fast onboarding with Google Identity Services (GIS) and standard email/password auth.
* **Production-Ready**: Configured for Firebase Hosting with Dockerized container for Cloud Run / Render.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, TanStack Query, Framer Motion, Recharts, Lucide Icons, Vite PWA.
* **Backend**: Node.js, Express, TypeScript, MongoDB Atlas (Mongoose), Redis/In-Memory Cache, JWT, Node-Cron, Web Push.
* **AI Engine**: Google Gemini 2.5 Flash / Groq LLM API.

---

## 🚀 Quick Start

### 1. Installation
```bash
npm install
npm run install:all
```

### 2. Environment Variables
Copy `.env.example` to `.env` in the root directory and configure your keys:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
```

### 3. Run Locally
```bash
npm run dev
```
* Client: `http://localhost:5173`
* API Server: `http://localhost:5000`

---

## 📦 Deployment

* **Frontend (Firebase Hosting)**:
  ```bash
  npm run deploy:hosting
  ```
* **Backend**: Containerized via `server/Dockerfile` for Google Cloud Run or Render.
* See [FIREBASE_DEPLOYMENT.md](FIREBASE_DEPLOYMENT.md) for full deployment instructions.
