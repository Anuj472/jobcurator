# Companies Cleanup Guide

## Companies to Remove (Unsupported ATS)

These companies use ATS platforms that don't have public JSON APIs. They should be removed from your harvest list or integrated via alternative methods (like RapidAPI JSearch).

### ❌ Workday Companies (No Public API)

**Remove these from constants.ts:**

```typescript
// REMOVE - Uses Workday (No free API available)
// { name: "Uber", identifier: "uber", platform: AtsPlatform.GREENHOUSE },
// { name: "Salesforce", identifier: "salesforce", platform: AtsPlatform.GREENHOUSE },
// { name: "Snowflake", identifier: "snowflake", platform: AtsPlatform.GREENHOUSE },
```

**Why they fail:**
- Workday uses a complex authentication system
- No public JSON API endpoints
- Requires login credentials or OAuth
- Data is rendered client-side via JavaScript

### ❌ Consulting Firms (Taleo/iCIMS)

**Remove these from constants.ts:**

```typescript
// REMOVE - Use Taleo/iCIMS (No public API)
// { name: "KPMG", identifier: "kpmg", platform: AtsPlatform.LEVER },
// { name: "McKinsey", identifier: "mckinsey", platform: AtsPlatform.LEVER },
// { name: "BCG", identifier: "bcg", platform: AtsPlatform.LEVER },
// { name: "Bain", identifier: "bain", platform: AtsPlatform.LEVER },
// { name: "Deloitte Digital", identifier: "deloittedigital", platform: AtsPlatform.LEVER },
```

**Why they fail:**
- Use enterprise ATS (Taleo, iCIMS, Oracle)
- No public APIs
- Heavy bot protection
- Require complex scraping

### ⚠️ Indian Companies (Mixed Results)

Some Indian startups may not have public APIs or may block automated requests:

```typescript
// HIGH RISK - May not work or may be empty
// { name: "Zomato", identifier: "zomato", platform: AtsPlatform.GREENHOUSE },
// { name: "Ola", identifier: "ola", platform: AtsPlatform.GREENHOUSE },
// { name: "Cred", identifier: "cred", platform: AtsPlatform.GREENHOUSE },
// { name: "Meesho", identifier: "meesho", platform: AtsPlatform.GREENHOUSE },
// { name: "Zerodha", identifier: "zerodha", platform: AtsPlatform.GREENHOUSE },
```

**Recommendation:**
- Test each one individually
- Keep only those that return jobs consistently
- Remove those returning 0 jobs for 3+ consecutive harvests

## Companies with Corrected Identifiers

### ✅ Fixed Greenhouse Identifiers

These had wrong slugs and are now corrected in your constants.ts:

| Company | Old ID | Correct ID | Status |
|---------|--------|------------|--------|
| Datadog | datadog | datadoghq | ✅ Fixed |
| Square | square | squareup | ✅ Fixed |
| DoorDash | doordash | doordash | ✅ Should work |
| Wayfair | wayfair | wayfair | ✅ Should work |
| ClickUp | clickup | clickup | ✅ Should work |
| Ramp | ramp | ramp | ✅ Should work |

### ✅ Companies Already Using Correct Platform

These were already correctly configured:

**Lever Companies:**
- Figma, Netflix, Atlassian, Canva, Palantir
- Shopify, Docusign, Yelp, Box, Eventbrite

**Ashby Companies:**
- Notion, Deel, Rippling, Linear, Vanta
- OpenAI, Anthropic, Perplexity, Scale AI

## Recommended Clean Constants File

Create a new `constants-clean.ts` with only working companies:

