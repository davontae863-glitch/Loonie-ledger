"""Adds a voiceover (Kokoro TTS, see kokoro_tts.py) that reads the on-screen text, over one of our music tracks (ducked under the voice).

Usage: python3 voiceover.py <in.mp4> <lines.json> <out.mp4> [--voice af_heart] [--speed 1.12] [--track N]
lines.json: [{"t": 0.15, "text": "Took money out of your TFSA?"}, ...]  t = seconds when that text appears on screen.
Run marketing/video/get_tts.sh first.
Each line is spoken starting at its t; if it would run into the next line it's re-voiced faster (up to 1.4x).
"""
import argparse, json, os, subprocess, sys, tempfile, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
VOICES = ['aspen']  # owner picked Aspen (kokoro_tts.BLENDS) on 2026-11-05
sys.path.insert(0, HERE); import kokoro_tts

# Voice polish: warmth (200 Hz), presence (3 kHz), less digital harshness (7.5 kHz), gentle compression, a small-room echo.
POLISH = 'highpass=f=80,equalizer=f=200:t=q:w=1:g=2,equalizer=f=3000:t=q:w=1.2:g=1.5,equalizer=f=7500:t=q:w=1.5:g=-3,acompressor=threshold=0.1:ratio=2.5:attack=8:release=120,aecho=0.85:0.5:28|46:0.08|0.05,volume=1.6'
PLAIN = 'highpass=f=90,acompressor=threshold=0.1:ratio=3:attack=5:release=80,volume=1.6'
HUMANIZE = True  # natural pauses between sentences + tiny pace variation (owner: "take a lot of that AI out", 2026-11-06)

def synth(text, voice, speed):
    import random, re
    if not HUMANIZE:
        x, _ = kokoro_tts.tts(text, voice, speed)
    else:
        rnd = random.Random(text)  # same line -> same result on re-runs
        parts = [p for p in re.split(r'(?<=[.!?])\s+', text.strip()) if p]
        chunks = []
        for i, part in enumerate(parts):
            y, _ = kokoro_tts.tts(part, voice, speed * rnd.uniform(0.97, 1.03))
            nz = np.nonzero(np.abs(y) > 0.01)[0]
            y = y[nz[0]:nz[-1] + 1] if len(nz) else y
            f = min(len(y), int(0.008 * kokoro_tts.SR)); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f)
            chunks.append(y)
            if i < len(parts) - 1:  # a breath-length pause between sentences, a bit longer after questions
                chunks.append(np.zeros(int(kokoro_tts.SR * (rnd.uniform(0.24, 0.32) if part.endswith('?') else rnd.uniform(0.16, 0.24))), np.float32))
        x = np.concatenate(chunks) if chunks else np.zeros(1, np.float32)
    nz = np.nonzero(np.abs(x) > 0.01)[0]  # trim leading/trailing silence
    return (x[nz[0]:nz[-1] + 1] if len(nz) else x), kokoro_tts.SR

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('lines'); ap.add_argument('out')
    ap.add_argument('--voice'); ap.add_argument('--plain', action='store_true', help='no humanize/polish (A/B tests)'); ap.add_argument('--speed', type=float, default=1.05); ap.add_argument('--track', type=int)
    ap.add_argument('--outro-line', default='Follow for a Canadian money tip every day.')
    ap.add_argument('--outro-secs', type=float, default=2.8, help='length of the outro at the end (0 if none)')
    a = ap.parse_args()
    global HUMANIZE
    if a.plain: HUMANIZE = False
    lines = sorted(json.load(open(a.lines)), key=lambda l: l['t'])
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video]))
    if a.outro_secs and a.outro_line:  # spoken sign-off as the outro's coin lands
        lines = [l for l in lines if l['t'] < dur - a.outro_secs] + [{'t': dur - a.outro_secs + 0.2, 'text': a.outro_line}]
    import datetime, zoneinfo
    doy = datetime.datetime.now(zoneinfo.ZoneInfo('America/Edmonton')).timetuple().tm_yday
    voice = a.voice or VOICES[doy % len(VOICES)]
    tracks = sorted(f for f in os.listdir(os.path.join(HERE, 'music')) if f.startswith('track-') and f.endswith('.m4a'))
    track = os.path.join(HERE, 'music', f'track-{a.track}.m4a' if a.track else tracks[doy % len(tracks)])
    tmp = tempfile.mkdtemp(); sr = 24000; vo = np.zeros(int((dur + 1) * sr), np.float32); cursor = 0.0
    for i, l in enumerate(lines):
        start = max(l['t'], cursor)
        limit = (lines[i + 1]['t'] if i + 1 < len(lines) else dur - 0.05) - start - 0.12
        speed = a.speed; x, sr = synth(l['text'], voice, speed)
        if len(x) / sr > limit and limit > 0:
            speed = min(1.4, speed * (len(x) / sr) / limit); x, sr = synth(l['text'], voice, speed)
        s = int(start * sr); e = min(len(vo), s + len(x)); vo[s:e] += x[:e - s]; cursor = start + len(x) / sr + 0.1
        print(f'  {start:5.2f}s  x{speed:.2f}  {l["text"]}', file=sys.stderr)
        if cursor > dur: print('  WARNING: voiceover runs past the end of the video', file=sys.stderr)
    vw = os.path.join(tmp, 'voice.wav')
    with wave.open(vw, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(vo / (np.abs(vo).max() + 1e-9) * 0.9, -1, 1) * 32767).astype('<i2').tobytes())
    fade = max(0, dur - 1.5)
    fc = (f"[1:a]atrim=0:{dur},afade=t=in:d=0.02,afade=t=out:st={fade}:d=1.5,volume=0.5,aformat=channel_layouts=stereo[m];"
          f"[2:a]aresample=44100,{POLISH if HUMANIZE else PLAIN},aformat=channel_layouts=stereo,asplit=2[v][key];"
          f"[m][key]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=300[md];"
          f"[0:a]aresample=44100,aformat=channel_layouts=stereo,volume=0.8[o];"
          f"[md][v][o]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=9[a]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', a.video, '-i', track, '-i', vw, '-filter_complex', fc,
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-t', str(dur),
                    '-movflags', '+faststart', a.out + '.tmp.mp4'], check=True)
    os.replace(a.out + '.tmp.mp4', a.out)
    print(f'voiceover: voice {voice}, {os.path.basename(track)} -> {a.out}')

if __name__ == '__main__':
    main()
