# LinkedIn Daily Job Posting System

## 🎯 Overview

Automated LinkedIn job posting system that posts **2 times per day**, each post containing **5 jobs** with full details and apply links to acrossjob.com.

## 📊 Configuration

- **Posts per day**: 2 (9 AM and 6 PM IST)
- **Jobs per post**: 5
- **Total jobs per day**: 10
- **Delay between posts**: 20 minutes
- **No-repeat period**: 30 days
- **Apply links**: Point to acrossjob.com/jobs/{job_id}

## 🕒 Schedule

| Time (IST) | Time (UTC) | Description |
|------------|------------|-------------|
| 9:00 AM | 3:30 AM | Morning post (Post 1 & 2) |
| 6:00 PM | 12:30 PM | Evening post (Post 1 & 2) |

Each run posts 2 batches with a 20-minute interval between them.

## 📝 Post Format

Each LinkedIn post looks like this:

```
🚀 NEW JOB OPPORTUNITIES 🚀

We've got 5 exciting opportunities for you today! 👇

━━━━━━━━━━━━━━━━━━━━

1️⃣ Senior Software Engineer
🏢 Google
📍 San Francisco, USA
💼 Full-time
💰 $150k - $200k

📋 We are looking for an experienced software engineer to join our team...

🔗 Apply: https://acrossjob.com/jobs/abc123

━━━━━━━━━━━━━━━━━━━━

2️⃣ Product Manager
🏢 Microsoft
...

━━━━━━━━━━━━━━━━━━━━

💡 More opportunities at acrossjob.com

#JobAlert #Hiring #JobOpportunities #Jobs #Career #AcrossJob
```

## 🛠️ Setup Instructions

### Step 1: Run Database Migration

You need to add a column to track posted jobs. Run this in your Supabase SQL editor:

```sql
-- Add linkedin_posted_at column
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS linkedin_posted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_linkedin_posted_at 
ON jobs(linkedin_posted_at);

CREATE INDEX IF NOT EXISTS idx_jobs_status_linkedin_posted 
ON jobs(status, linkedin_posted_at) 
WHERE status = 'active';
```

Or use the migration file:
```bash
psql $DATABASE_URL < migrations/add_linkedin_posted_at.sql
```

### Step 2: Add GitHub Secrets

Go to: https://github.com/Anuj472/jobcurator/settings/secrets/actions

Add these secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `LINKEDIN_ACCESS_TOKEN` | Your LinkedIn access token | Use OAuth tool from tools/get-linkedin-token.html |
| `LINKEDIN_AUTHOR_URN` | Your LinkedIn user URN | From OAuth tool (format: `urn:li:person:xxx`) |
| `SUPABASE_URL` | Supabase project URL | Already exists |
| `SUPABASE_ANON_KEY` | Supabase anon key | Already exists |

### Step 3: Test the Workflow

1. Go to: https://github.com/Anuj472/jobcurator/actions
2. Click **"Post Jobs to LinkedIn"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Wait ~21 minutes (2 posts with 20-min delay)
5. Check logs and your LinkedIn profile!

## 🔄 How It Works

### Job Selection Algorithm

1. **Query active jobs** that:
   - Have `status = 'active'`
   - Either never posted (`linkedin_posted_at IS NULL`)
   - Or posted more than 30 days ago

2. **Shuffle and select** 5 random jobs

3. **Post to LinkedIn** with formatted content

4. **Mark as posted** by updating `linkedin_posted_at` timestamp

### No-Repeat Logic

Jobs won't be posted again for 30 days, ensuring:
- ✅ Fresh content for followers
- ✅ No duplicate posts
- ✅ Even distribution across all jobs
- ✅ Automatic rotation after 30 days

## 📊 Monitoring

### View Workflow Status

- **Actions page**: https://github.com/Anuj472/jobcurator/actions
- **Workflow runs**: Click "Post Jobs to LinkedIn"
- **Logs**: Click any run to see detailed logs

### Log Output

```
🚀 Starting daily LinkedIn job posting...

📋 Configuration:
  - Posts per run: 2
  - Jobs per post: 5
  - Total jobs: 10
  - Delay between posts: 20 minutes
  - No-repeat period: 30 days

🔐 Validating LinkedIn access token...
✅ Token validated

📦 Preparing batch 1...
✅ Found 150 unposted jobs, selected 5

📝 Batch 1 contains:
  1. Senior Developer at Google (USA)
  2. Product Manager at Microsoft (UK)
  ...

✅ Successfully posted batch of 5 jobs to LinkedIn
✅ Marked 5 jobs as posted
✅ Batch 1 posted successfully!

⏳ Waiting 20 minutes before next post...

[20 minutes later]

📦 Preparing batch 2...
...

==================================================
🎯 DAILY POSTING COMPLETE
==================================================
✅ Successful posts: 2
❌ Failed posts: 0
📊 Total jobs posted: 10
==================================================
```

