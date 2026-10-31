"""Builds Loonie-Ledger-Freelancer-Invoice-Generator.xlsx"""
import sys
from datetime import date
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, Border, Side
from openpyxl.formatting.rule import FormulaRule
from common import *

PRESETS = [  # label, line1 name, rate1, line2 name, rate2
    ("Small supplier: no GST/HST", "", 0, "", 0),
    ("GST 5% (AB, BC, MB, SK, NT, NU, YT)", "GST (5%)", 0.05, "", 0),
    ("HST 13% (ON)", "HST (13%)", 0.13, "", 0),
    ("HST 14% (NS)", "HST (14%)", 0.14, "", 0),
    ("HST 15% (NB, NL, PE)", "HST (15%)", 0.15, "", 0),
    ("GST 5% + QST 9.975% (QC)", "GST (5%)", 0.05, "QST (9.975%)", 0.09975),
]
wb = Workbook()

# ---------- Lists ----------
L = wb.active; L.title = "Lists"
L["A1"] = "Tax presets"; L["A1"].font = f_title
L["A2"] = f"Rates checked {RATES_AS_OF}. Charge the rate for where your client receives the service or product (place of supply). QST can only be charged if you're registered with Revenu Québec."; L["A2"].font = f_note
header(L, 4, ["Preset", "Tax line 1", "Rate 1", "Tax line 2", "Rate 2"], [40, 14, 10, 14, 10])
for i, p in enumerate(PRESETS):
    for col, v in enumerate(p, start=1):
        c = L.cell(5 + i, col, v); c.font = f_body; c.border = box
        if col in (3, 5): c.number_format = "0.000%"
P_END = 5 + len(PRESETS) - 1
PRESET_RANGE = f"Lists!$A$5:$A${P_END}"
for i, s in enumerate(RATE_SOURCES): L.cell(P_END + 2 + i, 1, s).font = f_note

# ---------- Start Here ----------
S = wb.create_sheet("Start Here", 0); S.column_dimensions["A"].width = 110
lines = [
    ("Loonie Ledger — Freelancer Invoice Generator", f_title),
    (f"Version {VERSION}. Money tools made for Canada.", f_note), ("", None),
    ("Set up once", f_h2),
    ("1. Fill in Settings: your business details, payment instructions, payment terms and your GST/HST number if you have one.", f_body),
    ("2. Add your clients on Clients.", f_body), ("", None),
    ("Each time you bill", f_h2),
    ("1. On Invoice, enter the invoice number and date, pick the client, and type the line items.", f_body),
    ("2. Pick the tax preset (in the box to the right of the invoice, which doesn't print) for where your client is. Pick 'Small supplier' if you aren't registered for GST/HST.", f_body),
    ("3. Print or save the Invoice sheet as a PDF (it's set to fit one letter-size page) and send it.", f_body),
    ("4. Copy the green 'For your register' row at the bottom of the invoice, then on Register paste it as values only (Paste special → Values) in the next empty row.", f_body),
    ("5. When the client pays, type the date paid on Register. The Status column shows Paid, Open or Overdue.", f_body), ("", None),
    ("Invoice rules worth knowing", f_h2),
    ("If you're registered and the invoice is $30 or more, CRA expects your GST/HST number on it. For $150 or more, the client's name is also required. Details: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-documents-input-tax-credit.html", f_body),
    ("If you're a small supplier, don't charge GST/HST. You can show the optional 'not registered' line instead.", f_body),
    ("Colours: pale yellow = type here, pale green = calculated for you.", f_body), ("", None),
]
for i, (t, f) in enumerate(lines, start=1):
    c = S.cell(i, 1, t); c.alignment = Alignment(wrap_text=True, vertical="top")
    if f: c.font = f
legend(S, len(lines) + 1)
end = notice_rows(S, len(lines) + 3)
S.cell(end + 1, 1, "Questions or a problem with the file? Email loonieledgerservices@gmail.com").font = f_body

