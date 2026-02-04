# Quick Setup Instructions

## ✅ What You Need To Do Now

### Step 1: Run Database Migration (2 minutes)

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**
5. Copy and paste this SQL:

```sql
-- Add linkedin_posted_at column
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS linkedin_posted_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_jobs_linkedin_posted_at 
ON jobs(linkedin_posted_at);
```

6. Click **"Run"** (bottom right)
7. Should see: **"Success. No rows returned"**

### Step 2: Add LinkedIn Access Token to GitHub (1 minute)

1. Go to: https://github.com/Anuj472/jobcurator/settings/secrets/actions
2. Click **"New repository secret"**
3. Add your access token:
   - **Name**: `LINKEDIN_ACCESS_TOKEN`
   - **Value**: [Paste the access token you got]
4. Click **"Add secret"**

5. Click **"New repository secret"** again
6. Add your URN:
   - **Name**: `LINKEDIN_AUTHOR_URN`  
   - **Value**: [Your URN like `urn:li:person:abc123`]
7. Click **"Add secret"**

### Step 3: Test It! (1 minute)

1. Go to: https://github.com/Anuj472/jobcurator/actions
2. Click **"Post Jobs to LinkedIn"** workflow
3. Click **"Run workflow"** button (top right)
4. Click green **"Run workflow"** button
5. Wait for it to complete (~21 minutes)
6. Check your LinkedIn profile!

## 🎯 What Will Happen

### Automatic Schedule
Starting tomorrow, posts will go out automatically:

| Time | Posts | Jobs | Total Time |
|------|-------|------|------------|
| **9:00 AM IST** | 2 posts | 10 jobs | 21 minutes |
| **6:00 PM IST** | 2 posts | 10 jobs | 21 minutes |

**Total per day**: 4 posts, 20 jobs

### Post Format
Each post contains:
- ✅ 5 job opportunities
- ✅ Company names
- ✅ Locations
- ✅ Job types
- ✅ Salary (if available)
- ✅ Brief descriptions
- ✅ Apply links to **acrossjob.com/jobs/{job_id}**
- ✅ Professional hashtags

### Example Post:

```
🚀 NEW JOB OPPORTUNITIES 🚀

We've got 5 exciting opportunities for you today! 👇

━━━━━━━━━━━━━━━━━━━━

1️⃣ Senior Software Engineer
🏢 Google
📍 San Francisco, USA
💼 Full-time
💰 $150k - $200k

📋 We are looking for an experienced software engineer...

🔗 Apply: https://acrossjob.com/jobs/abc123

━━━━━━━━━━━━━━━━━━━━

2️⃣ Product Manager
🏢 Microsoft
...

━━━━━━━━━━━━━━━━━━━━

💡 More opportunities at acrossjob.com

#JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob
```

## 🛡️ Smart Features

### No Duplicates
- Jobs won't repeat for **30 days**
- After 30 days, they automatically become available again
- Ensures fresh content for your LinkedIn followers

### Job Selection
- Random selection from unposted jobs
- Prioritizes jobs that haven't been posted
- Diverse mix of locations and companies

### Apply Links
- All links point to **acrossjob.com**
- Format: `https://acrossjob.com/jobs/{job_id}`
- Drives traffic to your website

## 📅 Important Reminder

**LinkedIn tokens expire in 60 days!**

🗓️ Set a reminder for **55 days from now** to:
1. Get new access token (use the OAuth tool)
2. Update `LINKEDIN_ACCESS_TOKEN` secret in GitHub

## 📊 Expected Results

### Daily Metrics
- **Posts**: 4 per day
- **Jobs**: 20 per day
- **Total per week**: 28 posts, 140 jobs
- **Total per month**: ~120 posts, ~600 jobs

### Engagement
- Professional formatting with emojis
- Direct apply links to your site
- Consistent posting schedule
- Fresh, non-duplicate content

## ❓ Troubleshooting

### "No unposted jobs found"
**Meaning**: All jobs have been posted in the last 30 days.
**Solution**: Wait or add more jobs to database.

### "Token expired"
**Meaning**: Your 60-day token expired.
**Solution**: Get new token and update secret.

### "Failed to post"
**Check**:
- Token is valid
- URN is correct
- Database has jobs
- Check logs for details

## 📚 Documentation

For complete details:
- **Full documentation**: [LINKEDIN_DAILY_POSTING.md](./LINKEDIN_DAILY_POSTING.md)
- **Quick start**: [QUICK_START_LINKEDIN.md](./QUICK_START_LINKEDIN.md)

## ✅ Checklist

- [ ] Database migration run (✅ `linkedin_posted_at` column added)
- [ ] `LINKEDIN_ACCESS_TOKEN` secret added to GitHub
- [ ] `LINKEDIN_AUTHOR_URN` secret added to GitHub
- [ ] Manual workflow test run successful
- [ ] Checked LinkedIn profile for posts
- [ ] Apply links working (pointing to acrossjob.com)
- [ ] Token expiry reminder set (60 days from now)

## 🎉 All Done!

Your LinkedIn automation is ready! 

**Next post**: Check [GitHub Actions](https://github.com/Anuj472/jobcurator/actions) for schedule or run manually now!

---

**Questions?** Check the full documentation or test the workflow to see it in action! 🚀