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

def synth(text, voice, speed):
    x, _ = kokoro_tts.tts(text, voice, speed)
    nz = np.nonzero(np.abs(x) > 0.01)[0]  # trim leading/trailing silence
    return (x[nz[0]:nz[-1] + 1] if len(nz) else x), kokoro_tts.SR

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('lines'); ap.add_argument('out')
    ap.add_argument('--voice'); ap.add_argument('--speed', type=float, default=1.05); ap.add_argument('--track', type=int)
    ap.add_argument('--outro-line', default='Follow Loonie Ledger for more money tips.')
    ap.add_argument('--outro-secs', type=float, default=2.8, help='length of the outro at the end (0 if none)')
    a = ap.parse_args()
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
          f"[2:a]aresample=44100,highpass=f=90,acompressor=threshold=0.1:ratio=3:attack=5:release=80,volume=1.6,aformat=channel_layouts=stereo,asplit=2[v][key];"
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
