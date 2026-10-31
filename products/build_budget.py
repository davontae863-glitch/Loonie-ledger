"""Builds Loonie-Ledger-Canadian-Household-Budget.xlsx"""
import sys
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter as CL
from common import *

N = 1500
FIRST = 6
LAST = FIRST + N - 1
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

GROUPS = [
    ("Income", ["Pay — person 1", "Pay — person 2", "Canada Child Benefit", "GST/HST credit", "Side income", "Other income", "", ""]),
    ("Bills", ["Rent or mortgage", "Property tax", "Electricity", "Heat / natural gas", "Water and sewer", "Home or tenant insurance",
               "Phone", "Internet", "Car payment", "Car insurance", "Transit pass", "Childcare", "Subscriptions", "Debt payments", "", ""]),
    ("Spending", ["Groceries", "Gas for the car", "Car maintenance", "Eating out", "Household items", "Clothing", "Kids", "Pets",
                  "Health, dental and prescriptions", "Gifts and holidays", "Fun and entertainment", "Personal care", "Other spending", "", ""]),
    ("Savings", ["Emergency fund", "TFSA", "RRSP", "FHSA", "RESP", "Other savings", "", ""]),
]
EXAMPLE_PLAN = {"Pay — person 1": 4200, "Canada Child Benefit": 0, "Rent or mortgage": 1800, "Electricity": 90, "Phone": 75,
                "Internet": 80, "Groceries": 700, "Emergency fund": 200, "TFSA": 250}

wb = Workbook()

# ---------------- Plan ----------------
P = wb.active; P.title = "Plan"
P["A1"] = "Plan"; P["A1"].font = f_title
P["A2"] = "Type your usual monthly amount in column C. The months fill in from it; type over any month that's different (a property-tax month, a bonus). Rename or add categories in the blank yellow rows."; P["A2"].font = f_note
P["A2"].alignment = wrap; P.merge_cells("A2:P3"); P.row_dimensions[2].height = 18
header(P, 5, ["Group", "Category", "Usual monthly"] + MONTHS + ["Year total"], [11, 32, 13] + [10] * 12 + [13])
row = 6
cat_rows = []          # (group, row)
group_rows = {}        # group -> (first,last)
for g, cats in GROUPS:
    start = row
    for name in cats:
        P.cell(row, 1, g).font = f_body
        c = P.cell(row, 2, name or None); c.fill = fill_input; c.font = f_input; c.border = box
        c = P.cell(row, 3, EXAMPLE_PLAN.get(name)); c.fill = fill_input; c.font = f_example if name in EXAMPLE_PLAN else f_input; c.border = box; c.number_format = CUR
        for m in range(12):
            c = P.cell(row, 4 + m, f"=IF($C{row}=\"\",\"\",$C{row})"); c.fill = fill_input; c.font = f_body; c.border = box; c.number_format = CUR
        c = P.cell(row, 16, f"=SUM(D{row}:O{row})"); c.fill = fill_calc; c.number_format = CUR; c.border = box
        cat_rows.append((g, row)); row += 1
    group_rows[g] = (start, row - 1)
    P.cell(row, 2, f"Total {g.lower()}").font = f_bold
    for col in range(3, 17):
        c = P.cell(row, col, f"=SUM({CL(col)}{start}:{CL(col)}{row-1})"); c.font = f_bold; c.fill = fill_total; c.number_format = CUR; c.border = box
    group_rows[g] = (start, row - 1, row)
    row += 2
P.cell(row, 2, "Left over (income − bills − spending − savings)").font = f_bold
for col in range(3, 17):
    L_ = CL(col)
    c = P.cell(row, col, "=" + "-".join(f"{L_}{group_rows[g][2]}" for g in ("Income", "Bills", "Spending", "Savings")))
    c.font = f_bold; c.fill = fill_total; c.number_format = CUR; c.border = box
PLAN_LEFT = row
number_validation(P, f"C6:O{row}", 0)
P.freeze_panes = "C6"
CAT_FIRST, CAT_LAST = 6, cat_rows[-1][1]
CAT_RANGE = f"Plan!$B${CAT_FIRST}:$B${CAT_LAST}"

