#!/usr/bin/env python3
from __future__ import annotations

import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET


SITE_URL = "https://101locksmithhk.com"
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "sitemap.xml"
STATIC_OUTPUT = ROOT / "sitemap-static.xml"

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

HOME_ALTERNATES = {
    "index.html": {
        "zh-HK": "https://101locksmithhk.com/",
        "zh-CN": "https://101locksmithhk.com/zh-CN/",
        "en-HK": "https://101locksmithhk.com/en/",
        "x-default": "https://101locksmithhk.com/",
    },
    "zh-CN/index.html": {
        "zh-HK": "https://101locksmithhk.com/",
        "zh-CN": "https://101locksmithhk.com/zh-CN/",
        "en-HK": "https://101locksmithhk.com/en/",
        "x-default": "https://101locksmithhk.com/",
    },
    "en/index.html": {
        "zh-HK": "https://101locksmithhk.com/",
        "zh-CN": "https://101locksmithhk.com/zh-CN/",
        "en-HK": "https://101locksmithhk.com/en/",
        "x-default": "https://101locksmithhk.com/",
    },
}

IMAGE_EXTENSIONS = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"}
EXCLUDED_IMAGE_NAMES = {
    "apple-touch-icon.png",
    "favicon-48x48.png",
    "favicon.png",
    "logo.webp",
}


class SeoParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.canonical: str | None = None
        self.robots: str = ""
        self.images: list[tuple[str, str | None]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {name.lower(): value for name, value in attrs if name}
        if tag == "link" and data.get("rel") == "canonical" and data.get("href"):
            self.canonical = data["href"]
        if tag == "meta" and data.get("name", "").lower() == "robots" and data.get("content"):
            self.robots = data["content"] or ""
        if tag == "img" and data.get("src"):
            self.images.append((data["src"] or "", data.get("alt")))


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


def page_priority(relative: str) -> str:
    if relative in PRIORITIES:
        return PRIORITIES[relative]
    if relative.startswith("news/"):
        return "0.7"
    if relative.startswith("case/"):
        return "0.7"
    return "0.6"


def canonical_url(relative: str) -> str:
    return SITE_URL + public_path(relative)


def resolve_local_ref(page: Path, ref: str) -> Path | None:
    if not ref or ref.startswith(("data:", "mailto:", "tel:", "#")) or "${" in ref:
        return None

    parsed = urlparse(ref)
    if parsed.scheme in {"http", "https"}:
        if parsed.netloc != urlparse(SITE_URL).netloc:
            return None
        ref_path = parsed.path
    else:
        ref_path = ref.split("#", 1)[0].split("?", 1)[0]

    if not ref_path:
        return None
    if ref_path.startswith("/"):
        candidate = ROOT / ref_path.lstrip("/")
    else:
        candidate = page.parent / ref_path
    return candidate.resolve()


def image_url(path: Path) -> str | None:
    try:
        relative = path.relative_to(ROOT).as_posix()
    except ValueError:
        return None
    if path.name in EXCLUDED_IMAGE_NAMES or path.suffix.lower() not in IMAGE_EXTENSIONS:
        return None
    if not path.exists():
        return None
    return f"{SITE_URL}/{relative}"


def page_images(page: Path, html: str, parser: SeoParser) -> list[tuple[str, str | None]]:
    found: dict[str, str | None] = {}

    for ref, alt in parser.images:
        resolved = resolve_local_ref(page, ref)
        if resolved:
            url = image_url(resolved)
            if url:
                found.setdefault(url, alt.strip() if alt else None)

    for ref in re.findall(r"url\(['\"]?([^)'\"\\]+)['\"]?\)", html):
        resolved = resolve_local_ref(page, ref)
        if resolved:
            url = image_url(resolved)
            if url:
                found.setdefault(url, None)

    for ref in re.findall(r"['\\\"]((?:\\.\\./|/|image/)[^'\\\"]+\\.(?:avif|gif|jpe?g|png|webp))['\\\"]", html, re.I):
        resolved = resolve_local_ref(page, ref)
        if resolved:
            url = image_url(resolved)
            if url:
                found.setdefault(url, None)

    return list(found.items())[:20]


def add_text(parent: ET.Element, tag: str, text: str) -> None:
    ET.SubElement(parent, tag).text = text


def main() -> None:
    candidates = sorted(
        (
            path
            for path in ROOT.rglob("*.html")
            if path.is_file() and not should_skip(path.relative_to(ROOT))
        ),
        key=sort_key,
    )

    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    ET.register_namespace("xhtml", "http://www.w3.org/1999/xhtml")
    ET.register_namespace("image", "http://www.google.com/schemas/sitemap-image/1.1")
    urlset = ET.Element("{http://www.sitemaps.org/schemas/sitemap/0.9}urlset")

    included = 0
    skipped: list[str] = []

    for path in candidates:
        relative = path.relative_to(ROOT).as_posix()
        html = path.read_text(encoding="utf-8", errors="ignore")
        parser = SeoParser()
        parser.feed(html)

        robots = parser.robots.lower()
        loc = canonical_url(relative)
        if "noindex" in robots:
            skipped.append(f"{relative} (noindex)")
            continue
        if parser.canonical and parser.canonical.rstrip("/") != loc.rstrip("/"):
            skipped.append(f"{relative} (canonical -> {parser.canonical})")
            continue

        url = ET.SubElement(urlset, "{http://www.sitemaps.org/schemas/sitemap/0.9}url")
        add_text(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}loc", loc)

        for hreflang, href in HOME_ALTERNATES.get(relative, {}).items():
            ET.SubElement(
                url,
                "{http://www.w3.org/1999/xhtml}link",
                {"rel": "alternate", "hreflang": hreflang, "href": href},
            )

        add_text(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}lastmod", lastmod(path))
        add_text(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}changefreq", CHANGEFREQ.get(relative, "monthly"))
        add_text(url, "{http://www.sitemaps.org/schemas/sitemap/0.9}priority", page_priority(relative))

        for img, caption in page_images(path, html, parser):
            image = ET.SubElement(url, "{http://www.google.com/schemas/sitemap-image/1.1}image")
            add_text(image, "{http://www.google.com/schemas/sitemap-image/1.1}loc", img)
            if caption:
                add_text(image, "{http://www.google.com/schemas/sitemap-image/1.1}caption", caption)

        included += 1

    ET.indent(urlset, space="  ")
    tree = ET.ElementTree(urlset)
    for output in (OUTPUT, STATIC_OUTPUT):
        tree.write(output, encoding="utf-8", xml_declaration=True)
        print(f"Wrote {output.relative_to(ROOT)} with {included} URLs")
    if skipped:
        print("Skipped:")
        for item in skipped:
            print(f"- {item}")


if __name__ == "__main__":
    main()
