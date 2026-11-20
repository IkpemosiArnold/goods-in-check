// Sample data: a made-up maintenance shop's receiving bench on one Friday.
// The shop, vendors, people, part numbers, serials and tracking numbers are all invented,
// in the shape of the real ones. Certificates are shown as the fields typed in at receiving.

export const AS_OF = "2026-11-20";
export const SHOP = { name: "Tarrowby Aero Engineering", inspector: "Priya" };

// The shop's own receiving rules. Which Status/Work entry satisfies the condition the PO asked for.
export const RULES = {
  conditionAccepts: {
    NE: ["New"],
    OH: ["Overhauled"],
    SV: ["Overhauled", "Repaired", "Inspected/Tested"],
  },
  conditionNames: { NE: "New", OH: "Overhauled", SV: "Serviceable" },
};

export const DOCS = {
  po: {
    title: "Open PO lines",
    file: "po_lines.csv",
    cols: ["id", "partNo", "altPartNos", "description", "qty", "cond", "certs", "serialized", "minShelfDays", "vendor", "job"],
    heads: ["PO line", "Part number", "Approved alternates", "Description", "Qty", "Cond", "Release document", "Serialized", "Min shelf life (days)", "Vendor", "Job"],
    lines: [
      { id: "88412/1", partNo: "2234-901-3", altPartNos: "", description: "Fuel boost pump", qty: 1, cond: "OH", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Vallory Component Overhaul", job: "J-7104" },
      { id: "88412/2", partNo: "4417-2203-05", altPartNos: "", description: "Bleed shutoff valve", qty: 1, cond: "OH", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Vallory Component Overhaul", job: "J-7104" },
      { id: "88419/1", partNo: "7716-40-1", altPartNos: "7716-40-2", description: "Door actuator", qty: 1, cond: "SV", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Dunmere Aviation Spares", job: "J-7111" },
      { id: "88421/1", partNo: "SG-4310-6", altPartNos: "", description: "Starter generator", qty: 1, cond: "OH", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Dunmere Aviation Spares", job: "J-7111" },
      { id: "88421/2", partNo: "SX40-215", altPartNos: "", description: "Temperature sensor", qty: 1, cond: "SV", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Dunmere Aviation Spares", job: "J-7111" },
      { id: "88430/1", partNo: "KS-5520-11", altPartNos: "", description: "Seal kit", qty: 20, cond: "NE", certs: "8130-3 or Form 1", serialized: "N", minShelfDays: "", vendor: "Kestwick Aero Supply", job: "J-7120" },
      { id: "88430/2", partNo: "KS-718-06", altPartNos: "", description: "Sealant, 6 oz cartridge", qty: 12, cond: "NE", certs: "C of C", serialized: "N", minShelfDays: 180, vendor: "Kestwick Aero Supply", job: "J-7120" },
      { id: "88430/3", partNo: "HB-6634-08", altPartNos: "", description: "Bolt", qty: 100, cond: "NE", certs: "C of C", serialized: "N", minShelfDays: "", vendor: "Kestwick Aero Supply", job: "J-7120" },
      { id: "88433/1", partNo: "DU-6142-3", altPartNos: "", description: "Display unit", qty: 1, cond: "SV", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Dunmere Aviation Spares", job: "J-7126" },
      { id: "88433/2", partNo: "F2210-14", altPartNos: "", description: "Filter element", qty: 4, cond: "NE", certs: "8130-3 or Form 1", serialized: "N", minShelfDays: "", vendor: "Kestwick Aero Supply", job: "J-7126" },
      { id: "88436/1", partNo: "BR-1907-2", altPartNos: "", description: "Mounting bracket", qty: 2, cond: "NE", certs: "8130-3 or Form 1", serialized: "N", minShelfDays: "", vendor: "Kestwick Aero Supply", job: "J-7130" },
      { id: "88436/2", partNo: "CU-3341-7", altPartNos: "", description: "Control unit", qty: 1, cond: "SV", certs: "8130-3 or Form 1", serialized: "Y", minShelfDays: "", vendor: "Dunmere Aviation Spares", job: "J-7130" },
    ],
  },
  certs: {
    title: "Release documents",
    file: "release_documents.csv",
    cols: ["id", "form", "tracking", "issuedBy", "partNo", "description", "qty", "serial", "status", "remarks"],
    heads: ["Doc", "Form", "Tracking no.", "Issued by", "Part number", "Description", "Qty", "Serial/Batch", "Status/Work", "Remarks"],
    lines: [
      { id: "D-01", form: "FAA 8130-3", tracking: "VCO-26-11873", issuedBy: "Vallory Component Overhaul", partNo: "2234-901-3", description: "Fuel boost pump", qty: 1, serial: "BP10442", status: "Overhauled", remarks: "Overhauled per CMM 28-21-05 Rev 9. Work order VC-55120." },
      { id: "D-02", form: "FAA 8130-3", tracking: "VCO-26-11874", issuedBy: "Vallory Component Overhaul", partNo: "4417-2203-07", description: "Bleed shutoff valve", qty: 1, serial: "V7731", status: "Overhauled", remarks: "Overhauled per CMM 36-11-14 Rev 4. Work order VC-55121." },
      { id: "D-03", form: "EASA Form 1", tracking: "HCR-48211", issuedBy: "Hensall Component Repair (repair station)", partNo: "7716-40-2", description: "Door actuator", qty: 1, serial: "AC2209", status: "Inspected/Tested", remarks: "Tested per CMM 52-31-02. Interchangeable with -1 per SB 7716-52-003. Supplied through Dunmere Aviation Spares." },
      { id: "D-04", form: "FAA 8130-3", tracking: "HCR-48230", issuedBy: "Hensall Component Repair (repair station)", partNo: "SG-4310-6", description: "Starter generator", qty: 1, serial: "SG5518", status: "Inspected/Tested", remarks: "Bench tested per CMM 24-31-08. Brushes within limits. Supplied through Dunmere Aviation Spares." },
      { id: "D-05", form: "FAA 8130-3", tracking: "HCR-48231", issuedBy: "Hensall Component Repair (repair station)", partNo: "SX40-215", description: "Temperature sensor", qty: 1, serial: "40871", status: "Repaired", remarks: "Connector replaced. Tested per CMM 77-21-11. Supplied through Dunmere Aviation Spares." },
      { id: "D-06", form: "FAA 8130-3", tracking: "QFS-26-0419", issuedBy: "Quillfield Seals (manufacturer)", partNo: "KS-5520-11", description: "Seal kit", qty: 12, serial: "Batch K2611", status: "New", remarks: "New parts, released by the manufacturer. Supplied through Kestwick Aero Supply." },
      { id: "D-07", form: "C of C", tracking: "KAS-C-30412", issuedBy: "Kestwick Aero Supply", partNo: "KS-718-06", description: "Sealant, 6 oz cartridge", qty: 12, serial: "Batch 6M0291, expiry 2027-02-28", status: "New", remarks: "Store below 25 C." },
      { id: "D-08", form: "C of C", tracking: "KAS-C-30413", issuedBy: "Kestwick Aero Supply", partNo: "HB-6634-08", description: "Bolt", qty: 100, serial: "Lot 22-0815", status: "New", remarks: "" },
      { id: "D-09", form: "FAA 8130-3", tracking: "HCR-47602", issuedBy: "Hensall Component Repair (repair station)", partNo: "DU-6142-3", description: "Display unit", qty: 1, serial: "DU30655", status: "Inspected/Tested", remarks: "Tested per CMM 31-61-20. Supplied through Dunmere Aviation Spares." },
      { id: "D-10", form: "FAA 8130-3", tracking: "OGF-118302", issuedBy: "Ormsgate Filtration (manufacturer)", partNo: "F2210-14", description: "Filter element", qty: 4, serial: "Batch F0926", status: "New", remarks: "New parts, released by the manufacturer. Supplied through Kestwick Aero Supply." },
      { id: "D-11", form: "EASA Form 1", tracking: "HCR-48240", issuedBy: "Hensall Component Repair (repair station)", partNo: "CU-3341-7", description: "Control unit", qty: 1, serial: "CU1180", status: "Inspected/Tested", remarks: "Tested per CMM 22-11-41. Supplied through Dunmere Aviation Spares." },
    ],
  },
  receipts: {
    title: "Receiving log",
    file: "receiving_log.csv",
    cols: ["id", "poLine", "slip", "docId", "counted", "plateSerial", "labelExpiry", "note"],
    heads: ["Receipt", "PO line", "Packing slip", "Release doc", "Counted", "Serial on data plate", "Expiry on label", "Inspector note"],
    lines: [
      { id: "GR-60411", poLine: "88412/1", slip: "VCO-PS-2291", docId: "D-01", counted: 1, plateSerial: "BP10442", labelExpiry: "", note: "" },
      { id: "GR-60412", poLine: "88412/2", slip: "VCO-PS-2291", docId: "D-02", counted: 1, plateSerial: "V7731", labelExpiry: "", note: "" },
      { id: "GR-60413", poLine: "88419/1", slip: "DAS-PS-1180", docId: "D-03", counted: 1, plateSerial: "AC2209", labelExpiry: "", note: "" },
      { id: "GR-60414", poLine: "88421/1", slip: "DAS-PS-1184", docId: "D-04", counted: 1, plateSerial: "SG5518", labelExpiry: "", note: "" },
      { id: "GR-60415", poLine: "88421/2", slip: "DAS-PS-1184", docId: "D-05", counted: 1, plateSerial: "40817", labelExpiry: "", note: "" },
      { id: "GR-60416", poLine: "88430/1", slip: "KAS-PS-9031", docId: "D-06", counted: 20, plateSerial: "", labelExpiry: "", note: "" },
      { id: "GR-60417", poLine: "88430/2", slip: "KAS-PS-9031", docId: "D-07", counted: 12, plateSerial: "", labelExpiry: "2027-02-28", note: "" },
      { id: "GR-60418", poLine: "88430/3", slip: "KAS-PS-9031", docId: "D-08", counted: 100, plateSerial: "", labelExpiry: "", note: "" },
      { id: "GR-60419", poLine: "88433/1", slip: "DAS-PS-1187", docId: "D-09", counted: 1, plateSerial: "DU30655", labelExpiry: "", note: "" },
      { id: "GR-60420", poLine: "88433/2", slip: "KAS-PS-9034", docId: "D-10", counted: 4, plateSerial: "", labelExpiry: "", note: "" },
      { id: "GR-60421", poLine: "88436/1", slip: "KAS-PS-9034", docId: "", counted: 2, plateSerial: "", labelExpiry: "", note: "No release document in the box." },
      { id: "GR-60422", poLine: "88436/2", slip: "DAS-PS-1190", docId: "D-11", counted: 1, plateSerial: "", labelExpiry: "", note: "Data plate painted over, serial not readable." },
    ],
  },
  history: {
    title: "Earlier receipts",
    file: "receipts_2026.csv",
    cols: ["id", "date", "tracking", "partNo", "serial", "vendor"],
    heads: ["Receipt", "Date", "Tracking no.", "Part number", "Serial/Batch", "Vendor"],
    lines: [
      { id: "GR-59870", date: "2026-08-14", tracking: "HCR-47602", partNo: "DU-6142-3", serial: "DU30655", vendor: "Dunmere Aviation Spares" },
      { id: "GR-59911", date: "2026-08-27", tracking: "VCO-26-10140", partNo: "2234-901-3", serial: "BP09817", vendor: "Vallory Component Overhaul" },
      { id: "GR-60102", date: "2026-10-02", tracking: "OGF-117954", partNo: "F2210-14", serial: "Batch F0814", vendor: "Kestwick Aero Supply" },
    ],
  },
};
