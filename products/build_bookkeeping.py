"""Builds Loonie-Ledger-Bookkeeping-GST-HST-Tracker.xlsx"""
import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font
from openpyxl.formatting.rule import FormulaRule, CellIsRule
from openpyxl.styles import PatternFill
from common import *

N = 600                      # data rows on Income and Expenses
FIRST = 6                    # first data row (row 5 = headers, row 6 = example)
LAST = FIRST + N - 1

CATEGORIES = [
    ("8521", "Advertising"), ("8523", "Meals and entertainment (50% deductible)"), ("8590", "Bad debts"),
    ("8690", "Insurance"), ("8710", "Interest and bank charges"), ("8760", "Business taxes, licences and memberships"),
    ("8810", "Office expenses"), ("8811", "Office stationery and supplies"), ("8860", "Professional fees (legal, accounting)"),
    ("8871", "Management and administration fees"), ("8910", "Rent"), ("8960", "Repairs and maintenance"),
    ("9060", "Salaries, wages and benefits"), ("9180", "Property taxes"), ("9200", "Travel"),
    ("9220", "Telephone and utilities"), ("9224", "Fuel costs (not for motor vehicles)"), ("9275", "Delivery, freight and express"),
    ("9281", "Motor vehicle expenses (or use the Vehicle sheet)"), ("9270", "Other expenses"),
]
CAT_LABELS = [f"{c} {n}" for c, n in CATEGORIES]

wb = Workbook()

# ---------------- Lists (reference data) ----------------
L = wb.active; L.title = "Lists"
L["A1"] = "Reference data"; L["A1"].font = f_title
L["A2"] = f"Rates checked {RATES_AS_OF}. GST/HST is the federal tax (HST includes the provincial part). PST, RST and QST are separate provincial taxes with their own registration."; L["A2"].font = f_note
header(L, 4, ["Code", "Province or territory", "GST/HST rate", "Provincial tax", "Provincial rate", "Combined"], [8, 28, 14, 14, 14, 12])
for i, (code, name, g, pn, pr) in enumerate(PROVINCES):
    r = 5 + i
    for col, v in enumerate([code, name, g, pn or "None", pr], start=1):
        c = L.cell(r, col, v); c.font = f_body; c.border = box
    L.cell(r, 6, f"=C{r}+E{r}").font = f_body
    for col in (3, 5, 6): L.cell(r, col).number_format = "0.000%"
PROV_END = 5 + len(PROVINCES) - 1
r = PROV_END + 2
L.cell(r, 1, "Sources").font = f_bold
for i, s in enumerate(RATE_SOURCES): L.cell(r + 1 + i, 1, s).font = f_note
r = r + len(RATE_SOURCES) + 3
CAT_ROW = r
header(L, r, ["Line", "T2125 expense category", "Deductible share"], None)
for i, (code, name) in enumerate(CATEGORIES):
    rr = r + 1 + i
    L.cell(rr, 1, code).font = f_body
    L.cell(rr, 2, f"{code} {name}").font = f_body
    c = L.cell(rr, 3, 0.5 if code == "8523" else 1); c.number_format = "0%"; c.font = f_body
CAT_FIRST, CAT_LAST = CAT_ROW + 1, CAT_ROW + len(CATEGORIES)
L.cell(CAT_LAST + 2, 1, "Category labels follow Form T2125 (Statement of Business or Professional Activities). Source: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/sole-proprietorships-partnerships/business-expenses.html").font = f_note
L.cell(CAT_LAST + 3, 1, "Yes/No").font = f_bold; L.cell(CAT_LAST + 4, 1, "Yes"); L.cell(CAT_LAST + 5, 1, "No")
YN = f"Lists!$A${CAT_LAST+4}:$A${CAT_LAST+5}"
PROV_CODES = f"Lists!$A$5:$A${PROV_END}"
CAT_RANGE = f"Lists!$B${CAT_FIRST}:$B${CAT_LAST}"

