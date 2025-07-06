function getUserId() {
  let uid = localStorage.getItem("form_saver_uid");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("form_saver_uid", uid);
  }
  return uid;
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs || tabs.length === 0) {
    console.error("No active tab found");
    return;
  }

  const tab = tabs[0];
  const url = tab.url;
  
  if (!url) {
    console.error("No URL found in active tab");
    return;
  }
  
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
      if (clearBtn) clearBtn.disabled = true;
      if (syncNowBtn) syncNowBtn.disabled = true;
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      chrome.storage.local.remove(url, () => {
        if (chrome.runtime.lastError) {
          alert("Error clearing data: " + chrome.runtime.lastError.message);
        } else {
          alert("Form data cleared for this site.");
        }
      });
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          alert("Error clearing all data: " + chrome.runtime.lastError.message);
        } else {
          alert("🗑️ All form data cleared.");
          location.reload();
        }
      });
    });
  }

  if (syncNowBtn) {
    syncNowBtn.addEventListener("click", () => {
      chrome.storage.local.get([url], (result) => {
        if (chrome.runtime.lastError) {
          alert("Error accessing storage: " + chrome.runtime.lastError.message);
          return;
        }
        
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
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(() => alert("✅ Synced to backend"))
        .catch(err => {
          console.error("Sync error:", err);
          alert("⚠️ Sync failed: " + err.message);
        });
      });
    });
  }

  // List all saved sites (just display domain names)
  chrome.storage.local.get(null, (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error accessing storage:", chrome.runtime.lastError);
      if (sitesEl) sitesEl.textContent = "Error loading saved sites.";
      return;
    }
    
    const keys = Object.keys(data);
    if (keys.length === 0) {
      if (sitesEl) sitesEl.textContent = "No saved sites.";
    } else {
      const domains = [...new Set(keys.map(k => {
        try { 
          return new URL(k).hostname; 
        } catch (e) { 
          console.warn("Invalid URL:", k);
          return "Invalid URL"; 
        }
      }))];
      if (sitesEl) {
        sitesEl.innerHTML = domains.map(d => `<div>🌐 ${d}</div>`).join('');
      }
    }
  });
});







