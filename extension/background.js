// Service worker — handles auth flow and message passing
//
// Sign-in: the popup asks us to open the server's login page. That page gets an
// extension token from the server and posts it to itself with window.postMessage;
// we inject a listener into that tab only, so the token never appears in a URL.
//
// MV3 service workers are killed after ~30s idle (sign-in often takes longer),
// so the pending auth tab lives in chrome.storage.session and listeners are
// registered at the top level, where Chrome re-attaches them on wake.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Trackr extension installed");
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
