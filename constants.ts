import { AtsPlatform } from './types';

export const INITIAL_COMPANIES = [
  // ========== TECH COMPANIES (IT + All Departments) ==========
  // GREENHOUSE - BIG TECH & HIGH GROWTH
  { name: "Airbnb", identifier: "airbnb", platform: AtsPlatform.GREENHOUSE },
  { name: "Stripe", identifier: "stripe", platform: AtsPlatform.GREENHOUSE },
  { name: "Twitch", identifier: "twitch", platform: AtsPlatform.GREENHOUSE },
  { name: "GitLab", identifier: "gitlab", platform: AtsPlatform.GREENHOUSE },
  { name: "DoorDash", identifier: "doordashsoftware", platform: AtsPlatform.GREENHOUSE }, // Fixed!
  { name: "Pinterest", identifier: "pinterest", platform: AtsPlatform.GREENHOUSE },
  { name: "Robinhood", identifier: "robinhood", platform: AtsPlatform.GREENHOUSE },
  { name: "Coinbase", identifier: "coinbase", platform: AtsPlatform.GREENHOUSE },
  { name: "Dropbox", identifier: "dropbox", platform: AtsPlatform.GREENHOUSE },
  { name: "Discord", identifier: "discord", platform: AtsPlatform.GREENHOUSE },
  { name: "Instacart", identifier: "instacart", platform: AtsPlatform.GREENHOUSE },
  { name: "Peloton", identifier: "peloton", platform: AtsPlatform.GREENHOUSE },
  { name: "Roku", identifier: "roku", platform: AtsPlatform.GREENHOUSE },
  { name: "Wayfair", identifier: "wayfair", platform: AtsPlatform.GREENHOUSE },
  { name: "SoFi", identifier: "sofi", platform: AtsPlatform.GREENHOUSE },
  { name: "Okta", identifier: "okta", platform: AtsPlatform.GREENHOUSE },
  { name: "Brex", identifier: "brex", platform: AtsPlatform.GREENHOUSE },
  { name: "Plaid", identifier: "plaid", platform: AtsPlatform.GREENHOUSE },
  { name: "Databricks", identifier: "databricks", platform: AtsPlatform.GREENHOUSE },
  { name: "Gusto", identifier: "gusto", platform: AtsPlatform.GREENHOUSE },
  { name: "HashiCorp", identifier: "hashicorp", platform: AtsPlatform.GREENHOUSE },
  { name: "Twilio", identifier: "twilio", platform: AtsPlatform.GREENHOUSE },
  { name: "Cloudflare", identifier: "cloudflare", platform: AtsPlatform.GREENHOUSE },
  { name: "Asana", identifier: "asana", platform: AtsPlatform.GREENHOUSE },
  { name: "Duolingo", identifier: "duolingo", platform: AtsPlatform.GREENHOUSE },
  { name: "Vercel", identifier: "vercel", platform: AtsPlatform.GREENHOUSE },
  { name: "Reddit", identifier: "reddit", platform: AtsPlatform.GREENHOUSE },
  { name: "Lyft", identifier: "lyft", platform: AtsPlatform.GREENHOUSE },
  { name: "Udemy", identifier: "udemy", platform: AtsPlatform.GREENHOUSE },
  { name: "Datadog", identifier: "datadoghq", platform: AtsPlatform.GREENHOUSE },
  { name: "Zoom", identifier: "zoom", platform: AtsPlatform.GREENHOUSE },
  { name: "Square", identifier: "squareup", platform: AtsPlatform.GREENHOUSE },
  { name: "ClickUp", identifier: "clickup", platform: AtsPlatform.GREENHOUSE },
  { name: "Postman", identifier: "postman", platform: AtsPlatform.GREENHOUSE },

  // ========== NEW VERIFIED GREENHOUSE COMPANIES ==========
  { name: "SpaceX", identifier: "spacex", platform: AtsPlatform.GREENHOUSE },
  { name: "Warby Parker", identifier: "warbyparker", platform: AtsPlatform.GREENHOUSE },
  { name: "Snyk", identifier: "snyk", platform: AtsPlatform.GREENHOUSE },
  { name: "Revolut", identifier: "revolut", platform: AtsPlatform.GREENHOUSE },
  { name: "Klarna", identifier: "klarna", platform: AtsPlatform.GREENHOUSE },
  { name: "HelloFresh", identifier: "hellofresh", platform: AtsPlatform.GREENHOUSE },
  { name: "Substack", identifier: "substack", platform: AtsPlatform.GREENHOUSE },
  { name: "SeatGeek", identifier: "seatgeek", platform: AtsPlatform.GREENHOUSE },
  { name: "Scribd", identifier: "scribd", platform: AtsPlatform.GREENHOUSE },
  { name: "ClassPass", identifier: "classpass", platform: AtsPlatform.GREENHOUSE },
  { name: "Foursquare", identifier: "foursquare", platform: AtsPlatform.GREENHOUSE },
  { name: "Vimeo", identifier: "vimeo", platform: AtsPlatform.GREENHOUSE },
  { name: "TripAdvisor", identifier: "tripadvisor", platform: AtsPlatform.GREENHOUSE },
  { name: "SurveyMonkey", identifier: "surveymonkey", platform: AtsPlatform.GREENHOUSE },
  { name: "InVision", identifier: "invision", platform: AtsPlatform.GREENHOUSE },
  { name: "Gannett", identifier: "gannett", platform: AtsPlatform.GREENHOUSE },
  { name: "Hearst", identifier: "hearst", platform: AtsPlatform.GREENHOUSE },
  { name: "TechStyle", identifier: "techstyle", platform: AtsPlatform.GREENHOUSE },
  { name: "Thumbtack", identifier: "thumbtack", platform: AtsPlatform.GREENHOUSE },
  { name: "Better.com", identifier: "better", platform: AtsPlatform.GREENHOUSE },
  { name: "Carta", identifier: "carta", platform: AtsPlatform.GREENHOUSE },
  { name: "ThoughtWorks", identifier: "thoughtworks", platform: AtsPlatform.GREENHOUSE },
  { name: "Myntra", identifier: "myntra", platform: AtsPlatform.GREENHOUSE },
  { name: "Canonical", identifier: "canonical", platform: AtsPlatform.GREENHOUSE },

  // ========== FINANCE & FINTECH (Finance, Compliance, Legal) ==========
  { name: "Ramp", identifier: "ramp", platform: AtsPlatform.GREENHOUSE },
  { name: "Mercury", identifier: "mercury", platform: AtsPlatform.GREENHOUSE },
  { name: "Chime", identifier: "chime", platform: AtsPlatform.GREENHOUSE },
  { name: "Affirm", identifier: "affirm", platform: AtsPlatform.GREENHOUSE },
  { name: "BlockFi", identifier: "blockfi", platform: AtsPlatform.GREENHOUSE },
  { name: "Gemini", identifier: "gemini", platform: AtsPlatform.GREENHOUSE },
  { name: "Marqeta", identifier: "marqeta", platform: AtsPlatform.GREENHOUSE },
  { name: "Checkout.com", identifier: "checkout", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN UNICORNS (All Departments) ==========
  { name: "Zomato", identifier: "zomato", platform: AtsPlatform.GREENHOUSE },
  { name: "Swiggy", identifier: "swiggy", platform: AtsPlatform.GREENHOUSE },
  { name: "PhonePe", identifier: "phonepe", platform: AtsPlatform.GREENHOUSE },
  { name: "Razorpay", identifier: "razorpay", platform: AtsPlatform.GREENHOUSE },
  { name: "Cred", identifier: "cred", platform: AtsPlatform.GREENHOUSE },
  { name: "Groww", identifier: "groww", platform: AtsPlatform.GREENHOUSE },
  { name: "Meesho", identifier: "meesho", platform: AtsPlatform.GREENHOUSE },
  { name: "Freshworks", identifier: "freshworks", platform: AtsPlatform.GREENHOUSE },
  { name: "InMobi", identifier: "inmobi", platform: AtsPlatform.GREENHOUSE },
  { name: "Ola", identifier: "ola", platform: AtsPlatform.GREENHOUSE },
  { name: "BrowserStack", identifier: "browserstack", platform: AtsPlatform.GREENHOUSE },
  { name: "Chargebee", identifier: "chargebee", platform: AtsPlatform.GREENHOUSE },
  { name: "Zerodha", identifier: "zerodha", platform: AtsPlatform.GREENHOUSE },

  // ========== NEW INDIAN FINTECH & BANKING ==========
  { name: "Navi", identifier: "navi", platform: AtsPlatform.GREENHOUSE },
  { name: "Jupiter", identifier: "jupiter", platform: AtsPlatform.GREENHOUSE },
  { name: "Slice", identifier: "slice", platform: AtsPlatform.GREENHOUSE },
  { name: "Smallcase", identifier: "smallcase", platform: AtsPlatform.GREENHOUSE },
  { name: "CoinSwitch", identifier: "coinswitch", platform: AtsPlatform.GREENHOUSE },
  { name: "Zeta", identifier: "zeta", platform: AtsPlatform.GREENHOUSE },
  { name: "Khatabook", identifier: "khatabook", platform: AtsPlatform.LEVER },
  { name: "FamPay", identifier: "fampay", platform: AtsPlatform.GREENHOUSE },
  { name: "Fi Money", identifier: "epifi", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN E-COMMERCE & DELIVERY ==========
  { name: "Zepto", identifier: "zepto", platform: AtsPlatform.LEVER },
  { name: "Spinny", identifier: "spinny", platform: AtsPlatform.LEVER },
  { name: "Cars24", identifier: "cars24", platform: AtsPlatform.GREENHOUSE },
  { name: "Lenskart", identifier: "lenskart", platform: AtsPlatform.GREENHOUSE },
  { name: "Tata 1mg", identifier: "1mg", platform: AtsPlatform.GREENHOUSE },
  { name: "Urban Company", identifier: "urbancompany", platform: AtsPlatform.LEVER },
  { name: "NoBroker", identifier: "nobroker", platform: AtsPlatform.GREENHOUSE },
  { name: "DealShare", identifier: "dealshare", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN SAAS & B2B (High Hiring Volume) ==========
  { name: "Hasura", identifier: "hasura", platform: AtsPlatform.GREENHOUSE },
  { name: "HackerRank", identifier: "hackerrank", platform: AtsPlatform.GREENHOUSE },
  { name: "MindTickle", identifier: "mindtickle", platform: AtsPlatform.GREENHOUSE },
  { name: "Whatfix", identifier: "whatfix", platform: AtsPlatform.GREENHOUSE },
  { name: "MoEngage", identifier: "moengage", platform: AtsPlatform.GREENHOUSE },
  { name: "CleverTap", identifier: "clevertap", platform: AtsPlatform.GREENHOUSE },
  { name: "Quizizz", identifier: "quizizz", platform: AtsPlatform.LEVER },
  { name: "Icertis", identifier: "icertis", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN EDTECH & GAMING ==========
  { name: "Unacademy", identifier: "unacademy", platform: AtsPlatform.LEVER },
  { name: "Dream11", identifier: "dreamsports", platform: AtsPlatform.GREENHOUSE },
  { name: "MPL", identifier: "mobilepremierleague", platform: AtsPlatform.GREENHOUSE },
  { name: "Games24x7", identifier: "games24x7", platform: AtsPlatform.GREENHOUSE },
  { name: "Teachmint", identifier: "teachmint", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN HEALTH & LIFESTYLE ==========
  { name: "Cure.fit", identifier: "curefit", platform: AtsPlatform.GREENHOUSE },
  { name: "Practo", identifier: "practo", platform: AtsPlatform.GREENHOUSE },
  { name: "Headspace", identifier: "headspace", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN MEDIA & SOCIAL ==========
  { name: "ShareChat", identifier: "sharechat", platform: AtsPlatform.LEVER },
  { name: "Glance", identifier: "glance", platform: AtsPlatform.GREENHOUSE },

  // ========== SALES & MARKETING FOCUSED ==========
  { name: "HubSpot", identifier: "hubspot", platform: AtsPlatform.GREENHOUSE },
  { name: "Monday.com", identifier: "monday", platform: AtsPlatform.GREENHOUSE },
  { name: "Amplitude", identifier: "amplitude", platform: AtsPlatform.GREENHOUSE },
  { name: "Mixpanel", identifier: "mixpanel", platform: AtsPlatform.GREENHOUSE },
  { name: "Intercom", identifier: "intercom", platform: AtsPlatform.GREENHOUSE },
  { name: "Airtable", identifier: "airtable", platform: AtsPlatform.GREENHOUSE },
  { name: "Miro", identifier: "miro", platform: AtsPlatform.GREENHOUSE },

  // ========== CONSULTING & PROFESSIONAL SERVICES (Finance, Legal, Sales) ==========
  { name: "KPMG", identifier: "kpmg", platform: AtsPlatform.LEVER },
  { name: "McKinsey", identifier: "mckinsey", platform: AtsPlatform.LEVER },
  { name: "BCG", identifier: "bcg", platform: AtsPlatform.LEVER },
  { name: "Bain", identifier: "bain", platform: AtsPlatform.LEVER },
  { name: "Deloitte Digital", identifier: "deloittedigital", platform: AtsPlatform.LEVER },

  // ========== LEVER - DIVERSE COMPANIES ==========
  { name: "Figma", identifier: "figma", platform: AtsPlatform.LEVER },
  { name: "Netflix", identifier: "netflix", platform: AtsPlatform.LEVER },
  { name: "Atlassian", identifier: "atlassian", platform: AtsPlatform.LEVER },
  { name: "Canva", identifier: "canva", platform: AtsPlatform.LEVER },
  { name: "Palantir", identifier: "palantir", platform: AtsPlatform.LEVER },
  { name: "Udacity", identifier: "udacity", platform: AtsPlatform.LEVER },
  { name: "Shopify", identifier: "shopify", platform: AtsPlatform.LEVER },
  { name: "Docusign", identifier: "docusign", platform: AtsPlatform.LEVER },
  { name: "Evernote", identifier: "evernote", platform: AtsPlatform.LEVER },
  { name: "Yelp", identifier: "yelp", platform: AtsPlatform.LEVER },

  // ========== MARKETING & MEDIA COMPANIES ==========
  { name: "BuzzFeed", identifier: "buzzfeed", platform: AtsPlatform.GREENHOUSE },
  { name: "Vice Media", identifier: "vicemedia", platform: AtsPlatform.GREENHOUSE },
  { name: "Vox Media", identifier: "voxmedia", platform: AtsPlatform.GREENHOUSE },
  { name: "The New York Times", identifier: "nytimes", platform: AtsPlatform.LEVER },

  // ========== ASHBY - MODERN STARTUPS ==========
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
  { name: "Snowflake", identifier: "snowflake", platform: AtsPlatform.ASHBY }, // Verified working!

  // ========== WORKDAY RSS - ENTERPRISE COMPANIES ==========
  { 
    name: "Uber", 
    identifier: "uber", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "uber.wd1.myworkdayjobs.com",
    workday_site_id: "Uber_Careers"
  },
  { 
    name: "Salesforce", 
    identifier: "salesforce", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "salesforce.wd1.myworkdayjobs.com",
    workday_site_id: "External_Career_Site"
  },
  { 
    name: "Nvidia", 
    identifier: "nvidia", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "nvidia.wd5.myworkdayjobs.com",
    workday_site_id: "NVIDIAExternalCareerSite"
  },
  { 
    name: "Mastercard", 
    identifier: "mastercard", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "mastercard.wd1.myworkdayjobs.com",
    workday_site_id: "CorporateCareers"
  },
];