# ---------- Settings ----------
G = wb.create_sheet("Settings", 1)
G.column_dimensions["A"].width = 36; G.column_dimensions["B"].width = 44; G.column_dimensions["C"].width = 50
G["A1"] = "Settings"; G["A1"].font = f_title
rows = [
    ("Business name", "Your Business Name", ""),
    ("Address line 1", "123 Example Street", ""),
    ("City, province, postal code", "Calgary, AB  T2P 0A1", ""),
    ("Email", "you@example.com", ""),
    ("Phone", "", "Optional"),
    ("GST/HST number", "", "Leave blank if you're a small supplier."),
    ("Payment terms (days)", 30, "Due date = invoice date + this many days."),
    ("Payment instructions", "Interac e-Transfer to you@example.com", "Shown at the bottom of every invoice."),
    ("Show 'not registered' line for small suppliers?", "Yes", "Adds: GST/HST not charged — supplier not registered."),
]
for i, (a, b, c) in enumerate(rows):
    r = 3 + i
    G.cell(r, 1, a).font = f_bold
    x = G.cell(r, 2, b); x.fill = fill_input; x.font = f_example if b not in ("", 30, "Yes") else f_input; x.border = box
    G.cell(r, 3, c).font = f_note
G.cell(13, 1, "Yes").font = f_body; G.cell(14, 1, "No").font = f_body; G.cell(12, 1, "Lists for this sheet").font = f_note
list_validation(G, "$A$13:$A$14", "B11")
number_validation(G, "B9", 0, 365, kind="whole")

# ---------- Clients ----------
C = wb.create_sheet("Clients", 2)
C["A1"] = "Clients"; C["A1"].font = f_title
header(C, 3, ["Client name", "Contact person", "Email", "Address line 1", "City, province, postal code", "Province code"], [28, 20, 26, 28, 28, 12])
for r in range(4, 204):
    for col in range(1, 7):
        x = C.cell(r, col); x.fill = fill_input; x.border = box; x.font = f_input
for col, v in enumerate(["Example Client Inc.", "Sam Lee", "sam@example.com", "456 Sample Ave", "Toronto, ON  M5V 1A1", "ON"], start=1):
    C.cell(4, col, v).font = f_example
PROV_CODES = ",".join(p[0] for p in PROVINCES)
list_validation(C, f'"{PROV_CODES}"', "F4:F203")
CLIENTS = "Clients!$A$4:$A$203"

# ---------- Invoice ----------
V = wb.create_sheet("Invoice", 3)
widths = {"A": 46, "B": 10, "C": 14, "D": 16}
for k, w in widths.items(): V.column_dimensions[k].width = w
V.sheet_view.showGridLines = False
V["A1"] = "=Settings!B3"; V["A1"].font = Font(name=FONT, size=16, bold=True, color=INK)
V["A2"] = "=Settings!B4"; V["A3"] = "=Settings!B5"
V["A4"] = '=Settings!B6&IF(Settings!B7="",""," · "&Settings!B7)'
V["A5"] = '=IF(Settings!B8="","","GST/HST no. "&Settings!B8)'
for a in ("A2", "A3", "A4", "A5"): V[a].font = f_body
V["C1"] = "INVOICE"; V["C1"].font = Font(name=FONT, size=18, bold=True, color=SPRUCE)
labels = [("C2", "Invoice #"), ("C3", "Date"), ("C4", "Due date")]
for a, t in labels: V[a] = t; V[a].font = f_bold
V["D2"] = 1001; V["D3"] = date(2026, 11, 1)
for a in ("D2", "D3"): V[a].fill = fill_input; V[a].font = f_input; V[a].border = box
V["D3"].number_format = DATE
V["D4"] = '=IF(D3="","",D3+N(Settings!B9))'; V["D4"].number_format = DATE; V["D4"].fill = fill_calc

V["A7"] = "Bill to"; V["A7"].font = f_bold
V["A8"] = "Example Client Inc."; V["A8"].fill = fill_input; V["A8"].font = f_input; V["A8"].border = box
list_validation(V, CLIENTS, "A8", "Pick a client from your Clients sheet")
for i, col in enumerate(["B", "C", "D", "E"]):
    pass
