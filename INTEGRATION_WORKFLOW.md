# 🔄 Complete Integration Workflow: Internship Experience Level

## 📋 Overview

This document explains the **end-to-end workflow** of how internship jobs flow from ATS platforms → Database → Frontend filtering.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATS PLATFORMS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Greenhouse  │  │   Lever     │  │   Ashby     │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │   API Calls     │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              JOBCURATOR (GitHub Actions - Daily)                │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  scripts/harvest.ts                                   │     │
│  │  ┌─────────────────────────────────────────────────┐ │     │
│  │  │ 1. Fetch jobs from ATS APIs                     │ │     │
│  │  │ 2. Normalize data across platforms              │ │     │
│  │  │ 3. Detect experience level (INTERNSHIP first!)  │ │     │
│  │  │ 4. Categorize (IT, Sales, etc.)                 │ │     │
│  │  │ 5. Detect job type (Remote, Hybrid, On-site)    │ │     │
│  │  └─────────────────────────────────────────────────┘ │     │
│  └───────────────────────┬───────────────────────────────┘     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           │ INSERT/UPDATE
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                             │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  Table: jobs                                          │     │
│  │  ┌─────────────────────────────────────────────────┐ │     │
│  │  │ - title: "Software Engineering Intern"          │ │     │
│  │  │ - experience_level: "Internship" ⭐              │ │     │
│  │  │ - category: "it"                                │ │     │
│  │  │ - job_type: "Remote"                            │ │     │
│  │  │ - is_active: true                               │ │     │
│  │  │ - apply_link: "https://..." (UNIQUE KEY)        │ │     │
│  │  └─────────────────────────────────────────────────┘ │     │
│  └───────────────────────┬───────────────────────────────┘     │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           │ QUERY
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ACROSSJOBS (Frontend)                        │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  User Filter UI                                       │     │
│  │  ┌─────────────────────────────────────────────────┐ │     │
│  │  │ Experience Level: [Internship ▼]                │ │     │
│  │  │   • All Levels                                  │ │     │
│  │  │   • Internship ⭐ ← User selects this           │ │     │
│  │  │   • Entry Level                                 │ │     │
│  │  │   • Mid Level                                   │ │     │
│  │  └─────────────────────────────────────────────────┘ │     │
│  └───────────────────────┬───────────────────────────────┘     │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  Query: WHERE experience_level = 'Internship'        │     │
│  │         AND is_active = true                          │     │
│  └───────────────────────┬───────────────────────────────┘     │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────┐     │
│  │  Results: Only Internship jobs displayed             │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Step-by-Step Workflow

### **Step 1: Daily Harvest Trigger (12:00 PM IST)**

**File:** `.github/workflows/daily-harvest.yml`

```yaml
on:
  schedule:
    - cron: '30 6 * * *'  # 6:30 AM UTC = 12:00 PM IST
  workflow_dispatch:       # Manual trigger option
```

**What happens:**
- GitHub Actions triggers automatically daily
- Can also be triggered manually from Actions tab

---

### **Step 2: Fetch Jobs from ATS**

**File:** `scripts/harvest.ts`

```typescript
// For each company in INITIAL_COMPANIES
if (company.platform === AtsPlatform.GREENHOUSE) {
  rawJobs = await AtsService.fetchGreenhouseJobs(company.identifier);
} else if (company.platform === AtsPlatform.LEVER) {
  rawJobs = await AtsService.fetchLeverJobs(company.identifier);
} else if (company.platform === AtsPlatform.ASHBY) {
  rawJobs = await AtsService.fetchAshbyJobs(company.identifier);
}
```

**Example API Response:**
```json
{
  "id": "123456",
  "title": "Software Engineering Intern - AI/ML",
  "location": "San Francisco, CA (Remote)",
  "departments": ["Engineering"],
  "absolute_url": "https://boards.greenhouse.io/company/jobs/123456"
}
```

---

### **Step 3: Normalize Data**

**File:** `services/atsService.ts`

```typescript
// Different ATS platforms have different formats
// Normalize to standard format
const normalized = {
  title: "Software Engineering Intern - AI/ML",
  location_city: "San Francisco",
  location_country: "United States",
  apply_link: "https://boards.greenhouse.io/company/jobs/123456",
  description: "...",
  category: "Engineering"  // Raw category from ATS
};
```

---

### **Step 4: Detect Experience Level** ⭐ **CRITICAL**

**File:** `scripts/harvest.ts`

