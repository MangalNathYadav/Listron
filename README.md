# CampusPack — Collaborative Packing Checklists 🌸

A premium, ultra-minimalist, mobile-first public checklist maker application designed for incoming college freshmen to share essential packing lists with campus seniors, wardens, and alumni who can anonymously recommend and add essentials.

---

## ⚡ Project Vibes & Meta Info

- **Vibe Coded By**: `shadowXg`
- **IDE Used**: `Antigravity`
- **AI Agent Used**: `Gemini 3.5 Flash (Low) - Time Limited`

---

## ✨ Features

- 🌸 **Cherry Blossom Pink Theme**: A stunning, minimalist white and cherry-blossom light pink layout.
- 📱 **Mobile-First Layout**: Fully responsive, touch-friendly checklist interactions, optimized for single-handed mobile thumb usage.
- 🔒 **Spam-Prevention Sliding Window Rate Limiter**: 
  - Restricts additions to a maximum of 5 items per 5 seconds.
  - The 6th addition triggers an dynamic cooldown starting at 3 seconds that doubles continuously on spamming (6s, 12s, 24s... up to 64s).
  - Displays a clean visual cooldown warning overlay with a countdown ticker.
- 🔥 **Real-Time Synced Upvoting**: Atomic upvotes synced to Firebase Realtime Database that dynamically bubble high-priority recommendations to the top.
- 📋 **Anonymous Recommendations**: Clean, simplified checklist suggestions with no messy role configuration or identity tags.
- 🚀 **Dynamic Sharing**: Quick "Copy Share Link" buttons to send your checklist instantly to anyone.

---

## 🛠️ Architecture & Technologies Used

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4 + Vanilla CSS Custom Variables
- **Database**: Firebase Realtime Database (RTDB)
- **Icons**: Lucide React

---

## ⚙️ Setup & Installation

### 1. Configure Firebase Credentials
Create a `.env.local` file in the root directory and add your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_DATABASE_URL=YOUR_DATABASE_URL
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID
```

### 2. Configure Firebase Security Rules
Upload the `database.rules.json` configuration to your Firebase Realtime Database console to enforce strict item structure validations.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
