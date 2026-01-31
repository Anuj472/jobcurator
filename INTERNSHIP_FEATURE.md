# 🎓 Internship / Apprenticeship Experience Level

## ✨ What Changed?

Added **"Internship"** as a separate experience level so users can specifically filter for internships and apprenticeships.

---

## 📝 Experience Levels (Updated)

### Before:
1. Entry Level
2. Mid Level
3. Senior Level
4. Lead
5. Executive

### After:
1. **🎓 Internship** (NEW!)
2. Entry Level
3. Mid Level
4. Senior Level
5. Lead
6. Executive

---

## 🔍 Detection Keywords

The harvest script automatically detects internships using these keywords in job titles or descriptions:

```typescript
const internshipKeywords = [
  'intern ',
  'internship',
  'apprentice',
  'apprenticeship',
  'co-op',
  'coop',
  'student',
  'trainee',
  'campus',
  'new grad',
  'new graduate',
  'university program'
];
```

### Examples of Jobs Detected as Internships:

✅ **"Software Engineering Intern - Summer 2026"**  
✅ **"Marketing Apprenticeship (6 months)"**  
✅ **"Data Science Co-op"**  
✅ **"University Graduate Trainee Program"**  
✅ **"Campus Hire - Engineering"**  
✅ **"New Graduate Software Developer"**  

---

## ⚡ Priority Order

Internship detection has **HIGHEST PRIORITY** to avoid misclassification:

```typescript
// Priority order:
1. Internship        ⭐ HIGHEST (students)
2. Executive         (C-suite, VPs)
3. Lead              (Principals, Architects)
4. Senior Level      (Senior engineers)
5. Entry Level       (Junior, Associates)
6. Mid Level         (Default)
```

### Why Priority Matters:

A job titled **"Senior Software Engineering Intern"** will be classified as:
- ✅ **Internship** (correct - highest priority)
- ❌ NOT "Senior Level" (wrong)

A job titled **"Junior Software Engineer"** will be classified as:
- ✅ **Entry Level** (correct - no intern keywords)
- ❌ NOT "Internship" (wrong)

---

## 📊 How It Shows Up

### In acrossjobs Filter Dropdown:

```
Experience Level
└────────────────────
  • All Levels
  • Internship         ⭐ NEW!
  • Entry Level
  • Mid Level
  • Senior Level
  • Lead
  • Executive
```

### In Harvest Log:

```bash
🎯 Experience Level Distribution:
   Internship: 234        ⭐ NEW!
   Entry Level: 1,142
   Mid Level: 4,567
   Senior Level: 2,891
   Lead: 567
   Executive: 141
```

---

## 🚀 User Benefits

### For Students:
✅ **Easy Discovery** - Filter specifically for internships  
✅ **No Noise** - Entry-level full-time jobs excluded  
✅ **Comprehensive** - Catches co-ops, apprenticeships, trainee programs  

### For Recruiters:
✅ **Better Targeting** - Internship applicants separated from full-time  
✅ **Accurate Analytics** - Track internship vs full-time openings  

---

## 📊 Example Scenarios

### Scenario 1: Software Engineering Intern

**Job Title:** "Software Engineering Intern - AI/ML"  
**Detection:** Contains "Intern"  
**Result:** ✅ Classified as **Internship**

```sql
INSERT INTO jobs (
  title, 
  experience_level, 
  ...
) VALUES (
  'Software Engineering Intern - AI/ML',
  'Internship',  -- ⭐ Automatically set
  ...
);
```

---

### Scenario 2: New Graduate Program

**Job Title:** "New Graduate - Product Manager"  
**Detection:** Contains "New Graduate"  
**Result:** ✅ Classified as **Internship**

```sql
INSERT INTO jobs (
  title, 
  experience_level, 
  ...
) VALUES (
  'New Graduate - Product Manager',
  'Internship',  -- ⭐ Campus program
  ...
);
```

---

### Scenario 3: Co-op Position

**Job Title:** "Data Science Co-op (Winter 2026)"  
**Detection:** Contains "Co-op"  
**Result:** ✅ Classified as **Internship**

```sql
INSERT INTO jobs (
  title, 
  experience_level, 
  ...
) VALUES (
  'Data Science Co-op (Winter 2026)',
  'Internship',  -- ⭐ Co-op detected
  ...
);
```

