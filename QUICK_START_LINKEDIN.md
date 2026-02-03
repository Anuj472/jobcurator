# Quick Start: LinkedIn Job Posting

## 🚀 5-Minute Setup

### Step 1: Create LinkedIn App (2 minutes)

1. Go to https://www.linkedin.com/developers/apps
2. Click **"Create app"**
3. Fill in:
   - App name: `AcrossJob Automation`
   - LinkedIn Page: Your company page
   - Upload a logo
4. Click **"Create app"**

### Step 2: Get Credentials (1 minute)

1. Click **"Auth"** tab
2. Copy **Client ID** → Save it
3. Click **"Show"** on Client Secret
4. Copy **Primary Client Secret** → Save it

### Step 3: Request Permissions (1 minute)

1. Still in **"Auth"** tab
2. Scroll to **"OAuth 2.0 scopes"**
3. Request these scopes:
   - ✅ `r_liteprofile` - Read user profile
   - ✅ `w_member_social` - Post content
4. Click **"Update"**

### Step 4: Add GitHub Secrets (1 minute)

1. Go to: https://github.com/Anuj472/jobcurator/settings/secrets/actions
2. Click **"New repository secret"** for each:

#### Secret 1: LINKEDIN_CLIENT_ID
```
Name: LINKEDIN_CLIENT_ID
Value: [Paste your Client ID from Step 2]
```

#### Secret 2: LINKEDIN_CLIENT_SECRET
```
Name: LINKEDIN_CLIENT_SECRET
Value: [Paste your Client Secret from Step 2]
```

#### Secret 3: Get Your URN

**Option A: Run workflow to get it**
1. Go to: https://github.com/Anuj472/jobcurator/actions
2. Click "Post Jobs to LinkedIn"
3. Click "Run workflow"
4. It will fail but show your URN in logs - copy it!

**Option B: Manual (if you have tokens)**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.linkedin.com/v2/me
# Look for "id" in response
# Your URN is: urn:li:person:{id}
```

Then add:
```
Name: LINKEDIN_AUTHOR_URN
Value: urn:li:person:YOUR_ID
```

### Step 5: Test It! ✅

1. Go to: https://github.com/Anuj472/jobcurator/actions
2. Click **"Post Jobs to LinkedIn"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait and check logs
5. Check your LinkedIn profile for posts!

## 📋 Checklist

- [ ] LinkedIn app created
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] Permissions requested (`r_liteprofile`, `w_member_social`)
- [ ] `LINKEDIN_CLIENT_ID` secret added to GitHub
- [ ] `LINKEDIN_CLIENT_SECRET` secret added to GitHub
- [ ] `LINKEDIN_AUTHOR_URN` secret added to GitHub
- [ ] `SUPABASE_URL` secret exists (should already be there)
- [ ] `SUPABASE_ANON_KEY` secret exists (should already be there)
- [ ] Workflow tested manually

## 🎯 What Happens Next?

### Automatic Posting
- ✅ After daily job harvest completes
- ✅ Gets all countries from your database
- ✅ Posts 1 random job per country
- ✅ Waits 20 minutes between posts
- ✅ Continues until all countries covered

### Example Timeline
```
00:00 - Job harvest completes
00:01 - Post job for USA
00:21 - Post job for Canada
00:41 - Post job for UK
01:01 - Post job for India
...
```

## 🐛 Troubleshooting

### "Authentication failed"
- ❌ Check Client ID is correct
- ❌ Check Client Secret is correct
- ❌ Make sure no extra spaces in secrets

### "Forbidden (403)"
- ❌ Request `w_member_social` permission
- ❌ Wait for LinkedIn to approve (can take hours)
- ❌ Check LINKEDIN_AUTHOR_URN is correct format

### "No jobs found"
- ❌ Make sure jobs have `country` field populated
- ❌ Check jobs have `status = 'active'`

## 📚 More Details

For complete documentation, see [LINKEDIN_POSTING_SETUP.md](./LINKEDIN_POSTING_SETUP.md)

## 🎉 Done!

Your jobs will now automatically post to LinkedIn after each harvest!

Check your LinkedIn profile to see the magic happen! ✨