"""Add @smoke / @regression tags to Playwright test titles.

Reads the TC ID -> Coverage Type mapping from scripts/build-qa-xlsx.py (the
single source of truth) and rewrites each test title in tests/qa/specs/*.spec.js
to append the matching tag — but only when no tag is already present.

Idempotent: re-running leaves already-tagged titles untouched.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
BUILDER = ROOT / "scripts" / "build-qa-xlsx.py"
SPECS_DIR = ROOT / "tests" / "qa" / "specs"

TAG_FOR = {"Smoke": "@smoke", "Regression": "@regression"}


def load_coverage():
    """Return {TC-XXX-NN: 'Smoke'|'Regression'} from the xlsx builder source."""
    text = BUILDER.read_text(encoding="utf-8").splitlines()
    mapping = {}
    for i, line in enumerate(text):
        m = re.search(r'\["(TC-[A-Z]+-\d+)"', line)
        if not m:
            continue
        tc = m.group(1)
        block = " ".join(text[i:i + 6])
        cov = re.search(r'"(Smoke|Regression)"', block)
        if cov:
            mapping[tc] = cov.group(1)
    return mapping


def update_spec(path: Path, mapping: dict) -> tuple[int, int, list[str]]:
    """Return (updated_count, skipped_count, missing_tc_ids)."""
    src = path.read_text(encoding="utf-8")
    updated = skipped = 0
    missing = []

    # match: test('TC-PDT-13: ...title with optional \' apostrophes...', async ...)
    # The title body allows: any non-quote character, OR a backslash-escape
    # of any character (including \'), so titles with embedded apostrophes
    # don't get truncated.
    pattern = re.compile(r"test\(\s*'((TC-[A-Z]+-\d+):(?:[^'\\]|\\.)*)'")

    def repl(m: re.Match) -> str:
        nonlocal updated, skipped
        full_title = m.group(1)
        tc = m.group(2)
        # Already tagged?  Leave alone.
        if "@smoke" in full_title or "@regression" in full_title:
            skipped += 1
            return m.group(0)
        cov = mapping.get(tc)
        if not cov:
            missing.append(tc)
            skipped += 1
            return m.group(0)
        tag = TAG_FOR[cov]
        new_title = f"{full_title} {tag}"
        updated += 1
        return f"test('{new_title}'"

    new_src = pattern.sub(repl, src)
    if new_src != src:
        path.write_text(new_src, encoding="utf-8")
    return updated, skipped, missing


def main() -> int:
    mapping = load_coverage()
    print(f"Loaded {len(mapping)} TC -> Coverage mappings from build-qa-xlsx.py")

    total_updated = total_skipped = 0
    all_missing: list[str] = []
    for spec in sorted(SPECS_DIR.glob("*.spec.js")):
        u, s, miss = update_spec(spec, mapping)
        total_updated += u
        total_skipped += s
        all_missing.extend(miss)
        print(f"  {spec.name:30s}  updated={u:2d}  skipped={s:2d}  missing={len(miss)}")

    print(f"\nDone. Updated {total_updated} titles, skipped {total_skipped}.")
    if all_missing:
        print(f"WARN: {len(all_missing)} TC IDs in specs have no coverage in build-qa-xlsx.py:")
        for tc in all_missing:
            print(f"  - {tc}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
