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
SUB = 12.5 * 75 + 3 * 32.29   # 1034.37
r2 = lambda x: round(x + 1e-9, 2)
for preset, exp_lines in [
    ("Small supplier: no GST/HST", []),
    ("GST 5% (AB, BC, MB, SK, NT, NU, YT)", [("GST (5%)", r2(SUB * 0.05))]),
    ("HST 13% (ON)", [("HST (13%)", r2(SUB * 0.13))]),
    ("HST 14% (NS)", [("HST (14%)", r2(SUB * 0.14))]),
    ("HST 15% (NB, NL, PE)", [("HST (15%)", r2(SUB * 0.15))]),
    ("GST 5% + QST 9.975% (QC)", [("GST (5%)", r2(SUB * 0.05)), ("QST (9.975%)", r2(SUB * 0.09975))]),
]:
    exp_total = r2(SUB + sum(b for _, b in exp_lines))
    v = inv(preset, [("Design", 12.5, 75), ("Hosting", 3, 32.29)], gst_number="123456789RT0001")
    t_, lines = total(v)
    got = [(a, b) for a, b in lines if a]
    check(abs(t_ - exp_total) < 0.005 and [(a, r2(b)) for a, b in got] == exp_lines, f"Invoice: {preset} → {t_}")

# ---------- Room tracker ----------
def room(inputs, logs):
    wb = load_workbook(os.path.join(HERE, "dist/Loonie-Ledger-TFSA-RRSP-FHSA-Room-Tracker.xlsx"))
    m = wb["My Room"]
    labels = {m.cell(r, 1).value: r for r in range(1, m.max_row + 1)}
    for label, v in inputs.items(): m.cell(labels[label], 2, v)
    g = wb["Log"]
    for c in range(1, 7): g.cell(6, c).value = None
    for k, row in enumerate(logs):
        for c, v in enumerate(row, start=1): g.cell(6 + k, c, v)
    path = os.path.join(tmp, "room.xlsx"); wb.save(path)
    out = recalc(path)["My Room"]
    vals = {}
    for r in range(1, out.max_row + 1):
        if out.cell(r, 1).value: vals.setdefault(out.cell(r, 1).value, out.cell(r, 2).value)  # first = TFSA section
    return vals, out
vals, sheet = room({
    "TFSA contribution room on January 1 (from CRA My Account)": 7000,
    "Next year's TFSA limit (type it once CRA announces it)": 7000,
    "RRSP deduction limit for this year (from your Notice of Assessment)": 10000,
    "Year you opened your first FHSA": 2025,
    "FHSA participation room this year (from CRA My Account)": 16000,
    "Contributions and RRSP transfers in all earlier years": 8000,
}, [
    (date(2026, 1, 5), "TFSA", "Contribution", 5000), (date(2026, 3, 1), "TFSA", "Withdrawal", 2000),
    (date(2026, 4, 1), "TFSA", "Contribution", 3000), (date(2026, 5, 1), "TFSA", "Direct transfer between my own accounts", 4000),
    (date(2025, 12, 1), "TFSA", "Contribution", 999),
    (date(2026, 2, 1), "RRSP", "Contribution", 900, "", 2025), (date(2027, 2, 10), "RRSP", "Contribution", 11000, "", 2026),
    (date(2026, 6, 1), "FHSA", "Contribution", 8000), (date(2026, 7, 1), "FHSA", "Transfer in from my RRSP", 9000),
])
check(vals["Contributions this year"] == 8000, "Room: TFSA counts only this year's contributions, not transfers")
check(vals["Room left this year"] == -1000, "Room: re-contributing a same-year TFSA withdrawal puts you over")
glance = {sheet.cell(r, 1).value: sheet.cell(r, 3).value for r in range(1, sheet.max_row + 1)}
check(str(glance["TFSA"]).startswith("OVER"), "Room: TFSA status says over")
check(vals["Rough estimate of next year's room"] == 8000, "Room: next year = -1000 + 2000 withdrawn + 7000")
check(str(glance["RRSP"]).startswith("OVER") and vals["Over-contribution beyond the $2,000 cushion"] == 0, "Room: RRSP Feb-2027 claim counts for 2026; $1,000 over is inside the cushion")
check(vals["Lifetime limit left"] == 15000 and str(glance["FHSA"]).startswith("OVER"), "Room: FHSA counts RRSP transfers against annual and lifetime room")

