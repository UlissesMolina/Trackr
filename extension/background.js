// Service worker — handles message passing between content scripts and popup
chrome.runtime.onInstalled.addListener(() => {
  console.log("Trackr extension installed");
});
