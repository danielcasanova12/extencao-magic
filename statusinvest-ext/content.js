// content.js
(function () {
  function waitFor(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(() => {
        const e2 = document.querySelector(selector);
        if (e2) { obs.disconnect(); resolve(e2); }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
    });
  }

  function mountPanel() {
    if (document.getElementById("si-plus-host")) {
      const host = document.getElementById("si-plus-host");
      return { host, shadow: host.shadowRoot };
    }
    const host = document.createElement("div");
    host.id = "si-plus-host";
    host.style.position = "fixed";
    host.style.right = "16px";
    host.style.bottom = "16px";
    host.style.zIndex = 999999;

    const shadow = host.attachShadow({ mode: "open" });
    const wrap = document.createElement("div");
    wrap.className = "card";
    wrap.innerHTML = `
      <div class="title">Dados do meu banco (statusinvest_latest)</div>
      <div id="si-plus-content">Carregando…</div>
    `;
    shadow.appendChild(wrap);

    const style = document.createElement("style");
    style.textContent = `
      .card { font-family: system-ui, Arial, sans-serif; background:#fff; border:1px solid #e5e7eb; box-shadow:0 8px 24px rgba(0,0,0,.08); border-radius:12px; padding:12px; width: 420px; max-height: 60vh; overflow:auto; }
      .title { font-weight:700; margin-bottom:8px; }
      table { width:100%; border-collapse:collapse; font-size: 12.5px; }
      th, td { padding:6px 8px; border-bottom:1px solid #eee; text-align:left; white-space:nowrap; }
      th { position: sticky; top: 0; background: #fafafa; }
      .chip { display:inline-block; padding:2px 6px; border-radius:6px; background:#f3f4f6; }
      .muted { color:#6b7280; }
    `;
    shadow.appendChild(style);

    document.body.appendChild(host);
    return { host, shadow };
  }

  function fmtBRL(v) {
    if (v == null || isNaN(Number(v))) return "-";
    try { return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
    catch { return String(v); }
  }
  function fmtPct(v) {
    if (v == null || isNaN(Number(v))) return "-";
    return `${(Number(v) * 100).toFixed(2)}%`;
  }
  function fmtDate(s) {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return String(s);
    return d.toLocaleString("pt-BR");
  }

  function render(shadow, rows) {
    const box = shadow.getElementById?.("si-plus-content") || shadow.querySelector("#si-plus-content");
    if (!box) return;

    if (!rows?.length) {
      box.innerHTML = `<div class="muted">Nenhum dado retornado.</div>`;
      return;
    }

    const header = `
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Preço</th>
          <th>ROIC</th>
          <th>Earning Yield</th>
          <th>Market Cap</th>
          <th>Setor</th>
          <th>Atualizado</th>
        </tr>
      </thead>
    `;

    const body = rows.map(r => `
      <tr>
        <td><span class="chip">${r.ticker || "-"}</span></td>
        <td>${fmtBRL(r.price)}</td>
        <td>${fmtPct(r.roic_pct)}</td>
        <td>${fmtPct(r.earning_yield)}</td>
        <td>${r.market_cap != null ? Number(r.market_cap).toLocaleString("pt-BR") : "-"}</td>
        <td>${r.sector || "-"}</td>
        <td>${fmtDate(r.updated_at)}</td>
      </tr>
    `).join("");

    box.innerHTML = `<table>${header}<tbody>${body}</tbody></table>`;
  }

  async function main() {
    await waitFor("body");
    const { shadow } = mountPanel();

    // pede ao background para buscar os dados
    const resp = await chrome.runtime.sendMessage({ type: "GET_STATUSINVEST_LATEST" });
    if (!resp?.ok) {
      const box = shadow.getElementById?.("si-plus-content") || shadow.querySelector("#si-plus-content");
      if (box) box.innerHTML = `<div class="muted">Erro ao carregar: ${resp?.error || "desconhecido"}</div>`;
      return;
    }

    // resp.data = { ok:true, rows:[...] }
    const rows = resp.data?.rows ?? [];
    render(shadow, rows);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
