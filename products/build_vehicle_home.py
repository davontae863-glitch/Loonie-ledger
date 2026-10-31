"""Builds Loonie-Ledger-Vehicle-and-Home-Office-Log.xlsx (bundle-only extra)"""
import sys
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.formatting.rule import FormulaRule
from common import *

N = 1000
FIRST = 6
LAST = FIRST + N - 1
SOURCES = [
    "CRA, Motor vehicle expenses (self-employed): https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses/motor-vehicle-expenses.html",
    "CRA, Business-use-of-home expenses: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses/business-use-home-expenses.html",
]

wb = Workbook()
S = wb.active; S.title = "Start Here"
S.column_dimensions["A"].width = 110
rows = [
    ("Loonie Ledger — Vehicle & Home-Office Log", f_title),
    (f"Version {VERSION}. Included with the Complete Bundle.", f_note),
    ("", None),
    ("Vehicle", f_h2),
    ("1. Vehicle Log: type your odometer reading on January 1 and December 31 (or the day you started or stopped using the vehicle for business).", f_body),
    ("2. Log every business trip: date, where you went, why, and the kilometres. Driving between home and a regular place of work usually isn't business driving.", f_body),
    ("3. Vehicle Costs: type the year's costs. The sheet applies your business-use percentage.", f_body),
    ("CRA expects a logbook to back up your business kilometres. CRA also limits the interest and lease costs you can claim for passenger vehicles, and capital cost allowance (CCA) is worked out separately; see the CRA page below or ask an accountant.", f_body),
    ("", None),
    ("Home office", f_h2),
    ("4. Home Office: type the size of your workspace and your home, and the year's home costs. The sheet works out the business share.", f_body),
    ("You can claim it if your home is your main place of business, or if you use the space only for business and meet clients there regularly.", f_body),
    ("Business-use-of-home expenses can't create or increase a business loss. Anything you can't use this year carries forward. Type your business income before home-office costs and the sheet applies this limit.", f_body),
    ("Homeowners: mortgage interest and property tax count; mortgage principal doesn't. Claiming CCA on your home can have tax consequences when you sell, so most people don't.", f_body),
    ("", None),
    ("Sources", f_h2),
] + [(s, f_note) for s in SOURCES] + [("", None)]
for i, (t, f) in enumerate(rows, start=1):
    c = S.cell(i, 1, t)
    if f: c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")
legend(S, len(rows) + 1)
end = notice_rows(S, len(rows) + 3)
S.cell(end + 1, 1, "Questions or a problem with the file? Email loonieledgerservices@gmail.com").font = f_body

def inp(ws, ref, v=None, fmt=None):
    c = ws[ref]; c.value = v; c.fill = fill_input; c.font = f_input; c.border = box
    if fmt: c.number_format = fmt
def calc(ws, ref, v, fmt=CUR, bold=False):
    c = ws[ref]; c.value = v; c.fill = fill_total if bold else fill_calc; c.font = f_bold if bold else f_body; c.border = box; c.number_format = fmt

# ---------------- Vehicle Log ----------------
V = wb.create_sheet("Vehicle Log")
V["A1"] = "Vehicle Log"; V["A1"].font = f_title
V.column_dimensions["A"].width = 13; V.column_dimensions["B"].width = 30; V.column_dimensions["C"].width = 36
V.column_dimensions["D"].width = 14; V.column_dimensions["E"].width = 4; V.column_dimensions["F"].width = 40; V.column_dimensions["G"].width = 16
header(V, 5, ["Date", "Where you went", "Business reason", "Business km"])
for r in range(FIRST, LAST + 1):
    for col in range(1, 5):
        c = V.cell(r, col); c.fill = fill_input; c.font = f_input; c.border = box
    V.cell(r, 1).number_format = DATE; V.cell(r, 4).number_format = "#,##0.0"
for col, v in enumerate([date(2026, 1, 8), "Client office, 123 Example St", "Example — delete this row", 24], start=1):
    V.cell(FIRST, col, v).font = f_example
number_validation(V, f"D{FIRST}:D{LAST}", 0)
V["F5"] = "Summary"; V["F5"].font = f_h2
labels = [("F6", "Year"), ("F7", "Odometer at start of year"), ("F8", "Odometer at end of year"), ("F9", "Total km driven"),
          ("F10", "Business km logged this year"), ("F11", "Business-use percentage"), ("F12", "Check")]
for ref, t in labels: V[ref] = t; V[ref].font = f_bold
inp(V, "G6", 2026, "0"); inp(V, "G7", None, "#,##0"); inp(V, "G8", None, "#,##0")
number_validation(V, "G6", 2020, 2100, kind="whole"); number_validation(V, "G7:G8", 0)
calc(V, "G9", '=IF(OR(G7="",G8=""),"",G8-G7)', "#,##0")
calc(V, "G10", f'=SUMPRODUCT((YEAR(A{FIRST}:A{LAST}+0)=G6)*(A{FIRST}:A{LAST}<>"")*D{FIRST}:D{LAST})', "#,##0.0")
calc(V, "G11", '=IF(OR(G9="",N(G9)<=0),"",MIN(1,G10/G9))', PCT, bold=True)
calc(V, "G12", '=IF(G9="","Enter both odometer readings",IF(G9<0,"End reading is lower than start",IF(G10>G9,"Business km are more than total km — check the log","OK")))', "@")
V.freeze_panes = "A6"

