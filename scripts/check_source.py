"""Report edits to the published Naruto guide. CI uses the reviewed snapshot offline."""
import argparse
import difflib
import hashlib
from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen

URL = "https://shikimori.io/articles/365-naruto-ultimativnyy-gayd-po-prosmotru"
SNAPSHOT = Path(__file__).resolve().parents[1] / "reference/shikimori.snapshot"
ROW = re.compile(r"^((?:\[[^\]]+\](?:\s*\+\s*)?)+)\s*(Сери[ия]|Фильм|ОВА)\s+(\d+)(?:[-–](\d+))?\s*[—–-]\s*(.+)$", re.I)


class ArticleBody(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.text = []

    def handle_starttag(self, tag, attrs):
        if not self.depth:
            if tag == "div" and dict(attrs).get("itemprop") == "articleBody":
                self.depth = 1
        elif tag == "div":
            self.depth += 1
        elif tag in ("br", "p", "center"):
            self.text.append("\n")

    def handle_endtag(self, tag):
        if self.depth and tag == "div":
            self.depth -= 1
        if self.depth and tag in ("p", "center"):
            self.text.append("\n")

    def handle_data(self, data):
        if self.depth:
            self.text.append(data)


def snapshot(document):
    parser = ArticleBody()
    parser.feed(document)
    season = 0
    counts = [0, 0]
    lines = ["# season | type | range | source marker | SHA256 of title and notes"]
    instructions = []
    excerpts = {}
    for raw in "".join(parser.text).splitlines():
        line = " ".join(raw.split())
        if not line:
            continue
        if line.startswith("ПЕРВЫЙ СЕЗОН"):
            season = 1
        elif line.startswith("ВТОРОЙ СЕЗОН"):
            season = 2
        match = ROW.match(line) if season else None
        if match:
            marks, kind, lo, hi, wording = match.groups()
            kind = {"ова": "ova", "фильм": "film"}.get(kind.lower(), "series")
            marker = "+".join(re.findall(r"\[(.*?)\]", marks))
            span = f"{lo}-{hi}" if hi else lo
            digest = hashlib.sha256(wording.encode()).hexdigest()
            lines.append(f"{season} | {kind} | {span} | {marker} | {digest}")
            excerpts[lines[-1]] = line
            counts[season - 1] += 1
        else:
            if season and line.startswith("["):
                raise ValueError(f"Unrecognized catalog row: {line[:60]}")
            digest = hashlib.sha256(line.encode()).hexdigest()
            label = re.match(r"(Примечание №\d+|\d+\)|\[[^\]]+\])", line)
            section = label[1] if label else f"paragraph {len(instructions) + 1}"
            instructions.append(f"# {section} | {digest}")
            excerpts[instructions[-1]] = line
    if not all(counts):
        raise ValueError("Missing season data; refusing to replace the snapshot.")
    return "\n".join(lines + instructions) + "\n", excerpts


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--file", type=Path, help="use a locally saved article HTML")
    cli.add_argument("--update", action="store_true", help="accept a reviewed upstream change")
    args = cli.parse_args()
    if args.file:
        document = args.file.read_text(encoding="utf-8")
    else:
        with urlopen(Request(URL, headers={"User-Agent": "naruto-guide source check"}), timeout=30) as response:
            document = response.read().decode("utf-8")
    current, excerpts = snapshot(document)
    previous = SNAPSHOT.read_text(encoding="utf-8") if SNAPSHOT.exists() else ""
    if current == previous:
        print("Article matches the reviewed snapshot.")
        return 0
    sys.stdout.writelines(difflib.unified_diff(previous.splitlines(True), current.splitlines(True),
                                               fromfile="reviewed", tofile="upstream"))
    previous_lines = set(previous.splitlines())
    if previous:
        for line in current.splitlines():
            if line not in previous_lines and line in excerpts:
                print(f"Upstream wording: {excerpts[line]}")
    if args.update:
        SNAPSHOT.write_text(current, encoding="utf-8")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
