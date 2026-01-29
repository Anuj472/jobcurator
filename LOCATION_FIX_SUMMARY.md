# Location Fix Summary

## What Was Fixed

### Problem
- Jobs were showing incorrect locations (e.g., "Bangalore, USA" instead of "Bangalore, India")
- Location country was hardcoded to "United States" for all jobs
- No intelligent city-to-country mapping

### Solution Implemented

#### 1. **LocationService** (`services/locationService.ts`)
Created a comprehensive location parsing service that:
- Maps 150+ cities to their correct countries
- Supports India, USA, UK, Canada, Australia, Europe, and Asia
- Parses location strings in multiple formats:
  - `"Bangalore, India"`
  - `"San Francisco, CA"`
  - `"London, UK"`
  - `"Remote"`
  - `"Bangalore"` (infers India automatically)

#### 2. **Updated AtsService** (`services/atsService.ts`)
- All three ATS platforms (Greenhouse, Lever, Ashby) now use LocationService
- Properly extracts both `location_city` and `location_country`
- Handles remote job detection

#### 3. **Fixed App.tsx**
- Removed hardcoded `"United States"` fallback
- Changed to `"Global"` for unknown locations
- Location data now comes from properly parsed job data

## City-to-Country Mapping Coverage

### Indian Cities (50+)
- Bangalore/Bengaluru → India
- Mumbai, Delhi, Gurgaon/Gurugram → India
- Hyderabad, Chennai, Pune, Kolkata → India
- And 40+ more Indian cities

### US Cities (45+)
- New York, San Francisco, Seattle → United States
- Austin, Boston, Chicago, Denver → United States
- And 40+ more US cities

### UK Cities (18)
- London, Manchester, Edinburgh → United Kingdom

### Other Regions
- Canada (12 cities)
- Australia (12 cities)
- Europe (21 major cities with country mapping)
- Asia (15 major cities with country mapping)

## Data Migration

### For Existing Jobs in Database

Run this SQL in Supabase to fix existing jobs with incorrect locations:

```sql
-- Fix Bangalore jobs
UPDATE jobs 
SET location_country = 'India'
WHERE (location_city ILIKE '%bangalore%' OR location_city ILIKE '%bengaluru%')
AND location_country = 'United States';

-- Fix other major Indian cities
UPDATE jobs 
SET location_country = 'India'
WHERE location_city ILIKE ANY(ARRAY[
  '%mumbai%', '%delhi%', '%gurgaon%', '%gurugram%', '%hyderabad%',
  '%chennai%', '%pune%', '%kolkata%', '%ahmedabad%', '%jaipur%',
  '%noida%', '%greater noida%'
])
AND location_country = 'United States';

-- Fix US cities that might have been mislabeled
UPDATE jobs 
SET location_country = 'United States'
WHERE location_city ILIKE ANY(ARRAY[
  '%new york%', '%san francisco%', '%seattle%', '%austin%',
  '%boston%', '%chicago%', '%denver%', '%los angeles%'
])
AND location_country != 'United States';

-- Check results
SELECT 
  location_city, 
  location_country, 
  COUNT(*) as count
FROM jobs
GROUP BY location_city, location_country
ORDER BY count DESC
LIMIT 50;
```

## Testing the Fix

### 1. Run a Fresh Harvest
```bash
# In jobcurator
npm run dev
# Click "RUN GLOBAL HARVEST"
# Then click "SYNC X ROLES"
```

### 2. Verify Location Data
Check the console logs during harvest:
```
✅ Bangalore jobs will show: { city: 'Bangalore', country: 'India', isRemote: false }
✅ San Francisco jobs will show: { city: 'San Francisco', country: 'United States', isRemote: false }
✅ Remote jobs will show: { city: 'Remote', country: 'Global', isRemote: true }
```

### 3. Check Database
```sql
SELECT title, location_city, location_country, company_id
FROM jobs
WHERE location_city ILIKE '%bangalore%'
LIMIT 10;
```

Should show:
```
Site Reliability Engineer 2 - Netops | Bangalore | India | phonepe_id
```

## Location Format Examples

| Input from API | Parsed City | Parsed Country | Display |
|----------------|-------------|----------------|----------|
| "Bangalore, India" | Bangalore | India | Bangalore, India |
| "Bangalore" | Bangalore | India | Bangalore, India |
| "San Francisco, CA" | San Francisco | United States | San Francisco, United States |
| "London, UK" | London | United Kingdom | London, United Kingdom |
| "Remote" | Remote | Global | Remote |
| "Singapore" | Singapore | Singapore | Singapore, Singapore |

## Next Steps

1. **Run the SQL migration** to fix existing data
2. **Re-run harvest** to get fresh data with correct locations
3. **Deploy to production** (both jobcurator and acrossjobs)
4. **Clear Cloudflare cache** to see the changes

## Future Enhancements

### Add More Cities
Edit `services/locationService.ts` to add more cities:
```typescript
private static readonly INDIAN_CITIES = new Set([
  'bangalore', 'bengaluru', 'mumbai', // ... add more
  'your-city-here'
]);
```

### Add State/Province Support
The system already extracts state information:
```typescript
{ city: 'San Francisco', country: 'United States', state: 'CA' }
```

### Add Multi-Location Jobs
For jobs with multiple locations, you can extend the logic to store arrays.

## Troubleshooting

### Issue: Job still shows wrong country
**Solution**: The city might not be in our database. Add it to LocationService.

### Issue: New harvest doesn't fix old jobs
**Solution**: Harvest only adds new jobs. Run the SQL migration for existing data.

### Issue: Remote jobs showing as "Global"
**Solution**: This is correct! "Global" indicates remote jobs accessible worldwide.

## Files Modified

- ✅ `services/locationService.ts` (new file)
- ✅ `services/atsService.ts` (updated)
- ✅ `App.tsx` (updated)
- ✅ `types.ts` (unchanged, already has location_country field)

## Commits

1. [c6584c2](https://github.com/Anuj472/jobcurator/commit/c6584c2f58000c98973e0040a07d89adfd1d7600) - Add location service
2. [89afec7](https://github.com/Anuj472/jobcurator/commit/89afec75ed61e2325da6435d39967244e3461a5a) - Update ATS normalization
3. [b016cbd](https://github.com/Anuj472/jobcurator/commit/b016cbd9bf4abe37ab2e2dcf6cfc438ec57bcec4) - Fix hardcoded fallback
