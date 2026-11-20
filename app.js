import { checkAll, storesCsv, fmtDate, VERDICT } from "./check.js?v=1";
import { DOCS, RULES, AS_OF, SHOP } from "./samples.js?v=1";

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const g = (id) => `<svg aria-hidden="true"><use href="#g-${id}"/></svg>`;

const summary = checkAll(DOCS, RULES, AS_OF);
const state = { open: null, released: new Set(), swiped: null, tab: "receipts", hl: null };
const WORD = { pass: "Holds", fail: "Differs", none: "Not found" };

function verdictHtml(r) {
  if (r.verdict === VERDICT.stores) {
    const rel = state.released.has(r.id);
    return `<span class="verdict">${g("check")}<span class="cap yellow${state.swiped === r.id ? " swipe" : ""}">${rel ? `Released, ${esc(SHOP.inspector)}` : "To stores"}</span></span>`;
  }
  if (r.verdict === VERDICT.quarantine) return `<span class="verdict v-hold"><span class="cloud cap">${g("delta")}${esc(r.headline)}</span></span>`;
  return `<span class="verdict v-none">${g("none")}<span class="cap">${esc(r.headline)}</span></span>`;
}

// Bars drawn to one scale: thin dimension for the reference, heavy for what came in, the shortfall hatched.
function barsHtml(r) {
  const c = r.checks.find((x) => x.bar && x.status === "fail");
  if (!c) return "";
  const b = c.bar, max = Math.max(b.ref, b.got, b.counted || 0) * 1.12;
  const f = (v) => (v / max).toFixed(4);
  const short = b.got < b.ref;
  return `<span class="bars" aria-hidden="true">
    <span class="b file"><i class="cap">${esc(b.refName)}</i><span class="t" style="--d:${f(b.ref)}"><b>${b.ref}</b></span></span>
    <span class="b meas"><i class="cap">${esc(b.gotName)}</i><span class="t" style="--d:${f(short ? b.ref : b.got)};--f:${f(b.got)}">${short ? `<span class="over hatch"></span>` : ""}<b>${b.got}${short ? ` (${b.ref - b.got} short)` : ""}</b></span></span>
  </span>`;
}

function valueHtml(c) {
  if (!c.diff) return "";
  const s = c.diff.span;
  return `<dl class="sums"><dt>${c.key === "pn" ? "Ordered" : "Document"}</dt><dd>${esc(c.diff.want)}</dd>
    <dt>${c.key === "pn" ? "Document" : "Data plate"}</dt><dd>${esc(s.same)}<span class="cloud cap">${esc(s.diff)}</span>${esc(s.tail)}</dd></dl>`;
}

function srcHtml(x) {
  const d = DOCS[x.doc];
  const head = d.heads[d.cols.indexOf(x.field)];
  return `<button class="src src-btn" type="button" data-doc="${x.doc}" data-line="${esc(x.id)}" data-field="${x.field}" aria-label="${esc(d.file)}, ${esc(x.id)}, ${esc(head)}">${g("lead")}${esc(d.file)} · ${esc(x.id)}</button>`;
}

