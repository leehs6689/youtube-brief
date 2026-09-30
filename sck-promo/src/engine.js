/* Motion engine: deterministic canvas timeline, type helpers, camera, motion blur.
   Everything is a pure function of time t (seconds). No Date.now(), no unseeded random.
   Adapted from the motion-engine skill for 1920x1080 and Pretendard. */
(function (global) {
  'use strict';
  const E = {};
  E.W = 1920; E.H = 1080;

  // ---------- maths ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, b) => (b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
  const smooth = p => p * p * (3 - 2 * p);
  Object.assign(E, { clamp, lerp, prog, smooth });

  // CSS-accurate cubic-bezier(x1,y1,x2,y2)
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = t => ((ax * t + bx) * t + cx) * t;
    const sy = t => ((ay * t + by) * t + cy) * t;
    const dx = t => (3 * ax * t + 2 * bx) * t + cx;
    return p => {
      if (p <= 0) return 0; if (p >= 1) return 1;
      let t = p;
      for (let i = 0; i < 8; i++) { const x = sx(t) - p; const d = dx(t); if (Math.abs(x) < 1e-6) break; if (Math.abs(d) < 1e-6) break; t -= x / d; }
      let lo = 0, hi = 1; t = clamp(t);
      for (let i = 0; i < 20 && Math.abs(sx(t) - p) > 1e-6; i++) { if (sx(t) < p) lo = t; else hi = t; t = (lo + hi) / 2; }
      return sy(t);
    };
  }
  E.bezier = bezier;
  E.ease = {
    in: bezier(0.16, 1, 0.3, 1),        // entrances: fast in, long settle
    out: bezier(0.7, 0, 0.84, 0),       // exits: accelerate away
    cam: bezier(0.65, 0, 0.35, 1),      // camera moves
    emph: bezier(0.34, 1.56, 0.64, 1),  // one overshoot per scene
    lin: p => p,
  };
  E.ent = (t, start, dur = 0.3, fn = E.ease.in) => fn(prog(t, start, start + dur));
  E.ext = (t, start, dur = 0.15) => 1 - E.ease.out(prog(t, start, start + dur));

  E.rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let r = Math.imul(seed ^ seed >>> 15, 1 | seed); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };

  E.track = (keys, t, fn = E.ease.cam) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) { const p = fn(prog(t, keys[i - 1][0], keys[i][0])); return lerp(keys[i - 1][1], keys[i][1], p); }
    }
    return keys[keys.length - 1][1];
  };

  // ---------- type ----------
  E.FAMILY = "'Pretendard FS', 'Apple SD Gothic Neo', sans-serif";
  E.setFont = (ctx, o = {}) => {
    const size = o.size || 40, w = o.weight || 700;
    ctx.font = `${w} ${size}px ${o.family || E.FAMILY}`;
    ctx.letterSpacing = (o.track ? o.track * size : 0) + 'px';
    ctx.fontKerning = 'normal';
  };
  E.measure = (ctx, s, o) => { ctx.save(); E.setFont(ctx, o); const m = ctx.measureText(s).width - (o.track ? o.track * (o.size || 40) : 0); ctx.restore(); return m; };
  E.text = (ctx, s, x, y, o = {}) => {
    ctx.save();
    E.setFont(ctx, o);
    ctx.globalAlpha *= (o.alpha ?? 1);
    ctx.fillStyle = o.color || '#FFFFFF';
    ctx.textBaseline = o.base || 'alphabetic';
    let ax = x; const align = o.align || 'left';
    if (align !== 'left') { const w = E.measure(ctx, s, o); ax = align === 'center' ? x - w / 2 : x - w; }
    ctx.textAlign = 'left';
    if (o.halo) { ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.strokeStyle = o.halo; ctx.lineWidth = o.haloWidth || Math.max(4, (o.size || 40) * 0.18); ctx.strokeText(s, ax, y); }
    ctx.fillText(s, ax, y);
    ctx.restore();
  };
  E.fit = (ctx, s, maxW, o) => { let size = o.size; while (size > 8 && E.measure(ctx, s, { ...o, size }) > maxW) size -= 1; return size; };
  // wrap by spaces (Korean also breaks at spaces)
  E.wrap = (ctx, s, maxW, o) => {
    const words = s.split(' '), lines = []; let cur = '';
    for (const w of words) { const test = cur ? cur + ' ' + w : w; if (E.measure(ctx, test, o) > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur); return lines;
  };
  // kinetic line: slides up out of a mask line
  E.kin = (ctx, s, x, y, t, start, o = {}) => {
    const p = E.ent(t, start, o.dur || 0.45); if (p <= 0) return;
    const size = o.size || 40, a = (o.exitAt != null) ? E.ext(t, o.exitAt, o.exitDur || 0.2) : 1;
    if (a <= 0) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(-4000, y - size * 1.1, 12000, size * 1.45); ctx.clip();
    const dy = (1 - p) * size * 1.15 - (o.exitAt != null ? (1 - a) * size * 0.6 : 0);
    E.text(ctx, s, x, y + dy, { ...o, alpha: (o.alpha ?? 1) * a });
    ctx.restore();
  };

  // ---------- camera ----------
  E.camera = (ctx, cam) => {
    ctx.translate(cam.sx ?? E.W / 2, cam.sy ?? E.H / 2);
    ctx.rotate(cam.rot || 0);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);
  };

  // ---------- frame rendering with motion blur ----------
  E.makeRenderer = (canvas, drawFn, opts = {}) => {
    const ctx = canvas.getContext('2d', { alpha: false });
    const scratch = document.createElement('canvas'); scratch.width = canvas.width; scratch.height = canvas.height;
    const sctx = scratch.getContext('2d', { alpha: false });
    const fps = opts.fps || 60, shutter = opts.shutter ?? 0.5;
    const freezeFrom = opts.freezeFrom ?? Infinity;
    function instant(c, t) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; drawFn(c, Math.min(t, freezeFrom)); }
    function renderFrame(t, samples = 1) {
      if (samples <= 1 || t >= freezeFrom) { instant(ctx, t); return canvas; }
      const span = shutter / fps;
      for (let k = 0; k < samples; k++) {
        const tk = t + (k / (samples - 1) - 0.5) * span;
        instant(sctx, Math.max(0, tk));
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1 / (k + 1);
        ctx.drawImage(scratch, 0, 0);
      }
      ctx.globalAlpha = 1;
      return canvas;
    }
    return { ctx, renderFrame, instant };
  };

  global.MotionEngine = E;
})(window);