# ---------------- Spending log ----------------
T = wb.create_sheet("Log")
T["A1"] = "Money in and out"; T["A1"].font = f_title
T["A2"] = "One row per payment or deposit. Amounts are positive; the category decides whether it's income, a bill, spending or savings. Delete the blue example rows first."; T["A2"].font = f_note
header(T, 5, ["Date", "Category", "Amount", "Who", "Note", "Group", "Year", "Month"], [13, 32, 13, 14, 34, 11, 8, 8])
for r in range(FIRST, LAST + 1):
    for col in range(1, 6):
        c = T.cell(r, col); c.fill = fill_input; c.font = f_input; c.border = box
    T.cell(r, 1).number_format = DATE; T.cell(r, 3).number_format = CUR
    c = T.cell(r, 6, f'=IF(B{r}="","",IFERROR(INDEX(Plan!$A${CAT_FIRST}:$A${CAT_LAST},MATCH(B{r},{CAT_RANGE},0)),"Pick a category"))'); c.fill = fill_calc; c.font = f_body
    c = T.cell(r, 7, f'=IF(A{r}="","",YEAR(A{r}))'); c.fill = fill_calc; c.font = f_body
    c = T.cell(r, 8, f'=IF(A{r}="","",MONTH(A{r}))'); c.fill = fill_calc; c.font = f_body
for k, ex in enumerate([(date(2026, 1, 2), "Groceries", 84.37, "Sam", "Example — delete"), (date(2026, 1, 15), "Pay — person 1", 2100, "Sam", "Example — delete")]):
    for col, v in enumerate(ex, start=1):
        T.cell(FIRST + k, col, v).font = f_example
list_validation(T, CAT_RANGE, f"B{FIRST}:B{LAST}", "Pick a category from your Plan")
number_validation(T, f"C{FIRST}:C{LAST}", 0)
T.freeze_panes = "A6"

YEAR = "Settings!$B$4"
def actual(cat_ref, month_expr):
    return (f'SUMIFS(Log!$C${FIRST}:$C${LAST},Log!$B${FIRST}:$B${LAST},{cat_ref},'
            f'Log!$G${FIRST}:$G${LAST},{YEAR},Log!$H${FIRST}:$H${LAST},{month_expr})')

# ---------------- Year view ----------------
Y = wb.create_sheet("Year View")
Y["A1"] = "Year View — what actually happened"; Y["A1"].font = f_title
Y["A2"] = "Totals from the Log, by month, for the year on Settings."; Y["A2"].font = f_note
header(Y, 5, ["Group", "Category"] + MONTHS + ["Year actual", "Year plan", "Difference"], [11, 32] + [10] * 12 + [13, 13, 13])
row = 6
yv_groups = {}
for g, cats in GROUPS:
    start = row
    first_plan, last_plan, _ = group_rows[g]
    for pr in range(first_plan, last_plan + 1):
        Y.cell(row, 1, g).font = f_body
        c = Y.cell(row, 2, f'=IF(Plan!B{pr}="","",Plan!B{pr})'); c.font = f_body
        for m in range(12):
            c = Y.cell(row, 3 + m, f'=IF($B{row}="","",{actual(f"$B{row}", m + 1)})'); c.number_format = CUR; c.fill = fill_calc; c.border = box
        c = Y.cell(row, 15, f"=SUM(C{row}:N{row})"); c.number_format = CUR; c.fill = fill_calc; c.border = box
        c = Y.cell(row, 16, f"=Plan!P{pr}"); c.number_format = CUR; c.fill = fill_calc; c.border = box
        # For income and savings, more than plan is good; for bills and spending, less is good. Positive = good.
        sign = "O{r}-P{r}" if g in ("Income", "Savings") else "P{r}-O{r}"
        c = Y.cell(row, 17, "=" + sign.format(r=row)); c.number_format = CUR; c.fill = fill_calc; c.border = box
        row += 1
    Y.cell(row, 2, f"Total {g.lower()}").font = f_bold
    for col in range(3, 18):
        c = Y.cell(row, col, f"=SUM({CL(col)}{start}:{CL(col)}{row-1})"); c.font = f_bold; c.fill = fill_total; c.number_format = CUR; c.border = box
    yv_groups[g] = row
    row += 2
Y.cell(row, 2, "Left over").font = f_bold
for col in range(3, 17):
    L_ = CL(col)
    c = Y.cell(row, col, "=" + "-".join(f"{L_}{yv_groups[g]}" for g in ("Income", "Bills", "Spending", "Savings")))
    c.font = f_bold; c.fill = fill_total; c.number_format = CUR; c.border = box
