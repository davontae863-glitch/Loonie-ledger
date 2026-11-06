"""Prints today's Pinterest pin style, "light" (white) or "dark" (green), picked at random per date.
Owner request 2026-11-06: shuffle randomly between white and green pins.
The pick is seeded by the date, so re-running a day gives the same answer.
Usage: python3 marketing/video/pin_style.py [YYYY-MM-DD] [pin|carousel|video]   (default: today in America/Edmonton, pin)
The carousel pick is drawn separately from the pin pick, so they don't always match."""
import datetime, hashlib, random, sys, zoneinfo
d = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] not in ('pin', 'carousel', 'video') else datetime.datetime.now(zoneinfo.ZoneInfo('America/Edmonton')).date().isoformat()
kind = next((k for k in ('carousel', 'video') if k in sys.argv[1:]), 'pin')
seed = d if kind == 'pin' else d + ':' + kind
print(random.Random(hashlib.sha256(seed.encode()).hexdigest()).choice(['light', 'dark']))
