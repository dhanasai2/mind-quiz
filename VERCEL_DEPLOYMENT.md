# 🚀 Deploy to Vercel Guide

Vercel is the easiest way to host your frontend. It's free and takes 5 minutes!

## Quick Deploy (5 minutes)

### Step 1: Prepare Your Project

Make sure your app works locally first:

```bash
npm run dev
# Check it works at http://localhost:5173
```

### Step 2: Push to GitHub (or Vercel Git)

Firebase + Vercel works best with Git:

```bash
# If not already a git repo
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Create a GitHub repo and push
# OR use Vercel's built-in Git
```

or just use Vercel's Git import (easier, see Step 3)

### Step 3: Deploy on Vercel

1. **Go to**: https://vercel.com
2. Click **"Sign up"** (free, use GitHub/Google)
3. Click **"New Project"**
4. Choose:
   - **Import from Git** (if you have GitHub repo) 
   - OR **Deploy CLI** (simpler, no Git needed)
5. If using Git:
   - Select your `mind-matrix` repo
   - Click **"Import"**
6. Configure the project:
   - **Framework**: Select **"Vite"**
   - **Root Directory**: leave as `.`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 4: Add Firebase Environment Variables

1. On Vercel project page, go to **Settings** → **Environment Variables**
2. Add these 6 variables (same as `.env.local`):

```
VITE_FIREBASE_API_KEY = AIza...
VITE_FIREBASE_AUTH_DOMAIN = mind-matrix.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = mind-matrix-xxxxx
VITE_FIREBASE_STORAGE_BUCKET = mind-matrix.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID = 1:123456789:web:abcdef...
```

3. Click **"Save"**

### Step 5: Deploy!

1. Click **"Deploy"**
2. Wait 1-2 minutes
3. You'll get a URL like: `https://mind-matrix-xyz.vercel.app`
4. ✅ **Your app is live!**

---

## Update Firebase Security Rules

Now that your app is live, update Firestore rules:

1. In **Firebase Console** → **Firestore Database** → **Rules**
2. Update the rules to allow your domain:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write from your app domain
    match /{document=**} {
      allow read, write: if request.auth != null || true;
    }
  }
}
```

Click **"Publish"**

> For production with real users, add authentication:
```
allow read, write: if request.auth != null;
```
Then add login to your app.

---

## Automatic Deployments from Git

If you used Git, every commit to `main` will auto-deploy:

```bash
git add .
git commit -m "Update feature"
git push origin main
# 🚀 Automatically deploys to Vercel!
```

You can see deployment status at: https://vercel.com/dashboard

---

## Custom Domain (Optional)

To use your own domain:

1. In Vercel project → **Settings** → **Domains**
2. Add your domain
3. Follow DNS instructions
4. 🎉 Your app at `yoursite.com`

---

## Production Checklist

- [ ] Firebase config variables added to Vercel
- [ ] Firestore rules updated (not in test mode)
- [ ] Verify your app loads at `https://your-url.vercel.app`
- [ ] Test creating an event
- [ ] Test joining and answering questions
- [ ] Check Firestore in Firebase Console for data

---

## Monitoring & Logs

### View Logs
- Vercel Dashboard → **Deployments** → Click deployment → **Logs**

### View Firebase Usage
- Firebase Console → **Firestore Database** → **Usage**

### Debug in Production
- Open browser DevTools (F12)
- Check **Console** for errors
- Check **Network** tab for API calls

---

## Troubleshooting

### ❌ "Cannot find '/dist' directory"

**Problem**: Build failed

**Solution**:
1. In Vercel, check logs for build error
2. Run locally: `npm run build`
3. Fix any errors
4. Redeploy

### ❌ "Firebase not configured"

**Problem**: ENV variables not set

**Solution**:
1. Check **Settings** → **Environment Variables** in Vercel
2. Make sure all 6 Firebase values are there
3. Redeploy: Click **Deployments** → **...** → **Redeploy**

### ❌ "Firestore permission denied"

**Problem**: Database rules too restrictive

**Solution**:
1. Go to Firebase Console → Firestore Database → Rules
2. Switch to **Test mode** (temporary)
3. Or add your domain to rules

---

## Costs

Firebase + Vercel is **FREE** for this app because:

- **Vercel**: Free tier covers unlimited bandwidth
- **Firebase**: Free tier covers 50K reads/day
  - Most apps use <1K reads/day

You'll only pay if you exceed free tier limits.

---

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test your live app
3. ✅ Share the Vercel URL with others
4. ✅ Add custom domain (optional)
5. ✅ Set up authentication (for production)

---

## Questions?

- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Vite Docs**: https://vitejs.dev
