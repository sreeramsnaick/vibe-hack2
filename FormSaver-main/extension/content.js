function getUserId() {
  let uid = localStorage.getItem("form_saver_uid");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("form_saver_uid", uid);
  }
  return uid;
}

function initFormSaver() {
  console.log("✅ FormSaver content script active");

  const origin = window.location.origin + "/*";
  const pageKey = window.location.href;
  const userId = getUserId();

  function saveFormData() {
    try {
      const forms = document.forms;
      const formData = {};

      for (let form of forms) {
        for (let el of form.elements) {
          const tag = el.tagName.toLowerCase();
          if (el.name && ['input', 'textarea', 'select'].includes(tag)) {
            if (el.type !== "password") {
              formData[el.name] = el.value;
            }
          }
        }
      }

      // Save locally
      chrome.storage.local.set({ [pageKey]: formData }, () => {
        console.log("💾 Saved locally:", formData);
      });

      // Save to backend
      fetch("http://localhost:8000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, url: pageKey, data: formData })
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(() => console.log("✅ Synced to backend"))
        .catch(err => console.warn("⚠️ Failed to sync:", err));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }

  function restoreFormData() {
    try {
      chrome.storage.local.get([pageKey], (result) => {
        const savedData = result[pageKey];
        if (savedData && Object.keys(savedData).length > 0) {
          console.log("✅ Loaded from local");
          applyFormData(savedData);
        } else {
          // If not in local, fetch from backend
          fetch("http://localhost:8000/get", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, url: pageKey })
          })
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then(data => {
              if (data && Object.keys(data).length > 0) {
                chrome.storage.local.set({ [pageKey]: data });
                console.log("✅ Loaded from backend");
                applyFormData(data);
              }
            })
            .catch(err => console.warn("⚠️ Backend load failed:", err));
        }
      });
    } catch (error) {
      console.error("Error restoring form data:", error);
    }
  }

  function applyFormData(data) {
    try {
      for (const [name, value] of Object.entries(data)) {
        const el = document.querySelector(`[name="${name}"]`);
        if (el) el.value = value;
      }
    } catch (error) {
      console.error("Error applying form data:", error);
    }
  }

  document.addEventListener('input', () => {
    setTimeout(saveFormData, 200);
  });

  restoreFormData();
}

if (document.readyState === 'complete') {
  initFormSaver();
} else {
  window.addEventListener('load', initFormSaver);
}


