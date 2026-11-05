"""Synthesizes the Loonie Ledger coin 'ding' (our sonic logo) -> ding.wav. Starts at 0.35 s, when the coin lands."""
import os, wave, numpy as np
SR = 44100; n = int(2.8 * SR); t = np.arange(n) / SR; x = np.zeros(n)
def bell(f, start, amp, dec):
    s = int(start * SR); tt = t[: n - s]
    tone = sum(a * np.sin(2*np.pi*f*r*tt) * np.exp(-tt/(dec*d)) for r, a, d in [(1,1,1),(2.76,.35,.5),(5.4,.15,.3),(1.5,.1,.6)])
    x[s:] += amp * tone * np.minimum(1, tt/0.002)
bell(1318.5, 0.35, 0.6, 0.45)   # E6
bell(1975.5, 0.47, 0.5, 0.6)    # B6
x /= np.abs(x).max(); x *= 0.5
with wave.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ding.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
print('wrote ding.wav')
