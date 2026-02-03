# Quick Start: LinkedIn Job Posting

## 🚀 10-Minute Setup (Updated)

### Step 1: Create LinkedIn App (2 minutes)

1. Go to https://www.linkedin.com/developers/apps
2. Click **"Create app"**
3. Fill in:
   - App name: `AcrossJob Automation`
   - LinkedIn Page: Your company page
   - Upload a logo
4. Click **"Create app"**

### Step 2: Configure Permissions (2 minutes)

1. Click **"Auth"** tab
2. Under **"Redirect URLs"**, add:
   ```
   http://localhost:8080/callback
   ```
3. Click **"Update"**

4. Scroll to **"OAuth 2.0 scopes"**, request:
   - ✅ `r_liteprofile` - Read user profile
   - ✅ `r_emailaddress` - Read email address
   - ✅ `w_member_social` - Post content
5. Click **"Update"**

### Step 3: Get Your Credentials (3 minutes)

#### 3a. Download the OAuth Tool

1. Download this file: [get-linkedin-urn.html](https://raw.githubusercontent.com/Anuj472/jobcurator/main/tools/get-linkedin-urn.html)
2. Save it to your computer
3. Open it in your web browser (just double-click it)

#### 3b. Use the Tool

1. **In the LinkedIn app Auth tab:**
   - Copy your **Client ID**
   - Copy your **Primary Client Secret**

2. **In the OAuth Tool (HTML page):**
   - Paste your Client ID in Step 2
   - Click "🚀 Connect to LinkedIn"
   - Authorize the app on LinkedIn
   - Copy the **code** from the redirect URL
   - Paste code and Client Secret in Step 4
   - Click "📝 Get My URN"

3. **Copy these values:**
   - Your **LinkedIn URN** (format: `urn:li:person:xxx`)
   - Your **Access Token** (long string starting with `AQ...`)

### Step 4: Add GitHub Secrets (3 minutes)

Go to: https://github.com/Anuj472/jobcurator/settings/secrets/actions

Add these **2 secrets**:

#### Secret 1: LINKEDIN_ACCESS_TOKEN
```
Name: LINKEDIN_ACCESS_TOKEN
Value: [Paste the access token from Step 3]
```

#### Secret 2: LINKEDIN_AUTHOR_URN
```
Name: LINKEDIN_AUTHOR_URN
Value: [Paste the URN from Step 3, like: urn:li:person:abc123]
```

### Step 5: Test It! ✅

1. Go to: https://github.com/Anuj472/jobcurator/actions
2. Click **"Post Jobs to LinkedIn"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait and check logs
5. Check your LinkedIn profile for posts!

## 📋 Updated Checklist

- [ ] LinkedIn app created
- [ ] Redirect URL added: `http://localhost:8080/callback`
- [ ] Permissions requested (`r_liteprofile`, `r_emailaddress`, `w_member_social`)
- [ ] OAuth tool downloaded and opened
- [ ] Access token obtained
- [ ] LinkedIn URN obtained
- [ ] `LINKEDIN_ACCESS_TOKEN` secret added to GitHub
- [ ] `LINKEDIN_AUTHOR_URN` secret added to GitHub
- [ ] `SUPABASE_URL` secret exists
- [ ] `SUPABASE_ANON_KEY` secret exists
- [ ] Workflow tested manually

## 🐛 Troubleshooting

### "This application is not allowed to create application tokens"
✅ **Fixed!** We're now using user access tokens instead.

### "Authorization code expired"
- Authorization codes expire in 30 seconds
- Get a new one by clicking "Connect to LinkedIn" again
- Paste it quickly into the tool

### "Invalid redirect URI"
- Make sure you added `http://localhost:8080/callback` to your LinkedIn app
- Check for typos (no trailing slash!)

### "Access token expired"
- LinkedIn access tokens expire after **60 days**
- Run the OAuth tool again to get a new token
- Update the `LINKEDIN_ACCESS_TOKEN` secret

### "Forbidden (403)"
- Make sure you requested all 3 permissions
- Wait for LinkedIn to approve (can take minutes to hours)
- Check your URN format is correct

## ⏰ Token Expiration

**Important:** LinkedIn access tokens expire after 60 days. 

Set a reminder to:
1. Run the OAuth tool again in ~55 days
2. Get a new access token
3. Update the `LINKEDIN_ACCESS_TOKEN` secret in GitHub

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

## 📚 Tool Location

The OAuth tool is in your repository:
- Path: `tools/get-linkedin-urn.html`
- Direct link: https://raw.githubusercontent.com/Anuj472/jobcurator/main/tools/get-linkedin-urn.html

You can also clone the repo and open it locally:
```bash
git clone https://github.com/Anuj472/jobcurator.git
cd jobcurator/tools
open get-linkedin-urn.html  # or just double-click it
```

## 🎉 Done!

Your jobs will now automatically post to LinkedIn after each harvest!

Check your LinkedIn profile to see the magic happen! ✨

---

## 📝 What Changed?

Previously we tried to use **client credentials** which don't work for personal LinkedIn accounts. Now we use:

✅ **OAuth 2.0 Authorization Code Flow**
- Get user access token (expires in 60 days)
- Use that token to post on your behalf
- Works perfectly for personal LinkedIn accounts

For complete details, see [LINKEDIN_POSTING_SETUP.md](./LINKEDIN_POSTING_SETUP.md)