#!/usr/bin/env python3
"""Build the static site while preserving every ``.html`` filename.

The deployment output keeps the same HTML paths as the source website and
rewrites internal links only when a GitHub Pages base path is required.
"""

from __future__ import annotations

import argparse
import html
import posixpath
import re
import shutil
from pathlib import Path
from urllib.parse import unquote, urlsplit, urlunsplit


PROJECT_ROOT = Path(__file__).resolve().parent.parent

EXCLUDED_TOP_LEVEL = {
    ".agents",
    ".codex",
    ".git",
    ".github",
    "_site",
    "scripts",
}

EXCLUDED_FILES = {
    ".DS_Store",
    ".htaccess",  # GitHub Pages does not process Apache rewrite rules.
    "AGENTS.md",
}

URL_ATTRIBUTE_RE = re.compile(
    r"(?P<prefix>\b(?:href|src|poster)\s*=\s*)"
    r"(?P<quote>[\"'])(?P<url>.*?)(?P=quote)",
    re.IGNORECASE,
)

SRCSET_ATTRIBUTE_RE = re.compile(
    r"(?P<prefix>\bsrcset\s*=\s*)"
    r"(?P<quote>[\"'])(?P<value>.*?)(?P=quote)",
    re.IGNORECASE,
)

CSS_URL_RE = re.compile(
    r"url\(\s*(?P<quote>[\"']?)(?P<url>[^)\"']+)(?P=quote)\s*\)",
    re.IGNORECASE,
)

SCRIPT_PROPERTY_RE = re.compile(
    r"(?P<prefix>\b(?:link|img)\s*:\s*)"
    r"(?P<quote>[\"'])(?P<url>[^\"']+)(?P=quote)"
)

LANGUAGE_TARGET_RE = re.compile(
    r"const\s+targetUrl\s*=\s*lang\s*===\s*['\"]zh['\"]\s*\?.*?;",
    re.DOTALL,
)

NON_LOCAL_SCHEMES = {
    "data",
    "http",
    "https",
    "javascript",
    "mailto",
    "sms",
    "tel",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=PROJECT_ROOT / "_site",
        help="New directory for the generated site (must not already exist).",
    )
    parser.add_argument(
        "--base-path",
        default="",
        help="GitHub Pages base path, for example /repository-name.",
    )
    return parser.parse_args()


def normalize_base_path(value: str) -> str:
    value = value.strip().strip("/")
    return f"/{value}" if value else ""


def is_excluded(path: Path) -> bool:
    relative = path.relative_to(PROJECT_ROOT)
    return (
        relative.parts[0] in EXCLUDED_TOP_LEVEL
        or path.name in EXCLUDED_FILES
        or any(part.startswith(".") for part in relative.parts)
    )


def discover_source_pages() -> tuple[list[Path], dict[Path, Path]]:
    """Return every source HTML page without changing its filename."""
    all_pages = sorted(
        path.resolve()
        for path in PROJECT_ROOT.rglob("*.html")
        if not is_excluded(path)
    )
    return all_pages, {}


def output_path_for_page(source: Path, output_root: Path) -> Path:
    relative = source.relative_to(PROJECT_ROOT)
    return output_root / relative


def route_for_page(source: Path) -> str:
    relative = source.relative_to(PROJECT_ROOT)
    return f"/{relative.as_posix()}"


