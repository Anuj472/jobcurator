# 🔄 Automatic Job Lifecycle Management

## ❓ Your Question:
> *"If any job expires on the ATS platform, how will I know and how will it get removed from our platform?"*

## ✅ Answer: **It's Already Automatic!**

The harvest script **automatically detects and handles expired jobs** every time it runs (daily at 12 PM). Here's exactly how it works:

---

## 🛠️ How It Works

### Step 1: Fetch Current Active Jobs from ATS
```typescript
// Day 1: Google has 100 jobs on their ATS
rawJobs = fetchGreenhouseJobs('google')  // Returns 100 jobs
```

### Step 2: Sync Active Jobs to Database
```typescript
// Upsert all 100 jobs with is_active: true
supabase.upsert(jobs, { onConflict: 'apply_link' })
```

### Step 3: **Auto-Detect Expired Jobs** ⭐ **KEY FEATURE**
```typescript
// Day 2: Google closes 10 jobs, now only 90 on ATS
// Script compares:
//   - ATS has: 90 jobs (current)
//   - Database has: 100 jobs (old)
//   - Difference: 10 jobs are EXPIRED!

const markExpiredJobs = async (companyId, activeApplyLinks) => {
  // Find jobs in DB that are NOT in current ATS feed
  await supabase
    .update({ is_active: false })  // Mark as inactive
    .eq('company_id', companyId)
    .not('apply_link', 'in', activeApplyLinks);  // Not in current feed
};
```

### Step 4: Cleanup Old Inactive Jobs (After 30 Days)
```typescript
// Jobs inactive for >30 days are permanently deleted
supabase
  .delete()
  .eq('is_active', false)
  .lt('updated_at', thirtyDaysAgo);
```

---

## 📊 Example Timeline

### Day 1 - Initial Harvest
```
ATS: 100 jobs active
DB:  100 jobs (all is_active: true)
```

### Day 2 - Company Closes 10 Jobs
```
ATS: 90 jobs active (10 removed)
DB:  100 jobs total
     ├─ 90 is_active: true  ✅ (still on ATS)
     └─ 10 is_active: false ❌ (AUTOMATICALLY marked as expired)
```

### Day 32 - Cleanup Old Jobs
```
ATS: 90 jobs active
DB:  90 jobs total
     ├─ 90 is_active: true  ✅
     └─ 10 old jobs DELETED 🗑️ (inactive >30 days)
```

---

## 🔍 How acrossjobs Shows Only Active Jobs

By default, the acrossjobs frontend **only queries active jobs**:

```typescript
// In acrossjobs, this query filters out expired jobs:
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('is_active', true);  // ⭐ Only active jobs shown!
```

**Result:** Users never see expired jobs! ✅

---

## 📝 Daily Harvest Log Example

```bash
======================================================================
🚀 JOB HARVESTER WITH LIFECYCLE MANAGEMENT
   Started: 2026-02-01T06:30:00.000Z
======================================================================

📦 Processing: Google
   Found 90 active jobs on ATS
   ✅ Synced 90 active jobs
   🔄 Marked 10 expired jobs as inactive  ⭐ AUTOMATIC!

📦 Processing: Microsoft
   Found 150 active jobs on ATS
   ✅ Synced 150 active jobs
   🔄 Marked 5 expired jobs as inactive   ⭐ AUTOMATIC!

🧹 Cleaning up very old inactive jobs...
   🗑️ Deleted 23 jobs inactive for >30 days

======================================================================
📊 HARVEST SUMMARY
======================================================================
   Companies processed: 100
   Jobs found on ATS: 8,542
   Jobs synced/updated: 8,542
   Jobs marked expired: 327      ⭐ Automatic detection!
   Jobs deleted (>30d old): 23
   Jobs failed: 0
======================================================================
```

---

## ✨ Key Benefits

✅ **Zero Manual Work** - Fully automatic, no intervention needed  
✅ **Always Fresh** - Database matches ATS reality  
✅ **No Duplicates** - `apply_link` is unique key  
✅ **Clean Database** - Old jobs auto-deleted after 30 days  
✅ **User Experience** - acrossjobs only shows active jobs  
✅ **Daily Updates** - Runs every day at 12 PM IST  

---

## 💡 How Jobs Are Identified

### Unique Identifier: `apply_link`

Each job is uniquely identified by its **apply URL**:

```typescript
// Example apply_link:
"https://boards.greenhouse.io/google/jobs/123456"

// Database constraint:
CREATE UNIQUE INDEX jobs_apply_link_key ON jobs(apply_link);
```