# ---------------- Start Here ----------------
S = wb.create_sheet("Start Here", 0)
S.column_dimensions["A"].width = 110
rows = [
    ("Loonie Ledger — Sole-Proprietor Bookkeeping & GST/HST Tracker", f_title),
    (f"Version {VERSION}. Money tools made for Canada.", f_note),
    ("", None),
    ("Set up (5 minutes)", f_h2),
    ("1. Open Settings. Pick your province, enter the tax year, and say whether you're registered for GST/HST.", f_body),
    ("2. Log every sale on Income and every business cost on Expenses, one row each. Delete the blue example rows when you start.", f_body),
    ("3. Check GST Threshold any time to see your running four-quarter total against $30,000.", f_body),
    ("4. If you work from home or drive for work, fill in Home & Vehicle.", f_body),
    ("5. At year end, Year-End Summary shows your totals by T2125 line, ready for your return or your accountant.", f_body),
    ("", None),
    ("Colours", f_h2),
    ("Pale yellow cells are for you to type in. Pale green cells are calculated for you; leave them alone. Blue italic rows are examples.", f_body),
    ("", None),
    ("How tax is handled", f_h2),
    ("Income: GST/HST charged is worked out from your customer's province (place of supply). If you aren't registered, it's $0.", f_body),
    ("Expenses: if you're registered, the GST/HST you paid becomes an input tax credit and the expense is counted before tax. If you aren't registered, the whole amount you paid is the expense.", f_body),
    ("Meals and entertainment are counted at 50%, for both the deduction and the input tax credit.", f_body),
    ("PST, RST and QST are separate provincial taxes. This tracker records GST/HST only; if you're registered for a provincial tax, track it separately.", f_body),
    ("", None),
    ("Good to know", f_h2),
    ("The small-supplier threshold counts all your taxable sales worldwide, from every business you run, not just this one.", f_body),
    ("Taxi and rideshare drivers must register for GST/HST from their first fare, even under $30,000.", f_body),
    ("Capital cost allowance (CCA) for equipment and vehicles is complex; enter the amount from your own calculation or your accountant on Year-End Summary.", f_body),
    ("Keep your receipts: CRA can ask to see them. Mark 'Receipt kept' on each expense.", f_body),
    ("", None),
]
for i, (t, f) in enumerate(rows, start=1):
    c = S.cell(i, 1, t)
    if f: c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")
legend(S, len(rows) + 1)
end = notice_rows(S, len(rows) + 3)
S.cell(end + 1, 1, "Questions or a problem with the file? Email loonieledgerservices@gmail.com").font = f_body

# ---------------- Settings ----------------
G = wb.create_sheet("Settings", 1)
G.column_dimensions["A"].width = 38; G.column_dimensions["B"].width = 26; G.column_dimensions["C"].width = 60
G["A1"] = "Settings"; G["A1"].font = f_title
settings = [
    ("Business name", "Your business name", "Shows on the summary."),
    ("Your province or territory (code)", "AB", "Used when a sale has no customer province."),
    ("Tax year", 2026, "Calendar year you're tracking (sole proprietors almost always use Jan 1 to Dec 31)."),
    ("Registered for GST/HST?", "No", "Yes if you have a GST/HST account and charge tax."),
    ("GST/HST number (if registered)", "", "Your 9-digit business number + RT0001."),
]
for i, (a, b, c) in enumerate(settings):
    r = 3 + i
    G.cell(r, 1, a).font = f_bold
    cell = G.cell(r, 2, b); cell.fill = fill_input; cell.font = f_input; cell.border = box
    G.cell(r, 3, c).font = f_note
G["A9"] = "Your GST/HST rate"; G["A9"].font = f_bold
G["B9"] = f"=IFERROR(INDEX(Lists!$C$5:$C${PROV_END},MATCH(B4,{PROV_CODES},0)),0)"; G["B9"].number_format = "0.0%"; G["B9"].fill = fill_calc
G["C9"] = "Looked up from your province."; G["C9"].font = f_note
list_validation(G, PROV_CODES, "B4", "Pick your province or territory code")
list_validation(G, YN, "B6")
number_validation(G, "B5", 2020, 2040, kind="whole")
PROV = "Settings!$B$4"; YEAR = "Settings!$B$5"; REG = "Settings!$B$6"

