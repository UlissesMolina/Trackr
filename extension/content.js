// Content script — scrapes job data from any page
// Detection priority: schema.org structured data → site-specific scrapers → generic heuristics

// ── Schema.org JobPosting (covers thousands of sites) ──────────────────────

function scrapeSchemaOrg() {
  // Check JSON-LD scripts
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      let data = JSON.parse(script.textContent);
      // Handle @graph arrays
      if (data["@graph"]) data = data["@graph"];
      const postings = Array.isArray(data) ? data : [data];
      for (const item of postings) {
        if (item["@type"] === "JobPosting" || item["@type"]?.includes?.("JobPosting")) {
          return {
            title: item.title || "",
            company: item.hiringOrganization?.name || "",
            location: extractSchemaLocation(item),
            description: stripHtml(item.description || ""),
            url: window.location.href,
            source: "schema.org",
          };
        }
      }
    } catch {
      // Invalid JSON — skip
    }
  }
  return null;
}

function extractSchemaLocation(posting) {
  const loc = posting.jobLocation;
  if (!loc) return "";
  const locations = Array.isArray(loc) ? loc : [loc];
  return locations
    .map((l) => {
      const addr = l.address;
      if (!addr) return l.name || "";
      if (typeof addr === "string") return addr;
      return [addr.addressLocality, addr.addressRegion, addr.addressCountry]
        .filter(Boolean)
        .join(", ");
    })
    .filter(Boolean)
    .join(" | ");
}

function stripHtml(str) {
  const div = document.createElement("div");
  div.innerHTML = str;
  return div.textContent?.trim() || "";
}

// ── Site-specific scrapers ─────────────────────────────────────────────────

function scrapeLinkedIn() {
  const title =
    document.querySelector(".job-details-jobs-unified-top-card__job-title")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    "";
  const company =
    document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() ||
    document.querySelector(".job-details-jobs-unified-top-card__primary-description-container a")?.textContent?.trim() ||
    "";
  const location =
    document.querySelector(".job-details-jobs-unified-top-card__bullet")?.textContent?.trim() ||
    "";
  const description =
    document.querySelector(".jobs-description__content")?.textContent?.trim() ||
    document.querySelector("#job-details")?.textContent?.trim() ||
    "";
  return { title, company, location, description, url: window.location.href, source: "linkedin" };
}

function scrapeGreenhouse() {
  const title =
    document.querySelector(".app-title")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    "";
  const company = document.querySelector(".company-name")?.textContent?.trim() || "";
  const location = document.querySelector(".location")?.textContent?.trim() || "";
  const description =
    document.querySelector("#content .body")?.textContent?.trim() ||
    document.querySelector("#content")?.textContent?.trim() ||
    "";
  return { title, company, location, description, url: window.location.href, source: "greenhouse" };
}

function scrapeLever() {
  const title = document.querySelector(".posting-headline h2")?.textContent?.trim() || "";
  const location =
    document.querySelector(".posting-categories .sort-by-time")?.textContent?.trim() ||
    document.querySelector(".posting-categories .location")?.textContent?.trim() ||
    "";
  const company =
    document.querySelector(".main-header-logo img")?.alt?.trim() ||
    document.querySelector(".posting-header .company-name")?.textContent?.trim() ||
    "";
  const description =
    document.querySelector("[data-qa='job-description']")?.textContent?.trim() ||
    document.querySelector(".posting-page .content")?.textContent?.trim() ||
    "";
  return { title, company, location, description, url: window.location.href, source: "lever" };
}

function scrapeWorkday() {
  const title =
    document.querySelector("[data-automation-id='jobPostingHeader'] h2")?.textContent?.trim() ||
    document.querySelector("h2[data-automation-id='header']")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() ||
    "";
  const location =
    document.querySelector("[data-automation-id='locations']")?.textContent?.trim() ||
    document.querySelector("[data-automation-id='jobPostingLocation']")?.textContent?.trim() ||
    "";
  const description =
    document.querySelector("[data-automation-id='jobPostingDescription']")?.textContent?.trim() || "";
  return { title, company: "", location, description, url: window.location.href, source: "workday" };
}

function scrapeAshby() {
  const title = document.querySelector("h1")?.textContent?.trim() || "";
  const location =
    document.querySelector("[class*='locationValue']")?.textContent?.trim() ||
    document.querySelector("._location_")?.textContent?.trim() ||
    "";
  const description =
    document.querySelector("[class*='descriptionBody']")?.textContent?.trim() ||
    document.querySelector("._content_")?.textContent?.trim() ||
    "";
  return { title, company: "", location, description, url: window.location.href, source: "ashby" };
}

function scrapeSmartRecruiters() {
  const title = document.querySelector("h1.job-title")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() || "";
  const company = document.querySelector(".company-name")?.textContent?.trim() || "";
  const location = document.querySelector(".job-location")?.textContent?.trim() || "";
  const description = document.querySelector(".job-description")?.textContent?.trim() || "";
  return { title, company, location, description, url: window.location.href, source: "smartrecruiters" };
}