V["A9"] = '=IFERROR(INDEX(Clients!$B$4:$B$203,MATCH($A$8,Clients!$A$4:$A$203,0))&"","")'
V["A10"] = '=IFERROR(INDEX(Clients!$D$4:$D$203,MATCH($A$8,Clients!$A$4:$A$203,0))&"","")'
V["A11"] = '=IFERROR(INDEX(Clients!$E$4:$E$203,MATCH($A$8,Clients!$A$4:$A$203,0))&"","")'
V["A12"] = '=IFERROR(INDEX(Clients!$C$4:$C$203,MATCH($A$8,Clients!$A$4:$A$203,0))&"","")'
for a in ("A9", "A10", "A11", "A12"): V[a].font = f_body

head_row = 14
for col, t in zip("ABCD", ["Description", "Qty", "Unit price", "Amount"]):
    x = V[f"{col}{head_row}"]; x.value = t; x.font = f_head; x.fill = fill_head; x.border = box
first_item, last_item = head_row + 1, head_row + 12
for r in range(first_item, last_item + 1):
    for col in "ABC":
        x = V[f"{col}{r}"]; x.fill = fill_input; x.border = box; x.font = f_input
    V[f"C{r}"].number_format = CUR
    V[f"D{r}"] = f'=IF(OR(B{r}="",C{r}=""),"",ROUND(B{r}*C{r},2))'; V[f"D{r}"].number_format = CUR; V[f"D{r}"].border = box; V[f"D{r}"].fill = fill_calc
V[f"A{first_item}"] = "Example: website design, 10 hours"; V[f"B{first_item}"] = 10; V[f"C{first_item}"] = 75
for col in "ABC": V[f"{col}{first_item}"].font = f_example
number_validation(V, f"B{first_item}:C{last_item}", 0)

r = last_item + 1
V[f"C{r}"] = "Subtotal"; V[f"D{r}"] = f"=SUM(D{first_item}:D{last_item})"; sub = r
r += 1
PCELL = "$F$3"   # tax preset lives outside the printed area
V["F2"] = "Tax preset (not printed)"; V["F2"].font = f_bold
V["F3"] = PRESETS[0][0]; V["F3"].fill = fill_input; V["F3"].font = f_input; V["F3"].border = box
V["F4"] = "Pick the tax for where your client is."; V["F4"].font = f_note
V.column_dimensions["F"].width = 40
list_validation(V, PRESET_RANGE, "F3", "Pick the tax for where your client is")
look = lambda col: f'IFERROR(INDEX(Lists!${col}$5:${col}${P_END},MATCH({PCELL},{PRESET_RANGE},0)),"")'
V[f"C{r}"] = f"={look('B')}&\"\""; V[f"D{r}"] = f'=IF(N({look("C")})=0,"",ROUND(D{sub}*{look("C")},2))'; t1 = r
r += 1
V[f"C{r}"] = f"={look('D')}&\"\""; V[f"D{r}"] = f'=IF(N({look("E")})=0,"",ROUND(D{sub}*{look("E")},2))'; t2 = r
r += 1
V[f"C{r}"] = "Total (CAD)"; V[f"D{r}"] = f"=D{sub}+N(D{t1})+N(D{t2})"; tot = r
for rr in (sub, t1, t2, tot):
    V[f"C{rr}"].font = f_bold; V[f"D{rr}"].number_format = CUR; V[f"D{rr}"].fill = fill_calc; V[f"D{rr}"].border = box
V[f"D{tot}"].font = Font(name=FONT, size=12, bold=True, color=INK); V[f"C{tot}"].font = Font(name=FONT, size=12, bold=True, color=INK)
r += 2
V[f"A{r}"] = f'=IF(AND({PCELL}="{PRESETS[0][0]}",Settings!B11="Yes"),"GST/HST not charged — supplier not registered for GST/HST.","")'; V[f"A{r}"].font = f_note
warn = r + 1
V["F5"] = f'=IF(AND({PCELL}<>"{PRESETS[0][0]}",Settings!B8=""),"Check: you picked a tax preset but there\'s no GST/HST number in Settings.","")'
V["F5"].font = Font(name=FONT, size=9, bold=True, color="A14A1A"); V["F5"].alignment = Alignment(wrap_text=True)
r = warn + 2
V[f"A{r}"] = '="Payment: "&Settings!B10'; V[f"A{r}"].font = f_body
V[f"A{r+1}"] = '="Due "&TEXT(D4,"mmmm d, yyyy")&". Thank you for your business."'; V[f"A{r+1}"].font = f_body
print_end = r + 1

