"""Shared styling and reference data for Loonie Ledger spreadsheet products."""
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.utils import get_column_letter

VERSION = "2026.1"
RATES_AS_OF = "2026-10-31"
RATE_SOURCES = [
    "CRA, Charge and collect the tax - Which rate to charge: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-gst/charge-gst-hst.html",
    "CRA, GST/HST calculator (and rates): https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/charge-collect-which-rate/calculator.html",
    "TaxTips.ca, Sales tax rates 2026 (provincial PST/QST): https://www.taxtips.ca/salestaxes/sales-tax-rates-2026.htm",
]

# (code, name, GST/HST rate, provincial tax name, provincial rate)
PROVINCES = [
    ("AB", "Alberta", 0.05, "", 0),
    ("BC", "British Columbia", 0.05, "PST", 0.07),
    ("MB", "Manitoba", 0.05, "RST", 0.07),
    ("NB", "New Brunswick", 0.15, "", 0),
    ("NL", "Newfoundland and Labrador", 0.15, "", 0),
    ("NS", "Nova Scotia", 0.14, "", 0),
    ("NT", "Northwest Territories", 0.05, "", 0),
    ("NU", "Nunavut", 0.05, "", 0),
    ("ON", "Ontario", 0.13, "", 0),
    ("PE", "Prince Edward Island", 0.15, "", 0),
    ("QC", "Quebec", 0.05, "QST", 0.09975),
    ("SK", "Saskatchewan", 0.05, "PST", 0.06),
    ("YT", "Yukon", 0.05, "", 0),
]

FONT = "Arial"
INK = "102A22"; SOFT = "46605A"; SPRUCE = "1D5A45"; RULE = "CFE0D6"; BRONZE = "9A6B14"
f_body = Font(name=FONT, size=10, color=INK)
f_bold = Font(name=FONT, size=10, color=INK, bold=True)
f_title = Font(name=FONT, size=16, color=INK, bold=True)
f_h2 = Font(name=FONT, size=12, color=SPRUCE, bold=True)
f_head = Font(name=FONT, size=10, color="FFFFFF", bold=True)
f_note = Font(name=FONT, size=9, color=SOFT, italic=True)
f_input = Font(name=FONT, size=10, color="0000FF")
f_example = Font(name=FONT, size=10, color="0000FF", italic=True)
fill_head = PatternFill("solid", fgColor=SPRUCE)
fill_input = PatternFill("solid", fgColor="FFF8D6")   # pale yellow = type here
fill_calc = PatternFill("solid", fgColor="EEF4F0")    # pale green = calculated for you
fill_total = PatternFill("solid", fgColor="DCEBE2")
thin = Side(style="thin", color=RULE)
box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical="top")
CUR = '$#,##0.00;[Red]-$#,##0.00;"-"'
PCT = '0.0%;[Red]-0.0%;"-"'
DATE = "yyyy-mm-dd"


def header(ws, row, labels, widths=None):
    for i, label in enumerate(labels, start=1):
        c = ws.cell(row=row, column=i, value=label)
        c.font = f_head; c.fill = fill_head; c.alignment = Alignment(wrap_text=True, vertical="center"); c.border = box
    ws.row_dimensions[row].height = 32
    if widths:
        for i, w in enumerate(widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = w


def legend(ws, row, col=1):
    a = ws.cell(row=row, column=col, value="Type here"); a.fill = fill_input; a.font = f_body; a.border = box
    b = ws.cell(row=row, column=col + 1, value="Calculated for you"); b.fill = fill_calc; b.font = f_body; b.border = box


def list_validation(ws, formula, ref, prompt=None):
    dv = DataValidation(type="list", formula1=formula, allow_blank=True)
    if prompt:
        dv.prompt = prompt; dv.showInputMessage = True
    dv.error = "Pick a value from the list."; dv.showErrorMessage = True
    ws.add_data_validation(dv); dv.add(ref)
    return dv


def number_validation(ws, ref, minimum=0, maximum=None, kind="decimal"):
    if maximum is None:
        dv = DataValidation(type=kind, operator="greaterThanOrEqual", formula1=str(minimum), allow_blank=True)
    else:
        dv = DataValidation(type=kind, operator="between", formula1=str(minimum), formula2=str(maximum), allow_blank=True)
    dv.error = "Enter a number" + (f" from {minimum} to {maximum}." if maximum is not None else f" of at least {minimum}.")
    dv.showErrorMessage = True
    ws.add_data_validation(dv); dv.add(ref)


def notice_rows(ws, start_row, col=1):
    lines = [
        "Not tax, accounting or legal advice. Not affiliated with the Canada Revenue Agency.",
        f"Rates and limits in this file were checked on {RATES_AS_OF} (version {VERSION}). Check current CRA information before you rely on them.",
        "Licensed for your own household or business. Please don't share or resell this file.",
    ]
    for i, t in enumerate(lines):
        c = ws.cell(row=start_row + i, column=col, value=t); c.font = f_note
    return start_row + len(lines)