# ---------------- Income ----------------
I = wb.create_sheet("Income", 2)
I["A1"] = "Income"; I["A1"].font = f_title
I["A2"] = "One row per sale or invoice. Amounts before GST/HST. Delete the example row when you start."; I["A2"].font = f_note
legend(I, 3)
cols = ["Date", "Invoice #", "Client", "Description", "Customer province", "Sale amount (before tax)", "GST/HST rate", "GST/HST charged", "Total billed", "Date paid", "Quarter", "Year"]
header(I, 5, cols, [12, 11, 22, 30, 11, 15, 10, 14, 14, 12, 10, 8])
example = ["2026-01-15", "1001", "Example client", "Example: logo design", "ON", 800]
from datetime import date
for r in range(FIRST, LAST + 1):
    for col in range(1, 7):
        c = I.cell(r, col); c.fill = fill_input; c.border = box; c.font = f_input
    I.cell(r, 1).number_format = DATE; I.cell(r, 10).number_format = DATE
    I.cell(r, 10).fill = fill_input; I.cell(r, 10).border = box; I.cell(r, 10).font = f_input
    I.cell(r, 6).number_format = CUR
    I.cell(r, 7, f'=IF(F{r}="","",IF({REG}="Yes",IFERROR(INDEX(Lists!$C$5:$C${PROV_END},MATCH(IF(E{r}="",{PROV},E{r}),{PROV_CODES},0)),0),0))').number_format = "0.0%"
    I.cell(r, 8, f'=IF(F{r}="","",ROUND(F{r}*G{r},2))').number_format = CUR
    I.cell(r, 9, f'=IF(F{r}="","",F{r}+H{r})').number_format = CUR
    I.cell(r, 11, f'=IF(A{r}="","",YEAR(A{r})*10+ROUNDUP(MONTH(A{r})/3,0))')
    I.cell(r, 12, f'=IF(A{r}="","",YEAR(A{r}))')
    for col in (7, 8, 9, 11, 12):
        I.cell(r, col).fill = fill_calc; I.cell(r, col).border = box; I.cell(r, col).font = f_body
d = I.cell(FIRST, 1); d.value = date(2026, 1, 15)
for col, v in enumerate(example[1:], start=2): I.cell(FIRST, col, v)
I.cell(FIRST, 10, date(2026, 1, 30))
for col in (1, 2, 3, 4, 5, 6, 10): I.cell(FIRST, col).font = f_example
list_validation(I, PROV_CODES, f"E{FIRST}:E{LAST}", "Customer's province (where the service or product is supplied). Leave blank to use yours.")
number_validation(I, f"F{FIRST}:F{LAST}", 0)
I.freeze_panes = "B6"

# ---------------- Expenses ----------------
E = wb.create_sheet("Expenses", 3)
E["A1"] = "Expenses"; E["A1"].font = f_title
E["A2"] = "One row per business cost. Pick the T2125 category, enter the amount before tax and the GST/HST on the receipt."; E["A2"].font = f_note
legend(E, 3)
cols = ["Date", "Vendor", "What it was for", "T2125 category", "Amount before tax", "GST/HST paid", "Total paid", "Business use %", "Deductible amount", "Input tax credit", "Receipt kept?", "Year"]
header(E, 5, cols, [12, 20, 28, 38, 14, 12, 13, 11, 15, 14, 10, 8])
for r in range(FIRST, LAST + 1):
    for col in (1, 2, 3, 4, 5, 6, 8, 11):
        c = E.cell(r, col); c.fill = fill_input; c.border = box; c.font = f_input
    E.cell(r, 1).number_format = DATE
    for col in (5, 6): E.cell(r, col).number_format = CUR
    E.cell(r, 8).number_format = "0%"
    E.cell(r, 7, f'=IF(E{r}="","",E{r}+N(F{r}))').number_format = CUR
    share = f'IFERROR(INDEX(Lists!$C${CAT_FIRST}:$C${CAT_LAST},MATCH(D{r},{CAT_RANGE},0)),1)'
    biz = f'IF(H{r}="",1,H{r})'
    E.cell(r, 9, f'=IF(E{r}="","",ROUND(IF({REG}="Yes",E{r},E{r}+N(F{r}))*{biz}*{share},2))').number_format = CUR
    E.cell(r, 10, f'=IF(E{r}="","",IF({REG}="Yes",ROUND(N(F{r})*{biz}*{share},2),0))').number_format = CUR
    E.cell(r, 12, f'=IF(A{r}="","",YEAR(A{r}))')
    for col in (7, 9, 10, 12):
        E.cell(r, col).fill = fill_calc; E.cell(r, col).border = box; E.cell(r, col).font = f_body
