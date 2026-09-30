#!/bin/bash
# Full 60fps motion-blur render + H.264 encode per language; frames deleted after encode.
set -e
cd "$(dirname "$0")"
for L in ${@:-kr en}; do
  python3 render.py full --lang $L --fps 60 --samples 8 --workers 4 --out frames_$L
  ffmpeg -y -loglevel error -framerate 60 -i frames_$L/f_%05d.png -i out/mix_$L.wav -map 0:v -map 1:a \
    -c:v libx264 -preset slow -crf 16 -profile:v high -level 4.2 \
    -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
    -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -g 120 \
    -c:a aac -b:a 256k -ar 48000 -movflags +faststart -shortest out/STATSChipPAC_Korea_60s_$L.mp4
  cp frames_$L/f_00000.png out/poster_$L.png
  rm -rf frames_$L
  echo "done $L"
done
