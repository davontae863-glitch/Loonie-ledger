"""Generates Loonie Ledger's original background-music loops (no samples, no third-party audio).

Usage: python3 make_music.py [outdir]   -> track-1.m4a ... track-4.m4a (45 s each)
Everything is synthesized from sine/noise here, so the owner owns the result outright.
"""
import os, subprocess, sys, wave
import numpy as np

SR = 44100
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
SECONDS = 45

def midi(n): return 440.0 * 2 ** ((n - 69) / 12)

def env(n, a, d, s=0.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * (s + (1 - s) * np.exp(-t / d))
    rel = min(n, int(0.05 * SR)); e[-rel:] *= np.linspace(1, 0, rel)
    return e

def keys(f, n):  # soft electric-piano: fundamental + a few decaying partials + slight detune
    t = np.arange(n) / SR
    w = (np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t/0.4) + 0.12*np.sin(2*np.pi*3*f*t)*np.exp(-t/0.2)
         + 0.5*np.sin(2*np.pi*f*1.003*t))
    return w * env(n, 0.01, 1.4, 0.15) * (1 + 0.04*np.sin(2*np.pi*5*t))

def bass(f, n):
    t = np.arange(n) / SR
    return (np.sin(2*np.pi*f*t) + 0.2*np.sin(2*np.pi*2*f*t)) * env(n, 0.005, 0.5, 0.4)

def kick(n):
    t = np.arange(n) / SR
    return np.sin(2*np.pi*(45 + 90*np.exp(-t/0.04))*t) * np.exp(-t/0.18)

def hat(n, rng):
    x = rng.standard_normal(n); x = np.diff(x, prepend=0)  # crude high-pass
    return x * np.exp(-np.arange(n)/SR/0.025) * 0.08

def snare(n, rng):
    t = np.arange(n) / SR
    return (rng.standard_normal(n)*np.exp(-t/0.07)*0.28 + np.sin(2*np.pi*190*t)*np.exp(-t/0.05)*0.4)

def lowpass(x, cutoff):
    a = np.exp(-2*np.pi*cutoff/SR); y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc = (1-a)*v + a*acc; y[i] = acc
    return y

TRACKS = [  # (bpm, root midi, chord intervals per bar, bass pattern, swing, seed)
    (88,  60, [[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]], 'half', 0.10, 1),   # C maj7 - Am7 - Fmaj7 - G7, laid back
    (100, 62, [[0,3,7,10],[5,8,12,15],[10,14,17,21],[8,12,15,19]], 'eighth', 0.0, 2),  # D minor groove
    (94,  57, [[0,4,7,11],[5,9,12,16],[2,5,9,12],[7,11,14,17]], 'half', 0.08, 3),     # A maj7 - Dmaj7 - Bm7 - E7
    (106, 65, [[0,4,7,9],[7,11,14,16],[9,12,16,19],[5,9,12,16]], 'eighth', 0.0, 4),   # bright F major pop loop
]

def render(bpm, root, chords, bpat, swing, seed):
    rng = np.random.default_rng(seed)
    beat = 60 / bpm; bar = 4 * beat
    n = int(SECONDS * SR); mix = np.zeros(n); drums = np.zeros(n)
    def add(buf, start, sig):
        s = int(start * SR)
        if s >= n: return
        e = min(n, s + len(sig)); buf[s:e] += sig[:e-s]
    nb = int(SECONDS / bar) + 1
    for b in range(nb):
        ch = chords[b % len(chords)]; t0 = b * bar
        for k, iv in enumerate(ch):  # chord, slightly strummed
            add(mix, t0 + k*0.012, 0.16*keys(midi(root + iv), int(bar*SR)))
        # simple melody stab on the off-beats (chord tones, seeded)
        for q in (1.5, 2.5, 3.5):
            if rng.random() < 0.55:
                add(mix, t0 + q*beat, 0.10*keys(midi(root + 12 + ch[rng.integers(len(ch))]), int(0.6*SR)))
        bn = midi(root - 24 + ch[0])
        hits = [0, 2] if bpat == 'half' else [0, 1.5, 2, 3.5]
        for h in hits: add(mix, t0 + h*beat, 0.35*bass(bn, int(beat*1.4*SR)))
        for q in range(4):
            if q in (0, 2) or (q == 3 and rng.random() < 0.3): add(drums, t0 + q*beat, 0.6*kick(int(0.4*SR)))
            if q in (1, 3): add(drums, t0 + q*beat, 0.35*snare(int(0.25*SR), rng))
            for e in (0, 0.5):
                add(drums, t0 + (q + e + (swing if e else 0))*beat, hat(int(0.08*SR), rng) * (0.7 if e else 1))
    out = lowpass(mix, 3800) + lowpass(drums, 4500)
    fade = int(1.5*SR); out[:int(0.3*SR)] *= np.linspace(0, 1, int(0.3*SR)); out[-fade:] *= np.linspace(1, 0, fade)
    out /= np.max(np.abs(out)) + 1e-9
    return np.stack([out, np.roll(out, 300)], 1)  # tiny stereo widening

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for i, spec in enumerate(TRACKS, 1):
        x = render(*spec); wav = os.path.join(OUT, f'track-{i}.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((x * 0.9 * 32767).astype('<i2').tobytes())
        m4a = os.path.join(OUT, f'track-{i}.m4a')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
                        '-ar', '44100', '-c:a', 'aac', '-b:a', '160k', m4a], check=True)
        os.remove(wav); print('wrote', m4a)