ex = [date(2026, 1, 20), "Example: Staples", "Example: printer paper", "8811 Office stationery and supplies", 40, 2, None, 1, None, None, "Yes"]
for col, v in enumerate(ex, start=1):
    if v is not None and col not in (7, 9, 10): E.cell(FIRST, col, v).font = f_example
list_validation(E, CAT_RANGE, f"D{FIRST}:D{LAST}", "Pick the T2125 line this expense belongs to")
list_validation(E, YN, f"K{FIRST}:K{LAST}")
number_validation(E, f"E{FIRST}:F{LAST}", 0)
number_validation(E, f"H{FIRST}:H{LAST}", 0, 1)
E.freeze_panes = "B6"

# ---------------- GST Threshold ----------------
T = wb.create_sheet("GST Threshold", 4)
T.column_dimensions["A"].width = 16; T.column_dimensions["B"].width = 18; T.column_dimensions["C"].width = 22; T.column_dimensions["D"].width = 44
T["A1"] = "GST/HST small-supplier threshold"; T["A1"].font = f_title
T["A2"] = "Taxable sales by calendar quarter (from Income, before tax). You stop being a small supplier when one quarter, or the last four quarters together, pass $30,000."; T["A2"].font = f_note
T["A3"] = "Threshold"; T["A3"].font = f_bold; T["B3"] = 30000; T["B3"].number_format = CUR; T["B3"].fill = fill_calc
header(T, 5, ["Quarter", "Sales this quarter", "Last four quarters", "Status"])
for i in range(8):
    r = 6 + i
    yr = f"({YEAR}-1+INT({i}/4))"
    q = (i % 4) + 1
    T.cell(r, 1, f'={yr}&" Q{q}"')
    T.cell(r, 2, f"=SUMIFS(Income!$F${FIRST}:$F${LAST},Income!$K${FIRST}:$K${LAST},{yr}*10+{q})").number_format = CUR
    if i >= 3:
        T.cell(r, 3, f"=SUM(B{r-3}:B{r})").number_format = CUR
        T.cell(r, 4, f'=IF(B{r}>$B$3,"Over in this quarter: register now",IF(C{r}>$B$3,"Over across four quarters: register","Small supplier: "&TEXT($B$3-C{r},"$#,##0")&" to go"))')
    else:
        T.cell(r, 3, "earlier quarters"); T.cell(r, 3).font = f_note
        T.cell(r, 4, f'=IF(B{r}>$B$3,"Over in this quarter: register now","")')
    for col in range(1, 5):
        c = T.cell(r, col); c.border = box; c.fill = fill_calc
        if c.font != f_note: c.font = f_body
T.conditional_formatting.add("D6:D13", FormulaRule(formula=['LEFT(D6,4)="Over"'], font=Font(name=FONT, color="A14A1A", bold=True)))
T["A15"] = "When you pass the threshold, CRA says when your registration must take effect. Read: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/when-register-charge.html"; T["A15"].font = f_note
T["A16"] = "Counts only sales logged on Income. Add sales from any other business you run, because the threshold includes all of them."; T["A16"].font = f_note

