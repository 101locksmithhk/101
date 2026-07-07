#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET


SITE_URL = "https://101locksmith.com"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "sitemap.xml"

EXCLUDED_DIRS = {
    ".git",
    ".codex",
    ".agents",
    ".vscode",
    ".idea",
    "node_modules",
    "dist",
    "build",
}

PRIORITIES = {
    "index.html": "1.0",
    "zh-CN/index.html": "0.9",
    "en/index.html": "0.8",
    "service.html": "0.9",
    "price.html": "0.8",
    "faq.html": "0.7",
    "news.html": "0.8",
    "locksmith-real-case.html": "0.8",
}

CHANGEFREQ = {
    "index.html": "weekly",
    "zh-CN/index.html": "weekly",
    "en/index.html": "weekly",
    "service.html": "monthly",
    "price.html": "monthly",
    "faq.html": "monthly",
    "news.html": "weekly",
    "locksmith-real-case.html": "weekly",
}


def should_skip(path: Path) -> bool:
    return any(part in EXCLUDED_DIRS for part in path.parts)


def public_path(relative_path: str) -> str:
    if relative_path == "index.html":
        return "/"
    if relative_path.endswith("/index.html"):
        return "/" + relative_path.removesuffix("index.html")
    return "/" + relative_path


def sort_key(path: Path) -> tuple[int, str]:
    relative = path.relative_to(ROOT).as_posix()
    if relative == "index.html":
        return (0, relative)
    if relative == "zh-CN/index.html":
        return (1, relative)
    if relative == "en/index.html":
        return (2, relative)
    if relative in {"service.html", "price.html", "faq.html", "news.html", "locksmith-real-case.html"}:
        return (3, relative)
    if relative.startswith("news/"):
        return (4, relative)
    if relative.startswith("case/"):
        return (5, relative)
    return (9, relative)


def lastmod(path: Path) -> str:
    timestamp = path.stat().st_mtime
    return datetime.fromtimestamp(timestamp, timezone.utc).date().isoformat()


def main() -> None:
    html_files = sorted(
        (
            path
            for path in ROOT.rglob("*.html")
            if path.is_file() and not should_skip(path.relative_to(ROOT))
        ),
        key=sort_key,
    )

    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    urlset = ET.Element("{http://www.sitemaps.org/schemas/sitemap/0.9}urlset")

    for path in html_files:
        relative = path.relative_to(ROOT).as_posix()
        url = ET.SubElement(urlset, "{http://www.sitemaps.org/schemas/sitemap/0.9}url")
        ET.SubElement(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}loc").text = SITE_URL + public_path(relative)
        ET.SubElement(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod").text = lastmod(path)
        ET.SubElement(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}changefreq").text = CHANGEFREQ.get(relative, "monthly")
        ET.SubElement(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}priority").text = PRIORITIES.get(relative, "0.6")

    ET.indent(urlset, space="  ")
    tree = ET.ElementTree(urlset)
    tree.write(OUTPUT, encoding="utf-8", xml_declaration=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {len(html_files)} URLs")


if __name__ == "__main__":
    main()