function detailHtml(r, n) {
  const order = { fail: 0, none: 1, pass: 2 };
  const rows = [...r.checks].sort((a, b) => order[a.status] - order[b.status]).map((c) => `
    <li class="ck ck-${c.status}">
      <p class="ck-h">${g(c.status === "pass" ? "check" : c.status === "fail" ? "delta" : "none")}<span class="cap">${esc(c.label)}</span><span class="ck-w cap">${WORD[c.status]}</span></p>
      <p class="ck-n">${esc(c.note)}</p>
      ${valueHtml(c)}
      <div class="srcs">${c.refs.map(srcHtml).join("")}</div>
    </li>`).join("");
  let act;
  if (r.verdict === VERDICT.stores) {
    act = state.released.has(r.id)
      ? `<div class="actions"><button class="btn cap" type="button" disabled>Released to stores</button><button class="btn ghost cap" type="button" data-undo="${r.id}">Undo</button></div>`
      : `<div class="actions"><button class="btn cap" type="button" data-release="${r.id}">Release to stores as ${esc(SHOP.inspector)}</button></div>`;
  } else if (r.verdict === VERDICT.quarantine) {
    act = `<p class="held">Stays in quarantine until the vendor answers: ${esc(r.checks.filter((c) => c.status === "fail").map((c) => c.label.toLowerCase()).join("; "))}.</p>`;
  } else {
    act = `<p class="held">Waits for the inspector. Nothing is matched by guess.</p>`;
  }
  // A line that holds puts its action first; held lines lead with what differs.
  return r.verdict === VERDICT.stores
    ? `<div class="detail draw" id="d-${r.id}"><h3 class="cap">Detail ${n}</h3>${act}<ul class="cks after-act">${rows}</ul></div>`
    : `<div class="detail draw" id="d-${r.id}"><h3 class="cap">Detail ${n}</h3>
    <ul class="cks">${rows}</ul>${act}</div>`;
}

function renderSummary() {
  const total = summary.results.length;
  $("#summary").innerHTML = `<b>${summary.stores} of ${total}</b> <span>can go to stores today</span>`;
  const segs = [["ok", summary.stores, "to stores"], ["long", summary.quarantine, "quarantine"], ["none", summary.inspector, "wait for the inspector"]].filter((s) => s[1]);
  $("#chain").setAttribute("aria-label", `Of ${total} lines, ${summary.stores} to stores, ${summary.quarantine} quarantined, ${summary.inspector} wait for the inspector`);
  $("#chain").innerHTML = segs.map(([cls, n], i) => `<div class="seg ${cls}" style="--n:${n}"><span class="dim cap">${n}</span><span class="bar"></span>${i === segs.length - 1 ? '<span class="end"></span>' : ""}</div>`).join("");
  $("#legend").innerHTML = segs.map(([cls, n, w]) => `<span class="lg ${cls}">${n} ${w}</span>`).join(" ");
}

function renderItems() {
  const order = { quarantine: 0, inspector: 1, stores: 2 };
  const rs = [...summary.results].sort((a, b) => order[a.verdict] - order[b.verdict]);
  $("#items").innerHTML = rs.map((r, i) => {
    const open = state.open === r.id;
    return `<li class="item"><button class="row" type="button" data-row="${r.id}" aria-expanded="${open}" aria-controls="d-${r.id}">
      <span class="balloon">${i + 1}</span>
      <span class="who">${esc(r.po ? r.po.description : r.receipt.poLine)} <span class="pn">${esc(r.po ? r.po.partNo : "")}</span></span>
      ${verdictHtml(r)}
      <span class="meta">${esc(r.id)} · PO ${esc(r.receipt.poLine)} · ${esc(r.po ? r.po.vendor : "")}</span>
      ${barsHtml(r)}
    </button>${open ? detailHtml(r, i + 1) : ""}</li>`;
  }).join("");
  state.swiped = null;
  clouds();
}

function renderOut() {
  const csv = storesCsv(summary.results, state.released, SHOP.inspector, AS_OF);
  const n = state.released.size;
  $("#out-sub").textContent = n ? `${n} line${n === 1 ? "" : "s"} released by ${SHOP.inspector} on ${fmtDate(AS_OF)}, ready for the ERP.` : "Release a line that holds and it lands here, one row each, ready for the ERP.";
  $("#out-csv").textContent = csv;
  const a = $("#out-dl");
  if (a.dataset.url) URL.revokeObjectURL(a.dataset.url);
  a.dataset.url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.href = a.dataset.url;
  a.classList.toggle("off", n === 0);
  a.setAttribute("aria-disabled", String(n === 0));
}

