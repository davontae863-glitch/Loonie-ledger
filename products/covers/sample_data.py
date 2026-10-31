"""Fills each product with clearly-labelled example data, recalculates it with LibreOffice,
and writes the computed values to covers/data.json for the cover images.
Every number on a cover comes from the real spreadsheet, not typed in by hand.
Usage: python3 sample_data.py <recalc.py>"""
import json, os, subprocess, sys, tempfile
from datetime import date
from openpyxl import load_workbook

RECALC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "..", "dist")
tmp = tempfile.mkdtemp()
out = {}

def calc(wb, name):
    p = os.path.join(tmp, name); wb.save(p)
    r = json.loads(subprocess.run([sys.executable, RECALC, p, "120"], capture_output=True, text=True).stdout)
    assert r.get("status") == "success" and r.get("total_errors") == 0, r
    return load_workbook(p, data_only=True)

# Bookkeeping: registered in Alberta, clients in four provinces.
wb = load_workbook(os.path.join(DIST, "Loonie-Ledger-Bookkeeping-GST-HST-Tracker.xlsx"))
wb["Settings"]["B4"] = "AB"; wb["Settings"]["B6"] = "Yes"
inc = wb["Income"]
rows = [(date(2026, 1, 12), "1001", "Northern Lights Co.", "ON", 2400), (date(2026, 2, 3), "1002", "Prairie Bakery", "AB", 850),
        (date(2026, 3, 18), "1003", "Atelier Fleuve", "QC", 1600), (date(2026, 4, 9), "1004", "Harbourview Dental", "NS", 1200),
        (date(2026, 5, 22), "1005", "Rocky Mtn Outfitters", "AB", 3100), (date(2026, 6, 30), "1006", "Northern Lights Co.", "ON", 2750)]
for k, (d, n, c, p, a) in enumerate(rows):
    r = 6 + k
    inc.cell(r, 1, d); inc.cell(r, 2, n); inc.cell(r, 3, c); inc.cell(r, 4, "Design work"); inc.cell(r, 5, p); inc.cell(r, 6, a); inc.cell(r, 10, None)
v = calc(wb, "bk.xlsx")
i = v["Income"]
out["bookkeeping"] = {
    "rows": [[i.cell(r, 1).value.strftime("%Y-%m-%d"), i.cell(r, 3).value, i.cell(r, 5).value, i.cell(r, 6).value, i.cell(r, 7).value, i.cell(r, 8).value]
             for r in range(6, 6 + len(rows))],
    "threshold": [[v["GST Threshold"].cell(r, 1).value, v["GST Threshold"].cell(r, 2).value] for r in range(6, 14)],
}

# Invoice: Ontario client, HST 13%.
wb = load_workbook(os.path.join(DIST, "Loonie-Ledger-Freelancer-Invoice-Generator.xlsx"))
s = wb["Settings"]
s["B3"], s["B4"], s["B5"], s["B6"], s["B8"] = "Maple Studio", "100 Example Ave", "Calgary, AB  T2P 0A0", "hello@example.ca", "123456789RT0001"
iv = wb["Invoice"]; iv["F3"] = "HST 13% (ON)"; iv["D2"] = 1042; iv["D3"] = date(2026, 11, 1)
for r in range(15, 27): iv.cell(r, 1).value = iv.cell(r, 2).value = iv.cell(r, 3).value = None
for k, (d, q, p) in enumerate([("Brand identity design", 1, 1800), ("Website pages", 6, 225), ("Hosting setup", 1, 150)]):
    iv.cell(15 + k, 1, d); iv.cell(15 + k, 2, q); iv.cell(15 + k, 3, p)
v = calc(wb, "inv.xlsx")["Invoice"]
out["invoice"] = {
    "from": [v["A1"].value, v["A2"].value, v["A3"].value], "gst": v["A5"].value,
    "bill_to": v["A8"].value, "number": v["D2"].value, "date": "2026-11-01", "due": v["D4"].value.strftime("%Y-%m-%d") if v["D4"].value else "",
    "lines": [[v.cell(r, 1).value, v.cell(r, 2).value, v.cell(r, 3).value, v.cell(r, 4).value] for r in range(15, 18)],
    "subtotal": v["D27"].value, "tax": [v["C28"].value, v["D28"].value], "total": v["D30"].value,
}

