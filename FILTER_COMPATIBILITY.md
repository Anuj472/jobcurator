# 🔍 Filter Compatibility with AcrossJobs

This document explains how the job harvester ensures **100% compatibility** with all filters used in the [acrossjobs](https://github.com/Anuj472/acrossjobs) repository.

## ✅ Required Fields for All Filters

The harvest script (`scripts/harvest.ts`) populates all fields required for acrossjobs filters to work perfectly:

### 1. **Search Filter** (Home page)

**Fields used:**
- `title` - Job title (e.g., "Senior Software Engineer")
- `company.name` - Company name (e.g., "Google")

**How we populate:**
```typescript
title: norm.title!,  // From ATS API
company_id: companyId,  // Links to companies table
```

### 2. **Location Filter** (Home page & Category pages)

**Fields used:**
- `location_city` - City name (e.g., "San Francisco")
- `location_country` - Country name (e.g., "United States")

**How we populate:**
```typescript
location_city: norm.location_city || 'Remote',
location_country: norm.location_country || 'Global',
```

**Filter logic in acrossjobs:**
```typescript
// Matches "City, Country" format
`${job.location_city}, ${job.location_country}` === city
```

### 3. **Experience Level Filter** (Home page & Category pages) ⭐ **CRITICAL**

**Field used:**
- `experience_level` - One of: `'Entry Level'`, `'Mid Level'`, `'Senior Level'`, `'Lead'`, `'Executive'`, or `null`

**How we populate (NEW!):**
```typescript
const mapToExperienceLevel = (title, description) => {
  // Executive: CEO, CTO, VP, etc.
  if (executiveKeywords.some(kw => combined.includes(kw))) return 'Executive';
  
  // Lead: Team leads, Principal, Staff+
  if (leadKeywords.some(kw => combined.includes(kw))) return 'Lead';
  
  // Senior: Senior, Sr., Expert
  if (seniorKeywords.some(kw => combined.includes(kw))) return 'Senior Level';
  
  // Entry: Intern, Junior, Graduate
  if (entryKeywords.some(kw => combined.includes(kw))) return 'Entry Level';
  
  // Default: Mid Level
  return 'Mid Level';
};
```

**Valid values:**
- `'Entry Level'` - Interns, Juniors, Associates
- `'Mid Level'` - Regular engineers/managers (default)
- `'Senior Level'` - Senior ICs
- `'Lead'` - Staff+, Principals, Team Leads
- `'Executive'` - C-suite, VPs, Directors
- `null` - Unspecified

### 4. **Category Filter** (All pages)

**Field used:**
- `category` - One of: `'it'`, `'sales'`, `'marketing'`, `'finance'`, `'legal'`, `'management'`, `'research-development'`

**How we populate:**
```typescript
const mapToJobCategory = (rawDept, title) => {
  // Sales: sales, account executive, BDR, SDR
  if (salesKeywords.some(kw => combined.includes(kw))) return 'sales';
  
  // Marketing: marketing, growth, content, SEO
  if (marketingKeywords.some(kw => combined.includes(kw))) return 'marketing';
  
  // Finance: finance, accounting, CFO
  if (financeKeywords.some(kw => combined.includes(kw))) return 'finance';
  
  // Legal: legal, attorney, compliance
  if (legalKeywords.some(kw => combined.includes(kw))) return 'legal';
  
  // R&D: research, scientist, algorithm
  if (researchKeywords.some(kw => combined.includes(kw))) return 'research-development';
  
  // Management: CEO, VP, Director, HR
  if (managementKeywords.some(kw => combined.includes(kw))) return 'management';
  
  // IT: engineer, developer, software (default)
  return 'it';
};
```

**Valid categories:**
- `'it'` - IT & Software (default for tech jobs)
- `'sales'` - Sales & Business Development
- `'marketing'` - Marketing & Growth
- `'finance'` - Finance & Accounting
- `'legal'` - Legal & Compliance
- `'management'` - Management & Operations
- `'research-development'` - R&D & Innovation

### 5. **Job Type Filter** (Category pages)

**Field used:**
- `job_type` - One of: `'Remote'`, `'On-site'`, `'Hybrid'`, `'Freelance'`, `'Contract'`

**How we populate:**
```typescript
const mapToJobType = (location, title) => {
  if (combined.includes('remote') || combined.includes('anywhere')) return 'Remote';
  if (combined.includes('hybrid')) return 'Hybrid';
  return 'On-site';  // Default
};
```

**Valid types:**
- `'Remote'` - Fully remote
- `'On-site'` - Office-based (default)
- `'Hybrid'` - Mix of remote and office
- `'Freelance'` - Contract/freelance
- `'Contract'` - Temporary contract

### 6. **Subcategory Filter** (Category pages)

**Field used:**
- `title` - Matched against subcategory names

**How it works in acrossjobs:**
```typescript
const matchesSubcategory = !subcategoryFilter || 
  job.title.toLowerCase().includes(subcategoryFilter.toLowerCase());
```

**Example subcategories:**
- IT: "Software Development", "Data & AI", "Infrastructure & Cloud"
- Sales: "Hunting", "Farming", "Technical Sales"
- Marketing: "Digital", "Content & Creative", "Strategy"

## 📋 Complete Field Mapping

| Database Field | Type | Required | Filter Used By | Default Value |
|---------------|------|----------|----------------|---------------|
| `title` | string | ✅ | Search, Subcategory | - |
| `company_id` | uuid | ✅ | Search (via join) | - |
| `category` | enum | ✅ | Category pages | `'it'` |
| `location_city` | string | ❌ | Location filter | `'Remote'` |
| `location_country` | string | ❌ | Location filter | `'Global'` |
| `job_type` | enum | ✅ | Job Type filter | `'On-site'` |
| `experience_level` | enum | ❌ | Experience filter | `'Mid Level'` |
| `apply_link` | string | ✅ | Job applications | - |
| `description` | text | ❌ | Job details page | `''` |
| `is_active` | boolean | ✅ | Filtering inactive | `true` |

## 🎯 Data Quality Checks

The harvest script ensures:

✅ **No null titles** - Filtered out before database insert  
✅ **No null apply_links** - Jobs without links are skipped  
✅ **Valid categories** - All jobs mapped to one of 7 valid categories  
✅ **Valid job types** - All jobs have Remote/On-site/Hybrid  
✅ **Valid experience levels** - Intelligent detection from title  
✅ **Location defaults** - "Remote" and "Global" for missing data  
✅ **No duplicates** - `upsert` with `apply_link` as unique key  

## 🔄 Migration from Old Data

If you have existing jobs without `experience_level`:

```sql
-- Update all jobs with null experience_level to Mid Level
UPDATE jobs 
SET experience_level = 'Mid Level' 
WHERE experience_level IS NULL;
```

Or run a fresh harvest to get all fields populated correctly.

## 🧪 Testing Filters

### 1. Test Search Filter
```
1. Go to acrossjobs home page
2. Enter "engineer" in search
3. Should show all jobs with "engineer" in title or company name
```

### 2. Test Location Filter
```
1. Select a city from dropdown (e.g., "San Francisco, United States")
2. Should show only jobs in that location
3. Select "Remote" to see remote jobs
```

### 3. Test Experience Level Filter
```
1. Select "Senior Level" from dropdown
2. Should show only Senior jobs
3. All levels should have jobs (after harvest)
```

### 4. Test Category Filter
```
1. Click on "IT & Software" category
2. Should show only IT jobs
3. Try other categories: Sales, Marketing, Finance, Legal, Management, R&D
```

### 5. Test Job Type Filter
```
1. Go to any category page
2. Select "Remote" from Job Type dropdown
3. Should filter to only remote jobs
```

### 6. Test Subcategory Filter
```
1. On category page, click a subcategory (e.g., "Data & AI")
2. Should filter IT jobs to only data-related roles
```

## ⚠️ Common Issues

### Issue: Experience filter shows "No jobs"

**Cause:** Old harvest didn't set `experience_level`  
**Fix:** Run new harvest with updated script

### Issue: Location filter not working

**Cause:** Jobs have incomplete location data  
**Fix:** Harvest script now defaults to "Remote, Global"

### Issue: Category filter shows wrong jobs

**Cause:** Category keywords need tuning  
**Fix:** Update `mapToJobCategory()` keywords in harvest script

### Issue: Search returns no results

**Cause:** Empty `title` or `company.name`  
**Fix:** Harvest script filters out jobs without titles

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Add GitHub secrets (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Run manual test harvest (`npm run harvest`)
- [ ] Verify all 7 categories have jobs
- [ ] Test all 5 experience levels
- [ ] Check location dropdown has cities
- [ ] Test search with common keywords
- [ ] Enable GitHub Actions workflow
- [ ] Monitor first automated run

## 📊 Stats After Fresh Harvest

Expected distribution (from 100+ companies):

**By Category:**
- IT: 60-70% (tech-heavy companies)
- Sales: 10-15%
- Marketing: 5-10%
- Management: 5-10%
- Finance: 2-5%
- Legal: 1-2%
- R&D: 1-5%

**By Experience:**
- Entry Level: 10-15%
- Mid Level: 40-50%
- Senior Level: 25-30%
- Lead: 5-10%
- Executive: 2-5%

**By Job Type:**
- On-site: 40-50%
- Remote: 30-40%
- Hybrid: 10-20%

---

**Last Updated:** January 31, 2026  
**Compatibility:** acrossjobs v1.0 + jobcurator v1.0