function renderDocs() {
  $("#doc-tabs").innerHTML = Object.keys(DOCS).map((k) => `<button type="button" class="tab cap" data-tab="${k}" aria-pressed="${state.tab === k}">${esc(DOCS[k].title)}</button>`).join("");
  const d = DOCS[state.tab];
  $("#doc-file").textContent = d.file;
  $("#doc-grid").innerHTML = `<table class="grid"><thead><tr>${d.heads.map((h) => `<th class="cap">${esc(h)}</th>`).join("")}</tr></thead><tbody>${d.lines.map((l) => {
    const hl = state.hl && state.hl.id === l.id;
    return `<tr id="ln-${state.tab}-${l.id.replace(/\W/g, "_")}"${hl ? ' class="hl"' : ""}>${d.cols.map((c) => `<td${hl && state.hl.field === c ? ' class="hit"' : ""}>${esc(l[c] ?? "")}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table>`;
}

// Revision clouds: a scalloped outline drawn around whatever does not hold.
function cloud(el) {
  const old = el.querySelector(":scope > svg.c"); if (old) old.remove();
  if (!el.offsetWidth) return;
  const w = el.offsetWidth + 10, h = el.offsetHeight + 10, step = 13;
  const side = (len) => Math.max(2, Math.round(len / step));
  const nx = side(w - 8), ny = side(h - 8), cx = (w - 8) / nx, cy = (h - 8) / ny;
  let d = "M4 4";
  const arc = (dx, dy, c) => ` a${(c * .62).toFixed(2)} ${(c * .62).toFixed(2)} 0 0 1 ${dx.toFixed(2)} ${dy.toFixed(2)}`;
  for (let i = 0; i < nx; i++) d += arc(cx, 0, cx);
  for (let i = 0; i < ny; i++) d += arc(0, cy, cy);
  for (let i = 0; i < nx; i++) d += arc(-cx, 0, cx);
  for (let i = 0; i < ny; i++) d += arc(0, -cy, cy);
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"), p = document.createElementNS(ns, "path");
  svg.setAttribute("class", "c"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  p.setAttribute("d", d + "z"); p.setAttribute("pathLength", "1"); svg.appendChild(p); el.appendChild(svg); el.classList.add("drawn");
}
function clouds() { document.querySelectorAll(".cloud").forEach(cloud); }

document.addEventListener("click", (e) => {
  const row = e.target.closest("[data-row]");
  if (row) { state.open = state.open === row.dataset.row ? null : row.dataset.row; renderItems(); return; }
  const rel = e.target.closest("[data-release]");
  if (rel) { state.released.add(rel.dataset.release); state.swiped = rel.dataset.release; renderItems(); renderOut(); return; }
  const un = e.target.closest("[data-undo]");
  if (un) { state.released.delete(un.dataset.undo); renderItems(); renderOut(); return; }
  const src = e.target.closest(".src-btn");
  if (src) {
    state.tab = src.dataset.doc; state.hl = { id: src.dataset.line, field: src.dataset.field };
    renderDocs();
    $("#docs").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    const tr = document.getElementById(`ln-${state.tab}-${src.dataset.line.replace(/\W/g, "_")}`);
    const td = tr && tr.querySelector(".hit");
    if (td) setTimeout(() => td.scrollIntoView({ block: "nearest", inline: "center" }), 350);
    return;
  }
  const tab = e.target.closest("[data-tab]");
  if (tab) { state.tab = tab.dataset.tab; state.hl = null; renderDocs(); return; }
  if (e.target.closest("#why-btn")) {
    const b = $("#why-btn"), open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open)); $("#notes").hidden = !open; return;
  }
  const dl = e.target.closest("#out-dl");
  if (dl && dl.classList.contains("off")) { e.preventDefault(); return; }
  if (e.target.closest("#reset")) {
    state.open = null; state.released.clear(); state.tab = "receipts"; state.hl = null;
    render(); window.scrollTo({ top: 0 });
  }
});
addEventListener("resize", clouds);

function render() { renderSummary(); renderItems(); renderOut(); renderDocs(); }
render();
document.fonts.ready.then(clouds);
