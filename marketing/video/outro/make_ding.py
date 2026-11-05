"""Synthesizes the Loonie Ledger coin 'ding' (our sonic logo) -> ding.wav. Starts at 0.35 s, when the coin lands.
v2 (owner asked for crisper): instant attack, a short metallic tick, brighter overtones, faster low decay."""
import os, wave, numpy as np
SR = 44100; n = int(2.8 * SR); t = np.arange(n) / SR; x = np.zeros(n)
rng = np.random.default_rng(7)
def bell(f, start, amp, dec):
    s = int(start * SR); tt = t[: n - s]
    parts = [(1, 1, 1), (2.0, .25, .45), (2.76, .45, .35), (4.1, .25, .22), (5.4, .2, .15), (8.9, .12, .08)]
    tone = sum(a * np.sin(2*np.pi*f*r*tt) * np.exp(-tt/(dec*d)) for r, a, d in parts)
    x[s:] += amp * tone * np.minimum(1, tt/0.0004)
def tick(start, amp):
    s = int(start * SR); m = int(0.012 * SR); nz = np.diff(rng.standard_normal(m + 1))
    x[s:s+m] += amp * nz * np.exp(-np.arange(m)/SR/0.0025)
tick(0.35, 0.35); bell(1567.98, 0.35, 0.55, 0.32)   # G6
tick(0.44, 0.25); bell(2349.32, 0.44, 0.5, 0.42)    # D7
x /= np.abs(x).max(); x *= 0.55
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ding.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
print('wrote ding.wav')
