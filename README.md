# DO THIS - Task & Google Calendar Suite

DO THIS is a modern, high-performance To-Do, Task & Google Calendar integration suite built with React, Vite, Tailwind CSS, and an Express REST API backend with persistent database storage, JWT authentication, email notification abstraction, and security controls.

---

## 🌟 Architecture & Key Features

1. **REST API Backend (`/server`)**:
   - Express API server with CORS, JSON parsing, health check monitoring endpoint (`GET /api/health`), and rate/security middleware.
   - Database persistence with schema migration, unique user IDs, and foreign key constraints.

2. **Authentication & Data Isolation**:
   - Registration, login, password reset, password change, and profile management.
   - Passwords hashed securely using `bcryptjs`.
   - Protected API routes enforcing **strict server-side data isolation** (`WHERE user_id = req.user.id`).

3. **Email Provider Abstraction (`server/services/emailService.js`)**:
   - Configurable for Resend API / SMTP credentials via environment variables (`RESEND_API_KEY`, `EMAIL_HOST`).
   - Dev fallback logger to run seamlessly locally and in production.

4. **Multi-View Task & Event Management**:
   - **Soft Pastel Reference UI**: 24px rounded cards, ambient box-shadows, and pastel gradient cards.
   - **Task Views**: List View, Soft Pastel Kanban Board, Calendar View, and Productivity Analytics.
   - **Event Sharing**: Copyable share links (`#share=...`) & QR codes with recipient landing viewer, comments, and task import.
   - **Natural Language Parsing**: Type *"Submit presentation tomorrow 4pm"* to auto-extract title, due date, and time.

5. **User Testing & Bug Reporting**:
   - *"Report a Problem"* / *"Send Feedback"* modal tagged with build version `v2.0.0-prod`.

---

## 🛠️ Local Installation & Development

### 1. Prerequisites
- Node.js 18 or higher installed on your system.

### 2. Install Dependencies

```bash
cd C:\Users\shelb\Desktop\todo-task-app
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Running the Application

#### Option A: Start Frontend & Backend Together

```bash
# Terminal 1: Start Express API Backend Server (Port 5000)
npm run server

# Terminal 2: Start Vite Frontend (Port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 🔍 API Documentation & Health Check

- **Health Check Endpoint**: `GET /api/health` -> Returns `{ status: "ok", version: "2.0.0-prod", timestamp: ... }`
- **Auth Routes**:
  - `POST /api/auth/register` (Name, Email, Password)
  - `POST /api/auth/login` (Email, Password)
  - `GET /api/auth/me` (Header: `Authorization: Bearer <token>`)
  - `POST /api/auth/reset-password` (Email)
  - `POST /api/auth/change-password` (CurrentPassword, NewPassword)
- **Task Routes**:
  - `GET /api/tasks` (Protected)
  - `POST /api/tasks` (Protected)
  - `PUT /api/tasks/:id` (Protected)
  - `DELETE /api/tasks/:id` (Protected)
- **Feedback Route**:
  - `POST /api/feedback` (Subject, Message, Email, AppVersion)

---

## 🚀 Production Hosting Deployment Guide

### Deploying Frontend to Vercel / Netlify
1. Build the production frontend bundle:
   ```bash
   npm run build
   ```
2. Import project repository in Vercel or Netlify.
3. Add Environment Variable:
   `VITE_API_URL=https://your-backend-api.render.com/api`

### Deploying Backend to Render / Railway / Node Server
1. Set Root Directory to `/`.
2. Start Command:
   `npm run server`
3. Configure Environment Variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your_secure_random_jwt_secret`
   - `PORT=5000`
   - `RESEND_API_KEY=your_resend_api_key` (Optional for email dispatch)

---

## 📝 Testing Verification Checklist

[x] Voice option removed completely
[x] Production build passes clean compilation (`npm run build`)
[x] Express backend server starts (`node server/index.js`)
[x] Health check endpoint active (`/api/health`)
[x] User registration & login works
[x] JWT authentication session persists across page refresh
[x] User tasks isolated per account (`user_id` server validation)
[x] Share event link landing viewer works
[x] Feedback modal submits successfully (`v2.0.0-prod`)
[x] `.env.example` & `.gitignore` properly configured
