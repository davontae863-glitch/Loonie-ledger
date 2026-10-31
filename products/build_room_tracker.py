"""Builds Loonie-Ledger-TFSA-RRSP-FHSA-Room-Tracker.xlsx

Rule: the tracker never guesses anyone's room. The owner of the file types the figures CRA shows them
(My Account / Notice of Assessment); the sheet only adds up what they log against those figures.
"""
import sys
from openpyxl import Workbook
from openpyxl.styles import Alignment, PatternFill, Font
from openpyxl.formatting.rule import FormulaRule
from common import *

N = 500
FIRST = 6
LAST = FIRST + N - 1

# CRA "MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE", checked 2026-10-31
TFSA_LIMITS = [(2009, 5000), (2010, 5000), (2011, 5000), (2012, 5000), (2013, 5500), (2014, 5500), (2015, 10000),
               (2016, 5500), (2017, 5500), (2018, 5500), (2019, 6000), (2020, 6000), (2021, 6000), (2022, 6000),
               (2023, 6500), (2024, 7000), (2025, 7000), (2026, 7000)]
RRSP_LIMITS = [(2024, 31560), (2025, 32490), (2026, 33810), (2027, 35390)]
SOURCES = [
    "CRA, MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and the YAMPE: https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html",
    "CRA, Participating in your FHSAs: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/contributing-your-fhsa.html",
    "CRA, Tax-free savings account: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account.html",
    "CRA, RRSPs and related plans: https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans.html",
]
ACCOUNTS = ["TFSA", "RRSP", "FHSA"]
TYPES = ["Contribution", "Withdrawal", "Direct transfer between my own accounts", "Transfer in from my RRSP"]

wb = Workbook()

# ---------------- Lists / reference ----------------
L = wb.active; L.title = "Limits"
L["A1"] = "Limits and reference"; L["A1"].font = f_title
L["A2"] = f"Checked against CRA on {RATES_AS_OF}. These are the general limits. YOUR room depends on your own history, so always use the figure CRA shows you."; L["A2"].font = f_note
header(L, 4, ["Year", "TFSA annual limit", "Running total since 2009"], [10, 20, 26])
for i, (y, v) in enumerate(TFSA_LIMITS):
    r = 5 + i
    L.cell(r, 1, y).font = f_body
    c = L.cell(r, 2, v); c.number_format = CUR; c.font = f_body
    c = L.cell(r, 3, f"=SUM($B$5:B{r})"); c.number_format = CUR; c.font = f_body
    for col in (1, 2, 3): L.cell(r, col).border = box
TF_END = 5 + len(TFSA_LIMITS) - 1
r = TF_END + 2
header(L, r, ["Year", "RRSP dollar limit", "Note"])
RR_HEAD = r
for i, (y, v) in enumerate(RRSP_LIMITS):
    rr = r + 1 + i
    L.cell(rr, 1, y).font = f_body
    c = L.cell(rr, 2, v); c.number_format = CUR; c.font = f_body
    L.cell(rr, 3, "Your own limit is 18% of last year's earned income, up to this amount, minus pension adjustments, plus unused room.").font = f_note
r = RR_HEAD + len(RRSP_LIMITS) + 2
L.cell(r, 1, "FHSA").font = f_bold
fhsa_ref = [
    ("Participation room in the year you open your first FHSA", 8000),
    ("Most unused room you can carry forward to a later year", 8000),
    ("Lifetime limit on contributions and transfers", 40000),
]
FH = {}
for i, (t, v) in enumerate(fhsa_ref):
    rr = r + 1 + i
    L.cell(rr, 1, t).font = f_body
    c = L.cell(rr, 3, v); c.number_format = CUR; c.font = f_body
    FH[i] = f"Limits!$C${rr}"
r = r + len(fhsa_ref) + 2
L.cell(r, 1, "Sources").font = f_bold
for i, s in enumerate(SOURCES): L.cell(r + 1 + i, 1, s).font = f_note
r = r + len(SOURCES) + 2
L.cell(r, 1, "Accounts").font = f_bold
for i, a in enumerate(ACCOUNTS): L.cell(r + 1 + i, 1, a)
ACC_RANGE = f"Limits!$A${r+1}:$A${r+len(ACCOUNTS)}"
r = r + len(ACCOUNTS) + 2
L.cell(r, 1, "Types").font = f_bold
for i, t in enumerate(TYPES): L.cell(r + 1 + i, 1, t)
TYPE_RANGE = f"Limits!$A${r+1}:$A${r+len(TYPES)}"
L.column_dimensions["A"].width = 58

