"""Scenario tests for the spreadsheet products. Needs LibreOffice (recalc). Usage: python3 test_products.py <recalc.py>"""
import subprocess, sys, json, tempfile, os
from datetime import date
from openpyxl import load_workbook

RECALC = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
fails = 0
def check(ok, name):
    global fails
    print(("PASS " if ok else "FAIL ") + name)
    if not ok: fails += 1
def recalc(path):
    out = json.loads(subprocess.run([sys.executable, RECALC, path, "120"], capture_output=True, text=True).stdout)
    check(out.get("status") == "success" and out.get("total_errors") == 0, f"{os.path.basename(path)}: recalculates with zero errors")
    return load_workbook(path, data_only=True)

tmp = tempfile.mkdtemp()

# ---------- Bookkeeping tracker ----------
def bk(registered, province, incomes, expenses, home=None, vehicle=None):
    wb = load_workbook(os.path.join(HERE, "dist/Loonie-Ledger-Bookkeeping-GST-HST-Tracker.xlsx"))
    s = wb["Settings"]; s["B4"] = province; s["B6"] = registered
    i = wb["Income"]
    for c in range(1, 11): i.cell(6, c).value = None if c not in (7, 8, 9) else i.cell(6, c).value  # clear example
    for k, (d, p, amt) in enumerate(incomes):
        i.cell(6 + k, 1, d); i.cell(6 + k, 5, p); i.cell(6 + k, 6, amt)
    e = wb["Expenses"]
    for c in (1, 2, 3, 4, 5, 6, 8, 11): e.cell(6, c).value = None
    for k, (d, cat, amt, tax, biz) in enumerate(expenses):
        e.cell(6 + k, 1, d); e.cell(6 + k, 4, cat); e.cell(6 + k, 5, amt); e.cell(6 + k, 6, tax); e.cell(6 + k, 8, biz)
    h = wb["Home & Vehicle"]
    h["B4"], h["B5"] = home or (0, 0)
    h["B20"], h["B21"] = vehicle or (0, 0)
    path = os.path.join(tmp, f"bk_{registered}_{province}.xlsx"); wb.save(path)
    return recalc(path)

def ye(wb, line):
    y = wb["Year-End Summary"]
    for r in range(5, y.max_row + 1):
        if str(y.cell(r, 1).value) == line or y.cell(r, 2).value == line: return y.cell(r, 3).value
    raise KeyError(line)

# Scenario A: registered in Ontario, sells to ON, QC and NS clients.
wb = bk("Yes", "ON",
        [(date(2026, 1, 10), "ON", 1000), (date(2026, 2, 10), "QC", 1000), (date(2026, 3, 10), "NS", 1000), (date(2026, 4, 10), None, 500), (date(2025, 12, 1), "ON", 999)],
        [(date(2026, 1, 5), "8523 Meals and entertainment (50% deductible)", 200, 26, None),
         (date(2026, 2, 5), "9220 Telephone and utilities", 100, 13, 0.6),
         (date(2026, 3, 5), "8811 Office stationery and supplies", 50, 6.5, None)])
inc = wb["Income"]
check([inc.cell(r, 8).value for r in range(6, 10)] == [130, 50, 140, 65], "A: GST/HST charged by customer province (13%, 5%, 14%, blank→own 13%)")
check(ye(wb, "8299") == 3500, "A: gross income counts only the tax year, before tax")
check(ye(wb, "8523") == 100, "A: meals deducted at 50%")
check(ye(wb, "9220") == 60, "A: business-use % applied")
check(ye(wb, "GST/HST you charged") == 385, "A: GST/HST charged total")
check(abs(ye(wb, "Input tax credits (GST/HST you paid on business costs)") - (13 + 7.8 + 6.5)) < 0.001, "A: ITCs (meals 50%, phone 60%)")
check(ye(wb, "9369") == 3500 - 210, "A: net income before adjustments")

# Scenario B: not registered in Alberta: no GST charged, tax paid is part of the expense.
wb = bk("No", "AB", [(date(2026, 5, 1), "ON", 2000)], [(date(2026, 5, 2), "8810 Office expenses", 100, 5, None)],
        home=(100, 1000), vehicle=(10000, 2500))
