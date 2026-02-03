# LinkedIn Job Posting Automation Setup

This guide explains how to set up automated job posting to LinkedIn from your database.

## Overview

The workflow automatically:
1. Triggers after the daily job harvest workflow completes
2. Fetches all unique countries from your database
3. Posts one random job per country to LinkedIn
4. Waits 20 minutes between each post
5. Continues until all countries are covered

## Prerequisites

### 1. LinkedIn Developer Account & App

You need to create a LinkedIn app to get API credentials:

1. **Go to LinkedIn Developer Portal**
   - Visit: https://www.linkedin.com/developers/apps
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click "Create app"
   - Fill in required information:
     - App name: "AcrossJob Automation" (or your choice)
     - LinkedIn Page: Select your company page (create one if needed)
     - App logo: Upload your logo
     - Legal agreement: Accept terms

3. **Configure App Permissions**
   - Go to "Auth" tab
   - Add redirect URL: `https://localhost` (for testing)
   - Request these permissions/scopes:
     - `w_member_social` - Post on behalf of user
     - `r_liteprofile` - Read user profile

4. **Get Credentials**
   - Go to "Auth" tab
   - Copy **Client ID**
   - Copy **Primary Client Secret**

### 2. Get Your LinkedIn URN

You need your LinkedIn URN (User Resource Name) to post:

**Method 1: Use the script to get it automatically**
```bash
# Run locally first without LINKEDIN_AUTHOR_URN set
ts-node scripts/post-jobs.ts
# It will print your URN - copy it!
```

**Method 2: Manual API call**
1. Get an access token using OAuth 2.0 flow
2. Call `https://api.linkedin.com/v2/me`
3. Your URN will be in format: `urn:li:person:{id}`

## GitHub Secrets Setup

Add these secrets to your GitHub repository:

### Go to Repository Settings
1. Navigate to: `https://github.com/Anuj472/jobcurator/settings/secrets/actions`
2. Click "New repository secret"
3. Add each of the following:

### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|--------|
| `LINKEDIN_CLIENT_ID` | Your LinkedIn app Client ID | `86xxxxxxxxxx` |
| `LINKEDIN_CLIENT_SECRET` | Your LinkedIn app Client Secret | `xxxxxxxxxxxxxxxx` |
| `LINKEDIN_AUTHOR_URN` | Your LinkedIn user URN | `urn:li:person:abcdefg` |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJxxx...` |

### How to Add Secrets

```bash
# For each secret:
1. Click "New repository secret"
2. Name: LINKEDIN_CLIENT_ID (for example)
3. Value: [Paste your Client ID]
4. Click "Add secret"
5. Repeat for all 5 secrets
```

## Workflow Configuration

### Automatic Trigger

The workflow is configured to run automatically:

```yaml
on:
  workflow_run:
    workflows: ["Daily Job Harvest"]
    types:
      - completed
```

This means:
- ✅ Runs after job harvest completes
- ✅ Only runs if harvest was successful
- ✅ Automatically posts fresh jobs

### Manual Trigger

You can also trigger it manually:

1. Go to: `https://github.com/Anuj472/jobcurator/actions`
2. Click "Post Jobs to LinkedIn" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## How It Works

### Posting Flow

1. **Fetch Countries**
   ```sql
   SELECT DISTINCT country FROM jobs WHERE country IS NOT NULL
   ```

2. **For Each Country**
   - Get random job from that country
   - Format job post with emojis and hashtags
   - Post to LinkedIn
   - Wait 20 minutes
   - Repeat for next country

3. **Job Post Format**
   ```
   🚀 New Job Opportunity: Software Engineer

   🏢 Company: Google
   📍 Location: New York, USA
   💼 Type: Full-time
   💰 Salary: $120k - $180k

   📋 Description:
   [Job description...]

   🔗 Apply Now: [Job URL]

   #JobAlert #Hiring #JobOpportunity #AcrossJob
   ```

### Timing

- **First post**: Immediately after job harvest
- **Subsequent posts**: 20 minutes apart
- **Total duration**: ~20 minutes × number of countries

Example:
- 10 countries = ~3 hours 20 minutes
- 20 countries = ~6 hours 40 minutes

## Database Schema Requirements

Your `jobs` table should have these columns:

```sql
- id (uuid)
- title (text)
- company (text)
- city (text)
- country (text) -- REQUIRED for this workflow
- description (text)
- url (text)
- salary_range (text)
- job_type (text)
- status (text) -- 'active' jobs will be posted
- created_at (timestamp)
```

## Testing

### Local Testing

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` file**
   ```bash
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key
   LINKEDIN_CLIENT_ID=your_client_id
   LINKEDIN_CLIENT_SECRET=your_secret
   LINKEDIN_AUTHOR_URN=your_urn
   ```

3. **Run the script**
   ```bash
   ts-node scripts/post-jobs.ts
   ```

### Test on GitHub

1. Push your changes
2. Go to Actions tab
3. Run "Post Jobs to LinkedIn" manually
4. Check logs for success/errors

## Monitoring

### View Workflow Runs

1. Go to: `https://github.com/Anuj472/jobcurator/actions`
2. Click on "Post Jobs to LinkedIn"
3. View recent runs and logs

### Log Output

The workflow logs show:
- ✅ Successfully posted jobs
- ⚠️ Skipped countries (no jobs)
- ❌ Failed posts
- 📊 Final summary (success/fail counts)

## Troubleshooting

### Common Issues

#### 1. Authentication Failed
```
❌ Failed to get LinkedIn access token
```
**Solution**: Check your Client ID and Client Secret are correct

#### 2. Forbidden (403)
```
❌ Failed to post job to LinkedIn: 403 Forbidden
```
**Solution**: 
- Verify your app has `w_member_social` permission
- Check LINKEDIN_AUTHOR_URN is correct
- Ensure your LinkedIn app is approved

#### 3. No Jobs Found
```
⚠️ No active jobs found for USA
```
**Solution**: Ensure jobs have `status = 'active'` and `country` is populated

#### 4. Rate Limiting
```
❌ Too many requests
```
**Solution**: LinkedIn has rate limits. The 20-minute delay helps avoid this.

### Debug Mode

To see detailed logs, the script already includes:
- ✅ Success messages
- ❌ Error messages
- 📊 Progress tracking

## Rate Limits

LinkedIn API has these limits:
- **Posts per day**: ~25 posts (LinkedIn recommendation)
- **Requests per hour**: 100 requests

The 20-minute delay ensures we stay well within limits:
- 3 posts per hour
- ~72 posts per day maximum

## Customization

### Change Posting Delay

Edit `scripts/post-jobs.ts`:

```typescript
const delayMinutes = 20; // Change this value
```

### Change Post Format

Edit `services/linkedinService.ts` → `formatJobPost()` method

### Filter Jobs

Edit `scripts/post-jobs.ts` → `getRandomJobByCountry()` function:

```typescript
.eq('status', 'active')
.eq('job_type', 'Full-time') // Add filters
.gte('created_at', oneWeekAgo) // Only recent jobs
```

## Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Test LinkedIn API credentials manually
4. Review LinkedIn Developer documentation

## Next Steps

1. ✅ Add GitHub secrets
2. ✅ Test manual workflow run
3. ✅ Wait for automatic trigger after job harvest
4. ✅ Monitor LinkedIn for posts
5. ✅ Adjust timing if needed

Your jobs will now be automatically posted to LinkedIn! 🎉