```typescript
import { AtsPlatform } from './types';

export const WORKING_COMPANIES = [
  // ========== VERIFIED GREENHOUSE COMPANIES ==========
  { name: "Airbnb", identifier: "airbnb", platform: AtsPlatform.GREENHOUSE },
  { name: "Stripe", identifier: "stripe", platform: AtsPlatform.GREENHOUSE },
  { name: "Twitch", identifier: "twitch", platform: AtsPlatform.GREENHOUSE },
  { name: "GitLab", identifier: "gitlab", platform: AtsPlatform.GREENHOUSE },
  { name: "Pinterest", identifier: "pinterest", platform: AtsPlatform.GREENHOUSE },
  { name: "Robinhood", identifier: "robinhood", platform: AtsPlatform.GREENHOUSE },
  { name: "Coinbase", identifier: "coinbase", platform: AtsPlatform.GREENHOUSE },
  { name: "Dropbox", identifier: "dropbox", platform: AtsPlatform.GREENHOUSE },
  { name: "Discord", identifier: "discord", platform: AtsPlatform.GREENHOUSE },
  { name: "Instacart", identifier: "instacart", platform: AtsPlatform.GREENHOUSE },
  { name: "Peloton", identifier: "peloton", platform: AtsPlatform.GREENHOUSE },
  { name: "Roku", identifier: "roku", platform: AtsPlatform.GREENHOUSE },
  { name: "SoFi", identifier: "sofi", platform: AtsPlatform.GREENHOUSE },
  { name: "Okta", identifier: "okta", platform: AtsPlatform.GREENHOUSE },
  { name: "Brex", identifier: "brex", platform: AtsPlatform.GREENHOUSE },
  { name: "Databricks", identifier: "databricks", platform: AtsPlatform.GREENHOUSE },
  { name: "Gusto", identifier: "gusto", platform: AtsPlatform.GREENHOUSE },
  { name: "Twilio", identifier: "twilio", platform: AtsPlatform.GREENHOUSE },
  { name: "Cloudflare", identifier: "cloudflare", platform: AtsPlatform.GREENHOUSE },
  { name: "Asana", identifier: "asana", platform: AtsPlatform.GREENHOUSE },
  { name: "Duolingo", identifier: "duolingo", platform: AtsPlatform.GREENHOUSE },
  { name: "Vercel", identifier: "vercel", platform: AtsPlatform.GREENHOUSE },
  { name: "Reddit", identifier: "reddit", platform: AtsPlatform.GREENHOUSE },
  { name: "Lyft", identifier: "lyft", platform: AtsPlatform.GREENHOUSE },
  { name: "Udemy", identifier: "udemy", platform: AtsPlatform.GREENHOUSE },
  { name: "Datadog", identifier: "datadoghq", platform: AtsPlatform.GREENHOUSE }, // Fixed!
  { name: "Square", identifier: "squareup", platform: AtsPlatform.GREENHOUSE }, // Fixed!
  { name: "Postman", identifier: "postman", platform: AtsPlatform.GREENHOUSE },
  { name: "Mercury", identifier: "mercury", platform: AtsPlatform.GREENHOUSE },
  { name: "Chime", identifier: "chime", platform: AtsPlatform.GREENHOUSE },
  { name: "Affirm", identifier: "affirm", platform: AtsPlatform.GREENHOUSE },
  { name: "Gemini", identifier: "gemini", platform: AtsPlatform.GREENHOUSE },
  { name: "Marqeta", identifier: "marqeta", platform: AtsPlatform.GREENHOUSE },
  { name: "Amplitude", identifier: "amplitude", platform: AtsPlatform.GREENHOUSE },
  { name: "Mixpanel", identifier: "mixpanel", platform: AtsPlatform.GREENHOUSE },
  { name: "Intercom", identifier: "intercom", platform: AtsPlatform.GREENHOUSE },
  { name: "Airtable", identifier: "airtable", platform: AtsPlatform.GREENHOUSE },
  { name: "HubSpot", identifier: "hubspot", platform: AtsPlatform.GREENHOUSE },

  // ========== WORKING INDIAN COMPANIES ==========
  { name: "PhonePe", identifier: "phonepe", platform: AtsPlatform.GREENHOUSE },
  { name: "Groww", identifier: "groww", platform: AtsPlatform.GREENHOUSE },
  { name: "InMobi", identifier: "inmobi", platform: AtsPlatform.GREENHOUSE },
  // Test these individually - remove if they consistently return 0:
  // { name: "Swiggy", identifier: "swiggy", platform: AtsPlatform.GREENHOUSE },
  // { name: "Razorpay", identifier: "razorpay", platform: AtsPlatform.GREENHOUSE },
  // { name: "Freshworks", identifier: "freshworks", platform: AtsPlatform.GREENHOUSE },
  // { name: "BrowserStack", identifier: "browserstack", platform: AtsPlatform.GREENHOUSE },
  // { name: "Chargebee", identifier: "chargebee", platform: AtsPlatform.GREENHOUSE },

  // ========== VERIFIED LEVER COMPANIES ==========
  { name: "Figma", identifier: "figma", platform: AtsPlatform.LEVER },
  { name: "Netflix", identifier: "netflix", platform: AtsPlatform.LEVER },
  { name: "Atlassian", identifier: "atlassian", platform: AtsPlatform.LEVER },
  { name: "Canva", identifier: "canva", platform: AtsPlatform.LEVER },
  { name: "Palantir", identifier: "palantir", platform: AtsPlatform.LEVER },
  { name: "Shopify", identifier: "shopify", platform: AtsPlatform.LEVER },
  { name: "Docusign", identifier: "docusign", platform: AtsPlatform.LEVER },
  { name: "Yelp", identifier: "yelp", platform: AtsPlatform.LEVER },
  { name: "Box", identifier: "box", platform: AtsPlatform.LEVER },
  { name: "Eventbrite", identifier: "eventbrite", platform: AtsPlatform.LEVER },
  // Test these:
  // { name: "Udacity", identifier: "udacity", platform: AtsPlatform.LEVER },
  // { name: "Evernote", identifier: "evernote", platform: AtsPlatform.LEVER },
  // { name: "Zepto", identifier: "zepto", platform: AtsPlatform.LEVER },

  // ========== VERIFIED ASHBY COMPANIES ==========
  { name: "Notion", identifier: "notion", platform: AtsPlatform.ASHBY },
  { name: "Deel", identifier: "deel", platform: AtsPlatform.ASHBY },
  { name: "Rippling", identifier: "rippling", platform: AtsPlatform.ASHBY },
  { name: "Linear", identifier: "linear", platform: AtsPlatform.ASHBY },
  { name: "Vanta", identifier: "vanta", platform: AtsPlatform.ASHBY },
  { name: "Remote.com", identifier: "remote", platform: AtsPlatform.ASHBY },
  { name: "OpenAI", identifier: "openai", platform: AtsPlatform.ASHBY },
  { name: "Anthropic", identifier: "anthropic", platform: AtsPlatform.ASHBY },
  { name: "Perplexity", identifier: "perplexity", platform: AtsPlatform.ASHBY },
  { name: "Scale AI", identifier: "scale", platform: AtsPlatform.ASHBY },
];
```

