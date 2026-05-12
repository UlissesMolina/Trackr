document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("job-form");
  const noData = document.getElementById("no-data");
  const statusMsg = document.getElementById("status-msg");
  const successMsg = document.getElementById("success-msg");
  const errorMsg = document.getElementById("error-msg");
  const errorText = document.getElementById("error-text");
  const saveBtn = document.getElementById("save-btn");

  document.getElementById("open-options").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Ask the content script to scrape job data
  let jobData = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      jobData = await chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_JOB" });
    }
  } catch {
    // Content script not injected on this page
  }

  if (!jobData || (!jobData.title && !jobData.company)) {
    statusMsg.textContent = "No job detected";
    noData.style.display = "block";
    return;
  }

  statusMsg.textContent = `Found job on ${jobData.source || "page"}`;
  document.getElementById("title").value = jobData.title || "";
  document.getElementById("company").value = jobData.company || "";
  document.getElementById("location").value = jobData.location || "";
  document.getElementById("url").value = jobData.url || "";
  document.getElementById("description").value = (jobData.description || "").slice(0, 5000);
  form.style.display = "block";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    errorMsg.style.display = "none";

    const { apiKey, serverUrl } = await chrome.storage.sync.get(["apiKey", "serverUrl"]);
    if (!apiKey) {
      errorText.textContent = "No API key configured. Open Settings to add one.";
      errorMsg.style.display = "block";
      saveBtn.disabled = false;
      saveBtn.textContent = "Save to Trackr";
      return;
    }

    const base = serverUrl || "http://localhost:3001";
    const payload = {
      title: document.getElementById("title").value,
      company: document.getElementById("company").value,
      location: document.getElementById("location").value || undefined,
      url: document.getElementById("url").value || undefined,
      jobDescription: document.getElementById("description").value || undefined,
      status: document.getElementById("job-status").value,
    };

    try {
      const res = await fetch(`${base}/api/ext/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }

      form.style.display = "none";
      successMsg.style.display = "block";
      statusMsg.textContent = "Saved!";
    } catch (err) {
      errorText.textContent = err.message || "Failed to save application.";
      errorMsg.style.display = "block";
      saveBtn.disabled = false;
      saveBtn.textContent = "Save to Trackr";
    }
  });
});
