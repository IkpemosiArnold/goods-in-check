# Goods-In Check

A part arrives at a maintenance shop's receiving bench in a box with a packing slip and a release document. Before it goes into stores, someone checks the paperwork against what was ordered: the part number down to the dash, the quantity, the condition, the serial on the data plate, the shelf life, and whether the document has been seen before. When that check is rushed, a wrong dash number or a transposed serial sits on a shelf until a mechanic finds it on the aircraft.

This page does that check for one morning's deliveries, in plain code. Every check opens to the fields it read in the PO line, the release document, the receiving log or the earlier receipts this year. What does not hold is quarantined with the field that differs. What cannot be read waits for the inspector. Nothing is guessed, and a person releases every line to stores.

**Sample result:** 4 of 12 can go to stores. 6 quarantined. 2 wait for the inspector.

## What it shows

- **Bleed shutoff valve, quarantined.** Ordered 4417-2203-05. The document says 4417-2203-07, and the PO line names no approved alternate.
- **Starter generator, quarantined.** The PO asked for overhauled. The document's Status/Work says Inspected/Tested.
- **Temperature sensor, quarantined.** The data plate reads 40817. The document says 40871.
- **Seal kit, quarantined.** 20 counted, but the document covers 12. 8 have no release.
- **Sealant, quarantined.** 100 days of shelf life left at receipt against the PO's 180-day minimum.
- **Display unit, quarantined.** The document's tracking number was already received on 14 Aug, for the same serial.
- **Mounting bracket, waits.** No release document in the box. No other check runs without one.
- **Control unit, waits.** The data plate is painted over. The serial is not matched by guess.
- **Door actuator, to stores.** The document is for the -2, which the PO line lists as an approved alternate for the -1.
- **Fuel boost pump, bolts, filter elements, to stores.** Every check holds.

Released lines become a stores receipt CSV for the ERP: part number, quantity, serial or batch, condition, document and tracking number, job, who released it and when.

## Rules used

The shop's own receiving rules, made up for this sample:

- The PO line says which release documents it accepts: FAA Form 8130-3 or EASA Form 1 for components, a certificate of conformity for standard hardware and consumables.
- Part number exactly as ordered, or an approved alternate written on the PO line.
- Counted quantity equals the quantity on the document, and the document covers no more than was ordered.
- Condition codes as buyers use them: NE (new), OH (overhauled), SV (serviceable). New needs New. Overhauled needs Overhauled. Serviceable takes Overhauled, Repaired or Inspected/Tested.
- Serialized parts: the serial on the data plate matches the document.
- Consumables with a minimum shelf life: days left on the label at receipt meet the PO minimum.
- A tracking number already on an earlier receipt is not accepted again.

In the sample, a repaired or tested component carries a release signed by the repair station that did the work, and a new part one from its manufacturer. The distributors supply the parts and pass the documents on; they do not sign them.

Field names follow the release documents (Form Tracking Number, Part Number, Quantity, Serial/Batch Number, Status/Work, Remarks). Block numbers differ between form versions, so the page uses names only.

## Not covered

Reading scanned documents: the fields here are already typed in at receiving. Checking the issuer's approval, the signature or the date. Life-limited parts and back-to-birth trace. Suspected unapproved parts reporting. Shipping damage. Partial shipments against a PO line.

## Run it

Open `index.html` through any static server. Tests: `node --test` (Node 20 or later). Screenshots and layout checks: `NODE_PATH=<folder with playwright-core> node tools/shoot.cjs`.

## Files

- `samples.js`: the made-up shop, its open PO lines, the release documents, the receiving log and the earlier receipts this year. Part numbers, serials and tracking numbers are invented in the shape of real ones.
- `check.js`: the rules, in plain code. No model, no network.
- `app.js`, `index.html`, `style.css`: the page.
- `check.test.js`: 19 tests.

Built on 20 Nov 2026 with AI coding agents, directed by Arnold Ikpemosi Adeyemi.