function scrapeIndeed() {
  const title =
    document.querySelector(".jobsearch-JobInfoHeader-title")?.textContent?.trim() ||
    document.querySelector("h1")?.textContent?.trim() || "";
  const company =
    document.querySelector("[data-testid='inlineHeader-companyName']")?.textContent?.trim() ||
    document.querySelector(".jobsearch-InlineCompanyRating-companyHeader")?.textContent?.trim() || "";
  const location =
    document.querySelector("[data-testid='inlineHeader-companyLocation']")?.textContent?.trim() ||
    document.querySelector(".jobsearch-JobInfoHeader-subtitle > div:last-child")?.textContent?.trim() || "";
  const description =
    document.querySelector("#jobDescriptionText")?.textContent?.trim() || "";
  return { title, company, location, description, url: window.location.href, source: "indeed" };
}

// ── Generic heuristic scraper (fallback for unknown sites) ─────────────────

function scrapeGeneric() {
  // Try og: meta tags first
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const ogDesc = document.querySelector('meta[property="og:description"]')?.content || "";
  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content || "";

  // Try page title and h1
  const h1 = document.querySelector("h1")?.textContent?.trim() || "";
  const pageTitle = document.title || "";

  const title = ogTitle || h1 || pageTitle;

  // Look for common job page signals
  const bodyText = document.body?.innerText?.toLowerCase() || "";
  const jobSignals = [
    "apply now", "apply for this job", "submit application", "job description",
    "qualifications", "responsibilities", "requirements", "about the role",
    "about this role", "what you'll do", "who you are", "job type",
    "employment type", "experience level",
  ];
  const matchCount = jobSignals.filter((s) => bodyText.includes(s)).length;

  // Need at least 2 signals to consider this a job page
  if (matchCount < 2 && !title) return null;

  // Try to extract company from common patterns
  const company =
    ogSiteName ||
    document.querySelector('[class*="company"]')?.textContent?.trim() ||
    document.querySelector('[data-testid*="company"]')?.textContent?.trim() ||
    "";

  // Try to extract location
  const location =
    document.querySelector('[class*="location"]')?.textContent?.trim() ||
    document.querySelector('[data-testid*="location"]')?.textContent?.trim() ||
    "";

  // Description from main content area
  const description =
    document.querySelector('[class*="description"]')?.textContent?.trim() ||
    document.querySelector('[class*="job-details"]')?.textContent?.trim() ||
    ogDesc ||
    "";

  return {
    title,
    company,
    location,
    description,
    url: window.location.href,
    source: "generic",
    confidence: matchCount >= 3 ? "high" : "low",
  };
}

// ── Manual scrape (user clicked "Save this page" — always returns data) ────

function scrapeManual() {
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const h1 = document.querySelector("h1")?.textContent?.trim() || "";
  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content || "";
  const ogDesc = document.querySelector('meta[property="og:description"]')?.content || "";

  return {
    title: ogTitle || h1 || document.title || "",
    company: ogSiteName || "",
    location: "",
    description: ogDesc || "",
    url: window.location.href,
    source: "manual",
  };
}

// ── Main dispatcher ────────────────────────────────────────────────────────

const SITE_SCRAPERS = [
  { match: (h) => h.includes("linkedin.com"), fn: scrapeLinkedIn },
  { match: (h) => h.includes("greenhouse.io"), fn: scrapeGreenhouse },
  { match: (h) => h.includes("lever.co"), fn: scrapeLever },
  { match: (h, u) => h.includes("myworkdayjobs.com") || h.includes("myworkdaysite.com"), fn: scrapeWorkday },
  { match: (h) => h.includes("ashbyhq.com"), fn: scrapeAshby },
  { match: (h) => h.includes("smartrecruiters.com"), fn: scrapeSmartRecruiters },
  { match: (h) => h.includes("indeed.com"), fn: scrapeIndeed },
];

function scrapeJobData(manual = false) {
  if (manual) return scrapeManual();

  const host = window.location.hostname;
  const url = window.location.href;

  // 1. Try schema.org structured data (most reliable, works on thousands of sites)
  const schema = scrapeSchemaOrg();
  if (schema && (schema.title || schema.company)) return schema;

  // 2. Try site-specific scraper
  for (const { match, fn } of SITE_SCRAPERS) {
    if (match(host, url)) {
      const result = fn();
      if (result && (result.title || result.company)) return result;
    }
  }

  // 3. Try generic heuristic scraper
  const generic = scrapeGeneric();
  if (generic && (generic.title || generic.company)) return generic;

  return null;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SCRAPE_JOB") {
    const data = scrapeJobData(false);
    sendResponse(data);
  } else if (msg.type === "SCRAPE_MANUAL") {
    const data = scrapeJobData(true);
    sendResponse(data);
  }
  return true;
});
