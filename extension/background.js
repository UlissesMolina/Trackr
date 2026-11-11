// Service worker — handles auth flow and message passing
//
// Sign-in: the popup asks us to open the server's login page. That page gets an
// extension token from the server and posts it to itself with window.postMessage;
// we inject a listener into that tab only, so the token never appears in a URL.
//
// MV3 service workers are killed after ~30s idle (sign-in often takes longer),
// so the pending auth tab lives in chrome.storage.session and listeners are
// registered at the top level, where Chrome re-attaches them on wake.

const DEFAULT_SERVER = "https://trackr-production-4189.up.railway.app";
const MENU_ID = "trackr-save";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Trackr extension installed");
  chrome.contextMenus.create({ id: MENU_ID, title: "Save to Trackr", contexts: ["page"] });
});

// ── Right-click → Save to Trackr ────────────────────────────────────────────
// One click saves the current page without opening the popup. Feedback is a
// badge on the toolbar icon: ✓ saved, "dup" already tracked, ! failed.

function flashBadge(tabId, text, color) {
  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text });
  setTimeout(() => chrome.action.setBadgeText({ tabId, text: "" }), 4000);
}

async function scrapeFromTab(tabId, type) {
  try {
    return await chrome.tabs.sendMessage(tabId, { type });
  } catch {
    // content script not injected yet
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    return await chrome.tabs.sendMessage(tabId, { type });
  } catch {
    return null;
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const tabId = tab.id;
  const { token, serverUrl } = await chrome.storage.sync.get(["token", "serverUrl"]);
  const base = serverUrl || DEFAULT_SERVER;

  if (!token) {
    flashBadge(tabId, "!", "#ef4444");
    try { await chrome.action.openPopup(); } catch { /* not allowed from this gesture */ }
    return;
  }

  let data = await scrapeFromTab(tabId, "SCRAPE_JOB");
  if (!data || (!data.title && !data.company)) data = await scrapeFromTab(tabId, "SCRAPE_MANUAL");
  if (!data?.title) {
    flashBadge(tabId, "!", "#ef4444");
    return;
  }
  const hostname = (() => { try { return new URL(tab.url).hostname.replace(/^www\./, ""); } catch { return "Unknown"; } })();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  try {
    const params = new URLSearchParams({ url: data.url || tab.url || "", company: data.company || "", title: data.title });
    const existing = await fetch(`${base}/api/ext/applications/lookup?${params}`, { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (existing) {
      flashBadge(tabId, "dup", "#f59e0b");
      return;
    }
    const res = await fetch(`${base}/api/ext/applications`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: data.title,
        company: data.company || hostname,
        location: data.location || undefined,
        url: data.url || tab.url || undefined,
        jobDescription: (data.description || "").slice(0, 5000) || undefined,
        status: data.appliedHint ? "APPLIED" : "SAVED",
      }),
    });
    if (res.status === 401) await chrome.storage.sync.remove("token");
    flashBadge(tabId, res.ok ? "✓" : "!", res.ok ? "#16a34a" : "#ef4444");
  } catch {
    flashBadge(tabId, "!", "#ef4444");
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_AUTH") {
    startAuth(msg.loginUrl);
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === "AUTH_TOKEN") {
    receiveToken(msg.token, sender).then(sendResponse);
    return true; // async response
  }
});

async function startAuth(loginUrl) {
  const tab = await chrome.tabs.create({ url: loginUrl });
  await chrome.storage.session.set({
    authTabId: tab.id,
    authLoginUrl: new URL(loginUrl).origin + new URL(loginUrl).pathname,
  });
}

async function receiveToken(token, sender) {
  const { authTabId } = await chrome.storage.session.get("authTabId");
  // Only accept a token from the login tab we opened
  if (!sender.tab || sender.tab.id !== authTabId || typeof token !== "string" || !token) {
    return { ok: false };
  }
  await chrome.storage.sync.set({ token });
  await chrome.storage.session.remove(["authTabId", "authLoginUrl"]);
  return { ok: true };
}

// Each time the login tab finishes loading the login page (including after
// Clerk's sign-in redirects), inject the token listener.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  const { authTabId, authLoginUrl } = await chrome.storage.session.get(["authTabId", "authLoginUrl"]);
  if (tabId !== authTabId || !tab.url.startsWith(authLoginUrl)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: listenForToken,
    });
  } catch (err) {
    console.warn("Could not inject auth listener:", err);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { authTabId } = await chrome.storage.session.get("authTabId");
  if (tabId === authTabId) {
    await chrome.storage.session.remove(["authTabId", "authLoginUrl"]);
  }
});

// Runs inside the login page (isolated world)
function listenForToken() {
  if (window.__trackrAuthListener) return;
  window.__trackrAuthListener = true;

  let delivered = false;
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "TRACKR_EXT_TOKEN" || delivered) return;

    delivered = true;
    chrome.runtime.sendMessage({ type: "AUTH_TOKEN", token: event.data.token }, (res) => {
      if (res && res.ok) {
        window.postMessage({ type: "TRACKR_EXT_TOKEN_ACK" }, window.location.origin);
      } else {
        delivered = false;
      }
    });
  });
}
