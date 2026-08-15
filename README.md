# 🚀 NovaTasks (TaskNova)

> A premium futuristic task & event management platform built for tech communities to manage tasks, events, registrations, and participant activities.

**Mobile-first • APK-ready • Admin + Participant experiences**

## ✨ Features

* **Landing Page** — cinematic hero, featured tasks, how-it-works, upcoming events, platform features, and CTA sections
* **Admin Dashboard** — overview statistics, participant management, task/event management, registrations, analytics, and settings
* **Participant Experience** — continue as Guest, browse tasks/events, enroll, track progress, deadlines, notifications, and profile
* **AI Task Forge** — Gemini-powered task assistance using `@google/genai`
* **Focus Tools** — focus timer, alerts/scheduler, and task checklists
* **Mobile-First UI** — optimized for 360px–430px phones, tablets, and desktop
* **APK Ready** — responsive architecture designed for future Android packaging
* **Futuristic Design** — deep navy theme, glassmorphism, glowing gradients, animated network visuals, and smooth transitions

## 🔑 Demo Access

### Admin

Admin access is available for authorized prototype testing.

> ⚠️ **Prototype note:** Admin authentication is currently implemented for demonstration purposes. Production deployment should use secure Firebase/server-side authorization.

### Participant

Participants can currently enter using **Continue as Guest**.

Google Sign-In infrastructure is prepared for future participant authentication.

## 🛠️ Tech Stack

* **Frontend:** React 19 + TypeScript + Vite 6
* **Styling:** Tailwind CSS 4
* **Animations:** Motion / Framer Motion
* **Icons:** Lucide React
* **Backend:** Express + TypeScript (`server.ts`)
* **Authentication:** Firebase Authentication
* **Database:** Firebase / Firestore
* **AI:** Google Gemini (`@google/genai`)

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm

### 1. Clone the repository

```bash
git clone https://github.com/bhaveshrudra/tasknova.git
cd tasknova
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file or copy `.env.example`.

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

> ⚠️ Never commit your real API keys or `.env.local` file to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

> **Windows / Git Bash:** If you encounter a `'node' is not recognized` error from lifecycle scripts, run the command through Windows CMD.

## 📦 Scripts

| Script          | Purpose                   |
| --------------- | ------------------------- |
| `npm run dev`   | Start development server  |
| `npm run build` | Create production build   |
| `npm start`     | Run production build      |
| `npm run lint`  | Typecheck with TypeScript |

## 🗂️ Project Structure

```text
src/
├── components/
│   ├── ui/
│   │   ├── Background.tsx
│   │   ├── GlassCard.tsx
│   │   └── AnimatedCounter.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   ├── AdminDashboard.tsx
│   └── ParticipantTaskList.tsx
│
├── utils/
│   ├── auth.ts
│   └── firebase.ts
│
├── App.tsx
│
server.ts
```

## 🔐 Firebase

Firebase is used for authentication and backend integration.

For local Google Sign-In development:

1. Open Firebase Console
2. Go to **Authentication → Settings → Authorized domains**
3. Add:

```text
localhost
```

The deployed domain must also be added to Firebase Authorized Domains.

## 📱 Mobile & APK

NovaTasks follows a **mobile-first responsive architecture**.

The application is designed to support:

* Android phones
* Tablets
* Desktop browsers
* Touch interactions
* Mobile navigation
* Safe-area layouts
* Responsive dashboards

The long-term goal is:

**Web → Mobile Web → Android APK**

## 🔮 Future Improvements

* Firebase-based participant accounts
* Secure Firebase admin authorization
* Push notifications
* Real-time task updates
* Advanced analytics
* File/image submissions
* Event registration
* Leaderboards
* AI-powered task recommendations
* Native Android application
* Offline support

## 🎯 Vision

NovaTasks aims to provide students, teams, and technology communities with one platform to:

**Discover → Participate → Track → Complete**

tasks, events, and activities through a modern and intuitive experience.

## 👨‍💻 Developer

**Bhavesh Rudra**

B.Tech Information Technology Student

---

⭐ If you find NovaTasks useful, consider starring the repository.