# ---------- Household budget ----------
wb = load_workbook(os.path.join(HERE, "dist/Loonie-Ledger-Canadian-Household-Budget.xlsx"))
p = wb["Plan"]; rows_ = {p.cell(r, 2).value: r for r in range(6, p.max_row + 1)}
p.cell(rows_["Property tax"], 3, 300); p.cell(rows_["Property tax"], 9, 1200)   # June override
lg = wb["Log"]
for r in (6, 7):
    for c in range(1, 6): lg.cell(r, c).value = None
for k, row in enumerate([(date(2026, 6, 3), "Property tax", 1200), (date(2026, 6, 5), "Pay — person 1", 4200), (date(2026, 6, 9), "Groceries", 800),
                         (date(2026, 6, 20), "TFSA", 250), (date(2025, 6, 9), "Groceries", 999), (date(2026, 6, 10), "Not a category", 5)]):
    for c, v in enumerate(row, start=1): lg.cell(6 + k, c, v)
wb["Month View"]["B3"] = "June"
path = os.path.join(tmp, "budget.xlsx"); wb.save(path); wb = recalc(path)
mv = wb["Month View"]; m = {mv.cell(r, 2).value: [mv.cell(r, c).value for c in (3, 4, 5)] for r in range(6, mv.max_row + 1) if mv.cell(r, 2).value}
check(m["Property tax"] == [1200, 1200, 0], "Budget: a typed-over month replaces the usual amount")
check(m["Groceries"] == [700, 800, -100], "Budget: only this year's spending counts; over plan is negative")
check(m["Left over"][1] == 4200 - 1200 - 800 - 250, "Budget: left over = income − bills − spending − savings")
yv = wb["Year View"]
yrow_ = {yv.cell(r, 2).value: r for r in range(6, yv.max_row + 1)}
check(yv.cell(yrow_["Property tax"], 16).value == 300 * 11 + 1200, "Budget: year plan adds the override month")
check(abs(yv.cell(yrow_["Savings rate (savings ÷ income)"], 8).value - 250 / 4200) < 1e-9, "Budget: June savings rate")
check(yv.cell(yrow_["Log rows with a category not on your Plan"], 3).value == 1, "Budget: flags log rows with an unknown category")

# ---------- Vehicle & home office ----------
wb = load_workbook(os.path.join(HERE, "dist/Loonie-Ledger-Vehicle-and-Home-Office-Log.xlsx"))
v = wb["Vehicle Log"]; v["G7"], v["G8"] = 10000, 30000
v["A7"], v["D7"], v["A8"], v["D8"] = date(2026, 3, 1), 4976, date(2025, 12, 1), 500
c = wb["Vehicle Costs"]; c["B4"], c["B6"], c["B14"] = 3000, 1000, 120
h = wb["Home Office"]; h["B3"], h["B4"], h["B8"], h["B9"] = 150, 1500, 24000, 1200
hl = {h.cell(r, 1).value: r for r in range(1, h.max_row + 1)}
h.cell(hl["Office-only repairs"], 2, 100); h.cell(hl["Your business income before home-office costs"], 2, 1500); h.cell(hl["Amount carried forward from last year"], 2, 200)
path = os.path.join(tmp, "veh.xlsx"); wb.save(path); wb = recalc(path)
v = wb["Vehicle Log"]
check(v["G10"].value == 5000 and v["G11"].value == 0.25, "Vehicle: counts only this year's trips; 5,000 of 20,000 km = 25%")
cc = wb["Vehicle Costs"]; ct = {cc.cell(r, 1).value: cc.cell(r, 3).value for r in range(4, 25)}
check(ct["Vehicle costs to claim (before CCA)"] == 1120, "Vehicle: 25% of costs + parking in full")
h = wb["Home Office"]; ht = {h.cell(r, 1).value: h.cell(r, 3).value for r in range(1, h.max_row + 1)}
check(ht["You can claim this year"] == 1500 and ht["Carry forward to next year"] == 1320, "Home office: limited to business income, rest carried forward")

print(f"\n{fails} failure(s)" if fails else "\nAll product scenarios passed")
sys.exit(1 if fails else 0)