## 🐛 Troubleshooting

### "No unposted jobs found"

**Cause**: All jobs have been posted in the last 30 days.

**Solution**: 
- Wait for jobs to age past 30 days
- Or manually reset: `UPDATE jobs SET linkedin_posted_at = NULL WHERE ...`
- Or add more jobs to the database

### "LinkedIn access token is invalid or expired"

**Cause**: Access tokens expire after 60 days.

**Solution**:
1. Use `tools/get-linkedin-token.html` to get new token
2. Update `LINKEDIN_ACCESS_TOKEN` secret in GitHub

### "Failed to post jobs to LinkedIn: 403"

**Cause**: Missing permissions or URN issue.

**Solution**:
- Check `w_member_social` permission is granted
- Verify `LINKEDIN_AUTHOR_URN` is correct
- Ensure token has proper scopes

### "Only X jobs available (wanted 5)"

**Cause**: Fewer than 5 unposted jobs available.

**Solution**: This is just a warning. The workflow will post whatever is available.

## ⚙️ Customization

### Change Schedule

Edit `.github/workflows/linkedin-post-jobs.yml`:

```yaml
schedule:
  - cron: '30 3 * * *'   # 9:00 AM IST
  - cron: '30 12 * * *'  # 6:00 PM IST
```

Use [crontab.guru](https://crontab.guru/) to generate cron expressions.

### Change Jobs Per Post

Edit `scripts/post-jobs-daily.ts`:

```typescript
const JOBS_PER_POST = 5; // Change this number
```

### Change Posts Per Run

Edit `scripts/post-jobs-daily.ts`:

```typescript
const POSTS_PER_RUN = 2; // Change this number
```

### Change Delay Between Posts

Edit `scripts/post-jobs-daily.ts`:

```typescript
const DELAY_BETWEEN_POSTS_MINUTES = 20; // Change minutes
```

### Change No-Repeat Period

Edit `scripts/post-jobs-daily.ts`:

```typescript
const NO_REPEAT_DAYS = 30; // Change days
```

### Customize Post Format

Edit `services/linkedinService.ts` → `formatBatchJobPost()` method.

## 📚 Database Schema

### jobs table

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  city TEXT,
  country TEXT,
  description TEXT,
  url TEXT,
  salary_range TEXT,
  job_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linkedin_posted_at TIMESTAMP WITH TIME ZONE, -- NEW COLUMN
  ...
);
```

## 📅 Token Maintenance

**Important**: LinkedIn access tokens expire after **60 days**.

### Set a Reminder

- 🗓️ Refresh token every **55 days**
- 🔔 Set calendar reminder
- 📝 Keep track of token creation date

### Refresh Process

1. Use `tools/get-linkedin-token.html`
2. Get new access token
3. Update `LINKEDIN_ACCESS_TOKEN` in GitHub secrets
4. Test workflow

## 📊 Expected Results

### Daily Metrics

- **Posts per day**: 4 (2 in morning, 2 in evening)
- **Jobs per day**: 20
- **Jobs per week**: 140
- **Jobs per month**: ~600
- **Full rotation**: Every 30 days (all jobs posted once)

### LinkedIn Engagement

- **Post format**: Professional with emojis
- **Character count**: ~2000-3000 per post
- **Hashtags**: Included for discovery
- **Links**: Direct to acrossjob.com

## ✅ Checklist

- [ ] Database migration completed (`linkedin_posted_at` column added)
- [ ] `LINKEDIN_ACCESS_TOKEN` secret added
- [ ] `LINKEDIN_AUTHOR_URN` secret added
- [ ] Workflow tested manually
- [ ] First automatic post successful
- [ ] LinkedIn profile showing posts
- [ ] Apply links working (pointing to acrossjob.com)
- [ ] Token expiry reminder set (60 days)

## 🎉 You're All Set!

Your LinkedIn will now automatically post:
- ✅ 2 batches at 9 AM IST
- ✅ 2 batches at 6 PM IST
- ✅ 5 jobs per post
- ✅ 20 jobs total per day
- ✅ No duplicates for 30 days
- ✅ All apply links to acrossjob.com

**Next automatic post**: Check the schedule above! 🚀