**Why this works:**
- Each job posting has a unique ATS URL
- If URL disappears from ATS feed → Job expired
- If URL reappears → Job reopened (marked active again)

---

## 🔍 What Happens in Different Scenarios

### Scenario 1: Job Still Open
```
Day 1: Job in ATS → is_active: true
Day 2: Job in ATS → is_active: true (updated)
Day 3: Job in ATS → is_active: true (updated)
```
**Result:** Job stays active ✅

### Scenario 2: Job Gets Closed
```
Day 1: Job in ATS → is_active: true
Day 2: Job NOT in ATS → is_active: false ❌ (auto-marked)
Day 3: Job NOT in ATS → is_active: false
```
**Result:** Job marked inactive automatically ✅

### Scenario 3: Job Reopened
```
Day 1: Job in ATS → is_active: true
Day 2: Job NOT in ATS → is_active: false
Day 3: Job BACK in ATS → is_active: true ✅ (reactivated!)
```
**Result:** Job reactivated automatically ✅

### Scenario 4: Job Inactive for 30+ Days
```
Day 1: Job closed → is_active: false
Day 30: Still inactive
Day 31: DELETED from database 🗑️
```
**Result:** Permanent cleanup ✅

---

## ⏱️ Retention Policy

| Job Status | Retention | Action |
|------------|-----------|--------|
| **Active** | Forever | Kept and updated daily |
| **Inactive** (0-30 days) | 30 days | Kept but hidden from users |
| **Inactive** (>30 days) | Deleted | Permanently removed |

**Why keep inactive jobs for 30 days?**
- Companies sometimes repost jobs
- Allows for data analysis
- Gives buffer for temporary ATS issues

---

## 🔧 Customizing Retention Period

To change the 30-day cleanup period, edit `scripts/harvest.ts`:

```typescript
// Current: 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// Change to 60 days:
const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

// Change to 7 days (aggressive cleanup):
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
```

---

## 📊 Monitoring Job Health

### Check Active vs Inactive Jobs

```sql
-- Count active jobs
SELECT COUNT(*) FROM jobs WHERE is_active = true;

-- Count inactive jobs
SELECT COUNT(*) FROM jobs WHERE is_active = false;

-- Jobs by company with expiry rate
SELECT 
  c.name,
  COUNT(*) FILTER (WHERE j.is_active = true) as active,
  COUNT(*) FILTER (WHERE j.is_active = false) as inactive
FROM jobs j
JOIN companies c ON j.company_id = c.id
GROUP BY c.name
ORDER BY inactive DESC;
```

### Monitor Churn Rate

```sql
-- Jobs that became inactive in last 7 days
SELECT 
  title,
  company.name,
  updated_at as expired_date
FROM jobs
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

---

## ❓ FAQ

### Q: What if a job is temporarily removed from ATS by mistake?
**A:** It will be marked inactive, but kept for 30 days. If it reappears within 30 days, it's automatically reactivated.

### Q: Can I manually mark a job as inactive?
**A:** Yes, update directly in Supabase:
```sql
UPDATE jobs SET is_active = false WHERE id = 'job-id';
```

### Q: Can I prevent certain jobs from being marked inactive?
**A:** Not recommended, but you could add a `permanent` flag:
```sql
ALTER TABLE jobs ADD COLUMN permanent BOOLEAN DEFAULT false;
-- Then modify harvest script to skip jobs with permanent = true
```

### Q: How do I see expired jobs in acrossjobs?
**A:** Add a filter toggle:
```typescript
// In acrossjobs query:
const showInactive = false;  // Make this a state variable

const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('is_active', showInactive ? false : true);
```

### Q: What if ATS API is down during harvest?
**A:** Jobs won't be marked as expired because the script will fail before reaching that step. They remain active until next successful harvest.

---

## 🚀 Summary

**Your original question:**
> *"If any job expires on platform, how will I know and get it removed?"*

**Answer:**
✅ **Automatic Detection** - Script compares ATS vs Database daily  
✅ **Automatic Marking** - Expired jobs → `is_active: false`  
✅ **Automatic Cleanup** - Jobs >30 days old are deleted  
✅ **User-Friendly** - acrossjobs only shows active jobs  
✅ **Zero Manual Work** - Fully automated lifecycle management  

**No action needed from you!** The system handles everything automatically. 🎉

---

**Last Updated:** February 1, 2026  
**Feature Status:** ✅ Production Ready