# ---------------- Home & Vehicle ----------------
H = wb.create_sheet("Home & Vehicle", 5)
H.column_dimensions["A"].width = 42; H.column_dimensions["B"].width = 18; H.column_dimensions["C"].width = 60
H["A1"] = "Home office and vehicle"; H["A1"].font = f_title
H["A3"] = "Business use of home"; H["A3"].font = f_h2
home_inputs = [("Workspace area (sq ft)", 120), ("Total finished area of home (sq ft)", 1200)]
for i, (a, v) in enumerate(home_inputs):
    r = 4 + i; H.cell(r, 1, a).font = f_body
    c = H.cell(r, 2, v); c.fill = fill_input; c.font = f_example; c.border = box
H["A6"] = "Business-use share"; H["A6"].font = f_bold
H["B6"] = "=IF(N(B5)=0,0,MIN(1,B4/B5))"; H["B6"].number_format = "0.0%"; H["B6"].fill = fill_calc
H["C6"] = "Only if the space is your main place of business, or used only for business and regularly to meet clients."; H["C6"].font = f_note
home_exp = ["Rent (if you rent)", "Mortgage interest (not principal)", "Electricity, heat and water", "Home insurance", "Property taxes", "Maintenance and repairs", "Internet (business share entered here or on Expenses, not both)"]
for i, a in enumerate(home_exp):
    r = 8 + i; H.cell(r, 1, a).font = f_body
    c = H.cell(r, 2); c.fill = fill_input; c.border = box; c.number_format = CUR; c.font = f_input
H["A15"] = "Total home costs for the year"; H["A15"].font = f_bold
H["B15"] = "=SUM(B8:B14)"; H["B15"].number_format = CUR; H["B15"].fill = fill_calc
H["A16"] = "Business-use-of-home claim (before limit)"; H["A16"].font = f_bold
H["B16"] = "=ROUND(B15*B6,2)"; H["B16"].number_format = CUR; H["B16"].fill = fill_calc
H["C16"] = "Year-End Summary limits this so it can't create or increase a loss (line 9945)."; H["C16"].font = f_note

H["A19"] = "Motor vehicle"; H["A19"].font = f_h2
veh_inputs = [("Total kilometres driven this year", 15000), ("Business kilometres (from your trip log)", 6000)]
for i, (a, v) in enumerate(veh_inputs):
    r = 20 + i; H.cell(r, 1, a).font = f_body
    c = H.cell(r, 2, v); c.fill = fill_input; c.font = f_example; c.border = box
H["A22"] = "Business-use share"; H["A22"].font = f_bold
H["B22"] = "=IF(N(B20)=0,0,MIN(1,B21/B20))"; H["B22"].number_format = "0.0%"; H["B22"].fill = fill_calc
veh_exp = ["Fuel", "Insurance", "Licence and registration", "Maintenance and repairs", "Interest on vehicle loan", "Leasing costs"]
for i, a in enumerate(veh_exp):
    r = 24 + i; H.cell(r, 1, a).font = f_body
    c = H.cell(r, 2); c.fill = fill_input; c.border = box; c.number_format = CUR; c.font = f_input
H["A30"] = "Total vehicle costs"; H["A30"].font = f_bold
H["B30"] = "=SUM(B24:B29)"; H["B30"].number_format = CUR; H["B30"].fill = fill_calc
H["A31"] = "Vehicle claim (goes to line 9281)"; H["A31"].font = f_bold
H["B31"] = "=ROUND(B30*B22,2)"; H["B31"].number_format = CUR; H["B31"].fill = fill_calc
H["C31"] = "Enter what you paid. If you're GST/HST registered, enter amounts before tax and claim the tax as an input tax credit. CRA limits interest and lease amounts for passenger vehicles; check the motor vehicle expenses page."; H["C31"].font = f_note; H["C31"].alignment = wrap
H["A33"] = "Example numbers in blue: replace them with yours. Keep a trip log (date, destination, purpose, km) for each business trip."; H["A33"].font = f_note
number_validation(H, "B4:B5", 0); number_validation(H, "B20:B21", 0)

