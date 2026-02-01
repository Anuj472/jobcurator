# 🚀 SEO & Sitemap Setup Guide for AcrossJob.com

## 🎯 The Problem You're Solving

Google only knows about pages listed in your sitemap. If your sitemap only contains static pages (Home, About, Contact), Google will **never discover your 26,500+ job listings**.

### ❌ What You Had Before
- No sitemap.xml
- Google can't find job pages like `acrossjob.com/job/airbnb-software-engineer-abc123`
- Zero organic traffic to job listings
- Wasted SEO potential

### ✅ What You Have Now
- **Dynamic sitemap generator** that pulls all jobs from Supabase
- **Automatic robots.txt** that points crawlers to your sitemap
- **26,500+ URLs** ready for Google indexing
- **SEO-optimized** URL structure with proper priorities

---

## 📂 Files Created

### 1. `scripts/generateSitemap.ts`
Automatic sitemap generator that:
- ✅ Fetches all active jobs from Supabase
- ✅ Fetches all company pages
- ✅ Generates proper XML with priorities and change frequencies
- ✅ Creates URLs for:
  - Homepage (priority 1.0)
  - Category pages (priority 0.9)
  - Company pages (priority 0.8)
  - **Job pages (priority 0.7)** ← Most important!
  - Static pages (priority 0.5)

### 2. `public/robots.txt`
Tells search engines:
- Where to find your sitemap
- What they can/can't crawl
- Proper crawl delay

---

## 🔧 Setup Instructions

### Step 1: Install Dependencies

You'll need `tsx` to run TypeScript directly:

```bash
npm install -D tsx
```

### Step 2: Add Sitemap Script to package.json

Add this to your `scripts` section:

```json
{
  "scripts": {
    "generate:sitemap": "tsx scripts/generateSitemap.ts",
    "build": "npm run generate:sitemap && vite build"
  }
}
```

### Step 3: Generate Your First Sitemap

```bash
npm run generate:sitemap
```

You should see output like:

```
🚀 SITEMAP GENERATOR FOR ACROSSJOB.COM
============================================================
📥 Fetching active jobs from Supabase...
   ✅ Found 117 active companies
   ✅ Found 26,543 active jobs

🔨 Generating sitemap XML...
   ✅ Generated 26,672 URLs
   ✅ Sitemap written to: /path/to/public/sitemap.xml

============================================================
📊 SITEMAP SUMMARY
============================================================
   Homepage:        1 URL
   Categories:      7 URLs
   Companies:       117 URLs
   Jobs:            26,543 URLs
   Static pages:    4 URLs
   ────────────────────────────
   TOTAL:           26,672 URLs
============================================================

✅ Sitemap generation complete!
```

### Step 4: Verify Your Sitemap

After deploying, check:

1. **Sitemap URL**: https://acrossjob.com/sitemap.xml
2. **Robots URL**: https://acrossjob.com/robots.txt

Your sitemap should look like:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://acrossjob.com</loc>
    <lastmod>2026-02-01T16:00:00Z</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>https://acrossjob.com/job/airbnb-software-engineer-abc123</loc>
    <lastmod>2026-02-01T14:30:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <!-- 26,670+ more URLs... -->
</urlset>
```

---

## 🤖 Automate Sitemap Generation

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/sitemap.yml`:

```yaml
name: Generate Sitemap

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger
  push:
    branches:
      - main
    paths:
      - 'scripts/generateSitemap.ts'

jobs:
  generate-sitemap:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate sitemap
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run generate:sitemap
      
      - name: Commit & Push
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add public/sitemap.xml
          git commit -m "chore: update sitemap [skip ci]" || echo "No changes"
          git push
```

### Option B: Vercel Build Hook

If using Vercel, add to `vercel.json`:

```json
{
  "buildCommand": "npm run generate:sitemap && npm run build",
  "crons": [
    {
      "path": "/api/generate-sitemap",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 📊 Submit to Google Search Console

### Step 1: Add Your Site
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property"
3. Enter: `https://acrossjob.com`
4. Verify ownership (DNS, HTML file, or Google Analytics)

### Step 2: Submit Sitemap
1. In Search Console, go to **Sitemaps** (left sidebar)
2. Enter: `https://acrossjob.com/sitemap.xml`
3. Click **Submit**

### Step 3: Monitor Indexing

Within 24-48 hours, you should see:
- ✅ "Sitemap successfully processed"
- ✅ "26,672 URLs discovered"
- ✅ URLs starting to appear in Google index

