document.addEventListener("DOMContentLoaded", async () => {
  const statusMsg = document.getElementById("status-msg");
  const authSection = document.getElementById("auth-section");
  const noData = document.getElementById("no-data");
  const form = document.getElementById("job-form");
  const successMsg = document.getElementById("success-msg");
  const errorMsg = document.getElementById("error-msg");
  const errorText = document.getElementById("error-text");
  const saveBtn = document.getElementById("save-btn");
  const signInBtn = document.getElementById("sign-in-btn");
  const signOutLink = document.getElementById("sign-out-link");
  const signedInFooter = document.getElementById("signed-in-footer");
  const toggleServerUrl = document.getElementById("toggle-server-url");
  const serverUrlField = document.getElementById("server-url-field");
  const serverUrlInput = document.getElementById("server-url");
  const saveServerUrlBtn = document.getElementById("save-server-url");

  const { token, serverUrl } = await chrome.storage.sync.get(["token", "serverUrl"]);
  const base = serverUrl || "http://localhost:3001";

  if (serverUrlInput && serverUrl) {
    serverUrlInput.value = serverUrl;
  }

  // Server URL toggle
  toggleServerUrl.addEventListener("click", () => {
    serverUrlField.style.display = serverUrlField.style.display === "none" ? "block" : "none";
  });

  saveServerUrlBtn.addEventListener("click", async () => {
    await chrome.storage.sync.set({ serverUrl: serverUrlInput.value.trim() || "" });
    serverUrlField.style.display = "none";
  });

  // Not authenticated
  if (!token) {
    statusMsg.textContent = "Not signed in";
    authSection.style.display = "block";

    signInBtn.addEventListener("click", () => {
      const loginUrl = `${base}/api/ext/auth/login`;
      chrome.runtime.sendMessage({ type: "START_AUTH", loginUrl });
      // Popup will close when user switches to the login tab.
      // Next time they open the popup, the token will be stored.
    });
    return;
  }

  // Authenticated — sign out handler
  signedInFooter.style.display = "block";
  signOutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await chrome.storage.sync.remove("token");
    window.location.reload();
  });

  // Scrape job data from the active tab
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
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) {
          await chrome.storage.sync.remove("token");
          errorText.textContent = "Session expired. Please sign in again.";
          errorMsg.style.display = "block";
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
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