# ---------------- Vehicle Costs ----------------
C = wb.create_sheet("Vehicle Costs")
C["A1"] = "Vehicle Costs"; C["A1"].font = f_title
C.column_dimensions["A"].width = 46; C.column_dimensions["B"].width = 16; C.column_dimensions["C"].width = 16; C.column_dimensions["D"].width = 60
header(C, 3, ["Cost for the year", "Total paid", "Business share", "Note"])
costs = [
    ("Fuel and oil", ""), ("Maintenance and repairs", ""), ("Insurance", ""), ("Licence and registration", ""),
    ("Interest on a car loan", "CRA limits this for passenger vehicles."), ("Lease payments", "CRA limits this for passenger vehicles."),
    ("Car washes", ""), ("Other", ""),
]
for i, (t, note) in enumerate(costs):
    r = 4 + i
    C.cell(r, 1, t).font = f_body
    inp(C, f"B{r}", None, CUR)
    calc(C, f"C{r}", f"=IF(N('Vehicle Log'!$G$11)=0,0,N(B{r})*'Vehicle Log'!$G$11)")
    C.cell(r, 4, note).font = f_note
CL_ = 4 + len(costs) - 1
number_validation(C, f"B4:B{CL_}", 0)
r = CL_ + 1
C.cell(r, 1, "Total").font = f_bold
calc(C, f"B{r}", f"=SUM(B4:B{CL_})", bold=True); calc(C, f"C{r}", f"=SUM(C4:C{CL_})", bold=True)
C.cell(r + 2, 1, "Business parking and tolls").font = f_body
inp(C, f"B{r+2}", None, CUR); calc(C, f"C{r+2}", f"=N(B{r+2})")
C.cell(r + 2, 4, "Parking and tolls for business trips are claimed in full, not by percentage.").font = f_note
C.cell(r + 4, 1, "Vehicle costs to claim (before CCA)").font = f_bold
calc(C, f"C{r+4}", f"=C{r}+C{r+2}", bold=True)
C.cell(r + 4, 4, "On Form T2125 this goes on line 9281. Add CCA from your own calculation or your accountant.").font = f_note
VEH_TOTAL = f"C{r+4}"
notice_rows(C, r + 7)

# ---------------- Home Office ----------------
H = wb.create_sheet("Home Office")
H["A1"] = "Home Office"; H["A1"].font = f_title
H.column_dimensions["A"].width = 52; H.column_dimensions["B"].width = 16; H.column_dimensions["C"].width = 16; H.column_dimensions["D"].width = 60
H["A3"] = "Workspace area (sq ft or m²)"; H["A4"] = "Total finished area of your home (same unit)"; H["A5"] = "Business share of your home"
for ref in ("A3", "A4", "A5"): H[ref].font = f_bold
inp(H, "B3", None, "#,##0"); inp(H, "B4", None, "#,##0")
number_validation(H, "B3:B4", 0)
calc(H, "B5", '=IF(OR(N(B4)=0,N(B3)=0),0,MIN(1,B3/B4))', PCT, bold=True)
H["D4"] = "Hallways, kitchens and bathrooms you share with the household are usually left out of the workspace."; H["D4"].font = f_note
header(H, 7, ["Home cost for the year", "Total paid", "Business share", "Note"])
hcosts = [("Rent", "Tenants."), ("Electricity", ""), ("Heat", ""), ("Water", ""), ("Home or tenant insurance", ""),
          ("Maintenance and repairs", "Repairs to the whole home are shared; repairs only to the office count in full — put those in 'Office-only repairs'."),
          ("Mortgage interest", "Homeowners. Interest only, not principal."), ("Property tax", "Homeowners."), ("Other", "")]
for i, (t, note) in enumerate(hcosts):
    r = 8 + i
    H.cell(r, 1, t).font = f_body
    inp(H, f"B{r}", None, CUR)
    calc(H, f"C{r}", f"=N(B{r})*$B$5")
    H.cell(r, 4, note).font = f_note
HL = 8 + len(hcosts) - 1
number_validation(H, f"B8:B{HL}", 0)
r = HL + 1
H.cell(r, 1, "Office-only repairs").font = f_body; inp(H, f"B{r}", None, CUR); calc(H, f"C{r}", f"=N(B{r})")
r += 1
H.cell(r, 1, "Total business-use-of-home costs").font = f_bold
calc(H, f"B{r}", f"=SUM(B8:B{r-1})", bold=True); calc(H, f"C{r}", f"=SUM(C8:C{r-1})", bold=True)
TOT = r
r += 2
H.cell(r, 1, "Amount carried forward from last year").font = f_body; inp(H, f"B{r}", 0, CUR); CF = r
H.cell(r, 4, "From last year's Form T2125 (business-use-of-home expenses available to carry forward).").font = f_note
r += 1
H.cell(r, 1, "Your business income before home-office costs").font = f_body; inp(H, f"B{r}", None, CUR); INC = r
H.cell(r, 4, "Net income from your business after all other expenses. Leave blank if you don't know yet.").font = f_note
r += 1
number_validation(H, f"B{CF}:B{INC}", -10_000_000)
H.cell(r, 1, "You can claim this year").font = f_bold
calc(H, f"C{r}", f'=IF(B{INC}="",C{TOT}+N(B{CF}),MIN(C{TOT}+N(B{CF}),MAX(0,B{INC})))', bold=True); CLAIM = r
H.cell(r, 4, "Can't create or increase a business loss.").font = f_note
r += 1
H.cell(r, 1, "Carry forward to next year").font = f_bold
calc(H, f"C{r}", f"=C{TOT}+N(B{CF})-C{CLAIM}", bold=True)
notice_rows(H, r + 3)

for ws in wb.worksheets:
    ws.sheet_view.showGridLines = ws.title == "Vehicle Log"
    ws.page_setup.orientation = "landscape"; ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToHeight = 0
wb.active = 0
out = sys.argv[1] if len(sys.argv) > 1 else "Loonie-Ledger-Vehicle-and-Home-Office-Log.xlsx"
wb.save(out)
print("saved", out)