YV_LEFT = row
row += 1
Y.cell(row, 2, "Savings rate (savings ÷ income)").font = f_bold
for col in range(3, 17):
    L_ = CL(col)
    c = Y.cell(row, col, f'=IF({L_}{yv_groups["Income"]}=0,"",{L_}{yv_groups["Savings"]}/{L_}{yv_groups["Income"]})')
    c.number_format = PCT; c.fill = fill_total; c.font = f_bold; c.border = box
YV_RATE = row
row += 1
uncat = row
Y.cell(row, 2, "Log rows with a category not on your Plan").font = f_bold
c = Y.cell(row, 3, f'=COUNTIF(Log!$F${FIRST}:$F${LAST},"Pick a category")'); c.fill = fill_calc; c.border = box
Y.cell(row, 4, "Should be 0. If not, fix those rows on the Log.").font = f_note
red = PatternFill("solid", fgColor="F8D7D3")
Y.conditional_formatting.add(f"Q6:Q{YV_LEFT}", FormulaRule(formula=["AND(ISNUMBER(Q6),Q6<0)"], font=Font(color="9C0006")))
Y.conditional_formatting.add(f"C{YV_LEFT}:P{YV_LEFT}", FormulaRule(formula=[f"AND(ISNUMBER(C{YV_LEFT}),C{YV_LEFT}<0)"], fill=red, font=Font(color="9C0006", bold=True)))
Y.conditional_formatting.add(f"C{uncat}", FormulaRule(formula=[f"C{uncat}>0"], fill=red))
Y.freeze_panes = "C6"

# ---------------- Month view ----------------
M = wb.create_sheet("Month View")
M["A1"] = "Month View — plan vs actual"; M["A1"].font = f_title
M["A3"] = "Month"; M["A3"].font = f_bold
M["B3"] = "January"; M["B3"].fill = fill_input; M["B3"].font = f_input; M["B3"].border = box
M["C3"] = "Pick a month. The year comes from Settings."; M["C3"].font = f_note
MN = "Settings!$A$12:$A$23"
list_validation(M, MN, "B3", "Pick a month")
M["E3"] = "=MATCH(B3," + MN + ",0)"; M["E3"].font = Font(name=FONT, size=8, color="FFFFFF")  # month number, hidden in white
header(M, 5, ["Group", "Category", "Plan", "Actual", "Difference", "% of plan used"], [11, 32, 13, 13, 13, 14])
row = 6
mv_groups = {}
for g, cats in GROUPS:
    start = row
    first_plan, last_plan, _ = group_rows[g]
    for pr in range(first_plan, last_plan + 1):
        M.cell(row, 1, g).font = f_body
        M.cell(row, 2, f'=IF(Plan!B{pr}="","",Plan!B{pr})').font = f_body
        c = M.cell(row, 3, f'=IF($B{row}="","",N(INDEX(Plan!$D{pr}:$O{pr},1,$E$3)))'); c.number_format = CUR
        c2 = M.cell(row, 4, f'=IF($B{row}="","",{actual(f"$B{row}", "$E$3")})'); c2.number_format = CUR
        sign = "D{r}-C{r}" if g in ("Income", "Savings") else "C{r}-D{r}"
        c3 = M.cell(row, 5, f'=IF($B{row}="","",' + sign.format(r=row) + ")"); c3.number_format = CUR
        c4 = M.cell(row, 6, f'=IF(OR($B{row}="",N(C{row})=0),"",D{row}/C{row})'); c4.number_format = PCT
        for cc in (c, c2, c3, c4): cc.fill = fill_calc; cc.border = box; cc.font = f_body
        row += 1
    M.cell(row, 2, f"Total {g.lower()}").font = f_bold
    for col in (3, 4, 5):
        c = M.cell(row, col, f"=SUM({CL(col)}{start}:{CL(col)}{row-1})"); c.font = f_bold; c.fill = fill_total; c.number_format = CUR; c.border = box
    mv_groups[g] = row
    row += 2
M.cell(row, 2, "Left over").font = f_bold
for col in (3, 4):
    L_ = CL(col)
    c = M.cell(row, col, "=" + "-".join(f"{L_}{mv_groups[g]}" for g in ("Income", "Bills", "Spending", "Savings")))
    c.font = f_bold; c.fill = fill_total; c.number_format = CUR; c.border = box
