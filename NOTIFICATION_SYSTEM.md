# 📧 Job Notification System - Complete Design

## 🎯 Overview

Automatic email notifications when new jobs matching user preferences are posted.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY HARVEST (12 PM IST)                    │
│  1. Fetch jobs from ATS                                         │
│  2. Insert new jobs to database                                 │
│  3. Trigger notification matcher ⭐                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│              NOTIFICATION MATCHER (New Script)                  │
│  1. Get jobs created in last 24 hours                           │
│  2. Get all active subscriptions                                │
│  3. Match jobs with user preferences                            │
│  4. Group matches by user                                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                EMAIL SENDER (Resend API)                        │
│  For each user with matches:                                    │
│    - Build personalized email                                   │
│    - Include all matching jobs                                  │
│    - Send via Resend                                            │
│    - Log notification sent                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### **1. `job_subscriptions` Table**

```sql
CREATE TABLE job_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Job preferences
  categories TEXT[] DEFAULT NULL,  -- ['it', 'sales'], NULL = all
  locations TEXT[] DEFAULT NULL,   -- ['Remote', 'San Francisco'], NULL = all
  job_types TEXT[] DEFAULT NULL,   -- ['Remote', 'Hybrid'], NULL = all
  experience_levels TEXT[] DEFAULT NULL,  -- ['Entry Level', 'Internship'], NULL = all
  keywords TEXT[] DEFAULT NULL,    -- ['Python', 'React'], NULL = any
  
  -- Notification settings
  frequency TEXT DEFAULT 'daily',  -- 'instant', 'daily', 'weekly'
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_notified_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, email)
);

CREATE INDEX idx_subscriptions_active ON job_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_subscriptions_frequency ON job_subscriptions(frequency) WHERE is_active = true;
```

### **2. `notification_logs` Table**

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES job_subscriptions(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  job_ids UUID[] NOT NULL,  -- Array of job IDs sent
  job_count INTEGER NOT NULL,
  status TEXT DEFAULT 'sent',  -- 'sent', 'failed', 'bounced'
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(subscription_id, sent_at::DATE)  -- One notification per day per subscription
);

CREATE INDEX idx_notification_logs_sent ON notification_logs(sent_at);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
```

---

## 🔍 Matching Algorithm

### **Pseudo Code:**

```typescript
function matchJobsWithSubscription(job: Job, subscription: Subscription): boolean {
  // Category match
  if (subscription.categories && subscription.categories.length > 0) {
    if (!subscription.categories.includes(job.category)) {
      return false;
    }
  }
  
  // Location match (city OR country OR job type)
  if (subscription.locations && subscription.locations.length > 0) {
    const jobLocationStr = `${job.location_city} ${job.location_country}`.toLowerCase();
    const matchesLocation = subscription.locations.some(loc => 
      jobLocationStr.includes(loc.toLowerCase())
    );
    if (!matchesLocation) return false;
  }
  
  // Job type match (Remote, Hybrid, On-site)
  if (subscription.job_types && subscription.job_types.length > 0) {
    if (!subscription.job_types.includes(job.job_type)) {
      return false;
    }
  }
  
  // Experience level match
  if (subscription.experience_levels && subscription.experience_levels.length > 0) {
    if (!subscription.experience_levels.includes(job.experience_level)) {
      return false;
    }
  }
  
  // Keyword match (title OR description)
  if (subscription.keywords && subscription.keywords.length > 0) {
    const jobText = `${job.title} ${job.description}`.toLowerCase();
    const matchesKeyword = subscription.keywords.some(kw => 
      jobText.includes(kw.toLowerCase())
    );
    if (!matchesKeyword) return false;
  }
  
  return true;  // All filters passed!
}
```

---

## 📧 Email Template

### **Subject Line:**
```
🎯 {count} New {category} Jobs Matching Your Criteria
```

### **Email Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
    .job-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .job-title { font-size: 18px; font-weight: bold; color: #1F2937; margin-bottom: 8px; }
    .job-meta { color: #6B7280; font-size: 14px; margin-bottom: 12px; }
    .job-badge { display: inline-block; background: #EEF2FF; color: #4F46E5; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-right: 8px; }
    .apply-btn { background: #4F46E5; color: white; padding: 10px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 8px; }
    .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Jobs for You!</h1>
      <p>We found {count} new jobs matching your preferences</p>
    </div>
    
    <!-- Repeat for each job -->
    <div class="job-card">
      <div class="job-title">{job.title}</div>
      <div class="job-meta">
        <strong>{company.name}</strong> • {job.location_city}, {job.location_country}
      </div>
      <div>
        <span class="job-badge">{job.category}</span>
        <span class="job-badge">{job.job_type}</span>
        <span class="job-badge">{job.experience_level}</span>
      </div>
      <a href="{job.apply_link}" class="apply-btn">Apply Now →</a>
    </div>
    <!-- End repeat -->
    
    <div class="footer">
      <p>You're receiving this because you subscribed to job alerts on acrossjobs.</p>
      <p>
        <a href="{unsubscribe_link}">Unsubscribe</a> | 
        <a href="{manage_preferences_link}">Manage Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 🔧 Implementation Files

### **File Structure:**

```
jobcurator/
├── scripts/
│   ├── harvest.ts                    # Existing
│   ├── send-notifications.ts         # NEW ⭐
│   └── match-jobs.ts                 # NEW ⭐
├── services/
│   ├── emailService.ts               # NEW ⭐
│   └── notificationMatcher.ts        # NEW ⭐
├── templates/
│   └── job-notification-email.html   # NEW ⭐
└── types.ts                          # Update

