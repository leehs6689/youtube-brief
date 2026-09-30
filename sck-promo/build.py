"""Inline fonts, timeline, logo, engine, scenes and audio into one HTML per language.
Usage: python3 build.py            -> out/sck_kr.html, out/sck_en.html (+ out/render_<lang>.html)
       python3 build.py --no-audio -> skip audio embedding (faster for previews)"""
import base64, json, pathlib, sys
root = pathlib.Path(__file__).parent
font = root / 'node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2'
css = ("@font-face{font-family:'Pretendard FS';font-style:normal;font-weight:45 920;font-display:block;"
       f"src:url(data:font/woff2;base64,{base64.b64encode(font.read_bytes()).decode()}) format('woff2');}}\n")
tl = json.loads((root / 'timeline.json').read_text())
logo = (root / 'src/logo_paths.json').read_text()
tpl = (root / 'src/page.html').read_text()
engine = (root / 'src/engine.js').read_text()
scenes = (root / 'src/scenes.js').read_text()
COPY = {
    'kr': dict(h1='스태츠칩팩코리아 기업 홍보 영상', meta='60초 · 1920×1080 · 60fps · 한국어 나레이션 · 직접 합성한 음악. 화면의 사실은 공식 자료로 확인된 내용만 담았습니다.',
               play='소리와 함께 재생', sound='소리 켬',
               aria='스태츠칩팩코리아 60초 기업 홍보 애니메이션: 칩과 범프, 1984년부터의 연혁, 패키징 기술, 인천국제공항 자유무역지역, 국제 인증, JCET 매출 기준 글로벌 OSAT 3위, AI·HPC, 로고.',
               chapters=['연결', '연혁', '기술', '인천', '인증', '규모 · AI', '로고']),
    'en': dict(h1='STATSChipPAC Korea — Corporate Film', meta='60 seconds · 1920×1080 · 60fps · English narration · original synthesised score. On-screen facts are limited to officially verified information.',
               play='Play with sound', sound='Sound on',
               aria='STATSChipPAC Korea 60-second corporate animation: chip and bumps, heritage since 1984, packaging technologies, Incheon Airport Free Trade Zone, international certifications, JCET world No.3 OSAT by 2024 revenue, AI and HPC, logo.',
               chapters=['Connect', 'Heritage', 'Technology', 'Incheon', 'Standards', 'Scale · AI', 'Logo']),
}
out = root / 'out'; out.mkdir(exist_ok=True)
no_audio = '--no-audio' in sys.argv
for lang, c in COPY.items():
    aud = out / f'mix_{lang}.m4a'
    uri = ('data:audio/mp4;base64,' + base64.b64encode(aud.read_bytes()).decode()) if (aud.exists() and not no_audio) else ''
    page = (tpl.replace('/*FONTS*/', css).replace('/*TIMELINE*/', json.dumps(tl, ensure_ascii=False))
            .replace('/*LOGO*/', logo).replace('/*LANG*/', json.dumps(lang)).replace('/*CHAPTERS*/', json.dumps(c['chapters'], ensure_ascii=False))
            .replace('/*ENGINE*/', engine).replace('/*SCENES*/', scenes)
            .replace('/*H1*/', c['h1']).replace('/*META*/', c['meta']).replace('/*PLAY*/', c['play']).replace('/*SOUND*/', c['sound']).replace('/*ARIA*/', c['aria']))
    page = page.replace('src="/*AUDIO*/"', f'src="{uri}"' if uri else '')
    (out / f'sck_{lang}.html').write_text(page)
    (out / f'render_{lang}.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + page + '</body></html>')
    print(f'sck_{lang}.html {len(page)//1024} KB, audio {"yes" if uri else "no"}')
