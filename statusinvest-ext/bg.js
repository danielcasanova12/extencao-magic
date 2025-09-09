// bg.js
const DEFAULT_API_BASE = "https://<SEU-PROJETO>.vercel.app"; // ou http://localhost:3000

chrome.runtime.onInstalled.addListener(async () => {
  const curr = await chrome.storage.sync.get(["API_BASE"]);
  if (!curr.API_BASE) {
    await chrome.storage.sync.set({ API_BASE: DEFAULT_API_BASE });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_STATUSINVEST_LATEST") {
    (async () => {
      try {
        const { API_BASE } = await chrome.storage.sync.get("API_BASE");
        const url = `${API_BASE.replace(/\/$/, "")}/api/statusinvest-latest`;
        const r = await fetch(url, { method: "GET" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true; // resposta assíncrona
  }
});
