function getUserId() {
  let uid = localStorage.getItem("form_saver_uid");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("form_saver_uid", uid);
  }
  return uid;
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs || tabs.length === 0) return;

  const tab = tabs[0];
  const url = tab.url;
  const tabUrl = new URL(url);
  const origin = tabUrl.origin + "/*";
  const userId = getUserId();

  const currentSiteEl = document.getElementById("currentSite");
  const permissionSection = document.getElementById("permissionSection");
  const clearBtn = document.getElementById("clear");
  const clearAllBtn = document.getElementById("clearAll");
  const syncNowBtn = document.getElementById("syncNow");
  const sitesEl = document.getElementById("sites");

  if (currentSiteEl) currentSiteEl.textContent = tabUrl.hostname;

  chrome.permissions.contains({ origins: [origin] }, (hasPermission) => {
    if (!hasPermission) {
      const grantBtn = document.createElement("button");
      grantBtn.textContent = "Grant Permission";
      grantBtn.onclick = () => {
        chrome.permissions.request({ origins: [origin] }, (granted) => {
          if (chrome.runtime.lastError) {
            alert("Error: " + chrome.runtime.lastError.message);
          } else if (granted) {
            alert("✅ Permission granted! Reload page.");
            location.reload();
          } else {
            alert("❌ Permission denied.");
          }
        });
      };
      permissionSection.appendChild(grantBtn);
      clearBtn.disabled = true;
      syncNowBtn.disabled = true;
    }
  });

  clearBtn?.addEventListener("click", () => {
    chrome.storage.local.remove(url, () => {
      alert("Form data cleared for this site.");
    });
  });

  clearAllBtn?.addEventListener("click", () => {
    chrome.storage.local.clear(() => {
      alert("🗑️ All form data cleared.");
      location.reload();
    });
  });

  syncNowBtn?.addEventListener("click", () => {
    chrome.storage.local.get([url], (result) => {
      const data = result[url];
      if (!data) {
        alert("No data to sync for this site.");
        return;
      }

      fetch("http://localhost:8000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, url, data })
      })
      .then(res => res.json())
      .then(() => alert("✅ Synced to backend"))
      .catch(err => alert("⚠️ Sync failed"));
    });
  });

  // List all saved sites (just display domain names)
  chrome.storage.local.get(null, (data) => {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      sitesEl.textContent = "No saved sites.";
    } else {
      const domains = [...new Set(keys.map(k => {
        try { return new URL(k).hostname; }
        catch { return "Invalid URL"; }
      }))];
      sitesEl.innerHTML = domains.map(d => `<div>🌐 ${d}</div>`).join('');
    }
  });
});







