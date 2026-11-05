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

def pluck(f, n, decay=0.18):  # bright, short synth pluck (saw-ish from a few harmonics)
    t = np.arange(n) / SR
    w = sum(np.sin(2*np.pi*k*f*t) / k for k in range(1, 7)) + 0.6*np.sin(2*np.pi*f*1.006*t)
    return w * env(n, 0.003, decay)

def clap(n, rng):
    t = np.arange(n) / SR; x = rng.standard_normal(n); x = np.diff(x, prepend=0)
    e = np.exp(-t/0.09) + 0.6*np.exp(-np.maximum(0, t-0.012)/0.01)*(t > 0.012)
    return x * e * 0.35

TRACKS = [  # upbeat (v2, owner asked for faster): (bpm, root midi, chords, 16th-note stab pattern, seed)
    (124, 60, [[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]], [0,3,6,10,12], 1),  # C - Am - F - G
    (128, 62, [[0,3,7,10],[10,14,17,21],[8,12,15,19],[5,8,12,15]], [0,3,6,8,11,14], 2),  # D minor drive
    (120, 57, [[0,4,7,11],[7,11,14,17],[9,12,16,19],[5,9,12,16]], [2,6,10,14], 3),  # A major, off-beat stabs
    (126, 65, [[0,4,7,9],[7,11,14,16],[9,12,16,19],[5,9,12,16]], [0,3,6,10,13], 4),  # bright F pop
]

def render(bpm, root, chords, stabs, seed):
    rng = np.random.default_rng(seed)
    beat = 60 / bpm; bar = 4 * beat; six = beat / 4
    n = int(SECONDS * SR); mix = np.zeros(n); drums = np.zeros(n)
    def add(buf, start, sig):
        s = int(start * SR)
        if s >= n: return
        e = min(n, s + len(sig)); buf[s:e] += sig[:e-s]
    for b in range(int(SECONDS / bar) + 1):
        ch = chords[b % len(chords)]; t0 = b * bar
        for p in stabs:  # chord stabs
            for k, iv in enumerate(ch): add(mix, t0 + p*six + k*0.004, 0.09*pluck(midi(root + iv), int(0.3*SR)))
        arp = [ch[i % len(ch)] + 12*(1 + (i // len(ch)) % 2) for i in range(16)]
        for i in range(16):  # 16th-note arpeggio, quieter
            add(mix, t0 + i*six, 0.045*pluck(midi(root + arp[i]), int(0.15*SR), 0.08))
        bn = midi(root - 24 + ch[0])
        for q in range(4):  # off-beat bass + octave pop
            add(mix, t0 + (q + 0.5)*beat, 0.4*bass(bn, int(beat*0.45*SR)))
            if q % 2: add(mix, t0 + (q + 0.75)*beat, 0.2*bass(bn*2, int(six*0.9*SR)))
        for q in range(4):
            add(drums, t0 + q*beat, 0.75*kick(int(0.3*SR)))
            if q in (1, 3): add(drums, t0 + q*beat, 0.6*clap(int(0.3*SR), rng))
            for e in range(4):
                add(drums, t0 + (q + e/4)*beat, hat(int(0.05*SR), rng) * (1.6 if e == 2 else 0.8))
        if b % 4 == 3:  # little snare fill into every 4th bar
            for e in range(4): add(drums, t0 + (3 + e/4)*beat, 0.25*(0.6 + 0.15*e)*snare(int(0.15*SR), rng))
    out = lowpass(mix, 7000) + lowpass(drums, 9000)
    fade = int(1.5*SR); out[:int(0.02*SR)] *= np.linspace(0, 1, int(0.02*SR)); out[-fade:] *= np.linspace(1, 0, fade)
    out /= np.max(np.abs(out)) + 1e-9
    return np.stack([out, np.roll(out, 300)], 1)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for i, spec in enumerate(TRACKS, 1):
        x = render(*spec); wav = os.path.join(OUT, f'track-{i}.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((x * 0.9 * 32767).astype('<i2').tobytes())
        m4a = os.path.join(OUT, f'track-{i}.m4a')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.2:LRA=7',
                        '-ar', '44100', '-c:a', 'aac', '-b:a', '160k', m4a], check=True)
        os.remove(wav); print('wrote', m4a)
