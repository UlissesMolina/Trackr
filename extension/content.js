// Content script — scrapes job data from LinkedIn and Greenhouse pages

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

  const company =
    document.querySelector(".company-name")?.textContent?.trim() ||
    "";

  const location =
    document.querySelector(".location")?.textContent?.trim() ||
    "";

  const description =
    document.querySelector("#content .body")?.textContent?.trim() ||
    document.querySelector("#content")?.textContent?.trim() ||
    "";

  return { title, company, location, description, url: window.location.href, source: "greenhouse" };
}

function scrapeJobData() {
  const host = window.location.hostname;

  if (host.includes("linkedin.com")) {
    return scrapeLinkedIn();
  }
  if (host.includes("greenhouse.io")) {
    return scrapeGreenhouse();
  }

  return null;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "SCRAPE_JOB") {
    const data = scrapeJobData();
    sendResponse(data);
  }
  return true;
});
