# 🔥 Firebase Setup Guide for Mind Matrix

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project

1. **Go to**: https://console.firebase.google.com
2. Click **"Create a project"**
3. Name: `mind-matrix`
4. **Uncheck** "Enable Google Analytics" (optional)
5. Click **"Create project"** and wait 1 minute

### Step 2: Create Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create Database"**
3. Choose:
   - **Location**: Select closest to you (or us-central1)
   - **Security rules**: Start in **Test mode** (for development)
4. Click **"Create"**

### Step 3: Get Your Firebase Config

1. Go to **Project Settings** (⚙️ icon)
2. Go to **"Your apps"** section
3. Click on your Web app (or click </> to create one)
4. Copy the config object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mind-matrix.firebaseapp.com",
  projectId: "mind-matrix-xxxxx",
  storageBucket: "mind-matrix.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
}
```

### Step 4: Add to Your App

1. Open `.env.local` in your project
2. Fill in these values from Step 3:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=mind-matrix.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mind-matrix-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=mind-matrix.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...
```

### Step 5: Start Your App

```bash
npm install  # First time only
npm run dev
```

That's it! 🎉 Your app is now connected to Firebase.

---

## Firestore Security Rules (For Production)

By default, test mode allows anyone to read/write. For production, use these rules:

1. In Firebase Console, go to **Firestore Database** → **Rules**
2. Replace all content with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for all collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Then click **"Publish"**

> Note: This allows everyone to read/write. For a real app, add proper authentication.

---

## Firestore Database Structure

The app automatically creates collections:
- **events** - Quiz sessions
- **questions** - Quiz questions
- **participants** - Players in a quiz
- **answers** - Submitted answers
- **registered_players** - Registered users

---

## Features

✅ **No DNS blocking** - Uses HTTPS REST API (works everywhere)  
✅ **Real-time updates** - Built-in with Firestore listeners  
✅ **Free tier** - 1GB storage, 50K reads/day, 20K writes/day  
✅ **Scales easily** - Pay per use after free tier  
✅ **Auto-backups** - Your data is safe

---

## Limitations vs MongoDB

- **Document size**: Max 1MB per document (not an issue for this app)
- **Writes per second**: ~1 write/second per document (fine for 100 users)
- **No SQL joins**: Data is denormalized (fine for our structure)
- **Cost**: After 50K reads/day, you pay per operation

---

## Troubleshooting

### ❌ Error: "Firebase not configured"

**Problem**: Config values in `.env.local` are empty

**Solution**:
1. Double-check `.env.local` has all 6 Firebase values filled
2. Make sure you copied them correctly from Firebase Console
3. Restart the dev server: `npm run dev`

### ❌ Error: "Permission denied"

**Problem**: Firestore rules are too restrictive

**Solution**:
1. Go to Firestore Database → Rules
2. Switch from "Production mode" to "Test mode" temporarily
3. Or use the security rules above

### ❌ Slow queries

**Problem**: Missing Firestore indexes

**Solution**:
- Firestore auto-creates composite indexes
- Check Cloud Firestore → Indexes for any pending builds

---

## Next: Deploy to Vercel

See `VERCEL_DEPLOYMENT.md` for hosting your app!
