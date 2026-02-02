import { AtsPlatform } from './types';

export const INITIAL_COMPANIES = [
  // ========== TECH COMPANIES (IT + All Departments) ==========
  // GREENHOUSE - BIG TECH & HIGH GROWTH
  { name: "Airbnb", identifier: "airbnb", platform: AtsPlatform.GREENHOUSE },
  { name: "Stripe", identifier: "stripe", platform: AtsPlatform.GREENHOUSE },
  { name: "Twitch", identifier: "twitch", platform: AtsPlatform.GREENHOUSE },
  { name: "GitLab", identifier: "gitlab", platform: AtsPlatform.GREENHOUSE },
  { name: "DoorDash", identifier: "doordashsoftware", platform: AtsPlatform.GREENHOUSE },
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

  // ========== NEW CONSUMER & MEDIA ==========
  { name: "Spotify", identifier: "spotify", platform: AtsPlatform.GREENHOUSE },
  { name: "Eventbrite", identifier: "eventbrite", platform: AtsPlatform.GREENHOUSE },
  { name: "Strava", identifier: "strava", platform: AtsPlatform.GREENHOUSE },
  { name: "Calm", identifier: "calm", platform: AtsPlatform.GREENHOUSE },
  { name: "Patreon", identifier: "patreon", platform: AtsPlatform.GREENHOUSE },
  { name: "Medium", identifier: "medium", platform: AtsPlatform.GREENHOUSE },
  { name: "Cameo", identifier: "cameo", platform: AtsPlatform.GREENHOUSE },
  { name: "Clubhouse", identifier: "clubhouse", platform: AtsPlatform.GREENHOUSE },

  // ========== EDUCATION & LEARNING ==========
  { name: "Coursera", identifier: "coursera", platform: AtsPlatform.GREENHOUSE },
  { name: "Khan Academy", identifier: "khanacademy", platform: AtsPlatform.GREENHOUSE },
  { name: "Skillshare", identifier: "skillshare", platform: AtsPlatform.GREENHOUSE },
  { name: "Masterclass", identifier: "masterclass", platform: AtsPlatform.GREENHOUSE },

  // ========== VERIFIED GREENHOUSE COMPANIES ==========
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

  // ========== DEVELOPER TOOLS & INFRASTRUCTURE ==========
  { name: "GitHub", identifier: "github", platform: AtsPlatform.GREENHOUSE },
  { name: "Netlify", identifier: "netlify", platform: AtsPlatform.GREENHOUSE },
  { name: "Heroku", identifier: "heroku", platform: AtsPlatform.GREENHOUSE },
  { name: "DigitalOcean", identifier: "digitalocean", platform: AtsPlatform.GREENHOUSE },
  { name: "Docker", identifier: "docker", platform: AtsPlatform.GREENHOUSE },
  { name: "Grafana", identifier: "grafana", platform: AtsPlatform.GREENHOUSE },
  { name: "Kong", identifier: "kong", platform: AtsPlatform.GREENHOUSE },
  { name: "CircleCI", identifier: "circleci", platform: AtsPlatform.GREENHOUSE },
  { name: "LaunchDarkly", identifier: "launchdarkly", platform: AtsPlatform.GREENHOUSE },
  { name: "PagerDuty", identifier: "pagerduty", platform: AtsPlatform.GREENHOUSE },
  { name: "Auth0", identifier: "auth0", platform: AtsPlatform.GREENHOUSE },
  { name: "Splunk", identifier: "splunk", platform: AtsPlatform.GREENHOUSE },
  { name: "Elastic", identifier: "elastic", platform: AtsPlatform.GREENHOUSE },
  { name: "MongoDB", identifier: "mongodb", platform: AtsPlatform.GREENHOUSE },
  { name: "Redis", identifier: "redis", platform: AtsPlatform.GREENHOUSE },
  { name: "Couchbase", identifier: "couchbase", platform: AtsPlatform.GREENHOUSE },
  { name: "CockroachDB", identifier: "cockroachdb", platform: AtsPlatform.GREENHOUSE },
  { name: "Neo4j", identifier: "neo4j", platform: AtsPlatform.GREENHOUSE },
  { name: "PlanetScale", identifier: "planetscale", platform: AtsPlatform.GREENHOUSE },

  // ========== NO-CODE & PRODUCTIVITY ==========
  { name: "Webflow", identifier: "webflow", platform: AtsPlatform.GREENHOUSE },
  { name: "Framer", identifier: "framer", platform: AtsPlatform.GREENHOUSE },
  { name: "Bubble", identifier: "bubble", platform: AtsPlatform.GREENHOUSE },
  { name: "Retool", identifier: "retool", platform: AtsPlatform.GREENHOUSE },
  { name: "Zapier", identifier: "zapier", platform: AtsPlatform.GREENHOUSE },
  { name: "Coda", identifier: "coda", platform: AtsPlatform.GREENHOUSE },
  { name: "Slack", identifier: "slack", platform: AtsPlatform.GREENHOUSE },
  { name: "Zendesk", identifier: "zendesk", platform: AtsPlatform.GREENHOUSE },

  // ========== FINANCE & FINTECH ==========
  { name: "Ramp", identifier: "ramp", platform: AtsPlatform.GREENHOUSE },
  { name: "Mercury", identifier: "mercury", platform: AtsPlatform.GREENHOUSE },
  { name: "Chime", identifier: "chime", platform: AtsPlatform.GREENHOUSE },
  { name: "Affirm", identifier: "affirm", platform: AtsPlatform.GREENHOUSE },
  { name: "BlockFi", identifier: "blockfi", platform: AtsPlatform.GREENHOUSE },
  { name: "Gemini", identifier: "gemini", platform: AtsPlatform.GREENHOUSE },
  { name: "Marqeta", identifier: "marqeta", platform: AtsPlatform.GREENHOUSE },
  { name: "Checkout.com", identifier: "checkout", platform: AtsPlatform.GREENHOUSE },
  { name: "Kraken", identifier: "kraken", platform: AtsPlatform.GREENHOUSE },
  { name: "Binance", identifier: "binance", platform: AtsPlatform.GREENHOUSE },
  { name: "Afterpay", identifier: "afterpay", platform: AtsPlatform.GREENHOUSE },
  { name: "Wise", identifier: "wise", platform: AtsPlatform.GREENHOUSE },
  { name: "Monzo", identifier: "monzo", platform: AtsPlatform.GREENHOUSE },
  { name: "N26", identifier: "n26", platform: AtsPlatform.GREENHOUSE },
  { name: "Adyen", identifier: "adyen", platform: AtsPlatform.GREENHOUSE },
  { name: "Bill.com", identifier: "bill", platform: AtsPlatform.GREENHOUSE },
  { name: "Expensify", identifier: "expensify", platform: AtsPlatform.GREENHOUSE },

  // ========== AI & MACHINE LEARNING ==========
  { name: "Hugging Face", identifier: "huggingface", platform: AtsPlatform.GREENHOUSE },
  { name: "Jasper", identifier: "jasper", platform: AtsPlatform.GREENHOUSE },
  { name: "Copy.ai", identifier: "copyai", platform: AtsPlatform.GREENHOUSE },
  { name: "Midjourney", identifier: "midjourney", platform: AtsPlatform.GREENHOUSE },
  { name: "RunwayML", identifier: "runwayml", platform: AtsPlatform.GREENHOUSE },
  { name: "Weights & Biases", identifier: "wandb", platform: AtsPlatform.GREENHOUSE },
  { name: "Anyscale", identifier: "anyscale", platform: AtsPlatform.GREENHOUSE },
  { name: "Cohere", identifier: "cohere", platform: AtsPlatform.GREENHOUSE },

  // ========== SECURITY & COMPLIANCE ==========
  { name: "Drata", identifier: "drata", platform: AtsPlatform.GREENHOUSE },
  { name: "Secureframe", identifier: "secureframe", platform: AtsPlatform.GREENHOUSE },

  // ========== REMOTE WORK & HR ==========
  { name: "Remote.com", identifier: "remote", platform: AtsPlatform.GREENHOUSE },
  { name: "Oyster", identifier: "oyster", platform: AtsPlatform.GREENHOUSE },
  { name: "Multiplier", identifier: "multiplier", platform: AtsPlatform.GREENHOUSE },
  { name: "Doist", identifier: "doist", platform: AtsPlatform.GREENHOUSE },
  { name: "Automattic", identifier: "automattic", platform: AtsPlatform.GREENHOUSE },
  { name: "Buffer", identifier: "buffer", platform: AtsPlatform.GREENHOUSE },
  { name: "Gumroad", identifier: "gumroad", platform: AtsPlatform.GREENHOUSE },
  { name: "Basecamp", identifier: "basecamp", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN UNICORNS ==========
  { name: "Zomato", identifier: "zomato", platform: AtsPlatform.GREENHOUSE },
  { name: "Swiggy", identifier: "swiggy", platform: AtsPlatform.GREENHOUSE },
  { name: "PhonePe", identifier: "phonepe", platform: AtsPlatform.GREENHOUSE },
  { name: "Razorpay", identifier: "razorpay", platform: AtsPlatform.GREENHOUSE },
  { name: "Cred", identifier: "credclub", platform: AtsPlatform.GREENHOUSE },
  { name: "Groww", identifier: "groww", platform: AtsPlatform.GREENHOUSE },
  { name: "Meesho", identifier: "meesho", platform: AtsPlatform.GREENHOUSE },
  { name: "Freshworks", identifier: "freshworks", platform: AtsPlatform.GREENHOUSE },
  { name: "InMobi", identifier: "inmobi", platform: AtsPlatform.GREENHOUSE },
  { name: "Ola", identifier: "ola", platform: AtsPlatform.GREENHOUSE },
  { name: "BrowserStack", identifier: "browserstack", platform: AtsPlatform.GREENHOUSE },
  { name: "Chargebee", identifier: "chargebee", platform: AtsPlatform.GREENHOUSE },
  { name: "Zerodha", identifier: "zerodha", platform: AtsPlatform.GREENHOUSE },

  // ========== INDIAN FINTECH & BANKING ==========
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

  // ========== INDIAN SAAS & B2B ==========
  { name: "Hasura", identifier: "hasura", platform: AtsPlatform.GREENHOUSE },
  { name: "HackerRank", identifier: "hackerrank", platform: AtsPlatform.GREENHOUSE },
  { name: "MindTickle", identifier: "mindtickle", platform: AtsPlatform.GREENHOUSE },
  { name: "Whatfix", identifier: "whatfix", platform: AtsPlatform.GREENHOUSE },
  { name: "MoEngage", identifier: "moengage", platform: AtsPlatform.GREENHOUSE },
  { name: "CleverTap", identifier: "clevertap", platform: AtsPlatform.GREENHOUSE },
  { name: "Quizizz", identifier: "quizizz", platform: AtsPlatform.LEVER },
  { name: "Icertis", identifier: "icertis", platform: AtsPlatform.GREENHOUSE },
  { name: "Druva", identifier: "druva", platform: AtsPlatform.GREENHOUSE },
  { name: "HighRadius", identifier: "highradius", platform: AtsPlatform.GREENHOUSE },

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

  // ========== SALES & MARKETING ==========
  { name: "HubSpot", identifier: "hubspot", platform: AtsPlatform.GREENHOUSE },
  { name: "Monday.com", identifier: "monday", platform: AtsPlatform.GREENHOUSE },
  { name: "Amplitude", identifier: "amplitude", platform: AtsPlatform.GREENHOUSE },
  { name: "Mixpanel", identifier: "mixpanel", platform: AtsPlatform.GREENHOUSE },
  { name: "Intercom", identifier: "intercom", platform: AtsPlatform.GREENHOUSE },
  { name: "Airtable", identifier: "airtable", platform: AtsPlatform.GREENHOUSE },
  { name: "Miro", identifier: "miro", platform: AtsPlatform.GREENHOUSE },

  // ========== CONSULTING & PROFESSIONAL SERVICES ==========
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

  // ========== MARKETING & MEDIA ==========
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
  { name: "OpenAI", identifier: "openai", platform: AtsPlatform.ASHBY },
  { name: "Anthropic", identifier: "anthropic", platform: AtsPlatform.ASHBY },
  { name: "Perplexity", identifier: "perplexity", platform: AtsPlatform.ASHBY },
  { name: "Scale AI", identifier: "scale", platform: AtsPlatform.ASHBY },
  { name: "Together AI", identifier: "togetherai", platform: AtsPlatform.ASHBY },

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
  { 
    name: "Visa", 
    identifier: "visa", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "visa.wd1.myworkdayjobs.com",
    workday_site_id: "Careers"
  },
  { 
    name: "Adobe", 
    identifier: "adobe", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "adobe.wd5.myworkdayjobs.com",
    workday_site_id: "external_experienced"
  },
  { 
    name: "Palo Alto Networks", 
    identifier: "paloaltonetworks", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "paloaltonetworks.wd1.myworkdayjobs.com",
    workday_site_id: "US"
  },
  { 
    name: "CrowdStrike", 
    identifier: "crowdstrike", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "crowdstrike.wd5.myworkdayjobs.com",
    workday_site_id: "crowdstrikecareers"
  },
  { 
    name: "Zscaler", 
    identifier: "zscaler", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "zscaler.wd1.myworkdayjobs.com",
    workday_site_id: "External"
  },
  { 
    name: "Snowflake", 
    identifier: "snowflake", 
    platform: AtsPlatform.WORKDAY,
    workday_domain: "snowflake.wd1.myworkdayjobs.com",
    workday_site_id: "Careers"
  },
];
