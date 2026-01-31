# 🤖 Automated Job Harvesting Setup

This guide explains how to set up daily automated job harvesting using GitHub Actions.

## ✨ What's Automated

- **Daily Schedule**: Runs every day at **12:00 PM IST** (6:30 AM UTC)
- **Job Fetching**: Automatically fetches jobs from all companies in `INITIAL_COMPANIES`
- **Database Sync**: Inserts new jobs and updates existing ones in Supabase
- **Company Management**: Auto-creates companies if they don't exist
- **Logging**: Keeps harvest logs for 7 days for debugging

## 📋 Setup Instructions

### Step 1: Add GitHub Secrets

You need to add your Supabase credentials as GitHub repository secrets:

1. Go to your repository: [https://github.com/Anuj472/jobcurator](https://github.com/Anuj472/jobcurator)
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these two secrets:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

**Where to find these values:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to **Settings** → **API**
- Copy **Project URL** and **anon/public key**

### Step 2: Enable GitHub Actions

1. Go to **Actions** tab in your repository
2. If prompted, click **I understand my workflows, go ahead and enable them**
3. You should see "Daily Job Harvest" workflow listed

### Step 3: Test the Workflow

**Manual Test Run:**
1. Go to **Actions** → **Daily Job Harvest**
2. Click **Run workflow** → **Run workflow**
3. Watch the job execute in real-time
4. Check the logs to verify it's working

**Check Database:**
1. Go to your Supabase dashboard
2. Open **Table Editor** → **jobs** table
3. Verify new jobs were added

## ⏰ Schedule Details

```yaml
schedule:
  - cron: '30 6 * * *'  # 6:30 AM UTC = 12:00 PM IST
```

**Time Zone Conversion:**
- **UTC**: 6:30 AM
- **IST** (India): 12:00 PM (Noon)
- **EST** (US East): 1:30 AM
- **PST** (US West): 10:30 PM (previous day)

**Frequency**: Once per day, every day

## 🔍 How It Works

### Harvest Script (`scripts/harvest.ts`)

```typescript
1. Load INITIAL_COMPANIES from constants
2. For each company:
   a. Fetch jobs from their ATS (Greenhouse/Lever/Ashby)
   b. Normalize job data
   c. Map to categories (IT, Sales, Marketing, etc.)
   d. Get or create company in database
   e. Upsert jobs to Supabase (avoids duplicates)
3. Log summary statistics
```

### GitHub Actions Workflow

```yaml
1. Checkout code
2. Setup Node.js 20
3. Install npm dependencies
4. Install tsx (TypeScript executor)
5. Run harvest script with secrets
6. Upload logs as artifacts
```

## 📊 Monitoring

### View Harvest Logs

1. Go to **Actions** → **Daily Job Harvest**
2. Click on a specific run
3. Click **harvest** job
4. Expand steps to see detailed logs

### Download Logs

1. In the workflow run, scroll to **Artifacts**
2. Download `harvest-log-XXX.zip`
3. Logs are kept for 7 days

### What to Monitor

✅ **Success indicators:**
- "Jobs found: X" for each company
- "Jobs synced: Y" at the end
- No error messages

❌ **Warning signs:**
- "Failed to get company ID"
- "Database error"
- "Request timeout"
- Low sync counts

## 🛠️ Troubleshooting

### Issue: Workflow doesn't run

**Check:**
- GitHub Actions are enabled in repository settings
- Workflow file is in `.github/workflows/` folder
- YAML syntax is valid

**Fix:**
- Go to **Actions** tab and enable workflows
- Manually trigger a test run

### Issue: "Missing Supabase credentials" error

**Check:**
- Secrets are added in repository settings
- Secret names match exactly: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

**Fix:**
- Add/update secrets in Settings → Secrets and variables → Actions

### Issue: Jobs not appearing in database

**Check:**
- Supabase RLS (Row Level Security) policies
- Database connection in logs
- Network errors in logs

**Fix:**
- Disable RLS temporarily or add service role key
- Check Supabase project health
- Verify API limits not exceeded

### Issue: Rate limiting / Timeouts

**Check:**
- Too many companies processed too fast
- ATS API rate limits

**Fix:**
- Add delays between company processing (already included: 1s)
- Split companies into batches
- Contact ATS providers for higher limits

## 🔧 Customization

### Change Schedule Time

Edit `.github/workflows/daily-harvest.yml`:

```yaml
schedule:
  # Example: 8:00 AM IST (2:30 AM UTC)
  - cron: '30 2 * * *'
  
  # Example: Every 6 hours
  - cron: '0 */6 * * *'
```

**Cron Format**: `minute hour day month weekday`

**Helpful tools**:
- [Crontab Guru](https://crontab.guru/) - Cron expression tester
- [TimeZone Converter](https://www.worldtimebuddy.com/)

### Add More Companies

Edit `constants.ts`:

```typescript
export const INITIAL_COMPANIES = [
  // ... existing companies
  {
    name: 'New Company',
    identifier: 'newcompany',  // From ATS URL
    platform: AtsPlatform.GREENHOUSE
  }
];
```

### Modify Job Categories

Edit `scripts/harvest.ts` → `mapToJobCategory()` function

## 📈 Performance

**Expected metrics:**
- **Duration**: 5-15 minutes (depends on # of companies)
- **API Calls**: ~100-150 (1-3 per company)
- **Database Writes**: ~200-500 jobs per day
- **Success Rate**: >95%

**GitHub Actions Limits:**
- ✅ Free tier: 2,000 minutes/month
- ✅ This workflow: ~15 min/day = 450 min/month
- ✅ Well within free limits!

## 🎯 Next Steps

1. ✅ Set up GitHub secrets (required)
2. ✅ Enable GitHub Actions (required)
3. ✅ Run manual test (recommended)
4. ✅ Monitor first automated run tomorrow at 12 PM
5. ⏭️ Set up email notifications for failures (optional)
6. ⏭️ Create dashboard for harvest metrics (optional)

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Supabase API Documentation](https://supabase.com/docs/reference/javascript/introduction)
- [Greenhouse API](https://developers.greenhouse.io/job-board.html)
- [Lever API](https://github.com/lever/postings-api)

## 🆘 Support

If you encounter issues:

1. Check **Actions** tab for error logs
2. Verify Supabase credentials
3. Test manual run from Actions UI
4. Check this repository's Issues tab

---

**Status**: ✅ Automation configured and ready to run daily at 12 PM IST