# ---------------- Start Here ----------------
S = wb.create_sheet("Start Here", 0)
S.column_dimensions["A"].width = 110
rows = [
    ("Loonie Ledger — TFSA / RRSP / FHSA Room Tracker", f_title),
    (f"Version {VERSION}. Money tools made for Canada.", f_note),
    ("", None),
    ("Set up (10 minutes)", f_h2),
    ("1. Sign in to CRA My Account (or open your latest Notice of Assessment). Find your TFSA contribution room on January 1, your RRSP deduction limit, and your FHSA participation room.", f_body),
    ("2. Open My Room and type those figures into the yellow cells for the year you're tracking.", f_body),
    ("3. Log every deposit, withdrawal and transfer on the Log sheet as it happens. Delete the blue example row first.", f_body),
    ("4. My Room shows what you've used and what's left for each account, and turns red if you go over.", f_body),
    ("", None),
    ("Why you type your room in yourself", f_h2),
    ("Your room depends on your age, how long you've lived in Canada, your income, your pension and everything you've contributed or withdrawn since 2009. Only CRA has the full picture, so this tracker never guesses it. It adds up what you log against the number CRA gives you.", f_body),
    ("CRA's figures can lag: banks report contributions some weeks after the year ends. Use the figure for January 1 of the year you're tracking, and log everything you do from then on.", f_body),
    ("", None),
    ("Rules that catch people out", f_h2),
    ("TFSA: money you withdraw comes back as room on January 1 of the NEXT year, not straight away. Putting it back in the same year uses new room.", f_body),
    ("TFSA: moving money between your own TFSAs is free only as a direct transfer done by the institutions. Withdrawing and re-depositing it yourself counts as a new contribution.", f_body),
    ("RRSP: contributions made in the first 60 days of a year can be claimed for the previous tax year. Use the 'Claim for tax year' column to say which year a contribution belongs to.", f_body),
    ("RRSP: contributions your employer takes off your pay (group RRSP) and contributions you make to a spousal RRSP both use YOUR room. Log them too.", f_body),
    ("FHSA: transfers in from your RRSP use FHSA room even though you can't deduct them.", f_body),
    ("Going over the limit: CRA generally charges a tax of 1% per month on the excess while it stays in the account (RRSPs allow a $2,000 cushion first). If My Room turns red, take the excess out and check with CRA.", f_body),
    ("", None),
]
for i, (t, f) in enumerate(rows, start=1):
    c = S.cell(i, 1, t)
    if f: c.font = f
    c.alignment = Alignment(wrap_text=True, vertical="top")
legend(S, len(rows) + 1)
end = notice_rows(S, len(rows) + 3)
S.cell(end + 1, 1, "Questions or a problem with the file? Email loonieledgerservices@gmail.com").font = f_body

# ---------------- Log ----------------
G = wb.create_sheet("Log", 2)
G["A1"] = "Log"; G["A1"].font = f_title
G["A2"] = "One row for every deposit, withdrawal or transfer. Amounts are positive numbers; the Type says which way the money went."; G["A2"].font = f_note
header(G, 5, ["Date", "Account", "Type", "Amount", "Institution / note", "RRSP only: claim for tax year (leave blank = same year)", "Calendar year", "Counts for year"],
       [13, 10, 34, 14, 30, 22, 12, 12])
for r in range(FIRST, LAST + 1):
    for col in range(1, 7):
        c = G.cell(r, col); c.fill = fill_input; c.font = f_input; c.border = box
    G.cell(r, 1).number_format = DATE
    G.cell(r, 4).number_format = CUR
    g = G.cell(r, 7, f'=IF(A{r}="","",YEAR(A{r}))'); g.fill = fill_calc; g.font = f_body
    h = G.cell(r, 8, f'=IF(A{r}="","",IF(AND(B{r}="RRSP",F{r}<>""),F{r},G{r}))'); h.fill = fill_calc; h.font = f_body
