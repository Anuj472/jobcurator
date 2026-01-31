# 🔄 Smart Job Lifecycle Management

This document explains how jobcurator automatically keeps your job database **fresh and accurate** by detecting and removing expired jobs.

## ❓ The Problem

Without lifecycle management:

```
Day 1: Google posts 100 jobs → Database has 100 jobs
Day 2: Google closes 20 jobs, posts 10 new → Database has 90 jobs (should be)
       BUT database actually has: 80 old + 20 EXPIRED + 10 new = 110 jobs ❌
Day 7: Database cluttered with expired jobs users can't apply to ❌
```

**Result**: Bad user experience - users see jobs that no longer exist!

## ✅ The Solution

Our **3-step lifecycle management** system:

### Step 1: Sync Active Jobs
```typescript
// Upsert all jobs currently on ATS
.upsert(normalizedJobs, { onConflict: 'apply_link' })
```
- **New jobs**: Created with `is_active: true`
- **Existing jobs**: Updated with latest data, `is_active: true`

### Step 2: Mark Expired Jobs
```typescript
// Mark jobs NO LONGER on ATS as inactive
markExpiredJobs(companyId, activeApplyLinks)
```
- Compares database jobs vs current ATS jobs
- Jobs missing from ATS → `is_active: false`
- Happens **automatically every day**

### Step 3: Delete Very Old Jobs
```typescript
// Delete jobs inactive for >30 days
.delete()
.eq('is_active', false)
.lt('updated_at', thirtyDaysAgo)
```
- Permanent cleanup of old expired jobs
- Keeps database lean
- Only affects jobs inactive for 30+ days

## 📊 Lifecycle Workflow

### Example: Google's Jobs Over Time

**Day 1 - First Harvest:**
```
ATS has: [Job A, Job B, Job C]
Database: []

Action: Insert all 3 jobs as active
Result: Database has 3 active jobs ✅
```

**Day 2 - Job B Closes:**
```
ATS has: [Job A, Job C]  // Job B removed
Database: [Job A (active), Job B (active), Job C (active)]

Action:
  1. Upsert Job A, Job C → still active
  2. Mark Job B as inactive (not in ATS anymore)
  
Result: Database has 2 active, 1 inactive ✅
```

**Day 3 - New Job D Added:**
```
ATS has: [Job A, Job C, Job D]  // Job D is new
Database: [Job A (active), Job B (inactive), Job C (active)]

Action:
  1. Upsert Job A, Job C, Job D
  2. Job B stays inactive
  
Result: Database has 3 active, 1 inactive ✅
```

**Day 32 - Cleanup:**
```
Database: [Job A (active), Job B (inactive for 31 days), Job C (active), Job D (active)]

Action: Delete Job B (inactive >30 days)
Result: Database has 3 active, 0 inactive ✅
```

## 🔍 How Expired Jobs Are Detected

### Method: Apply Link Comparison

```typescript
const markExpiredJobs = async (companyId, activeApplyLinks) => {
  // Find all jobs for this company NOT in the active list
  await supabase
    .from('jobs')
    .update({ is_active: false })
    .eq('company_id', companyId)
    .eq('is_active', true)
    .not('apply_link', 'in', activeApplyLinks)  // 👈 Key logic
};
```

**Logic:**
1. Get all active jobs for company from database
2. Get all job apply_links currently on ATS
3. Any database job whose `apply_link` is NOT in ATS list = expired
4. Set `is_active: false` for those jobs

### Why `apply_link` as Unique Key?

✅ **Stable**: URL doesn't change  
✅ **Unique**: Each job has one apply link  
✅ **Reliable**: If link is gone, job is closed  

## 📊 Database Impact

### Before Lifecycle Management:
```sql
SELECT COUNT(*) FROM jobs WHERE is_active = true;
-- Result: 5,000 jobs (includes 1,500 expired!) ❌
```

### After Lifecycle Management:
```sql
SELECT COUNT(*) FROM jobs WHERE is_active = true;
-- Result: 3,500 jobs (only real active jobs) ✅
```

### Growth Over Time:
```
Week 1: 3,500 active jobs
Week 2: 3,700 active jobs (+200 net)
Week 3: 3,600 active jobs (-100 net, some closed)
Week 4: 3,800 active jobs (+200 net)
```

**Key Point**: Database size naturally fluctuates with real job market! 📉

## ⚙️ Configuration Options

### Cleanup Retention Period

Default: **30 days**  
Location: `scripts/harvest.ts` line ~200

```typescript
// Change retention period
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);  // Change 30 to desired days
```

**Options:**
- `7` days - Aggressive cleanup (smaller DB)
- `30` days - Balanced (recommended)
- `90` days - Keep history longer
- `0` - Never delete (disable cleanup)

### Disable Auto-Cleanup

Comment out the cleanup section:

```typescript
// STEP 3: Optional - Delete very old inactive jobs
/*
const { data: deletedJobs } = await supabase
  .from('jobs')
  .delete()
  .eq('is_active', false)
  .lt('updated_at', thirtyDaysAgo.toISOString())
  .select('id');
*/
```

