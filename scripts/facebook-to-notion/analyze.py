#!/usr/bin/env python3
"""LLM analysis of Facebook video extract — Manus-style structured output."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

SYSTEM_PROMPT = """You analyze Thai parenting / self-improvement Facebook videos for a Notion database.

You receive:
- Post caption/description (reliable)
- Audio transcript (may contain errors, especially names and couple vs. child topics)

Your job:
1. Identify the TRUE main topic (e.g. spousal relationship vs. parent-child rules).
2. If transcript conflicts with caption or seems wrong, trust caption + coherent reasoning; note uncertainty.
3. Produce structured content similar to a professional video summary.

Respond with valid JSON only (no markdown fence), keys:
- "title": short Thai title for Notion Name property
- "summary": 2-4 sentences Thai for Notion Summary property
- "key_takeaways_html": bullet lines joined with <br> for Notion (Thai, 4-8 bullets)
- "personal_action": one concrete Thai sentence for Notion Personal Action
- "category": one of: MindSet, Self Learning, Communication Skill, Leadership, Management, Time management
- "markdown_body": full Notion page body in Notion-flavored markdown (## headings, tables, callouts as blockquotes, bilingual labels OK)
"""


def analyze_with_openai(meta: dict, transcript: str, model: str = "gpt-4o-mini") -> dict:
    from openai import OpenAI

    client = OpenAI()
    user = json.dumps(
        {
            "uploader": meta.get("uploader"),
            "url": meta.get("webpage_url"),
            "description": meta.get("description"),
            "title": meta.get("title"),
            "transcript": transcript,
        },
        ensure_ascii=False,
        indent=2,
    )
    resp = client.chat.completions.create(
        model=model,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user},
        ],
        temperature=0.3,
    )
    return json.loads(resp.choices[0].message.content)


def analyze_with_gemini_video(video_path: Path, meta: dict, model: str = "gemini-2.0-flash") -> dict:
    """Closest to Manus: multimodal video understanding."""
    import google.generativeai as genai

    genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
    uploaded = genai.upload_file(str(video_path))
    gm = genai.GenerativeModel(model)
    prompt = (
        SYSTEM_PROMPT
        + "\n\nAlso use what you SEE and HEAR in the video. Caption from post:\n"
        + (meta.get("description") or "")
    )
    resp = gm.generate_content(
        [uploaded, prompt],
        generation_config={"response_mime_type": "application/json"},
    )
    return json.loads(resp.text)


def write_outputs(out_dir: Path, analysis: dict, meta: dict) -> None:
    (out_dir / "analysis.json").write_text(
        json.dumps(analysis, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    url = meta.get("webpage_url", "")
    body = analysis.get("markdown_body", "")
    draft = f"# {analysis.get('title', 'Untitled')}\n\n"
    draft += f"**Link:** {url}\n\n" if url else ""
    draft += body
    draft += f"\n\n---\n**Source:** {url}\n"
    (out_dir / "notion-draft.md").write_text(draft, encoding="utf-8")
    (out_dir / "manus-style-analysis.md").write_text(
        _format_manus_style(analysis, meta), encoding="utf-8"
    )


def _format_manus_style(analysis: dict, meta: dict) -> str:
    """Readable report like Manus export."""
    lines = [
        f"# Video Analysis: {analysis.get('title', '')}",
        "",
        f"**Source:** {meta.get('uploader', '')} — {meta.get('webpage_url', '')}",
        "",
        "## Summary",
        analysis.get("summary", ""),
        "",
        analysis.get("markdown_body", ""),
        "",
        "## Notion properties (copy-paste)",
        f"- **Name:** {analysis.get('title', '')}",
        f"- **Category:** {analysis.get('category', 'MindSet')}",
        f"- **Summary:** {analysis.get('summary', '')}",
        f"- **Personal Action:** {analysis.get('personal_action', '')}",
    ]
    return "\n".join(lines)


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Analyze extract output with LLM")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("./facebook-extract-out"),
        help="Directory with metadata.json and transcript.txt",
    )
    parser.add_argument(
        "--mode",
        choices=["openai", "gemini"],
        default="openai",
        help="openai = caption+transcript (needs OPENAI_API_KEY). gemini = full video (needs GOOGLE_API_KEY + video.mp4)",
    )
    parser.add_argument("--model", default=None, help="Override model name")
    args = parser.parse_args()

    out_dir = args.output.resolve()
    meta = json.loads((out_dir / "metadata.json").read_text(encoding="utf-8"))
    transcript = ""
    tp = out_dir / "transcript.txt"
    if tp.exists():
        transcript = tp.read_text(encoding="utf-8")

    if args.mode == "openai":
        if not os.environ.get("OPENAI_API_KEY"):
            print("Set OPENAI_API_KEY for OpenAI analysis.", file=sys.stderr)
            return 1
        model = args.model or "gpt-4o-mini"
        print(f"Analyzing with OpenAI ({model})...", file=sys.stderr)
        analysis = analyze_with_openai(meta, transcript, model)
    else:
        if not os.environ.get("GOOGLE_API_KEY"):
            print("Set GOOGLE_API_KEY for Gemini video analysis.", file=sys.stderr)
            return 1
        vp = out_dir / "video.mp4"
        if not vp.exists():
            print(f"Missing {vp}. Run: extract.py URL --download-video", file=sys.stderr)
            return 1
        model = args.model or "gemini-2.0-flash"
        print(f"Analyzing video with Gemini ({model})...", file=sys.stderr)
        analysis = analyze_with_gemini_video(vp, meta, model)

    write_outputs(out_dir, analysis, meta)
    print(json.dumps(analysis, ensure_ascii=False, indent=2))
    print(f"\nWrote {out_dir}/manus-style-analysis.md", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