ex = [__import__("datetime").date(2026, 1, 15), "TFSA", "Contribution", 500, "Example bank — delete this row", None]
for col, v in enumerate(ex, start=1):
    c = G.cell(FIRST, col, v); c.font = f_example
list_validation(G, ACC_RANGE, f"B{FIRST}:B{LAST}", "TFSA, RRSP or FHSA")
list_validation(G, TYPE_RANGE, f"C{FIRST}:C{LAST}")
number_validation(G, f"D{FIRST}:D{LAST}", 0)
number_validation(G, f"F{FIRST}:F{LAST}", 2009, 2100, kind="whole")
G.freeze_panes = "A6"

def SUMLOG(acc, typ, year_col="H"):
    return (f'SUMIFS(Log!$D${FIRST}:$D${LAST},Log!$B${FIRST}:$B${LAST},"{acc}",'
            f'Log!$C${FIRST}:$C${LAST},"{typ}",Log!${year_col}${FIRST}:${year_col}${LAST},$B$3)')

# ---------------- My Room ----------------
M = wb.create_sheet("My Room", 1)
M.column_dimensions["A"].width = 60; M.column_dimensions["B"].width = 18; M.column_dimensions["C"].width = 70
M["A1"] = "My Room"; M["A1"].font = f_title
M["A3"] = "Year you're tracking"; M["A3"].font = f_bold
M["B3"] = 2026; M["B3"].fill = fill_input; M["B3"].font = f_input; M["B3"].border = box
M["C3"] = "Change this each January and enter that year's figures from CRA."; M["C3"].font = f_note
number_validation(M, "B3", 2009, 2100, kind="whole")

r = 5
def section(title):
    global r
    c = M.cell(r, 1, title); c.font = f_h2
    r += 1

def line(label, value, note="", kind="calc", fmt=CUR, bold=False):
    global r
    a = M.cell(r, 1, label); a.font = f_bold if bold else f_body
    b = M.cell(r, 2, value); b.number_format = fmt; b.border = box
    if kind == "input":
        b.fill = fill_input; b.font = f_input
    else:
        b.fill = fill_total if bold else fill_calc; b.font = f_bold if bold else f_body
    if note:
        n = M.cell(r, 3, note); n.font = f_note; n.alignment = wrap
    r += 1
    return f"$B${r-1}"

