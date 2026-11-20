import { test } from "node:test";
import assert from "node:assert/strict";
import { checkAll, checkReceipt, storesCsv, diffSpan, daysBetween, VERDICT } from "./check.js";
import { DOCS, RULES, AS_OF } from "./samples.js";

const clone = () => JSON.parse(JSON.stringify(DOCS));
const all = (d = DOCS) => checkAll(d, RULES, AS_OF);
const byId = (id, d) => all(d).results.find((r) => r.id === id);
const ck = (r, key) => r.checks.find((c) => c.key === key);

test("sample: 4 of 12 to stores, 6 quarantined, 2 wait for the inspector", () => {
  const s = all();
  assert.equal(s.results.length, 12);
  assert.equal(s.stores, 4);
  assert.equal(s.quarantine, 6);
  assert.equal(s.inspector, 2);
  assert.deepEqual(s.results.filter((r) => r.verdict === VERDICT.stores).map((r) => r.id), ["GR-60411", "GR-60413", "GR-60418", "GR-60420"]);
});

test("GR-60412: the dash number differs and there is no approved alternate", () => {
  const r = byId("GR-60412");
  assert.equal(r.verdict, VERDICT.quarantine);
  assert.equal(ck(r, "pn").status, "fail");
  assert.deepEqual(ck(r, "pn").diff.span, { same: "4417-2203-0", diff: "7", tail: "" });
});

test("GR-60413: an approved alternate written on the PO line holds", () => {
  const r = byId("GR-60413");
  assert.equal(r.verdict, VERDICT.stores);
  assert.match(ck(r, "pn").note, /approved alternate/);
});

test("the same alternate without the PO's approval is quarantined", () => {
  const d = clone();
  d.po.lines.find((l) => l.id === "88419/1").altPartNos = "";
  assert.equal(byId("GR-60413", d).verdict, VERDICT.quarantine);
});

test("GR-60414: Inspected/Tested does not satisfy Overhauled", () => {
  const r = byId("GR-60414");
  assert.equal(ck(r, "cond").status, "fail");
  assert.equal(r.verdict, VERDICT.quarantine);
});

test("Serviceable takes Repaired or Inspected/Tested", () => {
  assert.equal(ck(byId("GR-60413"), "cond").status, "pass"); // Inspected/Tested for SV
  assert.equal(ck(byId("GR-60415"), "cond").status, "pass"); // Repaired for SV
});

test("GR-60415: transposed serial is caught and the differing digits marked", () => {
  const r = byId("GR-60415");
  assert.equal(ck(r, "sn").status, "fail");
  assert.deepEqual(ck(r, "sn").diff.span, { same: "408", diff: "17", tail: "" });
});

test("GR-60416: the document covers 12 of the 20 counted", () => {
  const r = byId("GR-60416");
  assert.equal(ck(r, "qty").status, "fail");
  assert.match(ck(r, "qty").note, /8 have no release/);
});

test("GR-60417: 100 days of shelf life left against a 180-day minimum", () => {
  assert.equal(daysBetween("2026-11-20", "2027-02-28"), 100);
  const r = byId("GR-60417");
  assert.equal(ck(r, "shelf").status, "fail");
  assert.equal(ck(r, "shelf").bar.got, 100);
  assert.equal(ck(r, "shelf").bar.ref, 180);
});

test("shelf life exactly at the minimum holds", () => {
  const d = clone();
  d.receipts.lines.find((l) => l.id === "GR-60417").labelExpiry = "2027-05-19"; // 180 days
  assert.equal(ck(byId("GR-60417", d), "shelf").status, "pass");
});

test("GR-60419: a tracking number already received in August is not accepted twice", () => {
  const r = byId("GR-60419");
  assert.equal(ck(r, "track").status, "fail");
  assert.deepEqual(ck(r, "track").refs.map((x) => x.id), ["D-09", "GR-59870"]);
});

test("GR-60421: no release document, so no other check runs", () => {
  const r = byId("GR-60421");
  assert.equal(r.verdict, VERDICT.inspector);
  assert.equal(r.checks.length, 1);
  assert.equal(r.checks[0].status, "none");
});

test("GR-60422: unreadable data plate waits; the serial is never matched by guess", () => {
  const r = byId("GR-60422");
  assert.equal(r.verdict, VERDICT.inspector);
  assert.equal(ck(r, "sn").status, "none");
  assert.match(ck(r, "sn").note, /Not matched by guess/);
});

test("a C of C where the PO asks for 8130-3 or Form 1 is quarantined", () => {
  const d = clone();
  d.certs.lines.find((c) => c.id === "D-01").form = "C of C";
  const r = byId("GR-60411", d);
  assert.equal(ck(r, "doc").status, "fail");
  assert.equal(r.verdict, VERDICT.quarantine);
});

test("a receipt on a PO line that does not exist waits for the inspector", () => {
  const r = checkReceipt({ ...DOCS.receipts.lines[0], poLine: "99999/9" }, DOCS, RULES, AS_OF);
  assert.equal(r.verdict, VERDICT.inspector);
});

test("a quarantine outranks a wait: fail first, then not found", () => {
  const d = clone();
  const rc = d.receipts.lines.find((l) => l.id === "GR-60422");
  d.certs.lines.find((c) => c.id === "D-11").partNo = "CU-3341-9";
  assert.equal(byId(rc.id, d).verdict, VERDICT.quarantine);
});

test("diffSpan marks only the characters that differ", () => {
  assert.deepEqual(diffSpan("ABC-12", "ABC-12"), { same: "ABC-12", diff: "", tail: "" });
  assert.deepEqual(diffSpan("7716-40-1", "7716-41-1"), { same: "7716-4", diff: "1", tail: "-1" });
});

test("every reference points at a line that exists and a field it has", () => {
  for (const r of all().results) for (const c of r.checks) for (const x of c.refs) {
    const line = DOCS[x.doc].lines.find((l) => l.id === x.id);
    assert.ok(line, `${r.id} ${c.key} cites ${x.doc}:${x.id}`);
    assert.ok(x.field in line, `${r.id} ${c.key} cites missing field ${x.field}`);
  }
});

test("stores receipt CSV carries only released lines that hold", () => {
  const s = all();
  const csv = storesCsv(s.results, new Set(["GR-60411", "GR-60412"]), "Priya", AS_OF).trim().split("\n");
  assert.equal(csv.length, 2); // header + GR-60411; GR-60412 is quarantined and never exported
  assert.match(csv[1], /^GR-60411,88412\/1,2234-901-3,1,BP10442,Overhauled,FAA 8130-3,VCO-26-11873,J-7104,Priya,2026-11-20$/);
});
