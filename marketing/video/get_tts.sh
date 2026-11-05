#!/usr/bin/env bash
# Downloads the voiceover tools into ~/.cache (too big for git). Owner approved on 2026-11-05.
#  - Kokoro-82M voice model (Apache-2.0) as ONNX, from github.com/thewh1teagle/kokoro-onnx releases -> ~/.cache/loonie-kokoro
#  - Piper's Linux bundle (MIT; we only use the espeak-ng phonemizer inside it) -> ~/.cache/loonie-piper
# Needs python onnxruntime + numpy (preinstalled in the cloud sessions).
set -euo pipefail
K="${KOKORO_DIR:-$HOME/.cache/loonie-kokoro}"; P="${PIPER_DIR:-$HOME/.cache/loonie-piper}"; mkdir -p "$K" "$P"
R=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s "$K/kokoro-v1.0.onnx" ] || curl -sSL -m 600 -o "$K/kokoro-v1.0.onnx" $R/kokoro-v1.0.onnx
[ -s "$K/voices-v1.0.bin" ] || curl -sSL -m 300 -o "$K/voices-v1.0.bin" $R/voices-v1.0.bin
if [ ! -f "$P/piper/espeak-ng" ]; then
  curl -sSL -m 300 -o "$P/piper.tar.gz" https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz
  tar xzf "$P/piper.tar.gz" -C "$P" && rm "$P/piper.tar.gz"
fi
chmod +x "$P/piper/espeak-ng"
python3 -c "import onnxruntime, numpy" && echo "voiceover tools ready"