check(wb["Income"].cell(6, 8).value == 0, "B: small supplier charges no GST/HST")
check(ye(wb, "8810") == 105, "B: unregistered expense includes the GST paid")
check(ye(wb, "Input tax credits (GST/HST you paid on business costs)") == 0, "B: no ITCs when not registered")
check(wb["Home & Vehicle"]["B6"].value == 0.1 and wb["Home & Vehicle"]["B22"].value == 0.25, "B: home 10% and vehicle 25% shares")

# Scenario C: threshold crossings.
wb = bk("No", "AB", [(date(2025, 10, 1), None, 9000), (date(2026, 1, 1), None, 9000), (date(2026, 4, 1), None, 9000), (date(2026, 7, 1), None, 4000)], [])
t = wb["GST Threshold"]
status = {t.cell(r, 1).value: t.cell(r, 4).value for r in range(9, 14)}
check(status["2026 Q3"].startswith("Over across four quarters"), "C: $31,000 over four quarters flags registration")
check(status["2026 Q2"] == "Small supplier: $3,000 to go", "C: under threshold shows amount to go")
wb = bk("No", "AB", [(date(2026, 8, 1), None, 30500)], [])
check(wb["GST Threshold"].cell(12, 4).value.startswith("Over in this quarter"), "C: single quarter over $30,000 flags immediately")

# Scenario D: home office can't create a loss.
wb = bk("No", "AB", [(date(2026, 3, 1), None, 1000)], [(date(2026, 3, 2), "8810 Office expenses", 900, 0, None)], home=(500, 1000))
w = load_workbook(os.path.join(tmp, "bk_No_AB.xlsx")); w["Home & Vehicle"]["B8"] = 2000; p = os.path.join(tmp, "bk_D.xlsx"); w.save(p)
wb = recalc(p)
check(ye(wb, "9945") == 100, "D: home office limited to remaining $100 of income")
check(ye(wb, "9946") == 0, "D: net after home office is zero, not negative")

# ---------- Invoice generator ----------
def inv(preset, items, gst_number=""):
    wb = load_workbook(os.path.join(HERE, "dist/Loonie-Ledger-Freelancer-Invoice-Generator.xlsx"))
    v = wb["Invoice"]; v["F3"] = preset; wb["Settings"]["B8"] = gst_number
    for r in range(15, 27): v.cell(r, 1).value = v.cell(r, 2).value = v.cell(r, 3).value = None
    for k, (d, q, p) in enumerate(items): v.cell(15 + k, 1, d); v.cell(15 + k, 2, q); v.cell(15 + k, 3, p)
    path = os.path.join(tmp, f"inv_{abs(hash(preset))}.xlsx"); wb.save(path)
    return recalc(path)["Invoice"]
def total(v):
    for r in range(25, 40):
        if v.cell(r, 3).value == "Total (CAD)": return v.cell(r, 4).value, [(v.cell(rr, 3).value, v.cell(rr, 4).value) for rr in range(r - 2, r)]
for preset, exp_total, exp_lines in [
    ("Small supplier: no GST/HST", 1033.37, []),
    ("GST 5% (AB, BC, MB, SK, NT, NU, YT)", 1085.04, [("GST (5%)", 51.67)]),
    ("HST 13% (ON)", 1167.71, [("HST (13%)", 134.34)]),
    ("HST 14% (NS)", 1178.04, [("HST (14%)", 144.67)]),
    ("HST 15% (NB, NL, PE)", 1188.38, [("HST (15%)", 155.01)]),
    ("GST 5% + QST 9.975% (QC)", 1188.12, [("GST (5%)", 51.67), ("QST (9.975%)", 103.08)]),
]:
    v = inv(preset, [("Design", 12.5, 75), ("Hosting", 3, 32.29)], gst_number="123456789RT0001")
    t_, lines = total(v)
    got = [(a, b) for a, b in lines if a]
    check(abs(t_ - exp_total) < 0.005 and got == exp_lines, f"Invoice: {preset} → {t_}")

print(f"\n{fails} failure(s)" if fails else "\nAll product scenarios passed")
sys.exit(1 if fails else 0)
