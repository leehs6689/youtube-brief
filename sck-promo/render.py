"""Deterministic frame renderer: headless Chromium seeks window.renderAt(t, samples) and saves PNGs.
Usage:
  python3 render.py stills --lang kr --times 0,1.5,3 [--samples 1] [--out frames_test]
  python3 render.py sheet  --lang kr --step 0.5 [--out frames_sheet]
  python3 render.py full   --lang kr [--fps 60] [--samples 8] [--workers 4] [--out frames_kr]
"""
import argparse, asyncio, base64, json, pathlib, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).parent
CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

async def worker(pw, wid, jobs, samples, outdir, errors, page_path):
    browser = await pw.chromium.launch(executable_path=CHROME, args=['--font-render-hinting=none', '--disable-gpu-vsync'])
    page = await browser.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
    page.on('pageerror', lambda e: errors.append(f'w{wid} pageerror: {e}'))
    page.on('console', lambda m: errors.append(f'w{wid} console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    await page.goto(f'file://{page_path}?render=1')
    await page.evaluate('window.ready')
    for name, t in jobs:
        data = await page.evaluate('([t,s]) => window.renderAt(t,s)', [t, samples])
        (outdir / name).write_bytes(base64.b64decode(data.split(',', 1)[1]))
    await browser.close()

async def run(jobs, samples, outdir, workers, page_path):
    outdir.mkdir(parents=True, exist_ok=True)
    errors = []
    chunks = [jobs[i::workers] for i in range(workers)]
    async with async_playwright() as pw:
        await asyncio.gather(*[worker(pw, i, c, samples, outdir, errors, page_path) for i, c in enumerate(chunks) if c])
    for e in errors[:20]:
        print(e, file=sys.stderr)
    return errors

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode', choices=['stills', 'sheet', 'full'])
    ap.add_argument('--lang', default='kr')
    ap.add_argument('--times', default='')
    ap.add_argument('--step', type=float, default=0.5)
    ap.add_argument('--fps', type=int, default=60)
    ap.add_argument('--samples', type=int, default=1)
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--out', default='')
    ap.add_argument('--start', type=int, default=0)
    ap.add_argument('--end', type=int, default=-1)
    a = ap.parse_args()
    page_path = (ROOT / f'out/render_{a.lang}.html').resolve()
    dur = json.loads((ROOT / 'timeline.json').read_text())['duration']
    if a.mode == 'stills':
        ts = [float(x) for x in a.times.split(',') if x]
        jobs = [(f't_{t:06.3f}.png', t) for t in ts]
        out = ROOT / (a.out or f'frames_test_{a.lang}')
    elif a.mode == 'sheet':
        n = int(round(dur / a.step)) + 1
        jobs = [(f's_{i:04d}.png', min(dur, i * a.step)) for i in range(n)]
        out = ROOT / (a.out or f'frames_sheet_{a.lang}')
    else:
        n = int(round(dur * a.fps))
        end = n if a.end < 0 else min(n, a.end)
        jobs = [(f'f_{i:05d}.png', i / a.fps) for i in range(a.start, end)]
        out = ROOT / (a.out or f'frames_{a.lang}')
    t0 = time.time()
    errs = asyncio.run(run(jobs, a.samples, out, a.workers, page_path))
    print(f'{len(jobs)} frames -> {out} in {time.time()-t0:.1f}s, {len(errs)} console errors/warnings')

if __name__ == '__main__':
    main()
