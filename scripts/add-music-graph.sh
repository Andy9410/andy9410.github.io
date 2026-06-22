#!/usr/bin/env bash
set -e

FFMPEG="/home/andy/desarrollo/learnsoft/node_modules/ffmpeg-static/ffmpeg"
VIDEO="/home/andy/desarrollo/learnsoft/testreel-output/learnsoft-metrics-demo.mp4"
MUSIC="/home/andy/Descargas/kontraa-water-afro-pop-music-445661.mp3"
OUTPUT="/home/andy/desarrollo/learnsoft/testreel-output/learnsoft-metrics-demo.mp4"
TMP_OUTPUT="/home/andy/desarrollo/learnsoft/testreel-output/learnsoft-metrics-demo.with-audio.mp4"

if [ ! -f "$VIDEO" ]; then
  echo "Error: no se encontró $VIDEO" >&2
  exit 1
fi

DURATION=$("$FFMPEG" -i "$VIDEO" 2>&1 | grep "Duration" | awk '{print $2}' | tr -d , | awk -F: '{print ($1*3600)+($2*60)+$3}')
FADE_START=$(echo "$DURATION - 3" | bc)

echo "Duración del video: ${DURATION}s — fade out desde ${FADE_START}s"

"$FFMPEG" -y \
  -i "$VIDEO" \
  -stream_loop -1 -i "$MUSIC" \
  -filter_complex "[1:a]volume=0.25,afade=t=out:st=${FADE_START}:d=3[music]" \
  -map 0:v \
  -map "[music]" \
  -c:v copy \
  -shortest \
  "$TMP_OUTPUT"

mv "$TMP_OUTPUT" "$OUTPUT"

echo "✓ Video final: $OUTPUT"