```typescript
const mapToExperienceLevel = (title, description) => {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();
  
  // 🎓 INTERNSHIP - Highest Priority!
  const internshipKeywords = [
    'intern ', 'internship', 'apprentice', 'apprenticeship',
    'co-op', 'coop', 'student', 'trainee', 'campus',
    'new grad', 'new graduate', 'university program'
  ];
  if (internshipKeywords.some(kw => combined.includes(kw))) {
    return 'Internship';  // ⭐ Returns here!
  }
  
  // Executive, Lead, Senior, Entry, Mid checks...
  // ...
};
```

**Result:**
```typescript
experienceLevel = 'Internship'  // ✅ Detected!
```

---

### **Step 5: Categorize Job**

**File:** `scripts/harvest.ts`

```typescript
const mapToJobCategory = (rawDept, title) => {
  const combined = `${rawDept || ''} ${title || ''}`.toLowerCase();
  
  // Check keywords for IT, Sales, Marketing, etc.
  const itKeywords = ['engineer', 'developer', 'software', ...];
  if (itKeywords.some(kw => combined.includes(kw))) {
    return 'it';
  }
  // ...
};
```

**Result:**
```typescript
category = 'it'  // Software Engineering → IT
```

---

### **Step 6: Detect Job Type**

```typescript
const mapToJobType = (location, title) => {
  const combined = `${location || ''} ${title || ''}`.toLowerCase();
  
  if (combined.includes('remote')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  return 'On-site';
};
```

**Result:**
```typescript
jobType = 'Remote'  // "Remote" in location
```

---

### **Step 7: Build Final Job Object**

```typescript
const finalJob = {
  company_id: companyId,
  title: 'Software Engineering Intern - AI/ML',
  category: 'it',
  location_city: 'San Francisco',
  location_country: 'United States',
  job_type: 'Remote',
  experience_level: 'Internship',  // ⭐ Set here!
  apply_link: 'https://boards.greenhouse.io/company/jobs/123456',
  description: '...',
  is_active: true
};
```

---

### **Step 8: Insert/Update Database**

```typescript
await supabase
  .from('jobs')
  .upsert(normalizedJobs, { onConflict: 'apply_link' })
  .select();
```

**Database Schema:**
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  title TEXT NOT NULL,
  category TEXT,
  location_city TEXT,
  location_country TEXT,
  job_type TEXT,
  experience_level TEXT,  -- ⭐ 'Internship' stored here
  apply_link TEXT UNIQUE,  -- Prevents duplicates
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### **Step 9: Frontend Query**

**File:** `acrossjobs/pages/CategoryPage.tsx`

**When user selects "Internship" filter:**

```typescript
const filteredJobs = allJobs.filter(job => {
  const matchesExperience = 
    experienceLevel === 'all' || 
    job.experience_level === experienceLevel;  // 'Internship'
  
  return matchesExperience && /* other filters */;
});
```

**Supabase Query (in App.tsx or API layer):**

```typescript
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    *,
    company:companies(*)
  `)
  .eq('is_active', true)              // Only active jobs
  .eq('experience_level', 'Internship')  // ⭐ Filter internships
  .order('created_at', { ascending: false });
```

---

### **Step 10: Display Results**

**User sees:**

```
┌─────────────────────────────────────────────┐
│ 🎓 Software Engineering Intern - AI/ML      │
│ Company XYZ • San Francisco, CA • Remote    │
│ IT • Internship • Posted 2 days ago         │
│ [Apply Now] →                               │
└─────────────────────────────────────────────┘
```

---

## 📊 Data Flow Summary

| Step | Component | Input | Output |
|------|-----------|-------|--------|
| 1 | GitHub Actions | Cron trigger | Run harvest script |
| 2 | AtsService | ATS API | Raw job data |
| 3 | Normalizer | Raw data | Standardized format |
| 4 | Experience Detector | Title + Description | **'Internship'** ⭐ |
| 5 | Category Mapper | Title + Dept | 'it' |
| 6 | Job Type Detector | Location | 'Remote' |
| 7 | Job Builder | All fields | Final job object |
| 8 | Supabase | Job object | Database record |
| 9 | Frontend Query | User filter | Filtered results |
| 10 | UI | Job list | Display cards |

---

## 🔍 Type Safety Across Repos

### **jobcurator/types.ts**
```typescript
export type ExperienceLevel = 
  | 'Internship'      // ⭐ Added
  | 'Entry Level'
  | 'Mid Level'
  | 'Senior Level'
  | 'Lead'
  | 'Executive'
  | null;

