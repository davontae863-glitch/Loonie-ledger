"""Prints today's Pinterest pin style, "light" (white) or "dark" (green), picked at random per date.
Owner request 2026-11-06: shuffle randomly between white and green pins.
The pick is seeded by the date, so re-running a day gives the same answer.
Usage: python3 marketing/video/pin_style.py [YYYY-MM-DD]   (default: today in America/Edmonton)"""
import datetime, hashlib, random, sys, zoneinfo
d = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now(zoneinfo.ZoneInfo('America/Edmonton')).date().isoformat()
print(random.Random(hashlib.sha256(d.encode()).hexdigest()).choice(['light', 'dark']))
