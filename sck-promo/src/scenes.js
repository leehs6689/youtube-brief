/* STATS ChipPAC Korea — 60 s corporate film. Scenes are pure functions of time.
   Signature motif: the magenta dot from the logo = a solder bump = the point of connection.
   It lights the die (hook), travels the heritage line, marks Incheon on the globe,
   runs the certification bus, and lands on the "i" of the logo at the end. */
(function (global) {
  'use strict';
  const E = global.MotionEngine, TL = global.TIMELINE;
  const { clamp, lerp, prog, ent, ext, ease, track } = E;
  const W = E.W, H = E.H;
  const LANG = global.LANG || 'kr';
  const KR = LANG === 'kr';

  // ---------------- brand tokens (from the company PPT theme + logo) ----------------
  const C = {
    bg: '#03051A', deep: '#070C38', panel: '#0A1250', edge: '#22308A', line: '#1B2A7A',
    navy: '#0000A0', blue: '#004BFF', sky: '#0098FF', cyan: '#00D6FF',
    mag: '#CC25B8', pink: '#FF4ABD', ink: '#FFFFFF', muted: '#A9B4E8', dim: '#6B77B8',
  };
  const M = 150; // left margin for text blocks

  // ---------------- copy (per language) ----------------
  const T = KR ? {
    hookSmall: '모든 반도체는', hook1: '연결될 때,', hook2: '완성됩니다.',
    n1: ['현대전자', '반도체 조립 부문에서 출발'], n2: ['STATS ChipPAC', '스태츠칩팩으로'], n3: ['JCET Group', '제이셋 그룹 합류'],
    years: '년, 쌓아온 패키징의 역사', now: '이제, 인천에서',
    techSub: ['플립칩', '패키지 온 패키지', '웨이퍼 레벨', '시스템 인 패키지'],
    wafer1: '12인치', wafer2: '웨이퍼 범핑', pitchPre: '최소 범프 피치', pitchPost: '대응',
    placeTag: '조립 · 테스트', place1: '인천국제공항', place2: '자유무역지역', rndTag: 'R&D', rnd: '한국 연구개발 센터',
    qTitle: '국제 표준으로 증명한 신뢰',
    cats: ['자동차 품질', '품질경영', '환경', '안전보건', '에너지', '정보보호', '비즈니스 연속성'],
    rankTag: 'JCET GROUP · 2024', rank1: '매출 기준 세계 3위', rank2: '반도체 후공정(OSAT) 전문기업',
    aiSub: 'AI · 고성능 컴퓨팅 수요', util: '꾸준히 높은 가동률', utilSub: '한국 사업장',
    tagline: '칩을 세상과 잇다',
  } : {
    hookSmall: 'Every chip is', hook1: 'complete when', hook2: 'connected.',
    n1: ['Hyundai Electronics', 'Semiconductor assembly division'], n2: ['STATS ChipPAC', 'A new name'], n3: ['JCET Group', 'Joins the JCET Group'],
    years: 'years of packaging expertise', now: 'Now in Incheon',
    techSub: ['', '', '', ''],
    wafer1: '12-inch', wafer2: 'wafer bumping', pitchPre: 'Bump pitch down to', pitchPost: '',
    placeTag: 'ASSEMBLY & TEST', place1: 'Incheon Airport', place2: 'Free Trade Zone', rndTag: 'R&D', rnd: 'R&D center in Korea',
    qTitle: 'Proven by international standards',
    cats: ['Automotive quality', 'Quality management', 'Environment', 'Health & safety', 'Energy', 'Information security', 'Business continuity'],
    rankTag: 'JCET GROUP · 2024', rank1: 'World No.3 by revenue', rank2: 'Outsourced semiconductor assembly & test (OSAT)',
    aiSub: 'AI & high-performance computing', util: 'Consistently high utilization', utilSub: 'Korea operations',
    tagline: 'Connecting chips to the world',
  };

  // captions: narration split into chunks, timed by character share within each paragraph
  const CAP = KR ? [
    ['모든 반도체는, 세상과 연결될 때 비로소 완성됩니다.'],
    ['1984년 현대전자 반도체 조립 부문에서 시작해,', '2004년 스태츠칩팩, 2015년 제이셋 그룹으로.', '40년 넘게 쌓아온 패키징의 역사가, 이제 인천에서 이어집니다.'],
    ['플립칩, 패키지 온 패키지, 웨이퍼 레벨,', '그리고 첨단 시스템 인 패키지.', '12인치 웨이퍼 범핑 라인은,', '최소 40µm 범프 피치까지 대응합니다.'],
    ['인천국제공항 자유무역지역에서 조립과 테스트를,', '그리고 한국 연구개발 센터에서 다음 기술을 준비합니다.'],
    ['자동차 품질부터 환경, 안전, 에너지, 정보보호까지.', '국제 표준으로 신뢰를 증명합니다.'],
    ['JCET는 2024년 매출 기준,', '세계 3위의 반도체 후공정 전문기업.', 'AI와 고성능 컴퓨팅 수요 속에,', '한국 사업장은 꾸준히 높은 가동률을 이어가고 있습니다.'],
    null,
  ] : [
    ['Every chip is complete only when it connects to the world.'],
    ["It began in 1984 at Hyundai Electronics' assembly division,", 'became STATS ChipPAC in 2004, and joined the JCET Group in 2015.', 'Over forty years of packaging expertise, now in Incheon.'],
    ['Flip chip, package-on-package, wafer-level,', 'and advanced system-in-package.', 'Our 12-inch wafer bumping line is capable of', 'bump pitches down to 40 microns.'],
    ['Assembly and test in the Incheon Airport Free Trade Zone,', 'backed by our R&D center in Korea.'],
    ['Automotive quality, environment, safety, energy and information security —', 'trust, proven by international standards.'],
    ["JCET: the world's number-three OSAT by 2024 revenue.", 'And as AI and high-performance computing surge,', 'our Korea operations run at consistently high utilization.'],
    null,
  ];
  const NAR = TL.narration[LANG];
  const capTimes = [];
  CAP.forEach((chunks, k) => {
    if (!chunks) return;
    const n = NAR[k]; const tot = chunks.reduce((a, s) => a + s.length + 6, 0);
    let t0 = n.t;
    chunks.forEach(s => { const d = n.dur * (s.length + 6) / tot; capTimes.push({ s, a: t0, b: t0 + d }); t0 += d; });
  });

  // ---------------- logo (vector trace of the supplied logo) ----------------
  const LG = global.LOGO;
  const LP = { text: new Path2D(LG.text), dot: new Path2D(LG.dot), c: new Path2D(LG.c) };
  const [lx0, ly0, lx1, ly1] = LG.bbox;
  // draw logo centred at (x,y) with width w. mode 'white' | 'navy'. reveal 0..1 (left->right). showDot
  function logo(ctx, x, y, w, o = {}) {
    const s = w / (lx1 - lx0), h = (ly1 - ly0) * s;
    ctx.save();
    ctx.translate(x - w / 2, y - h / 2); ctx.scale(s, s); ctx.translate(-lx0, -ly0);
    ctx.globalAlpha *= o.alpha ?? 1;
    if (o.reveal != null && o.reveal < 1) { ctx.beginPath(); ctx.rect(lx0 - 2, ly0 - 20, (lx1 - lx0 + 4) * clamp(o.reveal), ly1 - ly0 + 40); ctx.clip(); }
    ctx.fillStyle = o.mode === 'navy' ? C.navy : C.ink; ctx.fill(LP.text, 'evenodd');
    const [cx0, cy0, cx1, cy1] = LG.cbox;
    const g = ctx.createLinearGradient(cx0, cy1, cx1, cy0); g.addColorStop(0, C.blue); g.addColorStop(1, C.cyan);
    ctx.fillStyle = g; ctx.fill(LP.c, 'evenodd');
    if (o.showDot !== false) { ctx.fillStyle = C.mag; ctx.fill(LP.dot); }
    ctx.restore();
    return { s, h, dot: [x - w / 2 + (LG.dotc[0] - lx0) * s, y - h / 2 + (LG.dotc[1] - ly0) * s, LG.dotc[2] * s] };
  }

  // ---------------- shared drawing ----------------
  const NET = (() => { const r = E.rng(77); const a = []; for (let i = 0; i < 46; i++) a.push({ x: r() * W, y: r() * H, vx: (r() - 0.5) * 14, vy: (r() - 0.5) * 10, s: 1 + r() * 2.2, ph: r() * 6.28 }); return a; })();
  function background(ctx, t, o = {}) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * (o.cx ?? 0.62), H * 0.45, 40, W * 0.6, H * 0.5, W * 0.75);
    g.addColorStop(0, 'rgba(10,22,110,0.85)'); g.addColorStop(0.55, 'rgba(6,12,60,0.5)'); g.addColorStop(1, 'rgba(3,5,26,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // brand constellation network, slow drift
    const na = o.net ?? 1; if (na <= 0) return;
    const pts = NET.map(p => [((p.x + p.vx * t) % W + W) % W, ((p.y + p.vy * t) % H + H) % H, p]);
    ctx.save(); ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], d = Math.hypot(dx, dy);
      if (d < 230) { ctx.strokeStyle = `rgba(0,152,255,${0.10 * (1 - d / 230) * na})`; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke(); }
    }
    for (const [x, y, p] of pts) { ctx.fillStyle = `rgba(0,214,255,${(0.22 + 0.12 * Math.sin(t * 1.3 + p.ph)) * na})`; ctx.beginPath(); ctx.arc(x, y, p.s, 0, 6.2832); ctx.fill(); }
    ctx.restore();
  }
  function vignette(ctx) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,8,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function dot(ctx, x, y, r, o = {}) {
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    if (o.ring) { ctx.strokeStyle = C.mag; ctx.lineWidth = 2; ctx.globalAlpha *= o.ring[1]; ctx.beginPath(); ctx.arc(x, y, o.ring[0], 0, 6.2832); ctx.stroke(); ctx.globalAlpha /= o.ring[1] || 1; }
    ctx.fillStyle = o.color || C.mag; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.restore();
  }
  // beat pulse ring around a dot: expands once per beat
  function beatRing(ctx, x, y, t, r0 = 10, r1 = 46, a = 0.8) {
    const ph = (t * 2) % 1; dot(ctx, x, y, 0, { ring: [lerp(r0, r1, ease.in(ph)), a * (1 - ph)] });
  }
  function pill(ctx, s, x, y, o = {}) {
    const size = o.size || 22; E.setFont(ctx, { size, weight: 700, track: 0.12 });
    const w = E.measure(ctx, s, { size, weight: 700, track: 0.12 }) + size * 1.4, h = size * 1.9;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || C.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y - h * 0.68, w, h, h / 2); ctx.stroke();
    E.text(ctx, s, x + size * 0.7, y, { size, weight: 700, track: 0.12, color: o.color || C.cyan });
    ctx.restore(); return w;
  }
  function gradText(ctx, s, x, y, o) {
    // text filled with the brand blue->cyan gradient (the "C" of the logo)
    E.setFont(ctx, o); const w = E.measure(ctx, s, o);
    const ax = o.align === 'right' ? x - w : o.align === 'center' ? x - w / 2 : x;
    const g = ctx.createLinearGradient(ax, y, ax + w, y - (o.size || 40));
    g.addColorStop(0, C.blue); g.addColorStop(1, C.cyan);
    E.text(ctx, s, x, y, { ...o, color: g });
  }

  // ======================= SCENE 1 — HOOK (0–4.5) =======================
  const DIE = { cx: 1310, cy: 540, S: 400, N: 11 };
  const TRACES = (() => {
    const r = E.rng(11), out = [];
    const { cx, cy, S } = DIE, h = S / 2;
    for (let side = 0; side < 4; side++) for (let i = 0; i < 9; i++) {
      const f = (i + 0.5) / 9 - 0.5; const bend = 60 + r() * 90, far = 900 + r() * 400, spread = 1.0 + r() * 0.9;
      let pts;
      if (side === 0) pts = [[cx + f * S, cy - h], [cx + f * S, cy - h - bend], [cx + f * S * spread * 1.8, cy - h - bend - Math.abs(f) * 260 - 60], [cx + f * S * spread * 1.8, cy - far]];
      if (side === 1) pts = [[cx + h, cy + f * S], [cx + h + bend, cy + f * S], [cx + h + bend + Math.abs(f) * 260 + 60, cy + f * S * spread * 1.8], [cx + far, cy + f * S * spread * 1.8]];
      if (side === 2) pts = [[cx + f * S, cy + h], [cx + f * S, cy + h + bend], [cx + f * S * spread * 1.8, cy + h + bend + Math.abs(f) * 260 + 60], [cx + f * S * spread * 1.8, cy + far]];
      if (side === 3) pts = [[cx - h, cy + f * S], [cx - h - bend, cy + f * S], [cx - h - bend - Math.abs(f) * 260 - 60, cy + f * S * spread * 1.8], [cx - far - 400, cy + f * S * spread * 1.8]];
      out.push({ pts, off: r() });
    }
    return out;
  })();
  function polyLen(p) { let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return L; }
  function polyAt(p, d) { for (let i = 1; i < p.length; i++) { const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (d <= l) { const q = d / l; return [lerp(p[i - 1][0], p[i][0], q), lerp(p[i - 1][1], p[i][1], q)]; } d -= l; } return p[p.length - 1]; }
  function strokePoly(ctx, p, a, b) { // stroke from distance a to b
    const L = polyLen(p); a = clamp(a, 0, L); b = clamp(b, 0, L); if (b <= a) return;
    ctx.beginPath(); let d = 0; let started = false;
    for (let i = 1; i < p.length; i++) {
      const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      const s0 = Math.max(a, d), s1 = Math.min(b, d + l);
      if (s1 > s0) {
        const P0 = [lerp(p[i - 1][0], p[i][0], (s0 - d) / l), lerp(p[i - 1][1], p[i][1], (s0 - d) / l)], P1 = [lerp(p[i - 1][0], p[i][0], (s1 - d) / l), lerp(p[i - 1][1], p[i][1], (s1 - d) / l)];
        if (!started) { ctx.moveTo(P0[0], P0[1]); started = true; } ctx.lineTo(P1[0], P1[1]);
      }
      d += l;
    }
    ctx.stroke();
  }
  function drawDie(ctx, u, o = {}) {
    const { cx, cy, S, N } = DIE, h = S / 2;
    // fan-out traces
    const grow = 0.45 + 0.55 * ent(u, 0, 2.8, ease.cam);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const tr of TRACES) {
      const L = polyLen(tr.pts);
      ctx.strokeStyle = 'rgba(0,152,255,0.38)'; ctx.lineWidth = 2; strokePoly(ctx, tr.pts, 0, L * grow);
      // light pulse running outward, one per beat, staggered
      const ph = ((u * 2 + tr.off) % 1); const pd = ph * L * grow;
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.globalAlpha = 0.9 * (1 - ph * 0.6); strokePoly(ctx, tr.pts, pd - 70, pd); ctx.globalAlpha = 1;
      const e = polyAt(tr.pts, L * grow); ctx.fillStyle = C.sky; ctx.beginPath(); ctx.arc(e[0], e[1], 3, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
    // substrate
    ctx.save();
    ctx.fillStyle = '#081048'; ctx.strokeStyle = C.edge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(cx - h * 1.36, cy - h * 1.36, S * 1.36, S * 1.36, 18); ctx.fill(); ctx.stroke();
    // die
    const g = ctx.createLinearGradient(cx - h, cy - h, cx + h, cy + h); g.addColorStop(0, '#0B1A86'); g.addColorStop(1, '#050A3A');
    ctx.fillStyle = g; ctx.fillRect(cx - h, cy - h, S, S);
    ctx.strokeStyle = C.cyan; ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.strokeRect(cx - h, cy - h, S, S); ctx.globalAlpha = 1;
    // bump array; a ring wave leaves the centre on every beat
    const pitch = S / N, rb = pitch * 0.27; const wave = ((u * 2) % 1) * 9;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = cx - h + pitch * (i + 0.5), y = cy - h + pitch * (j + 0.5);
      const d = Math.hypot(i - (N - 1) / 2, j - (N - 1) / 2);
      const lit = Math.max(0, 1 - Math.abs(d - wave) / 1.3);
      if (i === (N - 1) / 2 && j === (N - 1) / 2) continue;
      ctx.fillStyle = `rgba(${Math.round(lerp(40, 0, lit))},${Math.round(lerp(70, 214, lit))},${Math.round(lerp(170, 255, lit))},1)`;
      ctx.beginPath(); ctx.arc(x, y, rb, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
    dot(ctx, cx, cy, rb * 1.25);
    beatRing(ctx, cx, cy, u, rb * 1.4, rb * 5, 0.9);
  }
  function sceneHook(ctx, u, D, t) {
    background(ctx, t);
    // camera: slow push, then a punch into the centre bump for the match cut
    const z = lerp(1, 1.05, ent(u, 0, 4, ease.lin)) * Math.exp(Math.log(9) * ease.out(prog(u, 3.95, 4.5)));
    ctx.save(); E.camera(ctx, { x: DIE.cx, y: DIE.cy, zoom: z, sx: DIE.cx, sy: DIE.cy }); drawDie(ctx, u); ctx.restore();
    vignette(ctx);
    // copy is complete on frame 0 (poster); exits before the punch
    const xa = ext(u, 3.75, 0.25);
    ctx.save(); ctx.globalAlpha = xa;
    logo(ctx, M + 150, 128, 300, { mode: 'white' });
    E.text(ctx, T.hookSmall, M, 420, { size: 44, weight: 500, color: C.muted });
    E.text(ctx, T.hook1, M, 540, { size: 112, weight: 800 });
    gradText(ctx, T.hook2, M, 670, { size: 112, weight: 800 });
    ctx.restore();
  }

  // ======================= SCENE 2 — HERITAGE (4.5–17.5) =======================
  const NODES = [
    { x: 0, year: '1984', lab: T.n1, at: 0.2 },
    { x: 1500, year: '2004', lab: T.n2, at: 4.15 },
    { x: 3000, year: '2015', lab: T.n3, at: 6.45 },
  ];
  const LINE_Y = 600, END_X = 4300;
  function sceneHeritage(ctx, u, D, t) {
    background(ctx, t, { cx: 0.5 });
    const fin = ent(u, 8.7, 1.1, ease.cam);             // finale zoom-out
    const camX = track([[0, 400], [3.7, 520], [4.2, 1900], [6.0, 2020], [6.5, 3400], [8.7, 3520]], u);
    const zoom = Math.exp(lerp(0, Math.log(0.34), fin));
    const cx = lerp(camX, 2150, fin), cy = lerp(LINE_Y, LINE_Y - (815 - 540) / 0.34, fin);
    const dotX = track([[0, 0], [3.7, 330], [4.2, 1500], [6.0, 1680], [6.5, 3000], [8.7, 3180], [10.2, END_X]], u);
    ctx.save(); E.camera(ctx, { x: cx, y: cy, zoom });
    // the line: bright behind the dot, dim ahead
    ctx.lineCap = 'round';
    ctx.strokeStyle = C.line; ctx.lineWidth = 3 / Math.max(zoom, 0.5); ctx.beginPath(); ctx.moveTo(-1200, LINE_Y); ctx.lineTo(END_X + 900, LINE_Y); ctx.stroke();
    const lg = ctx.createLinearGradient(-600, 0, dotX, 0); lg.addColorStop(0, 'rgba(0,75,255,0.2)'); lg.addColorStop(1, C.cyan);
    ctx.strokeStyle = lg; ctx.lineWidth = 5 / Math.max(zoom, 0.5); ctx.beginPath(); ctx.moveTo(-1200, LINE_Y); ctx.lineTo(dotX, LINE_Y); ctx.stroke();
    // nodes
    NODES.forEach((n, i) => {
      const on = u >= n.at - 0.05; const focus = i === 2 ? 1 : 1 - 0.55 * prog(u, NODES[i + 1].at - 0.3, NODES[i + 1].at + 0.2);
      ctx.save(); ctx.globalAlpha = lerp(focus, 1, fin);
      ctx.fillStyle = C.bg; ctx.strokeStyle = on ? C.cyan : C.line; ctx.lineWidth = 4 / Math.max(zoom, 0.5);
      ctx.beginPath(); ctx.arc(n.x, LINE_Y, 16, 0, 6.2832); ctx.fill(); ctx.stroke();
      if (on) { ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(n.x, LINE_Y, 7, 0, 6.2832); ctx.fill(); }
      // year above, label below (world space)
      const yx = n.x + 44;
      E.kin(ctx, n.year, yx, LINE_Y - 64, u, n.at, { size: 210, weight: 800, dur: 0.5 });
      E.kin(ctx, n.lab[0], yx + 6, LINE_Y + 96, u, n.at + 0.12, { size: 56, weight: 700, dur: 0.45 });
      E.kin(ctx, n.lab[1], yx + 6, LINE_Y + 150, u, n.at + 0.2, { size: 34, weight: 500, color: C.muted, dur: 0.45 });
      ctx.restore();
    });
    // Incheon end node
    const pin = ent(u, 9.9, 0.4, ease.emph);
    if (pin > 0) { ctx.save(); ctx.strokeStyle = C.mag; ctx.lineWidth = 6 / zoom * 0.5 * 2; ctx.globalAlpha = pin; ctx.beginPath(); ctx.arc(END_X, LINE_Y, 40 * pin, 0, 6.2832); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // travelling magenta dot (screen space so it stays crisp); arrives big from the match cut
    const sx = W / 2 + (dotX - cx) * zoom, sy = H / 2 + (LINE_Y - cy) * zoom;
    const big = 1 - ent(u, 0, 0.5);
    const mx = lerp(sx, DIE.cx, big), my = lerp(sy, DIE.cy, big);
    dot(ctx, mx, my, lerp(14, 70, big));
    beatRing(ctx, mx, my, u, 16, 48, 0.7 * (1 - big));
    vignette(ctx);
    // finale HUD
    if (u > 8.8) {
      const a = ext(u, D - 0.35, 0.3);
      ctx.save(); ctx.globalAlpha = a;
      E.kin(ctx, '40+', M, 400, u, 8.95, { size: 280, weight: 800, dur: 0.5 });
      E.kin(ctx, T.years, M + 560, 400, u, 9.15, { size: 56, weight: 600, color: C.muted, dur: 0.45 });
      const nowP = ent(u, 10.5, 0.4, ease.emph);
      if (nowP > 0) dot(ctx, M + 14, 540, 12 * nowP);
      E.kin(ctx, T.now, M + 48, 564, u, 10.5, { size: 72, weight: 800, dur: 0.45 });
      // label the Incheon end node of the mini timeline
      const ex = W / 2 + (END_X - 2150) * 0.34;
      E.kin(ctx, KR ? '인천' : 'INCHEON', ex, 870, u, 10.2, { size: 34, weight: 800, align: 'center', color: C.pink, dur: 0.4 });
      ctx.restore();
    }
  }

  // ======================= SCENE 3 — TECHNOLOGY (17.5–28.5) =======================
  const TECH = ['Flip Chip', 'Package-on-Package', 'Wafer-Level', 'System-in-Package'];
  const TECH_AT = [0.2, 1.3, 2.6, 3.75];
  // geometry states for the cross-section (centre x=1150)
  const ST = [
    { sub: 1, subW: 820, die: 460, dieX: 0, bumps: 1, pop: 0, wl: 0, sip: 0 },
    { sub: 1, subW: 820, die: 460, dieX: 0, bumps: 1, pop: 1, wl: 0, sip: 0 },
    { sub: 0, subW: 560, die: 560, dieX: 0, bumps: 0, pop: 0, wl: 1, sip: 0 },
    { sub: 1, subW: 1000, die: 360, dieX: -200, bumps: 1, pop: 0, wl: 0, sip: 1 },
  ];
  function techState(u) {
    let a = ST[0], b = ST[0], p = 0;
    for (let i = 1; i < 4; i++) if (u >= TECH_AT[i] - 0.25) { a = ST[i - 1]; b = ST[i]; p = ease.cam(prog(u, TECH_AT[i] - 0.25, TECH_AT[i] + 0.25)); }
    const s = {}; for (const k in a) s[k] = lerp(a[k], b[k], p); return s;
  }
  function crossSection(ctx, u) {
    const s = techState(u), X = 1150, Y = 620;
    const subH = 46 * s.sub, subTop = Y;
    ctx.save();
    // substrate + BGA balls
    if (s.sub > 0.01) {
      ctx.globalAlpha = s.sub;
      const sw = s.subW; ctx.fillStyle = '#0A1A7A'; ctx.fillRect(X - sw / 2, subTop, sw, subH);
      ctx.fillStyle = 'rgba(0,152,255,0.35)'; for (let k = 0; k < 3; k++) ctx.fillRect(X - sw / 2, subTop + 10 + k * 12, sw, 2);
      const nb = Math.round(sw / 60); for (let i = 0; i < nb; i++) { const bx = X - sw / 2 + (i + 0.5) * sw / nb; ctx.fillStyle = '#8FA3D6'; ctx.beginPath(); ctx.arc(bx, subTop + subH + 14, 15, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // die (flipped) with bump row
    const dw = s.die, dx = X + s.dieX, dieBot = lerp(Y + 0, subTop - 22, s.sub), dieH = 64;
    const dg = ctx.createLinearGradient(0, dieBot - dieH, 0, dieBot); dg.addColorStop(0, '#1C3BD8'); dg.addColorStop(1, '#0A1680');
    ctx.fillStyle = dg; ctx.fillRect(dx - dw / 2, dieBot - dieH, dw, dieH);
    ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.strokeRect(dx - dw / 2, dieBot - dieH, dw, dieH);
    if (s.bumps > 0.01) {
      ctx.globalAlpha = s.bumps; const nbp = Math.round(dw / 26);
      for (let i = 0; i < nbp; i++) { const bx = dx - dw / 2 + (i + 0.5) * dw / nbp; ctx.fillStyle = i === Math.floor(nbp / 2) ? C.mag : C.cyan; ctx.beginPath(); ctx.arc(bx, dieBot + 11, 8, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // wafer-level: RDL + balls directly on die
    if (s.wl > 0.01) {
      ctx.globalAlpha = s.wl; ctx.fillStyle = 'rgba(0,214,255,0.8)'; ctx.fillRect(dx - dw / 2, dieBot, dw, 6);
      const n = 8; for (let i = 0; i < n; i++) { const bx = dx - dw / 2 + (i + 0.5) * dw / n; ctx.fillStyle = '#8FA3D6'; ctx.beginPath(); ctx.arc(bx, dieBot + 24, 16, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // PoP: memory package drops on top
    if (s.pop > 0.01) {
      const oy = (1 - s.pop) * -140; ctx.globalAlpha = s.pop;
      const tw = 820, tb = dieBot - dieH - 34 + oy;
      ctx.fillStyle = '#0A1A7A'; ctx.fillRect(X - tw / 2, tb - 40, tw, 40);
      ctx.fillStyle = '#12208F'; ctx.fillRect(X - 300, tb - 110, 600, 70); ctx.strokeStyle = C.sky; ctx.strokeRect(X - 300, tb - 110, 600, 70);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = '#8FA3D6'; for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(X + sgn * (tw / 2 - 30 - i * 34), tb + 14, 13, 0, 6.2832); ctx.fill(); } }
      ctx.globalAlpha = 1;
    }
    // SiP: second die + passives on the wide substrate
    if (s.sip > 0.01) {
      ctx.globalAlpha = s.sip;
      ctx.fillStyle = '#12208F'; ctx.fillRect(X + 170, subTop - 86, 200, 64); ctx.strokeStyle = C.sky; ctx.strokeRect(X + 170, subTop - 86, 200, 64);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? C.pink : '#8FA3D6'; ctx.fillRect(X + 400 + i * 22 - 20, subTop - 22, 14, 22); }
      ctx.fillStyle = '#8FA3D6'; ctx.fillRect(X + 60, subTop - 30, 30, 30); ctx.fillRect(X + 108, subTop - 30, 30, 30);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  // wafer + bump pitch
  function wafer(ctx, u, cx, cy, R) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fillStyle = '#081048'; ctx.fill();
    ctx.clip();
    const rot = u * 0.06; ctx.translate(cx, cy); ctx.rotate(rot);
    const p = 44; const n = Math.ceil(R / p) + 1;
    for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) {
      const x = i * p + 2, y = j * p + 2; if (Math.hypot(x + p / 2, y + p / 2) > R - 18) continue;
      const k = (i * 7 + j * 13 + 100) % 5;
      ctx.fillStyle = ['#0E2296', '#0B1C84', '#112AA8', '#0D2090', '#1432B8'][k]; ctx.fillRect(x, y, p - 5, p - 5);
    }
    // iridescent sheen sweeping (brand wafer imagery)
    ctx.rotate(-rot);
    const sw = ((u * 0.35) % 1.6 - 0.3) * R * 2 - R;
    const g = ctx.createLinearGradient(sw - 260, -R, sw + 260, R);
    g.addColorStop(0, 'rgba(0,214,255,0)'); g.addColorStop(0.45, 'rgba(0,214,255,0.28)'); g.addColorStop(0.55, 'rgba(204,37,184,0.22)'); g.addColorStop(1, 'rgba(204,37,184,0)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, 2 * R, 2 * R);
    ctx.restore();
    ctx.strokeStyle = C.sky; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
  }
  function bumpField(ctx, u, a) {
    // close-up of the bump array with a pitch callout
    ctx.save(); ctx.globalAlpha = a;
    const cx = 1360, cy = 560, P = 150, R = 50;
    for (let i = -3; i <= 4; i++) for (let j = -3; j <= 3; j++) {
      const x = cx + i * P, y = cy + j * P; const hi = (i === 0 || i === 1) && j === 0;
      const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.35, R * 0.1, x, y, R);
      g.addColorStop(0, hi ? '#FFFFFF' : '#9FB6F0'); g.addColorStop(0.5, hi ? C.cyan : '#3D5BC4'); g.addColorStop(1, hi ? '#0060D0' : '#15247A');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
    }
    // dimension line between the two highlighted bumps
    const d = ent(u, 7.2, 0.6, ease.cam); const y0 = cy - R - 24;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, y0 - 14); ctx.lineTo(cx, y0 + 14); ctx.moveTo(cx + P * d, y0 - 14); ctx.lineTo(cx + P * d, y0 + 14); ctx.moveTo(cx, y0); ctx.lineTo(cx + P * d, y0); ctx.stroke();
    ctx.restore();
  }
  function sceneTech(ctx, u, D, t) {
    background(ctx, t, { net: 0.6 });
    const toWafer = prog(u, 5.55, 6.05);            // cross-section -> wafer
    // ---- part A: cross-section morph
    if (toWafer < 1) {
      ctx.save();
      const z = Math.exp(Math.log(4) * ease.out(toWafer)); ctx.globalAlpha = 1 - ease.out(toWafer);
      E.camera(ctx, { x: 1150, y: 590, zoom: 1.25 * z * lerp(0.96, 1, ent(u, 0, 0.6)), sx: 1200, sy: 660 });
      crossSection(ctx, u);
      ctx.restore();
      let idx = 0; for (let i = 0; i < 4; i++) if (u >= TECH_AT[i]) idx = i;
      const xa = ext(u, 5.35, 0.2);
      ctx.save(); ctx.globalAlpha = xa;
      E.text(ctx, `0${idx + 1}`, M, 250, { size: 40, weight: 800, color: C.cyan });
      E.text(ctx, '/ 04', M + 58, 250, { size: 40, weight: 500, color: C.dim });
      for (let i = 0; i < 4; i++) {
        const a0 = TECH_AT[i], a1 = i < 3 ? TECH_AT[i + 1] - 0.05 : 99;
        E.kin(ctx, TECH[i], M, 350, u, a0, { size: 80, weight: 800, dur: 0.35, exitAt: a1 - 0.18, exitDur: 0.18 });
        if (T.techSub[i]) E.kin(ctx, T.techSub[i], M, 430, u, a0 + 0.06, { size: 40, weight: 500, color: C.muted, dur: 0.35, exitAt: a1 - 0.18, exitDur: 0.18 });
      }
      // tab indicator
      for (let i = 0; i < 4; i++) {
        const on = i === idx, x = M + i * 250;
        ctx.fillStyle = on ? C.cyan : C.line; ctx.fillRect(x, 900, 230, on ? 6 : 3);
        E.text(ctx, TECH[i].replace('Package-on-Package', 'PoP').replace('System-in-Package', 'SiP'), x, 950, { size: 26, weight: on ? 700 : 500, color: on ? C.ink : C.dim });
      }
      ctx.restore();
    }
    // ---- part B: wafer, then bump-pitch close-up
    if (toWafer > 0) {
      const inA = ent(u, 5.75, 0.5);
      const toBump = prog(u, 6.7, 7.15);
      if (toBump < 1) {
        ctx.save(); ctx.globalAlpha = inA * (1 - toBump);
        const z = lerp(0.8, 1, inA) * Math.exp(Math.log(5) * ease.out(toBump));
        E.camera(ctx, { x: 1260, y: 560, zoom: z, sx: 1260, sy: 560 }); wafer(ctx, u, 1260, 560, 400); ctx.restore();
      }
      if (toBump > 0) bumpField(ctx, u, ease.in(toBump));
      const xa = ext(u, D - 0.35, 0.3);
      ctx.save(); ctx.globalAlpha = xa;
      E.kin(ctx, T.wafer1, M, 380, u, 5.85, { size: 150, weight: 800, dur: 0.45 });
      E.kin(ctx, T.wafer2, M, 470, u, 6.0, { size: 64, weight: 700, color: C.muted, dur: 0.45 });
      // pitch callout
      E.kin(ctx, T.pitchPre, M, 640, u, 7.35, { size: 44, weight: 600, color: C.muted, dur: 0.4 });
      if (u >= 7.5) {
        const p = ent(u, 7.5, 0.4);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 640, W, 190); ctx.clip();
        gradText(ctx, '40µm', M, 790 + (1 - p) * 150, { size: 170, weight: 800 });
        if (T.pitchPost) E.text(ctx, T.pitchPost, M + E.measure(ctx, '40µm', { size: 170, weight: 800 }) + 24, 790 + (1 - p) * 150, { size: 60, weight: 700 });
        ctx.restore();
      }
      ctx.restore();
    }
    vignette(ctx);
  }

  // ======================= SCENE 4 — PLACE (28.5–36) =======================
  const SPH = (() => { const n = 2400, a = []; const g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = g * i; a.push([Math.cos(th) * r, y, Math.sin(th) * r]); } return a; })();
  const D2R = Math.PI / 180;
  const HOME = [37.46, 126.44];
  const DEST = [[1.35, 103.8], [31.2, 121.5], [37.4, -122.0], [52.3, 4.8], [25.0, 121.5], [32.8, -96.8], [48.1, 11.6], [35.7, 139.7]];
  function ll2v(lat, lon) { const la = lat * D2R, lo = lon * D2R; return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)]; }
  function proj(v, lon0, lat0) { // orthographic, rotate so (lat0,lon0) faces viewer
    const a = -lon0 * D2R, b = lat0 * D2R;
    let [x, y, z] = v; const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
    const y2 = y * Math.cos(b) - z1 * Math.sin(b), z2 = y * Math.sin(b) + z1 * Math.cos(b);
    return [x1, y2, z2];
  }
  function slerp(a, b, p) { const d = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1)); if (d < 1e-6) return a; const s = Math.sin(d); const k1 = Math.sin((1 - p) * d) / s, k2 = Math.sin(p * d) / s; return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]; }
  function globe(ctx, u, cx, cy, R, a) {
    const lon0 = 140 - u * 3, lat0 = 22;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    g.addColorStop(0, '#0C1C8C'); g.addColorStop(1, '#040835'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
    for (const v of SPH) { const [x, y, z] = proj(v, lon0, lat0); if (z <= 0) continue; ctx.fillStyle = `rgba(0,170,255,${0.25 + 0.7 * z})`; ctx.fillRect(cx + x * R - 1.8, cy - y * R - 1.8, 3.6, 3.6); }
    ctx.strokeStyle = 'rgba(0,214,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    // arcs from Incheon, drawn on successive beats
    const home = ll2v(...HOME);
    DEST.forEach((d, i) => {
      const s = ent(u, 1.0 + i * 0.5, 0.9, ease.cam); if (s <= 0) return;
      const to = ll2v(...d); ctx.strokeStyle = i % 2 ? C.cyan : C.pink; ctx.lineWidth = 2.5; ctx.beginPath(); let first = true, vis = false;
      for (let k = 0; k <= 40; k++) {
        const p = k / 40 * s; const v = slerp(home, to, p); const lift = 1 + 0.18 * Math.sin(Math.PI * p / Math.max(s, 1e-3) * s);
        const [x, y, z] = proj(v, lon0, lat0); if (z < -0.05) { first = true; continue; }
        const X = cx + x * R * lift, Y = cy - y * R * lift; if (first) { ctx.moveTo(X, Y); first = false; } else ctx.lineTo(X, Y); vis = true;
      }
      if (vis) ctx.stroke();
    });
    const [hx, hy] = proj(home, lon0, lat0); const HX = cx + hx * R, HY = cy - hy * R;
    ctx.restore();
    return [HX, HY];
  }
  function scenePlace(ctx, u, D, t) {
    background(ctx, t, { net: 0.5 });
    const inP = ent(u, 0, 0.6);
    const [hx, hy] = globe(ctx, u, 1280, 560, 400 * lerp(0.9, 1, inP), inP);
    dot(ctx, hx, hy, 11 * ent(u, 0.3, 0.4, ease.emph)); beatRing(ctx, hx, hy, u, 12, 60, 0.9);
    vignette(ctx);
    const xa = ext(u, D - 0.3, 0.25);
    ctx.save(); ctx.globalAlpha = xa;
    const tp = ent(u, 0.2, 0.4); pill(ctx, T.placeTag, M, 300, { alpha: tp });
    E.kin(ctx, T.place1, M, 430, u, 0.3, { size: KR ? 92 : 84, weight: 800 });
    E.kin(ctx, T.place2, M, 540, u, 0.45, { size: KR ? 92 : 84, weight: 800 });
    const rp = ent(u, 3.9, 0.4); pill(ctx, T.rndTag, M, 690, { alpha: rp, color: C.pink });
    E.kin(ctx, T.rnd, M, 790, u, 4.0, { size: 60, weight: 700 });
    ctx.restore();
  }

  // ======================= SCENE 5 — QUALITY (36–43.25) =======================
  const CERTS = ['IATF 16949', 'ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001', 'ISO 27001', 'ISO 22301'];
  const CERT_AT = KR ? [0.35, 3.8, 1.55, 2.05, 2.55, 3.1, 4.05] : [0.35, 3.9, 1.1, 1.6, 2.1, 2.6, 4.15];
  function chipTile(ctx, x, y, w, h, code, cat, a, hi) {
    ctx.save(); ctx.globalAlpha *= a;
    // pins (package leads) top and bottom
    ctx.fillStyle = hi ? C.cyan : '#3448B0';
    for (let i = 0; i < 10; i++) { const px = x + 24 + i * (w - 48) / 9 - 5; ctx.fillRect(px, y - 12, 10, 12); ctx.fillRect(px, y + h, 10, 12); }
    ctx.fillStyle = C.panel; ctx.strokeStyle = hi ? C.cyan : C.edge; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.mag; ctx.beginPath(); ctx.arc(x + 22, y + 22, 6, 0, 6.2832); ctx.fill(); // pin-1 mark
    E.text(ctx, code, x + 40, y + 84, { size: 46, weight: 800 });
    E.text(ctx, cat, x + 40, y + 132, { size: 28, weight: 500, color: C.muted });
    ctx.restore();
  }
  function sceneQuality(ctx, u, D, t) {
    background(ctx, t, { net: 0.5, cx: 0.5 });
    const xa = ext(u, D - 0.3, 0.25);
    ctx.save(); ctx.globalAlpha = xa;
    E.kin(ctx, T.qTitle, M, 200, u, 0.1, { size: 64, weight: 800 });
    const w = 380, h = 170, gap = 36, rows = [[0, 1, 2, 3], [4, 5, 6]];
    const pos = [];
    rows.forEach((r, ri) => { const tw = r.length * w + (r.length - 1) * gap; const x0 = (W - tw) / 2; r.forEach((ci, k) => pos[ci] = [x0 + k * (w + gap), ri === 0 ? 330 : 580]); });
    // bus traces under the tiles, then the magenta dot runs the bus
    const busY = 830, bus = ent(u, 4.3, 0.8, ease.cam);
    if (bus > 0) {
      ctx.strokeStyle = 'rgba(0,152,255,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(pos[4][0] - 200, busY); ctx.lineTo(lerp(pos[4][0] - 200, pos[3][0] + w + 200, bus), busY); ctx.stroke();
      pos.forEach(([x, y]) => { const yy = y + h + 12; ctx.beginPath(); ctx.moveTo(x + w / 2, yy); ctx.lineTo(x + w / 2, lerp(yy, busY, bus)); ctx.stroke(); });
      const dx = lerp(pos[4][0] - 200, pos[3][0] + w + 200, ent(u, 4.6, 2.2, ease.cam));
      dot(ctx, dx, busY, 10); beatRing(ctx, dx, busY, u, 10, 36, 0.8);
    }
    CERTS.forEach((c, i) => {
      const p = ent(u, CERT_AT[i], 0.4); if (p <= 0) return;
      const [x, y] = pos[i];
      ctx.save(); ctx.translate(x + w / 2, y + h / 2 + (1 - p) * 40); const s = lerp(0.92, 1, p); ctx.scale(s, s);
      chipTile(ctx, -w / 2, -h / 2, w, h, c, T.cats[i], p, i === 0);
      ctx.restore();
    });
    ctx.restore();
    vignette(ctx);
  }

  // ======================= SCENE 6 — SCALE (43.25–54.75) =======================
  function aiPackage(ctx, u, cx, cy, S, a) {
    ctx.save(); ctx.globalAlpha = a;
    // outbound traces with beat pulses (demand in, product out)
    for (let k = 0; k < 16; k++) {
      const ang = k / 16 * 6.2832 + 0.2, r0 = S * 0.62, r1 = S * 1.7;
      const x0 = cx + Math.cos(ang) * r0, y0 = cy + Math.sin(ang) * r0, x1 = cx + Math.cos(ang) * r1, y1 = cy + Math.sin(ang) * r1;
      ctx.strokeStyle = 'rgba(0,152,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const ph = (u * 2 + k * 0.37) % 1; ctx.fillStyle = C.cyan; ctx.globalAlpha = a * (1 - ph);
      ctx.beginPath(); ctx.arc(lerp(x0, x1, ph), lerp(y0, y1, ph), 4, 0, 6.2832); ctx.fill(); ctx.globalAlpha = a;
    }
    ctx.fillStyle = '#081048'; ctx.strokeStyle = C.edge; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(cx - S / 2, cy - S / 2, S, S, 16); ctx.fill(); ctx.stroke();
    // passives ring
    for (let i = 0; i < 12; i++) for (const s of [-1, 1]) { ctx.fillStyle = '#3448B0'; ctx.fillRect(cx - S * 0.4 + i * S * 0.8 / 11 - 6, cy + s * S * 0.43 - 5, 12, 10); }
    const d = S * 0.56; const g = ctx.createLinearGradient(cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2); g.addColorStop(0, '#1C3BD8'); g.addColorStop(1, '#0A1680');
    ctx.fillStyle = g; ctx.fillRect(cx - d / 2, cy - d / 2, d, d); ctx.strokeStyle = C.cyan; ctx.strokeRect(cx - d / 2, cy - d / 2, d, d);
    // die floorplan: activity ripples on the beat
    const n = 8, p = d / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const lit = 0.5 + 0.5 * Math.sin(u * 6.2832 * 0.5 + (i + j) * 0.7);
      ctx.fillStyle = `rgba(0,214,255,${0.08 + 0.3 * lit})`; ctx.fillRect(cx - d / 2 + i * p + 4, cy - d / 2 + j * p + 4, p - 8, p - 8);
    }
    ctx.restore();
  }
  function conveyor(ctx, u, a) {
    // continuous line of packages: one passes a gate on every beat
    ctx.save(); ctx.globalAlpha = a;
    const y = 866, sp = 110, off = (u * 2 * sp) % sp;
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y + 26); ctx.lineTo(W, y + 26); ctx.stroke();
    for (let x = -sp + off; x < W + sp; x += sp) {
      ctx.fillStyle = '#0B1C84'; ctx.fillRect(x, y - 18, 64, 40); ctx.fillStyle = '#1C3BD8'; ctx.fillRect(x + 18, y - 8, 28, 20);
    }
    ctx.fillStyle = C.mag; ctx.fillRect(W * 0.72, y - 44, 4, 88); // inspection gate
    ctx.restore();
  }
  function sceneScale(ctx, u, D, t) {
    background(ctx, t, { net: 0.6 });
    // ---- part A: No.3
    const outA = ease.out(prog(u, 5.0, 5.45));
    if (outA < 1) {
      ctx.save(); ctx.globalAlpha = 1 - outA; ctx.translate(-outA * 300, 0);
      const pz = ent(u, 0.15, 0.55, ease.emph);
      ctx.save(); ctx.translate(M, 820); ctx.scale(lerp(0.85, 1, pz), lerp(0.85, 1, pz));
      E.text(ctx, 'No.', 0, -40, { size: 120, weight: 700, color: C.muted, alpha: pz });
      ctx.globalAlpha = pz; gradText(ctx, '3', 190, 0, { size: 620, weight: 800 });
      ctx.restore();
      const bx = 820;
      pill(ctx, T.rankTag, bx, 380, { alpha: ent(u, 0.5, 0.4) });
      E.kin(ctx, T.rank1, bx, 510, u, 0.7, { size: KR ? 84 : 76, weight: 800 });
      E.kin(ctx, T.rank2, bx, 585, u, 1.0, { size: KR ? 40 : 34, weight: 500, color: C.muted });
      ctx.restore();
    }
    // ---- part B: AI · HPC, utilisation
    const inB = ent(u, 5.2, 0.6);
    if (inB > 0) {
      const xa = ext(u, D - 0.3, 0.25);
      ctx.save(); ctx.globalAlpha = xa;
      aiPackage(ctx, u, 1400, 470, 420 * lerp(0.85, 1, inB), inB);
      conveyor(ctx, u, ent(u, 7.9, 0.5));
      E.kin(ctx, 'AI · HPC', M, 400, u, 5.3, { size: 170, weight: 800 });
      E.kin(ctx, T.aiSub, M, 480, u, 5.5, { size: 44, weight: 600, color: C.muted });
      const up = ent(u, 8.0, 0.4); pill(ctx, T.utilSub, M, 620, { alpha: up, color: C.pink });
      E.kin(ctx, T.util, M, 730, u, 8.1, { size: KR ? 80 : 64, weight: 800 });
      ctx.restore();
    }
    vignette(ctx);
  }

  // ======================= SCENE 7 — LOCKUP (54.75–60) =======================
  function sceneLockup(ctx, u, D, t) {
    background(ctx, t, { net: lerp(1, 0.4, ent(u, 0, 2)), cx: 0.5 });
    vignette(ctx);
    const LW = 1000, LY = 470;
    const rev = ent(u, 0.25, 0.9, ease.cam);
    const info = logo(ctx, W / 2, LY, LW, { mode: 'white', reveal: rev, showDot: false });
    const [dx, dy, dr] = info.dot;
    // the dot flies in along a trace and lands on the "i"
    const land = ent(u, 0.1, 1.1, ease.cam);
    const fx = lerp(-60, dx, land), fy = lerp(dy + 260, dy, ease.in(prog(u, 0.1, 1.2)));
    if (land < 1) { ctx.strokeStyle = 'rgba(204,37,184,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(Math.max(-60, fx - 400), fy); ctx.lineTo(fx, fy); ctx.stroke(); }
    const pop = ent(u, 1.15, 0.45, ease.emph);
    dot(ctx, fx, fy, dr * (land < 1 ? 1.4 : lerp(1.4, 1, pop)));
    if (u > 1.15) { const ph = prog(u, 1.15, 1.9); dot(ctx, dx, dy, 0, { ring: [lerp(dr, dr * 7, ease.in(ph)), 0.9 * (1 - ph)] }); }
    E.kin(ctx, T.tagline, W / 2, 680, u, 1.5, { size: KR ? 64 : 58, weight: 700, align: 'center', dur: 0.5 });
    E.kin(ctx, 'STATS ChipPAC Korea', W / 2, 760, u, 2.0, { size: 30, weight: 600, align: 'center', color: C.muted, track: 0.18, dur: 0.5 });
  }

  // ======================= captions (bottom) =======================
  function captions(ctx, t) {
    const c = capTimes.find(c => t >= c.a - 0.05 && t < c.b + 0.05); if (!c) return;
    const a = Math.min(ent(t, c.a - 0.05, 0.15, ease.lin), 1 - prog(t, c.b - 0.1, c.b + 0.05));
    const o = { size: 34, weight: 500 };
    const g = ctx.createLinearGradient(0, H - 190, 0, H); g.addColorStop(0, 'rgba(3,5,26,0)'); g.addColorStop(1, 'rgba(3,5,26,0.8)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 190, W, 190);
    E.text(ctx, c.s, W / 2, H - 62, { ...o, align: 'center', color: '#E3E8FF', alpha: a });
  }

  // ======================= composition & transitions =======================
  const SCENES = { hook: sceneHook, heritage: sceneHeritage, tech: sceneTech, place: scenePlace, quality: sceneQuality, scale: sceneScale, lockup: sceneLockup };
  const SC = TL.scenes;
  const TRANS = { 1: 'match', 2: 'wipe', 3: 'punch', 4: 'wipe', 5: 'punch', 6: 'wipe' }; // index of incoming scene
  function drawScene(ctx, i, t) { const s = SC[i]; ctx.save(); SCENES[s.id](ctx, t - s.start, s.end - s.start, t); ctx.restore(); }
  function draw(ctx, t) {
    let i = SC.findIndex(s => t >= s.start && t < s.end); if (i < 0) i = SC.length - 1;
    const s = SC[i];
    // transition windows straddle each cut
    const nextCut = s.end, prevCut = s.start, HW = 0.3;
    let done = false;
    for (const [cut, inc] of [[prevCut, i], [nextCut, i + 1]]) {
      if (done || inc <= 0 || inc >= SC.length) continue;
      const type = TRANS[inc]; if (type === 'match') continue;
      if (Math.abs(t - cut) >= HW) continue;
      const p = prog(t, cut - HW, cut + HW);
      if (type === 'wipe') {
        // brand gradient band sweeps left->right; incoming scene is revealed behind it
        const bw = 280, sk = 0.36 * H, x = lerp(-bw - sk, W + bw, ease.cam(p));
        drawScene(ctx, inc - 1, t);
        ctx.save(); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(x + sk, 0); ctx.lineTo(x, H); ctx.lineTo(-10, H); ctx.closePath(); ctx.clip(); drawScene(ctx, inc, t); ctx.restore();
        const g = ctx.createLinearGradient(x - bw, 0, x + sk, 0); g.addColorStop(0, 'rgba(0,75,255,0)'); g.addColorStop(0.7, C.blue); g.addColorStop(0.92, C.cyan); g.addColorStop(1, C.mag);
        ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - bw + sk, 0); ctx.lineTo(x + sk, 0); ctx.lineTo(x, H); ctx.lineTo(x - bw, H); ctx.closePath(); ctx.fill(); ctx.restore();
      } else if (type === 'punch') {
        const po = prog(t, cut - HW, cut), pi = prog(t, cut - 0.08, cut + HW);
        if (po < 1) { ctx.save(); ctx.globalAlpha = 1 - ease.out(po); ctx.translate(W / 2, H / 2); ctx.scale(1 + 0.4 * ease.out(po), 1 + 0.4 * ease.out(po)); ctx.translate(-W / 2, -H / 2); drawScene(ctx, inc - 1, t); ctx.restore(); }
        else { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); }
        if (pi > 0) { ctx.save(); ctx.globalAlpha = ease.in(pi); ctx.translate(W / 2, H / 2); const k = lerp(0.82, 1, ease.in(pi)); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2); drawScene(ctx, inc, t); ctx.restore(); }
      }
      done = true;
    }
    if (!done) drawScene(ctx, i, t);
    captions(ctx, t);
  }

  global.Reel = { draw, T, LANG };
})(window);
