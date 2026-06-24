#!/usr/bin/env python3
"""Fetch Facebook OG metadata (reels, videos, text posts) without login.

Tries multiple crawler user-agents; text posts often need Twitterbot.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.request


USER_AGENTS = [
    ("facebookexternalhit/1.1", "reels/videos"),
    ("Twitterbot/1.0", "posts/share/p"),
]


def fetch(url: str, user_agent: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_og(html_text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for key in ("title", "description", "url", "image", "type"):
        m = re.search(
            rf'property="og:{key}" content="([^"]*)"',
            html_text,
        )
        if m:
            out[key] = html.unescape(m.group(1))
    return out


def resolve_story_url(html_text: str) -> str | None:
    m = re.search(r"story\.php\?story_fbid=(\d+)&id=(\d+)", html_text)
    if m:
        return f"https://www.facebook.com/story.php?story_fbid={m.group(1)}&id={m.group(2)}"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch Facebook OG metadata")
    parser.add_argument("url", help="Facebook share/reel/post URL")
    parser.add_argument("--json", action="store_true", help="Print JSON only")
    args = parser.parse_args()

    best: dict[str, str] = {}
    story_url: str | None = None

    for ua, _hint in USER_AGENTS:
        try:
            body = fetch(args.url, ua)
        except Exception as e:
            print(f"WARN {ua}: {e}", file=sys.stderr)
            continue
        og = parse_og(body)
        if og.get("description") and len(og["description"]) > len(
            best.get("description", "")
        ):
            best = og
        if not story_url:
            story_url = resolve_story_url(body)

    if not best:
        print("No OG tags found.", file=sys.stderr)
        return 1

    result = {
        "og": best,
        "story_url": story_url,
        "permalink": best.get("url") or args.url,
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        if story_url:
            print(f"\nstory_url: {story_url}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