# ---------------- Year-End Summary ----------------
Y = wb.create_sheet("Year-End Summary", 6)
Y.column_dimensions["A"].width = 12; Y.column_dimensions["B"].width = 48; Y.column_dimensions["C"].width = 18; Y.column_dimensions["D"].width = 50
Y["A1"] = '="Year-end summary "&Settings!B5'; Y["A1"].font = f_title
Y["A2"] = "=Settings!B3"; Y["A2"].font = f_note
header(Y, 4, ["T2125 line", "Item", "Amount", "Notes"])
r = 5
def yrow(line, item, formula, note="", bold=False, fmt=CUR, fill=fill_calc):
    global r
    Y.cell(r, 1, line).font = f_bold if bold else f_body
    Y.cell(r, 2, item).font = f_bold if bold else f_body
    c = Y.cell(r, 3, formula); c.number_format = fmt; c.fill = fill; c.font = f_bold if bold else f_body
    Y.cell(r, 4, note).font = f_note
    for col in range(1, 5): Y.cell(r, col).border = box
    r += 1
    return r - 1
inc = yrow("3A / 3B", "Sales, commissions or fees (before GST/HST)", f"=SUMIFS(Income!$F${FIRST}:$F${LAST},Income!$L${FIRST}:$L${LAST},{YEAR})", "Business (3A) or professional (3B) income, depending on your work.")
gross = yrow("8299", "Gross business income", f"=C{inc}", "Add other income (line 8230) yourself if you have any.", bold=True)
r += 1
first_exp = r
for code, name in CATEGORIES:
    label = f"{code} {name}"
    f = f"=SUMIFS(Expenses!$I${FIRST}:$I${LAST},Expenses!$D${FIRST}:$D${LAST},\"{label}\",Expenses!$L${FIRST}:$L${LAST},{YEAR})"
    if code == "9281":
        f += "+'Home & Vehicle'!B31"
    yrow(code, name.split(" (")[0], f, "Includes the Vehicle sheet claim." if code == "9281" else ("Already reduced to 50%." if code == "8523" else ""))
cca = yrow("9936", "Capital cost allowance (CCA)", 0, "Type your CCA amount here (from your own calculation or your accountant).", fill=fill_input)
Y.cell(cca, 3).font = f_input
last_exp = r - 1
tot = yrow("9368", "Total business expenses", f"=SUM(C{first_exp}:C{last_exp})", bold=True)
net = yrow("9369", "Net income (loss) before adjustments", f"=C{gross}-C{tot}", bold=True)
home = yrow("9945", "Business-use-of-home expenses", f"=MIN('Home & Vehicle'!B16,MAX(0,C{net}))", "Limited so it can't create or increase a loss; any extra can be carried forward.")
yrow("9946", "Net income (loss) after home expenses", f"=C{net}-C{home}", "Goes to your T1 return (line 13500 for business income, 13700 for professional).", bold=True, fill=fill_total)
r += 1
Y.cell(r, 2, "GST/HST for the year (if registered)").font = f_h2; r += 1
col_ = yrow("", "GST/HST you charged", f"=SUMIFS(Income!$H${FIRST}:$H${LAST},Income!$L${FIRST}:$L${LAST},{YEAR})")
itc = yrow("", "Input tax credits (GST/HST you paid on business costs)", f"=SUMIFS(Expenses!$J${FIRST}:$J${LAST},Expenses!$L${FIRST}:$L${LAST},{YEAR})")
yrow("", "Net GST/HST (positive = you owe, negative = refund)", f"=C{col_}-C{itc}", "Report on your GST/HST return for each reporting period, not just at year end.", bold=True)
r += 1
notice_rows(Y, r + 1)

# Order and print setup
wb.move_sheet("Lists", offset=len(wb.sheetnames))
for ws in wb.worksheets:
    ws.sheet_view.showGridLines = ws.title in ("Income", "Expenses")
    ws.page_setup.orientation = "landscape"; ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToHeight = 0
wb.active = 0
out = sys.argv[1] if len(sys.argv) > 1 else "Loonie-Ledger-Bookkeeping-GST-HST-Tracker.xlsx"
wb.save(out)
print("saved", out)
