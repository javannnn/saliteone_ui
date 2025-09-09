import { API_BASE_URL } from "./config.js";

const el = document.getElementById("app");
el.innerHTML =
  "<h1>SaliteOne UI</h1>" +
  "<p>API base: <code>" + API_BASE_URL + "</code></p>" +
  '<button id="ping">Ping API</button>' +
  '<pre id="out" style="margin-top:12px;background:#f6f6f6;padding:12px;border-radius:8px;overflow:auto"></pre>';

document.getElementById("ping").onclick = async function() {
  const out = document.getElementById("out");
  out.textContent = "Pinging...";
  try {
    const r = await fetch(API_BASE_URL + "/api/method/ping");
    const txt = await r.text();
    out.textContent = r.status + " " + r.statusText + "\n" + txt;
  } catch (e) {
    out.textContent = "Error: " + e.message;
  }
};