# Room tracker.
wb = load_workbook(os.path.join(DIST, "Loonie-Ledger-TFSA-RRSP-FHSA-Room-Tracker.xlsx"))
m = wb["My Room"]; lab = {m.cell(r, 1).value: r for r in range(1, m.max_row + 1)}
for k, val in {"TFSA contribution room on January 1 (from CRA My Account)": 21000,
               "RRSP deduction limit for this year (from your Notice of Assessment)": 12400,
               "Year you opened your first FHSA": 2024,
               "FHSA participation room this year (from CRA My Account)": 8000,
               "Contributions and RRSP transfers in all earlier years": 16000}.items():
    m.cell(lab[k], 2, val)
g = wb["Log"]
for c in range(1, 7): g.cell(6, c).value = None
for k, row in enumerate([(date(2026, 1, 10), "TFSA", "Contribution", 7000), (date(2026, 3, 1), "RRSP", "Contribution", 6000),
                         (date(2026, 6, 15), "FHSA", "Contribution", 8000), (date(2026, 9, 2), "TFSA", "Contribution", 2500)]):
    for c, val in enumerate(row, start=1): g.cell(6 + k, c, val)
v = calc(wb, "room.xlsx")["My Room"]
glance = [[v.cell(r, 1).value, v.cell(r, 2).value, v.cell(r, 3).value] for r in range(1, v.max_row + 1) if v.cell(r, 1).value in ("TFSA", "RRSP", "FHSA") and v.cell(r, 3).value]
room_vals = {"TFSA": 21000, "RRSP": 12400, "FHSA": 8000}
out["room"] = {"rows": [[a, room_vals[a], b, c] for a, b, c in glance]}

# Budget: June.
wb = load_workbook(os.path.join(DIST, "Loonie-Ledger-Canadian-Household-Budget.xlsx"))
p = wb["Plan"]; pr = {p.cell(r, 2).value: r for r in range(6, p.max_row + 1)}
plan = {"Pay — person 1": 4200, "Pay — person 2": 2600, "Canada Child Benefit": 620, "Rent or mortgage": 2100, "Electricity": 95,
        "Phone": 80, "Internet": 85, "Car insurance": 160, "Groceries": 900, "Eating out": 200, "Kids": 150, "Emergency fund": 300,
        "TFSA": 400, "RESP": 210}
for k in pr:
    if k: p.cell(pr[k], 3, plan.get(k))
lg = wb["Log"]
for r in (6, 7):
    for c in range(1, 6): lg.cell(r, c).value = None
actual = [("Pay — person 1", 4200), ("Pay — person 2", 2600), ("Canada Child Benefit", 620), ("Rent or mortgage", 2100), ("Electricity", 88.4),
          ("Phone", 80), ("Internet", 85), ("Car insurance", 160), ("Groceries", 962.35), ("Eating out", 146.2), ("Kids", 121.5),
          ("Emergency fund", 300), ("TFSA", 400), ("RESP", 210)]
for k, (cat, a) in enumerate(actual):
    lg.cell(6 + k, 1, date(2026, 6, 1 + k)); lg.cell(6 + k, 2, cat); lg.cell(6 + k, 3, a)
wb["Month View"]["B3"] = "June"
v = calc(wb, "budget.xlsx")["Month View"]
mv = {v.cell(r, 2).value: [v.cell(r, 3).value, v.cell(r, 4).value, v.cell(r, 5).value] for r in range(6, v.max_row + 1) if v.cell(r, 2).value}
show = ["Rent or mortgage", "Groceries", "Eating out", "Kids", "TFSA", "RESP", "Total income", "Left over"]
out["budget"] = {"rows": [[k] + mv[k] for k in show]}

json.dump(out, open(os.path.join(HERE, "data.json"), "w"), indent=1, default=str)
print(json.dumps(out, indent=1, default=str)[:3000])