## Testing Strategy

### Phase 1: Test Core Companies
Run harvest with only these proven companies:
- Stripe, Airbnb, GitLab (Greenhouse)
- Figma, Netflix (Lever)
- Notion, Deel (Ashby)

Expected: 2,000+ jobs

### Phase 2: Add Questionable Companies
Test in small batches:
1. DoorDash, Wayfair, ClickUp
2. Indian companies (PhonePe, Groww, etc.)
3. Media companies (BuzzFeed, Vice, NYT)

### Phase 3: Remove Failures
After 3 harvest runs, remove any company that:
- Returns 0 jobs consistently
- Returns errors
- Times out regularly

## Alternative: RapidAPI JSearch

For companies that don't work via ATS APIs, consider using JSearch:

```typescript
// Add to your harvest script
import axios from 'axios';

async function fetchViaJSearch(companyName: string) {
  const options = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: {
      query: `${companyName} jobs`,
      page: '1',
      num_pages: '1'
    },
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };
  
  const response = await axios.request(options);
  return response.data.data; // Array of jobs
}
```

**Use JSearch for:**
- Uber, Salesforce, Snowflake
- KPMG, McKinsey, BCG, Bain
- Any company returning 0 jobs via ATS

## Next Steps

1. ✅ Update `constants.ts` - Comment out problematic companies
2. 🧪 Test with small batch (10 companies)
3. 📈 Monitor harvest results
4. 🗑️ Remove consistent failures
5. 🔄 Expand to full list once stable

---

**Last Updated**: February 1, 2026  
**Status**: Ready for Implementation