Check coverage:
```
Pages → Indexing → Page indexing
```

You should see your job pages being indexed.

---

## 🔍 SEO Best Practices

### 1. Dynamic Page Titles & Meta Tags

Make sure each job page has:

```tsx
// In your job page component
<Helmet>
  <title>{job.title} at {company.name} - AcrossJob</title>
  <meta name="description" content={`Apply for ${job.title} at ${company.name}. ${job.location}. ${job.category}.`} />
  <meta property="og:title" content={`${job.title} at ${company.name}`} />
  <meta property="og:description" content={job.description?.slice(0, 150)} />
  <meta property="og:url" content={`https://acrossjob.com/job/${jobSlug}`} />
  <link rel="canonical" href={`https://acrossjob.com/job/${jobSlug}`} />
</Helmet>
```

### 2. Structured Data (JSON-LD)

Add JobPosting schema to each job page:

```tsx
<script type="application/ld+json">
  {JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.created_at,
    "validThrough": job.expires_at,
    "employmentType": job.type,
    "hiringOrganization": {
      "@type": "Organization",
      "name": company.name,
      "sameAs": company.website
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location_city,
        "addressCountry": job.location_country
      }
    }
  })}
</script>
```

This makes your jobs eligible for **Google Jobs listings**!

### 3. Internal Linking

Link between:
- Job pages → Company pages
- Job pages → Category pages
- Similar jobs → Related jobs

Example:
```tsx
<a href={`/company/${company.slug}`}>More jobs at {company.name}</a>
<a href={`/jobs?category=${job.category}`}>More {job.category} jobs</a>
```

---

## 📈 Expected Results

### Week 1-2: Indexing
- Google starts crawling your sitemap
- Job pages begin appearing in Search Console
- 5,000-10,000 pages indexed

### Month 1: Initial Traffic
- 500-1,000 impressions/day
- 10-50 clicks/day
- Long-tail keywords start ranking

### Month 3: Growth
- 5,000-10,000 impressions/day
- 100-500 clicks/day
- Company names + job titles ranking

### Month 6: Established
- 20,000+ impressions/day
- 500-2,000 clicks/day
- Ranking for competitive terms
- Featured in Google Jobs

---

## 🐛 Troubleshooting

### Problem: Sitemap not accessible

**Check:**
```bash
curl https://acrossjob.com/sitemap.xml
```

If 404, ensure:
- File is in `public/` directory
- Vercel/hosting serves static files from `public/`
- No routing conflicts

### Problem: "Sitemap is HTML"

**Fix:** Make sure your server sends correct `Content-Type`:

Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/sitemap.xml",
      "headers": [
        { "key": "Content-Type", "value": "application/xml" }
      ]
    }
  ]
}
```

### Problem: Jobs not being indexed

**Possible causes:**
1. Sitemap not submitted to Search Console
2. Pages returning 404 (fix routing)
3. Content is too thin (add more job details)
4. Duplicate content (use canonical tags)
5. Robots.txt blocking crawlers

**Debug:**
```bash
# Test a specific URL
curl -A "Googlebot" https://acrossjob.com/job/airbnb-software-engineer-abc123
```

---

## ✅ Checklist

- [ ] Install `tsx`: `npm install -D tsx`
- [ ] Add sitemap script to `package.json`
- [ ] Run: `npm run generate:sitemap`
- [ ] Verify: https://acrossjob.com/sitemap.xml
- [ ] Verify: https://acrossjob.com/robots.txt
- [ ] Set up GitHub Actions for auto-generation
- [ ] Add sitemap to Google Search Console
- [ ] Add structured data (JSON-LD) to job pages
- [ ] Add dynamic meta tags to job pages
- [ ] Set up internal linking
- [ ] Monitor indexing in Search Console

---

## 🎉 Success Metrics

Track these in Google Search Console:

| Metric | Target (Month 3) |
|--------|------------------|
| **Indexed Pages** | 20,000+ |
| **Impressions/day** | 10,000+ |
| **Clicks/day** | 200+ |
| **CTR** | 2%+ |
| **Avg Position** | <30 |

---

## 📚 Resources

- [Google Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Search Central](https://developers.google.com/search)
- [JobPosting Schema](https://schema.org/JobPosting)
- [Google Jobs Guidelines](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

---

**🚀 Your 26,500+ job pages are now ready for Google!**

Run `npm run generate:sitemap` and deploy to see your site explode in search results.