## 📊 Monitoring Lifecycle Health

### Daily Harvest Logs

Every harvest shows:

```
📊 HARVEST SUMMARY
======================================================================
   Companies processed: 100
   Jobs found on ATS: 3,500
   Jobs synced/updated: 3,500
   Jobs marked expired: 200      👈 Jobs that closed today
   Jobs deleted (>30d old): 15    👈 Old cleanup
   Jobs failed: 0
```

### SQL Queries for Monitoring

**1. Active vs Inactive Jobs:**
```sql
SELECT 
  is_active,
  COUNT(*) as count
FROM jobs
GROUP BY is_active;

-- Result:
-- is_active | count
-- true      | 3,500
-- false     | 250
```

**2. Recently Expired Jobs:**
```sql
SELECT 
  title,
  company_id,
  updated_at
FROM jobs
WHERE is_active = false
  AND updated_at > NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC
LIMIT 20;
```

**3. Jobs By Company (Active Only):**
```sql
SELECT 
  c.name,
  COUNT(*) as active_jobs
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.is_active = true
GROUP BY c.name
ORDER BY active_jobs DESC
LIMIT 10;
```

**4. Inactive Jobs Pending Cleanup:**
```sql
SELECT 
  COUNT(*) as jobs_to_delete
FROM jobs
WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '30 days';
```

## 👁️ User-Facing Impact

### In AcrossJobs Frontend

**Default Query (Shows Only Active):**
```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select('*, company:companies(*)')
  .eq('is_active', true)  // 👈 Only show active jobs
  .order('created_at', { ascending: false });
```

**Result**: Users only see jobs they can actually apply to! ✅

### Optional: Show "Recently Closed" Section

```typescript
const { data: recentlyClosed } = await supabase
  .from('jobs')
  .select('*, company:companies(*)')
  .eq('is_active', false)
  .gte('updated_at', new Date(Date.now() - 7*24*60*60*1000).toISOString())
  .order('updated_at', { ascending: false })
  .limit(10);
```

Display with "This job is no longer available" badge.

## ⚠️ Edge Cases Handled

### Case 1: Company Removes ALL Jobs

```typescript
if (rawJobs.length === 0) {
  // Mark all existing jobs as inactive
  await markExpiredJobs(companyId, []);
}
```

**Result**: All jobs marked inactive if company has zero openings ✅

### Case 2: ATS API Down

```typescript
try {
  rawJobs = await AtsService.fetchGreenhouseJobs(identifier);
} catch (err) {
  console.error('ATS fetch failed');
  continue;  // Skip this company, don't mark jobs inactive
}
```

**Result**: If API fails, jobs stay active (safe default) ✅

### Case 3: Duplicate Apply Links

```typescript
.upsert(normalizedJobs, { onConflict: 'apply_link' })
```

**Result**: Database constraint ensures one job per apply_link ✅

### Case 4: Job Re-posted After Closure

```
Day 1: Job A posted → active
Day 10: Job A closed → inactive
Day 15: Job A re-posted (same apply_link) → active again
```

**Result**: Upsert updates existing row back to active ✅

## 🛠️ Troubleshooting

### Issue: Too Many Jobs Marked Expired

**Symptoms**: Hundreds of jobs marked inactive daily  
**Possible Causes**:
- ATS API changed response format
- Network issues causing incomplete fetches
- Company changed ATS platform

**Fix**:
1. Check harvest logs for errors
2. Manually verify ATS website
3. Update ATS normalization logic if needed

### Issue: Expired Jobs Not Being Marked

**Symptoms**: Database has jobs that don't exist on ATS  
**Check**:
```typescript
// Verify markExpiredJobs is being called
console.log('Active links:', activeApplyLinks.length);
const expired = await markExpiredJobs(companyId, activeApplyLinks);
console.log('Expired:', expired);
```

**Fix**: Ensure `apply_link` format matches between ATS and database

### Issue: Jobs Deleted Too Soon

**Symptoms**: Recent jobs disappearing  
**Cause**: Cleanup retention period too short  
**Fix**: Increase from 30 to 60 or 90 days

## 📊 Statistics & Benchmarks

Expected lifecycle metrics (100 companies):

**Daily Changes:**
- New jobs: 100-200/day (2-4%)
- Expired jobs: 80-150/day (2-3%)
- Net change: +20 to +50/day

**Cleanup (30 days):**
- Jobs deleted: 10-30/day
- Total inactive: 200-400 at any time

**Database Size:**
- Active jobs: 3,000-5,000
- Inactive jobs: 200-400
- Total: ~3,500-5,500

## ✅ Benefits Summary

✅ **Accurate Data**: Users only see real, active jobs  
✅ **Better UX**: No "job no longer available" frustration  
✅ **Lean Database**: Auto-cleanup prevents bloat  
✅ **Market Insights**: Track hiring trends over time  
✅ **SEO Friendly**: Search engines don't index dead links  
✅ **Cost Efficient**: Smaller database = lower hosting costs  

---

**Last Updated:** February 1, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
