# JobCurator Setup Guide

## Recent Fixes Applied ✅

- ✅ Removed Tailwind CDN (replaced with npm package)
- ✅ Fixed Vite dev server for cloud environments (Lightning AI, Codespaces)
- ✅ Added proper HMR and WebSocket configuration
- ✅ Fixed white screen issue
- ✅ Added Tailwind CSS, PostCSS, and Autoprefixer

## Setup Instructions

### 1. Pull Latest Changes

```bash
cd C:\Users\anujm\Desktop\jobcurator\jobcurator
git pull origin main
```

### 2. Install Dependencies

```bash
# Stop any running dev server (Ctrl+C)

# Remove old node_modules
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Install fresh (using npm or pnpm)
npm install
# OR if using pnpm:
pnpm install
```

### 3. Setup Environment Variables

```bash
# Copy the example file
Copy-Item .env.example .env

# Edit .env and add your credentials
notepad .env
```

Add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Supabase credentials:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Settings → API
4. Copy "Project URL" and "anon public" key

### 4. Run Development Server

```bash
npm run dev
```

**Expected output:**
```
  VITE v6.4.1  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

### 5. Open in Browser

Navigate to http://localhost:3000

**You should now see the JobCurator interface!** 🎉

---

## Troubleshooting

### Issue: "npm install" fails with LRU error

**Solution:** Use pnpm instead:
```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm run dev
```

### Issue: White screen in browser

**Check:**
1. Press F12 → Console tab → Look for errors
2. Verify .env file exists with correct values
3. Clear Vite cache:
   ```bash
   Remove-Item -Recurse -Force node_modules\.vite
   npm run dev
   ```

### Issue: WebSocket connection errors

**Solution:** Already fixed in vite.config.ts. If still occurring:
```bash
# Try running with --host flag
npm run dev -- --host
```

### Issue: Tailwind styles not working

**Verify:**
```bash
# Check if Tailwind is installed
npm list tailwindcss

# Should show: tailwindcss@3.4.17 or similar
```

If missing:
```bash
npm install -D tailwindcss postcss autoprefixer
npm run dev
```

---

## What Changed?

### Before (Broken)
- ❌ Tailwind via CDN (not production-ready)
- ❌ Import maps for React (incompatible with Vite)
- ❌ No proper CSS processing
- ❌ White screen due to module errors

### After (Fixed)
- ✅ Tailwind via npm (proper build process)
- ✅ Vite handles React modules correctly
- ✅ PostCSS processes Tailwind CSS
- ✅ Full UI renders correctly

---

## File Structure

```
jobcurator/
├── index.html          # Entry HTML (updated)
├── index.tsx           # Entry TypeScript (imports CSS)
├── index.css           # Tailwind CSS directives
├── App.tsx             # Main React component
├── vite.config.ts      # Vite configuration (updated)
├── tailwind.config.js  # Tailwind configuration (new)
├── postcss.config.js   # PostCSS configuration (new)
├── package.json        # Dependencies (updated)
├── .env.example        # Environment variables template (new)
└── .env                # Your actual environment variables (create this)
```

---

## Cloud Development (Lightning AI, etc.)

The vite.config.ts now includes:
- `allowedHosts: 'all'` - Works with any cloud URL
- `hmr` configuration - Better hot module replacement
- `watch.usePolling` - File watching in cloud environments

**This works on:**
- ✅ Lightning AI
- ✅ GitHub Codespaces
- ✅ Gitpod
- ✅ Local Windows/Mac/Linux

---

## Next Steps After Setup

1. **Verify Connection:** Check if JobCurator can connect to Supabase
2. **Run Harvest:** Click "RUN GLOBAL HARVEST" to fetch jobs
3. **Sync Data:** Click "SYNC X ROLES" to push to database
4. **View Results:** Check acrossjobs website for new jobs

---

## Summary

✅ **All fixes applied** - Ready to use  
✅ **Proper Tailwind setup** - No more CDN warnings  
✅ **Better Vite config** - Works everywhere  
✅ **Environment variables** - Easy configuration  
✅ **Documentation** - Clear setup instructions  

**Just pull, install, add .env, and run!** 🚀
