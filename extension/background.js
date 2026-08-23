// Service worker — handles auth flow and message passing

chrome.runtime.onInstalled.addListener(() => {
  console.log("Trackr extension installed");
});

// Listen for auth requests from the popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "START_AUTH") {
    handleAuth(msg.loginUrl);
    sendResponse({ ok: true });
  }
  return true;
});

async function handleAuth(loginUrl) {
  // Open login page in a new tab
  const tab = await chrome.tabs.create({ url: loginUrl });
  const tabId = tab.id;

  // Watch for the callback URL containing the token
  function onUpdated(updatedTabId, changeInfo) {
    if (updatedTabId !== tabId || !changeInfo.url) return;

    const url = changeInfo.url;
    if (!url.includes("/api/ext/auth/done")) return;

    // Extract token from URL
    try {
      const parsed = new URL(url);
      const token = parsed.searchParams.get("token");
      if (token) {
        chrome.storage.sync.set({ token });
      }
    } catch {
      // ignore parse errors
    }

    // Clean up: remove listener and close the tab
    chrome.tabs.onUpdated.removeListener(onUpdated);
    chrome.tabs.remove(tabId).catch(() => {});
  }

  // Also clean up if the user closes the tab manually
  function onRemoved(removedTabId) {
    if (removedTabId !== tabId) return;
    chrome.tabs.onUpdated.removeListener(onUpdated);
    chrome.tabs.onRemoved.removeListener(onRemoved);
  }

  chrome.tabs.onUpdated.addListener(onUpdated);
  chrome.tabs.onRemoved.addListener(onRemoved);
}