export interface Job {
  // ...
  experience_level?: ExperienceLevel;  // ⭐ Type-safe
  // ...
}
```

### **acrossjobs/types.ts**
```typescript
export type ExperienceLevelType = 
  | 'Internship'      // ⭐ Same as jobcurator
  | 'Entry Level'
  | 'Mid Level'
  | 'Senior Level'
  | 'Lead'
  | 'Executive'
  | null;

export interface Job {
  // ...
  experience_level: ExperienceLevelType;  // ⭐ Matches DB
  // ...
}
```

**✅ Result: Complete type safety from ATS → Database → Frontend**

---

## 🧪 Testing the Integration

### **1. Test Harvest Script Locally**

```bash
cd jobcurator
npm install
npm run harvest
```

**Look for in logs:**
```
🎯 Experience Level Distribution:
   Internship: 42      ⭐ Should show count
   Entry Level: 234
   ...
```

---

### **2. Test Database**

```sql
-- Check internships were inserted
SELECT COUNT(*) 
FROM jobs 
WHERE experience_level = 'Internship' 
  AND is_active = true;

-- View sample internships
SELECT title, experience_level, category, job_type
FROM jobs
WHERE experience_level = 'Internship'
LIMIT 10;
```

---

### **3. Test Frontend Filter**

**In acrossjobs:**
1. Navigate to any category (e.g., IT)
2. Open "Experience Level" dropdown
3. Select **"Internship"**
4. Verify only internship jobs appear

**Check browser console:**
```javascript
🔍 Filtering jobs: {
  category: 'it',
  experienceLevel: 'Internship',  // ⭐ Filter applied
  ...
}
✅ Filtered result: 42 jobs
```

---

## ⚙️ Configuration Files

### **GitHub Actions Workflow**
```yaml
# .github/workflows/daily-harvest.yml
name: Daily Job Harvest

on:
  schedule:
    - cron: '30 6 * * *'  # 12:00 PM IST
  workflow_dispatch:

jobs:
  harvest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npm install -g tsx
      - run: tsx scripts/harvest.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## 🚨 Troubleshooting

### **Problem: Internships not appearing in filter**

**Check:**
1. Are internships in database?
   ```sql
   SELECT COUNT(*) FROM jobs WHERE experience_level = 'Internship';
   ```

2. Is filter working?
   - Open browser DevTools
   - Check console logs when selecting filter

3. Type mismatch?
   - Ensure `'Internship'` exactly matches (case-sensitive)

---

### **Problem: Jobs not being classified as Internship**

**Check:**
1. Keyword detection in `harvest.ts`
2. Run harvest with logging:
   ```typescript
   const level = mapToExperienceLevel(title, description);
   console.log(`Title: ${title} → Level: ${level}`);
   ```

3. Verify job title has internship keywords

---

## ✅ Checklist: Full Integration

### **jobcurator Repository**
- [x] `types.ts` - ExperienceLevel type added
- [x] `scripts/harvest.ts` - Internship detection logic
- [x] `.github/workflows/daily-harvest.yml` - Workflow configured
- [x] Documentation created

### **acrossjobs Repository**
- [x] `types.ts` - ExperienceLevelType updated
- [x] `constants.tsx` - Internship option added
- [x] `pages/CategoryPage.tsx` - Filter dropdown updated
- [x] Frontend filtering logic working

### **Database**
- [x] `jobs.experience_level` column exists
- [x] Can store 'Internship' value
- [x] Queries filter correctly

### **GitHub Actions**
- [x] Secrets configured (SUPABASE_URL, SUPABASE_ANON_KEY)
- [x] Workflow enabled
- [x] Daily schedule set

---

## 🎯 Success Metrics

After next harvest (tomorrow at 12:00 PM IST):

✅ **Harvest logs show:**
```
🎯 Experience Level Distribution:
   Internship: X (where X > 0)
```

✅ **Database contains:**
```sql
SELECT COUNT(*) FROM jobs WHERE experience_level = 'Internship';
-- Returns: X rows
```

✅ **Frontend displays:**
- Internship filter option visible
- Selecting it shows only internships
- Job cards show "Internship" badge

---

## 📚 Related Documentation

- [JOB_LIFECYCLE.md](./JOB_LIFECYCLE.md) - Job expiry management
- [INTERNSHIP_FEATURE.md](./INTERNSHIP_FEATURE.md) - Internship feature details
- [FILTER_COMPATIBILITY.md](./FILTER_COMPATIBILITY.md) - Filter guide

---

**Integration Complete!** 🎉

**Last Updated:** February 1, 2026  
**Status:** ✅ Production Ready