reg = print_end + 3
V[f"A{reg-1}"] = "For your register (not printed): copy this row, then paste as values on Register."; V[f"A{reg-1}"].font = f_note
reg_cols = ["Invoice #", "Date", "Client", "Subtotal", "Tax", "Total", "Due date"]
for i, t in enumerate(reg_cols):
    x = V.cell(reg, 1 + i, t); x.font = f_head; x.fill = fill_head
vals = ["=D2", "=D3", "=A8", f"=D{sub}", f"=N(D{t1})+N(D{t2})", f"=D{tot}", "=D4"]
for i, f in enumerate(vals):
    x = V.cell(reg + 1, 1 + i, f); x.fill = fill_calc; x.font = f_body; x.border = box
    if i in (1, 6): x.number_format = DATE
    if i in (3, 4, 5): x.number_format = CUR
for col in "EFG": V.column_dimensions[col].width = 13
from openpyxl.styles import PatternFill
for row in V.iter_rows(min_row=1, max_row=print_end, max_col=4):
    for x in row:
        if x.fill is not None and x.fill.fgColor is not None and x.fill.fgColor.rgb in ("00FFF8D6", "00EEF4F0"):
            x.fill = PatternFill(fill_type=None)
V.print_area = f"A1:D{print_end}"
V.page_setup.orientation = "portrait"; V.page_setup.paperSize = V.PAPERSIZE_LETTER
V.sheet_properties.pageSetUpPr.fitToPage = True; V.page_setup.fitToWidth = 1; V.page_setup.fitToHeight = 1

# ---------- Register ----------
R = wb.create_sheet("Register", 4)
R["A1"] = "Invoice register"; R["A1"].font = f_title
R["A2"] = '="Open: "&TEXT(SUMIFS(F6:F505,I6:I505,"Open")+SUMIFS(F6:F505,I6:I505,"Overdue"),"$#,##0.00")&"   Overdue: "&TEXT(SUMIFS(F6:F505,I6:I505,"Overdue"),"$#,##0.00")&"   Paid this year: "&TEXT(SUMIFS(F6:F505,I6:I505,"Paid",H6:H505,">="&DATE(YEAR(TODAY()),1,1)),"$#,##0.00")'
R["A2"].font = f_bold
legend(R, 3)
header(R, 5, ["Invoice #", "Date", "Client", "Subtotal", "Tax", "Total", "Due date", "Date paid", "Status", "Days overdue"], [11, 12, 26, 13, 12, 13, 12, 12, 11, 12])
for r in range(6, 506):
    for col in range(1, 9):
        x = R.cell(r, col); x.fill = fill_input; x.border = box; x.font = f_input
    for col in (2, 7, 8): R.cell(r, col).number_format = DATE
    for col in (4, 5, 6): R.cell(r, col).number_format = CUR
    R.cell(r, 9, f'=IF(A{r}="","",IF(H{r}<>"","Paid",IF(AND(G{r}<>"",TODAY()>G{r}),"Overdue","Open")))')
    R.cell(r, 10, f'=IF(I{r}="Overdue",TODAY()-G{r},"")')
    for col in (9, 10): R.cell(r, col).fill = fill_calc; R.cell(r, col).border = box; R.cell(r, col).font = f_body
for col, v in enumerate([1000, date(2026, 10, 1), "Example Client Inc.", 500, 65, 565, date(2026, 10, 31), date(2026, 10, 20)], start=1):
    R.cell(6, col, v).font = f_example
R.conditional_formatting.add("I6:J505", FormulaRule(formula=['$I6="Overdue"'], font=Font(name=FONT, color="A14A1A", bold=True)))
R.freeze_panes = "A6"

wb.move_sheet("Lists", offset=len(wb.sheetnames))
for ws in wb.worksheets:
    if ws.title != "Invoice":
        ws.sheet_view.showGridLines = ws.title in ("Clients", "Register")
wb.active = 0
out = sys.argv[1] if len(sys.argv) > 1 else "Loonie-Ledger-Freelancer-Invoice-Generator.xlsx"
wb.save(out); print("saved", out)