section("TFSA")
t_room = line("TFSA contribution room on January 1 (from CRA My Account)", None, "CRA My Account > Tax-free savings account > Contribution room.", "input")
number_validation(M, t_room.replace("$", ""), 0)
t_con = line("Contributions this year", "=" + SUMLOG("TFSA", "Contribution"), "Direct transfers between your own TFSAs are not counted.")
t_wd = line("Withdrawals this year", "=" + SUMLOG("TFSA", "Withdrawal"), "Added back to your room next January 1, not this year.")
t_left = line("Room left this year", f'=IF({t_room}="","",{t_room}-{t_con})', "Red means you're over. Take the excess out.", bold=True)
t_tax = line("Estimated tax per month while over", f'=IF({t_left}="","",IF({t_left}<0,-{t_left}*0.01,0))', "1% of the highest excess in the month. An estimate only; CRA works out the real amount.")
t_next = line("Next year's TFSA limit (type it once CRA announces it)", None, "CRA usually announces it in November. See the Limits sheet for past years.", "input")
number_validation(M, t_next.replace("$", ""), 0)
t_est = line("Rough estimate of next year's room", f'=IF(OR({t_room}="",{t_next}=""),"",{t_left}+{t_wd}+{t_next})', "Unused room + this year's withdrawals + next year's limit. Check it against CRA in January.")
r += 1
section("RRSP")
p_lim = line("RRSP deduction limit for this year (from your Notice of Assessment)", None, "On last year's Notice of Assessment, called 'RRSP deduction limit'. Also in CRA My Account.", "input")
p_unused = line("Unused RRSP contributions already made (from your Notice of Assessment)", 0, "Contributions you made earlier but haven't deducted yet. Usually $0.", "input")
for ref in (p_lim, p_unused): number_validation(M, ref.replace("$", ""), 0)
p_con = line("Contributions you're claiming for this year", "=" + SUMLOG("RRSP", "Contribution"), "Includes rows where 'Claim for tax year' is this year.")
p_left = line("Room left this year", f'=IF({p_lim}="","",{p_lim}-{p_unused}-{p_con})', "Red means you've used more than your limit.", bold=True)
p_excess = line("Over-contribution beyond the $2,000 cushion", f'=IF({p_left}="","",MAX(0,-{p_left}-2000))', "CRA allows $2,000 over your limit before the tax applies.")
p_tax = line("Estimated tax per month while over", f'=IF({p_excess}="","",{p_excess}*0.01)', "An estimate only; CRA works out the real amount.")
r += 1
section("FHSA")
f_open = line("Year you opened your first FHSA", None, "Leave blank if you haven't opened one.", "input", fmt="0")
f_room = line("FHSA participation room this year (from CRA My Account)", None, f"Up to $8,000 a year plus up to $8,000 carried forward. In your first year it's $8,000.", "input")
f_prior = line("Contributions and RRSP transfers in all earlier years", 0, "Add up your earlier years. Used for the $40,000 lifetime limit.", "input")
number_validation(M, f_open.replace("$", ""), 2023, 2100, kind="whole")
for ref in (f_room, f_prior): number_validation(M, ref.replace("$", ""), 0)
f_con = line("Contributions this year", "=" + SUMLOG("FHSA", "Contribution"))
f_rrsp = line("Transfers in from your RRSP this year", "=" + SUMLOG("FHSA", "Transfer in from my RRSP"), "Use FHSA room but aren't deductible.")
f_wd = line("Withdrawals this year", "=" + SUMLOG("FHSA", "Withdrawal"), "Withdrawals don't give room back unless CRA says so.")
f_left = line("Room left this year", f'=IF({f_room}="","",{f_room}-{f_con}-{f_rrsp})', "Red means you're over.", bold=True)
f_life = line("Lifetime limit left", f'=IF({f_open}="","",{FH[2]}-{f_prior}-{f_con}-{f_rrsp})', "Out of $40,000.", bold=True)
f_tax = line("Estimated tax per month while over", f'=IF({f_left}="","",IF({f_left}<0,-{f_left}*0.01,0))', "An estimate only; CRA works out the real amount.")
r += 1
section("At a glance")
header_row = r
for col, t in enumerate(["Account", "Room left this year", "Status"], start=1):
    c = M.cell(r, col, t); c.font = f_head; c.fill = fill_head; c.border = box
r += 1
for name, ref in (("TFSA", t_left), ("RRSP", p_left), ("FHSA", f_left)):
    M.cell(r, 1, name).font = f_bold
    c = M.cell(r, 2, f"={ref}"); c.number_format = CUR; c.fill = fill_calc; c.border = box
    s = M.cell(r, 3, f'=IF({ref}="","Enter your room from CRA above",IF({ref}<0,"OVER THE LIMIT — take the excess out",IF({ref}<500,"Almost full","OK")))')
    s.fill = fill_calc; s.border = box; s.font = f_bold
    r += 1
GLANCE_LAST = r - 1
red = PatternFill("solid", fgColor="F8D7D3")
for ref in (t_left, p_left, f_left, f_life):
    cell = ref.replace("$", "")
    M.conditional_formatting.add(cell, FormulaRule(formula=[f'AND(ISNUMBER({cell}),{cell}<0)'], fill=red, font=Font(color="9C0006", bold=True)))
M.conditional_formatting.add(f"B{header_row+1}:C{GLANCE_LAST}", FormulaRule(formula=[f'AND(ISNUMBER($B{header_row+1}),$B{header_row+1}<0)'], fill=red, font=Font(color="9C0006", bold=True)))
r += 1
notice_rows(M, r)

wb.move_sheet("Limits", offset=len(wb.sheetnames))
for ws in wb.worksheets:
    ws.sheet_view.showGridLines = ws.title == "Log"
    ws.page_setup.orientation = "landscape"; ws.page_setup.fitToWidth = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True; ws.page_setup.fitToHeight = 0
wb.active = 0
out = sys.argv[1] if len(sys.argv) > 1 else "Loonie-Ledger-TFSA-RRSP-FHSA-Room-Tracker.xlsx"
wb.save(out)
print("saved", out)
