"""Text -> speech with Kokoro-82M (Apache-2.0 model, github.com/hexgrad/kokoro; ONNX files from
github.com/thewh1teagle/kokoro-onnx releases) using onnxruntime, with espeak-ng (from the Piper bundle) for phonemes.

python3 kokoro_tts.py "text" out.wav [--voice af_heart] [--speed 1.1]
Files: ~/.cache/loonie-kokoro/{kokoro-v1.0.onnx,voices-v1.0.bin}  (marketing/video/get_tts.sh downloads them)
"""
import os, re, subprocess, sys, wave
import numpy as np

KDIR = os.environ.get('KOKORO_DIR', os.path.expanduser('~/.cache/loonie-kokoro'))
PDIR = os.environ.get('PIPER_DIR', os.path.expanduser('~/.cache/loonie-piper'))
SR = 24000
_V = {';':1,':':2,',':3,'.':4,'!':5,'?':6,'—':9,'…':10,'"':11,'(':12,')':13,'“':14,'”':15,' ':16,'̃':17,'ʣ':18,'ʥ':19,'ʦ':20,'ʨ':21,
      'ᵝ':22,'ꭧ':23,'A':24,'I':25,'O':31,'Q':33,'S':35,'T':36,'W':39,'Y':41,'ᵊ':42,'a':43,'b':44,'c':45,'d':46,'e':47,'f':48,'h':50,
      'i':51,'j':52,'k':53,'l':54,'m':55,'n':56,'o':57,'p':58,'q':59,'r':60,'s':61,'t':62,'u':63,'v':64,'w':65,'x':66,'y':67,'z':68,'ɑ':69,
      'ɐ':70,'ɒ':71,'æ':72,'β':75,'ɔ':76,'ɕ':77,'ç':78,'ɖ':80,'ð':81,'ʤ':82,'ə':83,'ɚ':85,'ɛ':86,'ɜ':87,'ɟ':90,'ɡ':92,'ɥ':99,'ɨ':101,'ɪ':102,
      'ʝ':103,'ɯ':110,'ɰ':111,'ŋ':112,'ɳ':113,'ɲ':114,'ɴ':115,'ø':116,'ɸ':118,'θ':119,'œ':120,'ɹ':123,'ɾ':125,'ɻ':126,'ʁ':128,'ɽ':129,'ʂ':130,
      'ʃ':131,'ʈ':132,'ʧ':133,'ʊ':135,'ʋ':136,'ʌ':138,'ɣ':139,'ɤ':140,'χ':142,'ʎ':143,'ʒ':147,'ʔ':148,'ˈ':156,'ˌ':157,'ː':158,'ʰ':162,'ʲ':164,
      '↓':169,'→':171,'↗':172,'↘':173,'ᵻ':177}
TIE = '͡'
_MAP = [(TIE,''),('aɪ','I'),('aʊ','W'),('dʒ','ʤ'),('eɪ','A'),('tʃ','ʧ'),('ɔɪ','Y'),('oʊ','O'),('əʊ','O'),('ɚ','əɹ'),('r','ɹ'),('x','k'),('ɐ','ə'),('ɬ','l'),('ː','')]

def espeak(text):
    env = dict(os.environ, ESPEAK_DATA_PATH=os.path.join(PDIR, 'piper', 'espeak-ng-data'), LD_LIBRARY_PATH=os.path.join(PDIR, 'piper'))
    out = subprocess.run([os.path.join(PDIR, 'piper', 'espeak-ng'), '-q', '--ipa=1', '-v', 'en-us', text], env=env,
                         capture_output=True, text=True, check=True).stdout
    return ' '.join(out.split())

def phonemize(text):
    text = text.replace('$', ' dollars ').replace('%', ' percent').replace('&', ' and ')
    parts = re.split(r'([.,!?;:—…])', text); ps = ''
    for p in parts:
        if not p.strip(): continue
        if p in '.,!?;:—…': ps = ps.rstrip() + p + ' '; continue
        ph = espeak(p.strip())
        for a, b in _MAP: ph = ph.replace(a, b)
        ps += ph + ' '
    return ''.join(c for c in ps.strip() if c in _V)

_sess = _voices = None
_eng = {}  # engine name -> (session, voices dict)
K11_DIR = os.environ.get('KOKORO11_DIR', os.path.expanduser('~/.cache/loonie-tts2/kokoro-multi-lang-v1_1.x/kokoro-multi-lang-v1_1'))

def engine(name):
    """'v10' = Kokoro v1.0 (default), 'v11' = Kokoro v1.1 (newer English voices af_maple, af_sol, bf_vale)."""
    import onnxruntime as ort
    if name not in _eng:
        if name == 'v11':
            sess = ort.InferenceSession(os.path.join(K11_DIR, 'model.onnx'), providers=['CPUExecutionProvider'])
            meta = sess.get_modelmeta().custom_metadata_map
            names = meta['speaker_names'].split(',')
            arr = np.fromfile(os.path.join(K11_DIR, 'voices.bin'), dtype=np.float32).reshape(len(names), 510, 1, 256)
            _eng[name] = (sess, {n: arr[i] for i, n in enumerate(names)})
        else:
            sess = ort.InferenceSession(os.path.join(KDIR, 'kokoro-v1.0.onnx'), providers=['CPUExecutionProvider'])
            _eng[name] = (sess, dict(np.load(os.path.join(KDIR, 'voices-v1.0.bin'))))
    return _eng[name]

BLENDS = {  # our own voices: weighted mixes of Kokoro's built-in voice styles (made 2026-11-05)
    'maple':   {'af_heart': 0.5, 'af_bella': 0.5},
    'juniper': {'af_bella': 0.7, 'af_jessica': 0.3},
    'aspen':   {'af_heart': 0.6, 'af_sarah': 0.4},
    'rowan':   {'am_puck': 0.5, 'am_michael': 0.5},
}
V11_VOICES = {'maple': 'af_maple', 'sol': 'af_sol', 'vale': 'bf_vale'}  # Kokoro v1.1 voices (engine 'v11')

def blend(voice, voices=None):
    """voice = a Kokoro voice id, a name from BLENDS, or 'af_bella:0.6,af_heart:0.4'."""
    voices = voices if voices is not None else _voices
    spec = BLENDS.get(voice) or ({k: float(w) for k, w in (p.split(':') for p in voice.split(','))} if ':' in voice else {voice: 1.0})
    tot = sum(spec.values())
    return sum(voices[k] * (w / tot) for k, w in spec.items())

def tts(text, voice='af_heart', speed=1.0):
    """voice may be prefixed 'v11:' (e.g. 'v11:maple') to use Kokoro v1.1."""
    eng = 'v10'
    if voice.startswith('v11:'):
        eng, voice = 'v11', V11_VOICES.get(voice[4:], voice[4:])
    sess, voices = engine(eng)
    ph = phonemize(text)[:510]; toks = [_V[c] for c in ph]
    style = blend(voice, voices)[len(toks)]  # (1, 256)
    audio = sess.run(None, {'tokens': np.array([[0, *toks, 0]], np.int64), 'style': style.astype(np.float32),
                            'speed': np.array([speed], np.float32)})[0]
    return np.asarray(audio, np.float32).reshape(-1), ph

def save(path, x, sr=SR):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(); ap.add_argument('text'); ap.add_argument('out'); ap.add_argument('--voice', default='af_heart'); ap.add_argument('--speed', type=float, default=1.0)
    a = ap.parse_args(); x, ph = tts(a.text, a.voice, a.speed); save(a.out, x); print(ph, f'{len(x)/SR:.2f}s')
