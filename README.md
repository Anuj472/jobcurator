# 🎯 JobCurator - Automated Job Aggregation Platform

**Automated daily harvesting of tech jobs from 100+ companies** with intelligent lifecycle management.

## ✨ Key Features

✅ **Daily Automated Harvesting** - Runs every day at 12 PM IST via GitHub Actions  
✅ **Multi-ATS Support** - Greenhouse, Lever, Ashby platforms  
✅ **Smart Categorization** - Auto-categorizes into IT, Sales, Marketing, Finance, Legal, Management, R&D  
✅ **Experience Level Detection** - Automatically detects Entry/Mid/Senior/Lead/Executive  
✅ **Automatic Job Expiry Detection** - Marks expired jobs as inactive automatically  
✅ **No Duplicates** - Uses `apply_link` as unique key  
✅ **Filter-Ready** - Fully compatible with [acrossjobs](https://github.com/Anuj472/acrossjobs) filters  

---

## 🔄 Job Lifecycle Management (Automatic)

### How It Works

```
┌──────────────────────────────────────────────────┐
│       DAILY HARVEST (12 PM IST)                    │
└──────────────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                    │
    ┌────┴────┐          ┌────┴────┐
    │  Fetch  │          │ Compare │
    │ from ATS│          │ ATS vs DB│
    └────┬────┘          └────┬────┘
         │                    │
         │                    │
         │              ┌─────┴─────┐
         │              │           │
         │         ┌────┴───┐   ┌───┴───┐
         │         │        │   │       │
         │         │  New   │   │Expired│
         │         │  Jobs  │   │ Jobs  │
         │         │        │   │       │
         │         └────┬───┘   └───┬───┘
         │              │           │
         │              │           │
         └──────────────┴───────────┴──────────┐
                      │                        │
              ┌───────┴───────┐        ┌─────┴─────┐
              │  INSERT/UPDATE │        │ Mark as  │
              │ is_active=true│        │ INACTIVE │
              └───────────────┘        └──────────┘
                                           │
                                           │
                                  After 30 days
                                           │
                                           │
                                      ┌────┴────┐
                                      │ DELETE │
                                      └─────────┘
```

### Example

**Day 1:**
- Google has 100 jobs on ATS → All inserted with `is_active: true`

**Day 2:**
- Google closes 10 jobs (now 90 on ATS)
- Harvest detects: 10 jobs missing from ATS
- **Automatically marks those 10 as `is_active: false`** ⭐

**Day 32:**
- Those 10 inactive jobs are **automatically deleted** (inactive >30 days)

**Result:** ✅ Database always stays fresh and accurate!

📚 **[Read Full Documentation](./JOB_LIFECYCLE.md)**

---

## 🚀 Quick Start

### 1. Setup Automation

```bash
# Clone repository
git clone https://github.com/Anuj472/jobcurator.git
cd jobcurator

# Install dependencies
npm install
```

### 2. Add GitHub Secrets

Go to: **Settings** → **Secrets and variables** → **Actions**

Add:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

### 3. Test Manually

```bash
# Local test
npm run harvest

# Or trigger via GitHub Actions
# Go to Actions tab → Daily Job Harvest → Run workflow
```

### 4. Let It Run!

✅ Automation runs daily at 12 PM IST  
✅ New jobs automatically added  
✅ Expired jobs automatically marked inactive  
✅ Old inactive jobs auto-deleted after 30 days  

---

## 📋 Database Schema

### Jobs Table

| Field | Type | Description | Required for Filters |
|-------|------|-------------|---------------------|
| `id` | uuid | Primary key | - |
| `company_id` | uuid | Foreign key to companies | ✅ Search |
| `title` | text | Job title | ✅ Search, Subcategory |
| `category` | enum | it, sales, marketing, etc. | ✅ Category filter |
| `location_city` | text | City name | ✅ Location filter |
| `location_country` | text | Country name | ✅ Location filter |
| `job_type` | enum | Remote, On-site, Hybrid | ✅ Job type filter |
| `experience_level` | enum | Entry/Mid/Senior/Lead/Executive | ✅ Experience filter |
| `apply_link` | text | **UNIQUE** - Job URL | ✅ Applications |
| `description` | text | Job description | Job details page |
| `is_active` | boolean | Currently open on ATS | **Lifecycle** |
| `created_at` | timestamp | First seen date | - |
| `updated_at` | timestamp | Last modified date | **Lifecycle** |

---

## 🛠️ Architecture

```
┌──────────────────────────────────────────────────┐
│           GitHub Actions (Cron: Daily 12 PM)          │
└─────────────────────┬────────────────────────────┘
                     │
                     │ Triggers
                     │
         ┌───────────┴───────────┐
         │   scripts/harvest.ts  │
         │   (Job Harvester)     │
         └───────────┬───────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────┴────┐   ┌────┴────┐   ┌────┴────┐
    │Greenhouse│   │  Lever  │   │  Ashby  │
    │    API   │   │   API  │   │   API  │
    └─────────┘   └─────────┘   └─────────┘
         │           │           │
         └───────────┬───────────┘
                     │
                     │ Normalize & Categorize
                     │
         ┌───────────┴───────────┐
         │   Supabase Database  │
         │  (PostgreSQL + RLS)  │
         └───────────┬───────────┘
                     │
                     │ Consumed by
                     │
         ┌───────────┴───────────┐
         │     acrossjobs      │
         │   (Job Board UI)    │
         └───────────────────────┘
```

---

## 📄 Documentation

- **[🔄 Job Lifecycle Management](./JOB_LIFECYCLE.md)** - How expired jobs are detected
- **[🔍 Filter Compatibility](./FILTER_COMPATIBILITY.md)** - Ensuring acrossjobs filters work
- **[⚙️ Automation Setup](./AUTOMATION_SETUP.md)** - GitHub Actions configuration

---

## 📊 Stats

**Current Coverage:**
- 100+ companies tracked
- 7 job categories (IT, Sales, Marketing, Finance, Legal, Management, R&D)
- 5 experience levels (Entry, Mid, Senior, Lead, Executive)
- 3 ATS platforms (Greenhouse, Lever, Ashby)

**Expected Daily Harvest:**
- ~5,000-10,000 active jobs
- ~200-500 new jobs per day
- ~100-300 expired jobs per day
- ~5-15 minute runtime

---

## ❓ FAQ

**Q: What happens if a job expires on the ATS platform?**  
A: It's **automatically marked as inactive** during the next harvest. After 30 days, it's permanently deleted. [Read more](./JOB_LIFECYCLE.md)

**Q: Are there duplicate jobs in the database?**  
A: No. Each job has a unique `apply_link` URL. If the same job appears again, it's updated, not duplicated.

**Q: Do I need to manually clean up old jobs?**  
A: No. Jobs inactive for >30 days are **automatically deleted**.

**Q: What if I want to add more companies?**  
A: Edit `constants.ts` and add to `INITIAL_COMPANIES` array with ATS platform and identifier.

**Q: Can I change the harvest schedule?**  
A: Yes. Edit `.github/workflows/daily-harvest.yml` cron expression.

---

## 👥 Contributing

To add more companies to the harvest:

1. Find the company's ATS platform (Greenhouse/Lever/Ashby)
2. Get their job board identifier (usually in the careers page URL)
3. Add to `constants.ts`:

```typescript
export const INITIAL_COMPANIES = [
  // ... existing companies
  {
    name: 'New Company',
    identifier: 'newcompany',  // From careers URL
    platform: AtsPlatform.GREENHOUSE
  }
];
```

---

## 🚀 Related Projects

- **[acrossjobs](https://github.com/Anuj472/acrossjobs)** - Job board frontend consuming this data

---

## 📝 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ for job seekers**
