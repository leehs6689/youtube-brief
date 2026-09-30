"""Split raw narration into scene paragraphs using detected silences, cap internal pauses.
Outputs vo/<lang>_pNN.wav (mono 48k) and vo/segments.json with durations."""
import subprocess, re, json, sys, pathlib
import numpy as np
from scipy.io import wavfile
ROOT = pathlib.Path(__file__).parent
SR = 48000
# paragraph boundary silences (start,end) found by silencedetect, per language
BOUNDS = {
  'kr': [(4.57, 5.30), (20.48, 21.19), (34.91, 35.63), (44.21, 44.96), (53.16, 53.97), (67.44, 68.14)],
  'en': [(3.33, 4.04), (19.52, 20.23), (31.32, 31.93), (38.11, 38.90), (47.64, 48.24), (61.22, 61.81)],
}
GAP_CAP = 0.20   # max pause inside a paragraph (s)
def load(lang):
    wav = ROOT / f'{lang}_raw.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(ROOT / f'{lang}_raw.mp3'), '-ac', '1', '-ar', str(SR), str(wav)], check=True)
    sr, x = wavfile.read(wav); return x.astype(np.float32) / 32768
def silences(x, thr_db=-40, min_d=0.18):
    win = int(0.01 * SR); n = len(x) // win
    rms = np.sqrt(np.mean(x[:n * win].reshape(n, win) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms); quiet = db < thr_db
    out = []; i = 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]: j += 1
            if (j - i) * 0.01 >= min_d: out.append((i * 0.01, j * 0.01))
            i = j
        else: i += 1
    return out
res = {}
for lang, b in BOUNDS.items():
    x = load(lang); dur = len(x) / SR
    edges = [0.0] + [v for s, e in b for v in (s, e)] + [dur]
    paras = [(edges[2 * k], edges[2 * k + 1]) for k in range(len(b) + 1)]
    segs = []
    for k, (a, e) in enumerate(paras):
        y = x[int(a * SR):int(e * SR)]
        # trim leading/trailing silence
        sil = silences(y)
        lead = sil[0][1] if sil and sil[0][0] <= 0.01 else 0.0
        tail = sil[-1][0] if sil and sil[-1][1] >= len(y) / SR - 0.02 else len(y) / SR
        # cap internal pauses
        keep = []; cur = lead
        for s0, s1 in sil:
            if s0 <= lead + 0.01 or s1 >= tail - 0.01: continue
            if s1 - s0 > GAP_CAP:
                keep.append((cur, s0 + GAP_CAP / 2)); cur = s1 - GAP_CAP / 2
        keep.append((cur, tail))
        z = np.concatenate([y[int(p * SR):int(q * SR)] for p, q in keep])
        fade = int(0.01 * SR); z[:fade] *= np.linspace(0, 1, fade); z[-fade:] *= np.linspace(1, 0, fade)
        out = ROOT / f'{lang}_p{k + 1}.wav'; wavfile.write(out, SR, (z * 32767).astype(np.int16))
        segs.append(round(len(z) / SR, 3))
    res[lang] = segs
    print(lang, segs, 'sum', round(sum(segs), 2))
json.dump(res, open(ROOT / 'segments.json', 'w'), indent=1)
