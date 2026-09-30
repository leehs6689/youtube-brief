"""Original score + sound design + narration mix, driven by timeline.json (same beat map as the visuals).
120 BPM, F major (F–C–Dm–Bb). Deterministic. Per language:
  vo/<lang>_pN.wav --atempo--> placed at timeline narration times, music ducked under the voice,
  two-pass loudnorm -14 LUFS / TP -2 dBTP -> out/mix_<lang>.wav + out/mix_<lang>.m4a
Usage: python3 audio.py [kr|en ...]"""
import json, pathlib, subprocess, re, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).parent
TL = json.loads((ROOT / 'timeline.json').read_text())
SR = 48000
DUR = TL['duration']
N = int(SR * DUR)
BEAT = 60.0 / TL['bpm']
CUT = [s['start'] for s in TL['scenes']]  # 0, 4.5, 17.5, 28.5, 36, 43.25, 54.75

def tt(n): return np.arange(n) / SR
def sine(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,)) if np.ndim(freq) else np.full(n, float(freq))
    return np.sin(2 * np.pi * (phase0 + np.cumsum(f / SR)))
def polyblep_saw(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,)) if np.ndim(freq) else np.full(n, float(freq))
    dt = f / SR; ph = (phase0 + np.cumsum(dt)) % 1.0; y = 2 * ph - 1
    m1 = ph < dt; t1 = ph[m1] / dt[m1]; y[m1] -= t1 + t1 - t1 * t1 - 1
    m2 = ph > 1 - dt; t2 = (ph[m2] - 1) / dt[m2]; y[m2] -= t2 * t2 + t2 + t2 + 1
    return y
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def lp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'lowpass', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'highpass', fs=SR, output='sos'), x)
def sweep_filter(x, f0, f1, kind='lowpass', block=256, order=2):
    n = len(x); y = np.zeros(n); zi = None; nb = (n + block - 1) // block
    for b in range(nb):
        p = b / max(1, nb - 1); fc = min(max(f0 * (f1 / f0) ** p, 20), SR / 2 * 0.95)
        sos = signal.butter(order, [fc / 1.6, min(fc * 1.6, SR / 2 * 0.95)], 'bandpass', fs=SR, output='sos') if kind == 'bandpass' else signal.butter(order, fc, kind, fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        out, zi = signal.sosfilt(sos, x[b * block:(b + 1) * block], zi=zi); y[b * block:(b + 1) * block] = out
    return y
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def hz(name):
    m = re.match(r'([A-G][b#]?)(-?\d)', name); return 440.0 * 2 ** ((NOTE[m.group(1)] + 12 * (int(m.group(2)) + 1) - 69) / 12)

def env_adsr(n, a, d, s, r, hold):
    na, nd, nr, nh = max(1, int(a * SR)), max(1, int(d * SR)), max(1, int(r * SR)), int(hold * SR)
    x = np.concatenate([np.linspace(0, 1, na, endpoint=False) ** 1.5, s + (1 - s) * np.exp(-np.linspace(0, 5, nd)), np.full(nh, s), s * np.exp(-np.linspace(0, 6, nr))])
    e = np.zeros(n); e[:min(n, len(x))] = x[:n]; return e

def build_music(seed=20260930):
    rng = np.random.default_rng(seed)
    noise = lambda n: rng.standard_normal(n)
    bus = {k: np.zeros((2, N)) for k in ['drums', 'bass', 'pad', 'arp', 'fx', 'verb']}
    def place(name, x, t0, gain=1.0, pan=0.0, send=0.0):
        i0 = int(round(t0 * SR))
        if i0 >= N: return
        if x.ndim == 1: x = np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan)])
        s0 = 0
        if i0 < 0: s0 = -i0; i0 = 0
        i1 = min(N, i0 + x.shape[1] - s0); seg = x[:, s0:s0 + (i1 - i0)] * gain
        bus[name][:, i0:i1] += seg
        if send: bus['verb'][:, i0:i1] += seg * send
    # instruments
    def kick(g=1.0):
        n = int(0.5 * SR); t = tt(n); body = sine(52 + 110 * np.exp(-t / 0.03), n) * np.exp(-t / 0.25)
        knock = bp(noise(n), 110, 320) * np.exp(-t / 0.025) * 0.4; click = hp(noise(n), 2500) * np.exp(-t / 0.004) * 0.35
        return np.tanh((body * 0.85 + knock + click) * 1.3) * g
    def clap():
        n = int(0.3 * SR); t = tt(n); x = bp(noise(n), 900, 4200); e = np.zeros(n)
        for k, d in enumerate([0, 0.011, 0.022]): i = int(d * SR); e[i:] += np.exp(-t[:n - i] / (0.008 if k < 2 else 0.08))
        return x * e * 0.6
    def hat(vel=1.0, open_=False):
        n = int((0.2 if open_ else 0.05) * SR); t = tt(n); return hp(noise(n), 7500, 3) * np.exp(-t / (0.06 if open_ else 0.011)) * 0.3 * vel
    def bass_note(f, dur):
        n = int(dur * SR); t = tt(n); x = polyblep_saw(f, n) + 0.5 * polyblep_saw(f * 1.004, n)
        y = lp(x, 650) * (0.4 + 0.6 * np.exp(-t / 0.1)); return lp(y * env_adsr(n, 0.004, 0.08, 0.6, 0.04, max(0, dur - 0.13)), 900) * 0.8
    def pad(names, dur, bright=1500):
        n = int(dur * SR); out = np.zeros((2, n))
        for nm in names:
            f = hz(nm) * 2
            for d, pan in [(-0.08, -0.6), (0.0, 0.0), (0.08, 0.6)]:
                v = polyblep_saw(f * 2 ** (d / 12), n, rng.random()); out[0] += v * np.sqrt(0.5 * (1 - pan)); out[1] += v * np.sqrt(0.5 * (1 + pan))
        e = env_adsr(n, 0.4, 0.3, 0.8, 0.5, max(0, dur - 1.2)); return np.stack([lp(out[0], bright), lp(out[1], bright)]) * e * 0.07
    def pluck(f, dur=0.45, bright=1.0):
        n = int(dur * SR); t = tt(n); mod = sine(f * 2.0, n) * 2.5 * bright * np.exp(-t / 0.07)
        return np.sin(2 * np.pi * np.cumsum(np.full(n, f) / SR) + mod) * np.exp(-t / 0.2) * 0.35
    def whoosh(dur=0.55, lo=300, hi=6000, g=0.4):
        n = int(dur * SR); t = tt(n); x = sweep_filter(noise(n), lo, hi, 'bandpass', 128); return x * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5 * g
    def riser(dur=1.5):
        n = int(dur * SR); t = tt(n); return sweep_filter(noise(n), 300, 6000, 'bandpass', 128) * (t / dur) ** 2 * 0.3
    def hit():
        k = kick(0.9); n = int(0.7 * SR); t = tt(n); y = sine(55, n) * np.exp(-t / 0.25) * 0.3; y[:len(k)] += k; return y
    def slam():
        k = kick(1.0); n = int(1.6 * SR); t = tt(n); y = sine(55 * np.exp(-t / 1.5) + 30, n) * np.exp(-t / 0.6) * 0.35 + hp(noise(n), 2000) * np.exp(-t / 0.05) * 0.25
        y[:len(k)] += k; return y
    def crash(dur=3.0):
        n = int(dur * SR); t = tt(n); return np.stack([hp(noise(n), 5500, 2), hp(noise(n), 5500, 2)]) * np.exp(-t / 0.9) * 0.14
    def blip(f=1760):
        n = int(0.12 * SR); t = tt(n); return (sine(f, n) + 0.3 * sine(f * 2, n)) * np.exp(-t / 0.03) * 0.25
    def shimmer(dur=3.5):  # bell-like chord for the logo
        n = int(dur * SR); t = tt(n); y = np.zeros(n)
        for nm, a in [('F5', 1), ('A5', 0.7), ('C6', 0.6), ('F6', 0.4), ('E6', 0.25)]:
            f = hz(nm); y += (sine(f, n) + 0.2 * sine(f * 2.76, n) * np.exp(-t / 0.3)) * a * np.exp(-t / 1.4)
        return y * 0.12

    CH = {'F': ['F3', 'A3', 'C4', 'F4'], 'C': ['C3', 'E3', 'G3', 'C4'], 'Dm': ['D3', 'F3', 'A3', 'D4'], 'Bb': ['Bb2', 'D3', 'F3', 'Bb3']}
    ROOT_ = {'F': 'F2', 'C': 'C2', 'Dm': 'D2', 'Bb': 'Bb1'}
    PROG = ['F', 'C', 'Dm', 'Bb']
    chord_at = lambda t: PROG[int(t // 2) % 4]
    # sections: level of groove 0 none, 1 light, 2 full
    def level(t):
        if t < CUT[1]: return 0
        if t < CUT[2]: return 1
        if t < CUT[3]: return 2
        if t < CUT[4]: return 1
        if t < CUT[5]: return 2
        if t < CUT[6]: return 2
        return 0
    beats = np.arange(0, DUR, BEAT)
    for b in beats:
        L = level(b); bi = int(round(b / BEAT))
        if L >= 1: place('drums', kick(0.8 if L == 1 else 0.95), b)
        if L >= 2 and bi % 2 == 1: place('drums', clap(), b, 0.5, send=0.12)
        if L >= 1: place('drums', hat(0.8 if L == 1 else 1.0), b + BEAT / 2, 1.0, pan=0.3)
        if L >= 2: place('drums', hat(0.45), b + BEAT / 4, 1.0, pan=-0.3); place('drums', hat(0.45), b + 3 * BEAT / 4, 1.0, pan=-0.3)
    # hook: heartbeat-like pulse on each beat (matches the bump wave)
    for b in np.arange(0, CUT[1], BEAT): place('fx', blip(880 if int(round(b / BEAT)) % 4 else 1320), b, 0.6, send=0.3)
    for b in np.arange(0, CUT[6], BEAT / 2):
        if level(b) >= 1: place('bass', bass_note(hz(ROOT_[chord_at(b)]), BEAT / 2 * 0.9), b, 0.75)
    for bi in range(int(DUR // 2) + 1):
        t0 = bi * 2.0
        if t0 < 58: place('pad', pad(CH[chord_at(t0)], 2.4, 1300 if t0 < CUT[1] else 1800), t0, 0.7, send=0.35)
    # arpeggio in the scale section
    for k, b in enumerate(np.arange(CUT[5], CUT[6], BEAT / 2)):
        ch = CH[chord_at(b)]; place('arp', pluck(hz(ch[k % 4]) * 2, 0.4), b, 0.55, pan=0.35 * (1 if k % 2 else -1), send=0.25)
    # cue hits
    place('fx', riser(1.4), CUT[1] - 1.4, 0.8)
    place('fx', hit(), CUT[1], 0.8, send=0.2)
    for c in (CUT[2], CUT[4], CUT[6]): place('fx', whoosh(0.6), c - 0.3, 1.0)
    for c in (CUT[3], CUT[5]): place('fx', whoosh(0.5, 400, 7000, 0.35), c - 0.25, 1.0); place('fx', hit(), c, 0.7)
    for a in (0.2, 4.15, 6.45): place('fx', blip(1320), CUT[1] + a, 0.7, send=0.3)          # heritage nodes
    for a in (0.2, 1.3, 2.6, 3.75): place('fx', blip(990), CUT[2] + a, 0.6, send=0.2)        # tech states
    for a in (0.35, 1.55, 2.05, 2.55, 3.1, 3.8, 4.05): place('fx', blip(1480), CUT[4] + a, 0.45, send=0.2)  # certificate tiles
    land = CUT[6] + 1.15
    place('fx', slam(), land, 1.0, send=0.3); place('fx', crash(3.2), land, 0.9); place('fx', shimmer(3.8), land, 1.0, send=0.5)
    place('pad', pad(CH['F'], 4.0, 2200), land, 0.9, send=0.4)
    # mix
    ir_n = int(1.8 * SR); tir = tt(ir_n)
    ir = np.stack([lp(noise(ir_n), 6000) * np.exp(-tir / 0.45), lp(noise(ir_n), 6000) * np.exp(-tir / 0.48)]); ir[:, :int(0.02 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
    verb = np.stack([signal.fftconvolve(bus['verb'][c], ir[c])[:N] for c in range(2)]) * 0.35
    bus['bass'] = np.stack([lp(np.tanh(hp(bus['bass'][c], 38) * 2) / 2, 1800) for c in range(2)])
    lv = {'drums': 0.8, 'bass': 0.8, 'pad': 1.0, 'arp': 0.7, 'fx': 0.9}
    mix = sum(bus[k] * g for k, g in lv.items()) + verb
    fade = np.ones(N); fi = int(58.6 * SR); fade[fi:] = np.linspace(1, 0, N - fi) ** 1.6
    return hp(mix, 35) * fade

def load_voice(lang):
    """time-stretch each paragraph (pitch kept) and place it on the timeline; returns mono voice track"""
    v = np.zeros(N)
    for k, a in enumerate(TL['narration'][lang]):
        src = ROOT / a['file']; tmp = ROOT / f'vo/_{lang}_{k}.wav'
        af = f"atempo={a['tempo']:.4f},highpass=f=80,equalizer=f=3000:t=q:w=1:g=2,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2"
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-af', af, '-ar', str(SR), '-ac', '1', str(tmp)], check=True)
        sr, x = wavfile.read(tmp); x = x.astype(np.float32) / 32768
        i0 = int(a['t'] * SR); i1 = min(N, i0 + len(x)); v[i0:i1] += x[:i1 - i0]
    return v

def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)

def main(langs):
    music = build_music()
    music /= np.max(np.abs(music)) + 1e-9
    for lang in langs:
        voice = load_voice(lang)
        # ducking: smoothed voice envelope pulls the music down ~9 dB
        env = np.abs(voice); env = signal.sosfilt(signal.butter(1, 6, 'lowpass', fs=SR, output='sos'), env)
        env = np.minimum(1, env / (np.percentile(env[env > 1e-4], 60) + 1e-9))
        duck = 1 - 0.65 * env
        voice_rms = np.sqrt(np.mean(voice[np.abs(voice) > 1e-3] ** 2))
        m = music * duck * (voice_rms / 0.18) * 0.5
        mix = m + np.stack([voice, voice])
        mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89
        out = ROOT / 'out'; out.mkdir(exist_ok=True)
        raw = out / f'mix_{lang}_raw.wav'; wavfile.write(raw, SR, mix.T.astype(np.float32))
        r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(raw), '-af', 'loudnorm=I=-14:TP=-2.0:LRA=11:print_format=json', '-f', 'null', '-'])
        js = json.loads(r.stderr[r.stderr.rfind('{'):r.stderr.rfind('}') + 1])
        af = (f"loudnorm=I=-14:TP=-2.0:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
              f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true:print_format=summary")
        run(['ffmpeg', '-y', '-hide_banner', '-i', str(raw), '-af', af + ',aresample=48000', '-ar', '48000', '-c:a', 'pcm_s24le', str(out / f'mix_{lang}.wav')])
        run(['ffmpeg', '-y', '-hide_banner', '-i', str(out / f'mix_{lang}.wav'), '-c:a', 'aac', '-b:a', '192k', str(out / f'mix_{lang}.m4a')])
        # also export music-only stem for later edits
        if lang == langs[0]: wavfile.write(out / 'music_only.wav', SR, (music * 0.5).T.astype(np.float32))
        print(lang, 'pass1', {k: js[k] for k in ('input_i', 'input_tp')})

if __name__ == '__main__':
    main(sys.argv[1:] or ['kr', 'en'])