MV_LEFT = row
M.conditional_formatting.add(f"E6:E{MV_LEFT}", FormulaRule(formula=["AND(ISNUMBER(E6),E6<0)"], font=Font(color="9C0006", bold=True)))
M.conditional_formatting.add(f"C{MV_LEFT}:D{MV_LEFT}", FormulaRule(formula=[f"AND(ISNUMBER(C{MV_LEFT}),C{MV_LEFT}<0)"], fill=red))
M.cell(row + 2, 1, "Difference: positive is good (spent less than planned, or earned or saved more). Red means over plan.").font = f_note

# ---------------- Settings ----------------
G = wb.create_sheet("Settings", 1)
G.column_dimensions["A"].width = 30; G.column_dimensions["B"].width = 22; G.column_dimensions["C"].width = 60
G["A1"] = "Settings"; G["A1"].font = f_title
G["A3"] = "Household name"; G["A3"].font = f_bold
G["B3"] = "Our household"; G["B3"].fill = fill_input; G["B3"].font = f_input; G["B3"].border = box
G["A4"] = "Year"; G["A4"].font = f_bold
G["B4"] = 2026; G["B4"].fill = fill_input; G["B4"].font = f_input; G["B4"].border = box
G["C4"] = "The year Year View and Month View show. Log rows from other years are kept but not counted."; G["C4"].font = f_note
number_validation(G, "B4", 2020, 2100, kind="whole")
G["A11"] = "Months (used by the drop-downs)"; G["A11"].font = f_note
for i, n in enumerate(MONTH_NAMES): G.cell(12 + i, 1, n).font = f_note

# ---------------- Start Here ----------------
S = wb.create_sheet("Start Here", 0)
S.column_dimensions["A"].width = 110
rows = [
    ("Loonie Ledger — Canadian Household Budget", f_title),
    (f"Version {VERSION}. Money tools made for Canada.", f_note),
    ("", None),
    ("Set up (15 minutes)", f_h2),
    ("1. Settings: enter your household name and the year.", f_body),
    ("2. Plan: type your usual monthly amount for each category in column C. Rename categories or use the blank yellow rows for your own. Type over a month that's different (a bonus, an insurance renewal, a property-tax month).", f_body),
    ("3. Log: add money in and out as it happens, one row each. Ten minutes a week is enough. Delete the blue example rows first.", f_body),
    ("4. Month View: pick a month to see plan vs actual. Year View shows all twelve months, your savings rate and what's left over.", f_body),
    ("", None),
    ("Built for Canada", f_h2),
    ("Income lines for the Canada Child Benefit and the GST/HST credit, which arrive on their own schedule (CCB monthly, the GST/HST credit quarterly).", f_body),
    ("Savings lines for a TFSA, RRSP, FHSA and RESP, plus an emergency fund. To check you're not over-contributing, use the Loonie Ledger Room Tracker or CRA My Account.", f_body),
    ("Everything is in Canadian dollars.", f_body),
    ("", None),
    ("Sharing with a partner", f_h2),
    ("Use the Google Sheets copy and share it, or keep the Excel file in a shared folder. The 'Who' column on the Log shows who spent what.", f_body),
    ("", None),
]
for i, (t, f) in enumerate(rows, start=1):
    c = S.cell(i, 1, t)
    if f: c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")
legend(S, len(rows) + 1)
lines = [
    "Not financial advice. Not affiliated with the Canada Revenue Agency or the Government of Canada.",
    f"Version {VERSION}.",
    "Licensed for your own household. Please don't share or resell this file.",
]
for i, t in enumerate(lines): S.cell(len(rows) + 3 + i, 1, t).font = f_note
S.cell(len(rows) + 3 + len(lines) + 1, 1, "Questions or a problem with the file? Email loonieledgerservices@gmail.com").font = f_body

order = ["Start Here", "Settings", "Plan", "Log", "Month View", "Year View"]
wb._sheets = [wb[n] for n in order]
for ws in wb.worksheets:
    ws.sheet_view.showGridLines = ws.title == "Log"
    ws.page_setup.orientation = "landscape"; ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToHeight = 0
wb.active = 0
out = sys.argv[1] if len(sys.argv) > 1 else "Loonie-Ledger-Canadian-Household-Budget.xlsx"
wb.save(out)
print("saved", out)
