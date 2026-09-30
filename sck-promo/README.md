# STATSChipPAC Korea — 60초 기업 홍보 영상

## 결과물
두 편 모두 1920×1080, 60fps, H.264와 AAC 형식이며 음량은 -14 LUFS로 맞췄습니다.
- `out/STATSChipPAC_Korea_60s_kr.mp4`: 한국어판
- `out/STATSChipPAC_Korea_60s_en.mp4`: 영어판

## 자료
- `script.md`: 나레이션과 화면 문구 (팩트체크 반영)
- `facts.md`: 사실 목록과 출처 (영상에는 출처를 표기하지 않음)
- `research/`: 리서치 원자료
- `storyboard.md`: 장면·모션·사운드 설계
- `out/sck_kr.html`, `out/sck_en.html`: 브라우저 플레이어 (단일 파일, 오디오 포함)

## 수정·재렌더 방법
```bash
npm i                      # Pretendard 폰트 설치
pip install numpy scipy playwright imageio-ffmpeg
python3 vo/segment.py      # 원본 나레이션(vo/*_raw.mp3)을 문단별로 분할
python3 audio.py           # 음악 합성과 나레이션 믹스 → out/mix_<lang>.wav
python3 build.py           # 플레이어 HTML 생성
python3 render.py sheet --lang kr --step 0.5   # 컨택시트 미리보기
./render_all.sh kr en      # 60fps 모션블러 풀 렌더 + 인코딩
```

- 문구를 바꾸려면 `src/scenes.js` 위쪽의 `T`(화면 문구)와 `CAP`(자막)을 고칩니다.
- 색을 바꾸려면 `src/scenes.js`의 `C`를 고칩니다.
- 장면 경계는 `timeline.json`의 `scenes`에서 조정합니다.
- 로고는 제공받은 PNG를 벡터로 트레이싱한 `src/logo_paths.json`입니다. 공식 벡터(AI/SVG)를 받으면 이 파일만 교체하면 됩니다.

## 지도 데이터
지구본의 세계 지도는 Natural Earth 1:50m(퍼블릭 도메인)을 world-atlas 패키지(ISC 라이선스)로 받아 d3-geo 정사영으로 그렸습니다. 데이터를 다시 만들려면 `node tools/geo.mjs`를 실행합니다(결과: `src/geo.json`).
