# Firebase Setup Instructions

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter project name: **DuoFi**
4. Disable Google Analytics (optional for now)
5. Click "Create project"

### Step 2: Register Your App

1. In Firebase Console, click the **Web icon** (`</>`)
2. Register app with nickname: **DuoFi Web**
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the Firebase configuration values

### Step 3: Enable Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. (Optional) Enable **Google** sign-in method for OAuth

### Step 4: Create Firestore Database

1. In Firebase Console, go to **Build > Firestore Database**
2. Click "Create database"
3. Select location: Choose closest to your users
4. Start in **test mode** (we'll add security rules later)
5. Click "Enable"

### Step 5: Enable Cloud Storage

1. In Firebase Console, go to **Build > Storage**
2. Click "Get started"
3. Start in **test mode**
4. Select same location as Firestore
5. Click "Done"

### Step 6: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in the values from Firebase Console (Project Settings > General > Your apps):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=duofi-xxxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=duofi-xxxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=duofi-xxxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
   ```

### Step 7: Restart Development Server

```bash
npm run dev
```

## 📊 Database Schema

See `docs/DATABASE_SCHEMA.md` for the complete Firestore schema with:
- Collections structure
- Data models
- Security rules
- Indexes

## 🔒 Security Rules (Apply Later)

Once the app is functional, apply security rules from `docs/DATABASE_SCHEMA.md` in:
- **Firestore Rules** (Build > Firestore Database > Rules)
- **Storage Rules** (Build > Storage > Rules)

## ✅ Verification

To verify Firebase is working:

1. Check for warnings in console on `npm run dev`
2. No "Firebase configuration incomplete" warnings = ✅ Success!

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
