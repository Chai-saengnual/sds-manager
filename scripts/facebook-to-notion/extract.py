#!/usr/bin/env python3
"""
Download Facebook video/reel audio and transcribe with faster-whisper.

Usage:
  python extract.py "https://www.facebook.com/share/v/..."
  python extract.py "URL" --output ./out --model base
  python extract.py "URL" --metadata-only   # og:title via yt-dlp, no download

Outputs:
  - transcript.txt
  - metadata.json (title, uploader, description, duration, url)
  - notion-draft.md (structured draft for Notion)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def fetch_metadata(url: str) -> dict:
    import yt_dlp

    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    return {
        "title": info.get("title") or "",
        "description": info.get("description") or "",
        "uploader": info.get("uploader") or info.get("channel") or "",
        "duration": info.get("duration"),
        "view_count": info.get("view_count"),
        "webpage_url": info.get("webpage_url") or url,
        "id": info.get("id"),
    }


def download_audio(url: str, out_dir: Path) -> Path:
    import yt_dlp

    out_dir.mkdir(parents=True, exist_ok=True)
    template = str(out_dir / "audio.%(ext)s")
    opts = {
        "quiet": True,
        "no_warnings": True,
        "format": "bestaudio/best",
        "outtmpl": template,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "128",
            }
        ],
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])

    for ext in ("mp3", "m4a", "webm", "opus"):
        p = out_dir / f"audio.{ext}"
        if p.exists():
            return p
    raise FileNotFoundError(f"No audio file in {out_dir}")


def transcribe(audio_path: Path, model_size: str, language: str | None) -> str:
    from faster_whisper import WhisperModel

    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, _info = model.transcribe(
        str(audio_path),
        language=language or None,
        vad_filter=True,
    )
    lines = [seg.text.strip() for seg in segments if seg.text.strip()]
    return "\n".join(lines)


def clean_title(raw: str) -> str:
    """Strip view/reaction prefix from Facebook og titles."""
    if "|" in raw:
        parts = raw.split("|", 1)
        if re.match(r"^\d", parts[0].strip()):
            raw = parts[0]
    raw = re.sub(r"^[\d.,]+[KMB]?\s*views?\s*·\s*[\d.,]+[KMB]?\s*reactions?\s*\|\s*", "", raw, flags=re.I)
    return raw.strip()


def build_notion_draft(meta: dict, transcript: str) -> str:
    title = clean_title(meta.get("title", "Untitled"))
    uploader = meta.get("uploader", "")
    url = meta.get("webpage_url", "")
    desc = (meta.get("description") or "").strip()

    lines = [
        f"# {title}",
        "",
        f"**Source:** {uploader}" if uploader else "",
        f"**Link:** {url}" if url else "",
        "",
    ]
    if desc and desc not in transcript[:200]:
        lines.extend(["## Caption", "", desc, ""])

    lines.extend(
        [
            "## Transcript",
            "",
            transcript or "_(no transcript)_",
            "",
            "## Key Takeaways",
            "",
            "_Fill after review — bullet the main parenting points from the transcript._",
            "",
            "## Personal Action",
            "",
            "_One concrete behavior to try this week._",
        ]
    )
    return "\n".join(line for line in lines if line is not None)


def main() -> int:
    parser = argparse.ArgumentParser(description="Facebook video → transcript")
    parser.add_argument("url", help="Facebook share/reel/watch URL")
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path("./facebook-extract-out"),
        help="Output directory",
    )
    parser.add_argument(
        "--model",
        default="small",
        choices=["tiny", "base", "small", "medium"],
        help="Whisper model size (default: small — better for Thai)",
    )
    parser.add_argument(
        "--language",
        default="th",
        help="Language code for Whisper (default: th). Use 'auto' to detect.",
    )
    parser.add_argument(
        "--metadata-only",
        action="store_true",
        help="Only fetch metadata, skip download and transcription",
    )
    args = parser.parse_args()

    lang = None if args.language == "auto" else args.language
    out_dir = args.output.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    print("Fetching metadata...", file=sys.stderr)
    meta = fetch_metadata(args.url)
    (out_dir / "metadata.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(meta, ensure_ascii=False, indent=2))

    if args.metadata_only:
        return 0

    print("Downloading audio...", file=sys.stderr)
    audio = download_audio(args.url, out_dir)
    print(f"Audio: {audio}", file=sys.stderr)

    print(f"Transcribing with faster-whisper ({args.model})...", file=sys.stderr)
    transcript = transcribe(audio, args.model, lang)
    (out_dir / "transcript.txt").write_text(transcript, encoding="utf-8")
    print("\n--- TRANSCRIPT ---\n")
    print(transcript)

    draft = build_notion_draft(meta, transcript)
    (out_dir / "notion-draft.md").write_text(draft, encoding="utf-8")
    print(f"\nWrote {out_dir}/notion-draft.md", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
