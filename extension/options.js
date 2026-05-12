document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("api-key");
  const serverUrlInput = document.getElementById("server-url");
  const saveBtn = document.getElementById("save-btn");
  const savedNotice = document.getElementById("saved-notice");

  // Load saved settings
  const { apiKey, serverUrl } = await chrome.storage.sync.get(["apiKey", "serverUrl"]);
  if (apiKey) apiKeyInput.value = apiKey;
  if (serverUrl) serverUrlInput.value = serverUrl;

  saveBtn.addEventListener("click", async () => {
    await chrome.storage.sync.set({
      apiKey: apiKeyInput.value.trim(),
      serverUrl: serverUrlInput.value.trim() || "",
    });

    savedNotice.classList.add("show");
    setTimeout(() => savedNotice.classList.remove("show"), 2000);
  });
});
