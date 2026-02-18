# Smart Complaint & Auto-Assignment System

An AI-powered complaint management platform built with React, TypeScript, and Firebase.

## Features

- **User Portal**: Submit complaints with AI-powered categorization, track status, and view history.
- **Admin Dashboard**: Department-specific complaint queues, status updates, and resolution notes.
- **Super Admin**: Manage departments, users, and view system-wide analytics.
- **AI Engine**: Client-side keyword-based NLP for automatic classification and priority assignment.
- **Analytics**: Visual charts for trends, category breakdown, and department performance.
- **Dark Mode**: Fully supported dark theme.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Backend / DB**: Firebase Firestore & Storage
- **Auth**: Firebase Authentication (Email/Password + Google)
- **Charts**: Recharts
- **Icons**: Lucide React

## Setup Instructions

### 1. Prerequisites

- Node.js (v18+)
- Firebase Project (Spark Plan is sufficient)

### 2. Installation

```bash
# Install dependencies
npm install
```

### 3. Firebase Configuration

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password and Google providers).
3. Create a **Firestore Database**.
4. Enable **Storage**.
5. Copy your web app config and create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Fill in your Firebase config values
```

### 4. Running Locally

```bash
npm run dev
```

### 5. Seeding Data

After setting up Firebase, seed the database with initial departments:

1. Register your first user in the app.
2. Run the seed script:
   ```bash
   npx ts-node scripts/seed.ts
   ```
3. Go to Firebase Console > Firestore > `users` collection.
4. Find your user document and change the `role` field to `super_admin`.

## Deployment

Build the project for production:

```bash
npm run build
```

Deploy to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Security Rules

Start with the provided `firestore.rules` and `storage.rules` to ensure data security.

## License

MIT