---

### Scenario 4: Junior Developer (NOT an intern)

**Job Title:** "Junior Software Developer"  
**Detection:** No intern keywords, contains "Junior"  
**Result:** ✅ Classified as **Entry Level**

```sql
INSERT INTO jobs (
  title, 
  experience_level, 
  ...
) VALUES (
  'Junior Software Developer',
  'Entry Level',  -- ✅ Full-time entry job
  ...
);
```

---

## 🔧 Files Changed

### 1. acrossjobs Repository

| File | Change |
|------|--------|
| `types.ts` | Added `'Internship'` to `ExperienceLevelType` |
| `constants.tsx` | Added `{ value: 'INTERNSHIP', label: 'Internship' }` |
| `pages/CategoryPage.tsx` | Added Internship option to filter dropdown |

### 2. jobcurator Repository

| File | Change |
|------|--------|
| `scripts/harvest.ts` | Added internship detection logic with highest priority |
| `types.ts` | Updated `ExperienceLevel` type (if exists) |

---

## 🔄 Migration Steps

### For Existing Data:

If you already have jobs in the database, you can update them:

```sql
-- Update existing jobs with intern keywords
UPDATE jobs
SET experience_level = 'Internship'
WHERE (
  LOWER(title) LIKE '%intern%' OR
  LOWER(title) LIKE '%apprentice%' OR
  LOWER(title) LIKE '%co-op%' OR
  LOWER(title) LIKE '%coop%' OR
  LOWER(title) LIKE '%trainee%' OR
  LOWER(title) LIKE '%student%' OR
  LOWER(title) LIKE '%new grad%' OR
  LOWER(title) LIKE '%campus%'
)
AND is_active = true;
```

### For New Harvests:

✅ **Automatic** - All new jobs harvested after this update will be correctly classified!

---

## 📊 Expected Impact

### Before Update:

```
Total Jobs: 10,000
├─ Entry Level: 2,500  (includes ~500 internships mixed in ❌)
├─ Mid Level: 5,000
├─ Senior Level: 2,000
├─ Lead: 400
└─ Executive: 100
```

### After Update:

```
Total Jobs: 10,000
├─ Internship: 500      ⭐ NEW!
├─ Entry Level: 2,000   (✅ Pure entry-level now)
├─ Mid Level: 5,000
├─ Senior Level: 2,000
├─ Lead: 400
└─ Executive: 100
```

---

## ❓ FAQ

### Q: What if a job has both "Intern" and "Senior" in the title?
**A:** Internship has highest priority, so it will be classified as **Internship**.

Example: "Senior Software Engineering Intern" → **Internship** ✅

---

### Q: What about "New Graduate" full-time positions?
**A:** These are classified as **Internship** because they're typically campus hire programs similar to internships.

If you want to separate them, you could:
1. Create a new level: "New Graduate"
2. Or keep them as "Internship" (current approach)
3. Or manually classify as "Entry Level"

---

### Q: Can I change the keywords?
**A:** Yes! Edit the `internshipKeywords` array in `scripts/harvest.ts`:

```typescript
const internshipKeywords = [
  'intern ',
  'internship',
  'your-custom-keyword',  // Add more
  // ...
];
```

---

### Q: What if I don't want "New Grad" counted as Internship?
**A:** Remove those keywords:

```typescript
const internshipKeywords = [
  'intern ',
  'internship',
  'apprentice',
  'apprenticeship',
  'co-op',
  'coop',
  // Remove: 'new grad', 'new graduate', 'campus'
];
```

---

### Q: How do I test this?
**A:** Run the harvest script and check the logs:

```bash
npm run harvest
```

Look for:
```
🎯 Experience Level Distribution:
   Internship: X        ⭐ Should show internship count
```

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| **Types updated** | ✅ Done |
| **Detection logic** | ✅ Done |
| **Frontend filter** | ✅ Done |
| **Harvest script** | ✅ Done |
| **Auto-classification** | ✅ Works automatically |
| **Backward compatible** | ✅ Existing jobs unaffected |
| **Priority handling** | ✅ Internship has highest priority |

---

**Result:** Users can now filter for internships separately! 🎉

**Next Harvest:** All internship positions will be automatically detected and classified.

---

**Last Updated:** February 1, 2026  
**Feature Status:** ✅ Production Ready