acrossjobs/
├── pages/
│   └── SubscriptionsPage.tsx         # NEW ⭐
├── components/
│   └── SubscriptionForm.tsx          # NEW ⭐
└── hooks/
    └── useSubscriptions.ts           # NEW ⭐
```

---

## 🚀 Step-by-Step Implementation

### **Phase 1: Database Setup**

1. Create subscription tables in Supabase
2. Set up Row Level Security (RLS)
3. Create helper functions

### **Phase 2: Notification Matching**

1. Create `notificationMatcher.ts`
2. Implement matching algorithm
3. Test with sample data

### **Phase 3: Email Integration**

1. Sign up for [Resend](https://resend.com) (free tier: 100 emails/day)
2. Create `emailService.ts`
3. Design email template
4. Test email sending

### **Phase 4: Automation**

1. Create `send-notifications.ts` script
2. Update GitHub Actions workflow
3. Add notification step after harvest

### **Phase 5: Frontend**

1. Create subscription UI in acrossjobs
2. Add "Subscribe to Alerts" button
3. Manage subscription preferences page

---

## 📝 Example Subscription Flow

### **User Creates Subscription:**

```typescript
const subscription = {
  user_id: 'user-123',
  email: 'user@example.com',
  categories: ['it', 'research-development'],
  locations: ['Remote', 'San Francisco'],
  job_types: ['Remote', 'Hybrid'],
  experience_levels: ['Entry Level', 'Internship'],
  keywords: ['Python', 'Machine Learning', 'AI'],
  frequency: 'daily',
  is_active: true
};
```

### **Daily Harvest (12 PM IST):**

1. Harvest finds 50 new jobs
2. Notification matcher runs
3. Finds 5 jobs matching user's preferences:
   - "ML Engineering Intern" (IT, Remote, Internship) ✅
   - "Python Developer" (IT, San Francisco, Entry Level) ✅
   - "AI Research Associate" (R&D, Remote, Entry Level) ✅
   - "Senior Data Scientist" (IT, Remote, Senior) ❌ (wrong level)
   - "Marketing Manager" (Marketing, Remote, Mid) ❌ (wrong category)

4. Email sent with 3 matching jobs

### **Notification Log Created:**

```typescript
{
  subscription_id: 'sub-456',
  user_email: 'user@example.com',
  job_ids: ['job-1', 'job-2', 'job-3'],
  job_count: 3,
  status: 'sent',
  sent_at: '2026-02-01T12:05:00Z'
}
```

---

## ⚙️ Notification Frequencies

### **1. Instant** (Advanced)
- Trigger: New job inserted
- Use: Supabase Database Webhooks
- Send: Within 5 minutes

### **2. Daily** (Recommended)
- Trigger: After harvest completes
- Time: 12:10 PM IST daily
- Send: Digest of all new jobs from last 24h

### **3. Weekly**
- Trigger: GitHub Actions cron (Sundays)
- Time: Sunday 10 AM IST
- Send: Digest of all jobs from last 7 days

---

## 🔐 Security & Privacy

### **Unsubscribe Link:**
```
https://acrossjobs.com/unsubscribe?token={encrypted_subscription_id}
```

### **Email Verification:**
- Send confirmation email when user subscribes
- Require click to activate subscription
- Prevent spam

### **Rate Limiting:**
- Max 1 email per subscription per day
- Max 10 subscriptions per user
- Prevent abuse

---

## 📊 Analytics

### **Track:**
- Email open rate (via Resend)
- Click-through rate (UTM parameters)
- Unsubscribe rate
- Most popular preferences

### **Dashboard Metrics:**
```sql
-- Active subscriptions
SELECT COUNT(*) FROM job_subscriptions WHERE is_active = true;

-- Emails sent today
SELECT COUNT(*) FROM notification_logs WHERE sent_at::DATE = CURRENT_DATE;

-- Average jobs per notification
SELECT AVG(job_count) FROM notification_logs;

-- Popular categories
SELECT category, COUNT(*) 
FROM job_subscriptions, unnest(categories) AS category 
GROUP BY category 
ORDER BY COUNT(*) DESC;
```

---

## 🧪 Testing Strategy

### **1. Unit Tests:**
- Test matching algorithm with edge cases
- Test email template rendering

### **2. Integration Tests:**
- Create test subscription
- Insert test job
- Verify match detected
- Verify email sent

### **3. Manual Test:**
```bash
# Add your email as test subscriber
npm run test:notification -- --email your@email.com
```

---

## 💰 Cost Estimation

### **Email Provider (Resend):**
- Free tier: 100 emails/day (3,000/month)
- Paid: $20/month for 50,000 emails

### **Expected Usage:**
- 100 active subscriptions
- 30% get daily notifications
- ~30 emails/day

**Result: FREE tier sufficient for MVP!** ✅

---

## 🚀 Quick Start (Next Steps)

1. **Set up database tables** (I'll create SQL)
2. **Integrate Resend API** (I'll create emailService.ts)
3. **Build notification matcher** (I'll create matcher logic)
4. **Update harvest workflow** (Add notification step)
5. **Create frontend UI** (Subscription form in acrossjobs)

---

## 📚 Additional Features (Future)

- 📱 SMS notifications (Twilio)
- 🔔 In-app notifications
- 📊 Notification preferences analytics
- 🎯 AI-powered job recommendations
- 💬 Slack/Discord integration
- 📅 Custom schedule (e.g., Mon/Wed/Fri only)

---

**Ready to implement?** Let me know and I'll create all the code! 🚀