class SiteBuilder:
    def __init__(self, output_root: Path, base_path: str) -> None:
        self.output_root = output_root.resolve()
        self.base_path = normalize_base_path(base_path)
        self.pages, self.aliases = discover_source_pages()
        self.page_routes = {page: route_for_page(page) for page in self.pages}

        output_paths = [output_path_for_page(page, self.output_root) for page in self.pages]
        if len(output_paths) != len(set(output_paths)):
            raise RuntimeError("Two source pages resolve to the same HTML output path.")

    def site_url(self, path: str) -> str:
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{self.base_path}{path}" or "/"

    def canonical_page(self, path: Path) -> Path | None:
        path = path.resolve()

        if path in self.aliases:
            return self.aliases[path]

        if path in self.page_routes:
            return path

        if path.is_dir():
            sibling_html = Path(f"{path}.html").resolve()
            if sibling_html in self.page_routes:
                return sibling_html

            index_page = (path / "index.html").resolve()
            index_page = self.aliases.get(index_page, index_page)
            if index_page in self.page_routes:
                return index_page

        if not path.suffix:
            html_page = Path(f"{path}.html").resolve()
            html_page = self.aliases.get(html_page, html_page)
            if html_page in self.page_routes:
                return html_page

        return None

    def resolve_local_path(self, source: Path, url_path: str) -> Path:
        decoded_path = unquote(url_path)
        if decoded_path.startswith("/"):
            return (PROJECT_ROOT / decoded_path.lstrip("/")).resolve()
        return (source.parent / decoded_path).resolve()

    def rewrite_url(self, source: Path, raw_url: str) -> str:
        decoded_url = html.unescape(raw_url.strip())
        if not decoded_url or decoded_url.startswith("#"):
            return raw_url

        parts = urlsplit(decoded_url)
        if parts.scheme.lower() in NON_LOCAL_SCHEMES or parts.netloc:
            return raw_url

        if not parts.path:
            return raw_url

        target = self.resolve_local_path(source, parts.path)
        page = self.canonical_page(target)

        if page is not None:
            new_path = self.site_url(self.page_routes[page])
        elif target.exists() and target.is_file():
            relative_asset = target.relative_to(PROJECT_ROOT).as_posix()
            new_path = self.site_url(f"/{relative_asset}")
        else:
            # Keep unknown paths untouched so the build does not invent a target.
            return raw_url

        return urlunsplit(("", "", new_path, parts.query, parts.fragment))

    def rewrite_srcset(self, source: Path, value: str) -> str:
        rewritten_entries: list[str] = []
        for entry in value.split(","):
            components = entry.strip().split(maxsplit=1)
            if not components:
                continue
            rewritten_url = self.rewrite_url(source, components[0])
            rewritten_entries.append(
                " ".join((rewritten_url, components[1]))
                if len(components) == 2
                else rewritten_url
            )
        return ", ".join(rewritten_entries)

    def rewrite_language_targets(self, text: str) -> str:
        language_target = (
            "const targetUrl = lang === 'zh' "
            f"? '{self.site_url('/zh-CN/index.html')}' "
            f": (lang === 'en' ? '{self.site_url('/en/index.html')}' "
            f": '{self.site_url('/index.html')}');"
        )
        return LANGUAGE_TARGET_RE.sub(language_target, text)

    def rewrite_html(self, source: Path, text: str) -> str:
        def replace_attribute(match: re.Match[str]) -> str:
            rewritten = self.rewrite_url(source, match.group("url"))
            return (
                f"{match.group('prefix')}{match.group('quote')}"
                f"{rewritten}{match.group('quote')}"
            )

        def replace_srcset(match: re.Match[str]) -> str:
            rewritten = self.rewrite_srcset(source, match.group("value"))
            return (
                f"{match.group('prefix')}{match.group('quote')}"
                f"{rewritten}{match.group('quote')}"
            )

        def replace_css_url(match: re.Match[str]) -> str:
            rewritten = self.rewrite_url(source, match.group("url").strip())
            quote = match.group("quote")
            return f"url({quote}{rewritten}{quote})"

        def replace_script_property(match: re.Match[str]) -> str:
            rewritten = self.rewrite_url(source, match.group("url"))
            return (
                f"{match.group('prefix')}{match.group('quote')}"
                f"{rewritten}{match.group('quote')}"
            )

        text = URL_ATTRIBUTE_RE.sub(replace_attribute, text)
        text = SRCSET_ATTRIBUTE_RE.sub(replace_srcset, text)
        text = CSS_URL_RE.sub(replace_css_url, text)
        text = SCRIPT_PROPERTY_RE.sub(replace_script_property, text)
        return self.rewrite_language_targets(text)

    def copy_static_files(self) -> None:
        for source in sorted(PROJECT_ROOT.rglob("*")):
            if not source.is_file() or source.suffix.lower() == ".html":
                continue
            if is_excluded(source):
                continue

            relative = source.relative_to(PROJECT_ROOT)
            destination = self.output_root / relative
            destination.parent.mkdir(parents=True, exist_ok=True)

            if relative == Path("js/news.js"):
                text = source.read_text(encoding="utf-8")
                destination.write_text(
                    self.rewrite_language_targets(text),
                    encoding="utf-8",
                )
            else:
                shutil.copy2(source, destination)

    def build_pages(self) -> None:
        for source in self.pages:
            destination = output_path_for_page(source, self.output_root)
            destination.parent.mkdir(parents=True, exist_ok=True)
            source_html = source.read_text(encoding="utf-8")
            destination.write_text(
                self.rewrite_html(source, source_html),
                encoding="utf-8",
            )

    def build(self) -> None:
        if self.output_root.exists():
            raise FileExistsError(
                f"Output directory already exists: {self.output_root}. "
                "Choose a new empty path."
            )

        self.output_root.mkdir(parents=True)
        self.copy_static_files()
        self.build_pages()
        (self.output_root / ".nojekyll").write_text("", encoding="utf-8")


def main() -> None:
    args = parse_args()
    builder = SiteBuilder(args.output, args.base_path)
    builder.build()
    print(
        f"Built {len(builder.pages)} HTML-URL pages in {builder.output_root} "
        f"with base path {builder.base_path or '/'}"
    )


if __name__ == "__main__":
    main()
