// Receiving check, in plain code. No model, no network.
// Each line on the bench is checked against its PO line and its release document.
// A part goes to stores only when every check holds. Anything that does not hold is quarantined
// with the field that differs. Anything that cannot be read waits for the inspector. Nothing is guessed.

export const VERDICT = { stores: "stores", quarantine: "quarantine", inspector: "inspector" };

const toDate = (s) => new Date(s + "T00:00:00Z");
export const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const fmtDate = (s) => { const d = toDate(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

const ref = (doc, id, field) => ({ doc, id, field });
const FORMS = { "8130-3 or Form 1": ["FAA 8130-3", "EASA Form 1"], "C of C": ["C of C", "FAA 8130-3", "EASA Form 1"] };

// Where two part numbers differ, the part of the string that differs (for the revision cloud).
export function diffSpan(want, got) {
  let i = 0;
  while (i < want.length && i < got.length && want[i] === got[i]) i++;
  let j = 0;
  while (j < want.length - i && j < got.length - i && want[want.length - 1 - j] === got[got.length - 1 - j]) j++;
  return { same: got.slice(0, i), diff: got.slice(i, got.length - j), tail: got.slice(got.length - j) };
}

export function checkReceipt(rc, docs, rules, asOf) {
  const po = docs.po.lines.find((l) => l.id === rc.poLine);
  const doc = rc.docId ? docs.certs.lines.find((c) => c.id === rc.docId) : null;
  const checks = [];
  const out = { id: rc.id, receipt: rc, po, doc, checks, verdict: null, headline: "" };

  if (!po) {
    checks.push({ key: "po", label: "PO line", status: "none", note: "No open PO line with this number. Nothing is matched by description.", refs: [ref("receipts", rc.id, "poLine")] });
    out.verdict = VERDICT.inspector; out.headline = "PO line not found";
    return out;
  }

  // 1. A release document must be in the box, and of a kind the PO accepts.
  if (!doc) {
    checks.push({ key: "doc", label: "Release document", status: "none", note: `None recorded for this receipt. The PO asks for ${po.certs}. No other check runs until the inspector has the document.`, refs: [ref("receipts", rc.id, "docId"), ref("receipts", rc.id, "note"), ref("po", po.id, "certs")] });
    out.verdict = VERDICT.inspector; out.headline = "No release document";
    return out;
  }
  const okForms = FORMS[po.certs] || [];
  checks.push(okForms.includes(doc.form)
    ? { key: "doc", label: "Release document", status: "pass", note: `${doc.form}, as the PO asks (${po.certs}).`, refs: [ref("certs", doc.id, "form"), ref("po", po.id, "certs")] }
    : { key: "doc", label: "Release document", status: "fail", note: `${doc.form}. The PO asks for ${po.certs}.`, refs: [ref("certs", doc.id, "form"), ref("po", po.id, "certs")] });

  // 2. Part number: exact, dash number included, or an approved alternate written on the PO line.
  const alts = po.altPartNos ? po.altPartNos.split(/\s*;\s*/) : [];
  if (doc.partNo === po.partNo) {
    checks.push({ key: "pn", label: "Part number", status: "pass", note: `${doc.partNo}, as ordered.`, refs: [ref("certs", doc.id, "partNo"), ref("po", po.id, "partNo")] });
  } else if (alts.includes(doc.partNo)) {
    checks.push({ key: "pn", label: "Part number", status: "pass", note: `${doc.partNo} is an approved alternate on the PO line for ${po.partNo}.`, refs: [ref("certs", doc.id, "partNo"), ref("po", po.id, "altPartNos")] });
  } else {
    checks.push({ key: "pn", label: "Part number", status: "fail", note: `The document says ${doc.partNo}. The PO ordered ${po.partNo}${alts.length ? ` (alternates: ${alts.join(", ")})` : ", with no approved alternate"}.`, refs: [ref("certs", doc.id, "partNo"), ref("po", po.id, "partNo")], diff: { want: po.partNo, got: doc.partNo, span: diffSpan(po.partNo, doc.partNo) } });
  }

  // 3. Quantity: what was counted, what the document covers, what was ordered.
  const qtyOk = rc.counted === doc.qty && doc.qty <= po.qty;
  checks.push({
    key: "qty", label: "Quantity", status: qtyOk ? "pass" : "fail",
    note: qtyOk ? `${rc.counted} counted, ${doc.qty} on the document, ${po.qty} ordered.`
      : rc.counted > doc.qty ? `${rc.counted} counted, but the document covers ${doc.qty}. ${rc.counted - doc.qty} have no release.`
      : `${rc.counted} counted, ${doc.qty} on the document, ${po.qty} ordered.`,
    refs: [ref("receipts", rc.id, "counted"), ref("certs", doc.id, "qty"), ref("po", po.id, "qty")],
    bar: { label: "Qty", ref: po.qty, refName: "Ordered", got: doc.qty, gotName: "Released", counted: rc.counted },
  });

  // 4. Condition: the Status/Work entry must satisfy the condition the PO asked for.
  const accepts = rules.conditionAccepts[po.cond] || [];
  checks.push(accepts.includes(doc.status)
    ? { key: "cond", label: "Condition", status: "pass", note: `${doc.status} satisfies ${rules.conditionNames[po.cond]} (${po.cond}).`, refs: [ref("certs", doc.id, "status"), ref("po", po.id, "cond")] }
    : { key: "cond", label: "Condition", status: "fail", note: `The document says ${doc.status}. The PO asked for ${rules.conditionNames[po.cond]} (${po.cond}), which needs ${accepts.join(" or ")}.`, refs: [ref("certs", doc.id, "status"), ref("po", po.id, "cond")] });

  // 5. Serial: the data plate, read at the bench, must match the document.
  if (po.serialized === "Y") {
    if (!rc.plateSerial) {
      checks.push({ key: "sn", label: "Serial number", status: "none", note: `The document says ${doc.serial}. No serial was read from the data plate${rc.note ? ` (inspector: "${rc.note.replace(/\.$/, "")}")` : ""}. Not matched by guess.`, refs: [ref("receipts", rc.id, "plateSerial"), ref("receipts", rc.id, "note"), ref("certs", doc.id, "serial")] });
    } else if (rc.plateSerial === doc.serial) {
      checks.push({ key: "sn", label: "Serial number", status: "pass", note: `${doc.serial} on the plate and on the document.`, refs: [ref("receipts", rc.id, "plateSerial"), ref("certs", doc.id, "serial")] });
    } else {
      checks.push({ key: "sn", label: "Serial number", status: "fail", note: `The data plate says ${rc.plateSerial}. The document says ${doc.serial}.`, refs: [ref("receipts", rc.id, "plateSerial"), ref("certs", doc.id, "serial")], diff: { want: doc.serial, got: rc.plateSerial, span: diffSpan(doc.serial, rc.plateSerial) } });
    }
  }

  // 6. Shelf life: days left on the label at receipt, against the minimum on the PO line.
  if (po.minShelfDays) {
    if (!rc.labelExpiry) {
      checks.push({ key: "shelf", label: "Shelf life", status: "none", note: `No expiry read from the label. The PO asks for ${po.minShelfDays} days left at receipt.`, refs: [ref("receipts", rc.id, "labelExpiry"), ref("po", po.id, "minShelfDays")] });
    } else {
      const left = daysBetween(asOf, rc.labelExpiry);
      const ok = left >= po.minShelfDays;
      checks.push({
        key: "shelf", label: "Shelf life", status: ok ? "pass" : "fail",
        note: `Expires ${fmtDate(rc.labelExpiry)}: ${left} days left at receipt. The PO asks for at least ${po.minShelfDays}.`,
        refs: [ref("receipts", rc.id, "labelExpiry"), ref("certs", doc.id, "serial"), ref("po", po.id, "minShelfDays")],
        bar: { label: "Days", ref: po.minShelfDays, refName: "Minimum", got: left, gotName: "Left" },
      });
    }
  }

  // 7. Tracking number: a document already used on an earlier receipt is not used twice.
  const seen = docs.history.lines.find((h) => h.tracking === doc.tracking);
  checks.push(seen
    ? { key: "track", label: "Document used once", status: "fail", note: `Tracking number ${doc.tracking} was already received on ${seen.id}, ${fmtDate(seen.date)}${seen.serial === doc.serial ? `, for the same serial ${seen.serial}` : ""}. A document is used for one receipt.`, refs: [ref("certs", doc.id, "tracking"), ref("history", seen.id, "tracking")] }
    : { key: "track", label: "Document used once", status: "pass", note: `${doc.tracking} is not on any earlier receipt this year.`, refs: [ref("certs", doc.id, "tracking")] });

  const fails = checks.filter((c) => c.status === "fail");
  const nones = checks.filter((c) => c.status === "none");
  out.verdict = fails.length ? VERDICT.quarantine : nones.length ? VERDICT.inspector : VERDICT.stores;
  out.headline = headlineFor(out, fails[0] || nones[0]);
  return out;
}

function headlineFor(r, c) {
  if (!c) return "Every check holds";
  const h = {
    doc: "Wrong kind of release document",
    pn: "Dash number differs",
    qty: "Document covers fewer than counted",
    cond: `${r.doc.status}, not ${r.po.cond === "OH" ? "overhauled" : "as ordered"}`,
    sn: c.status === "none" ? "Serial not readable" : "Serial differs from the plate",
    shelf: "Short shelf life",
    track: "Document already used",
  }[c.key];
  return h || c.label;
}

export function checkAll(docs, rules, asOf) {
  const results = docs.receipts.lines.map((rc) => checkReceipt(rc, docs, rules, asOf));
  const n = (v) => results.filter((r) => r.verdict === v).length;
  return { results, stores: n(VERDICT.stores), quarantine: n(VERDICT.quarantine), inspector: n(VERDICT.inspector) };
}

const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
// The stores receipt for the ERP: one row per line released by the inspector.
export function storesCsv(results, released, inspector, asOf) {
  const head = ["receipt", "po_line", "part_number", "qty", "serial_or_batch", "condition", "release_document", "tracking_no", "job", "released_by", "released_on"];
  const rows = results.filter((r) => released.has(r.id) && r.verdict === VERDICT.stores).map((r) => [
    r.id, r.po.id, r.doc.partNo, r.receipt.counted, r.doc.serial, r.doc.status, r.doc.form, r.doc.tracking, r.po.job, inspector, asOf,
  ]);
  return [head, ...rows].map((row) => row.map(cell).join(",")).join("\n") + "\n";
}
