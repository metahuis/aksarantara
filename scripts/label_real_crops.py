#!/usr/bin/env python3
"""
label_real_crops.py
───────────────────
Simple CLI tool for labeling real Lontara manuscript image crops.

Workflow:
  1. Put raw manuscript images in data/real_manuscripts/raw/
  2. Run this script — it shows each image and asks for romanization
  3. Labels are saved to data/real_manuscripts/metadata.jsonl
  4. Push to HF with: python scripts/push_to_hub.py --data data/real_manuscripts --repo aksarantara/lontara-ocr-real

Controls:
  Type the romanized text → press Enter to save and continue
  Press Enter with no text → skip this image
  Type 'q' → quit and save progress

Usage:
  pip install pillow
  python scripts/label_real_crops.py
  python scripts/label_real_crops.py --dir data/real_manuscripts/raw
"""

import argparse
import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("pip install pillow", file=sys.stderr)
    sys.exit(1)

try:
    import subprocess
    import platform
except ImportError:
    pass


def open_image_viewer(path: Path):
    """Open image in system viewer so labeler can see it while typing."""
    try:
        if platform.system() == "Windows":
            subprocess.Popen(["explorer", str(path)])
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", str(path)])
        else:
            for viewer in ["eog", "feh", "display", "xdg-open"]:
                try:
                    subprocess.Popen([viewer, str(path)])
                    break
                except FileNotFoundError:
                    continue
    except Exception:
        pass  # viewer is optional — labeler can open manually


def load_done(meta_path: Path) -> set:
    """Return set of already-labeled filenames."""
    done = set()
    if meta_path.exists():
        with open(meta_path, encoding="utf-8") as f:
            for line in f:
                rec = json.loads(line.strip())
                done.add(Path(rec["image_path"]).name)
    return done


def run(raw_dir: Path, meta_path: Path):
    raw_dir.mkdir(parents=True, exist_ok=True)
    meta_path.parent.mkdir(parents=True, exist_ok=True)

    images = sorted(
        p for p in raw_dir.iterdir()
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if not images:
        print(f"No images found in {raw_dir}")
        print("Put manuscript crops (jpg/png) there and re-run.")
        return

    done  = load_done(meta_path)
    todo  = [p for p in images if p.name not in done]
    total = len(images)

    print(f"\n{'─'*50}")
    print(f"  Lontara manuscript labeling tool")
    print(f"  {len(done)}/{total} already labeled  |  {len(todo)} remaining")
    print(f"  Output: {meta_path}")
    print(f"{'─'*50}")
    print(f"  Enter romanized text → save")
    print(f"  Enter (empty)        → skip")
    print(f"  q                    → quit")
    print(f"{'─'*50}\n")

    labeled = 0
    skipped = 0

    with open(meta_path, "a", encoding="utf-8") as out:
        for i, img_path in enumerate(todo, 1):
            # Show image dimensions
            try:
                img = Image.open(img_path)
                size_str = f"{img.width}×{img.height}"
            except Exception:
                size_str = "?"

            open_image_viewer(img_path)

            print(f"[{i}/{len(todo)}] {img_path.name}  ({size_str})")
            print(f"  → ", end="", flush=True)

            try:
                text = input().strip()
            except (EOFError, KeyboardInterrupt):
                print("\nInterrupted. Progress saved.")
                break

            if text.lower() == "q":
                print("Quit. Progress saved.")
                break

            if not text:
                skipped += 1
                print(f"     skipped\n")
                continue

            rec = {
                "image_path": f"images/{img_path.name}",
                "text":       text,
                "script":     "",   # leave blank — not required for real crops
                "type":       "real",
                "source":     str(img_path.parent.name),
            }
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            out.flush()
            labeled += 1
            print(f"     ✓ saved: {text!r}\n")

    print(f"\n{'─'*50}")
    print(f"  Session summary")
    print(f"  Labeled : {labeled}")
    print(f"  Skipped : {skipped}")
    print(f"  Total   : {len(done) + labeled} / {total}")
    print(f"{'─'*50}")

    if labeled > 0:
        print(f"\nNext step:")
        print(f"  python scripts/push_to_hub.py \\")
        print(f"    --data data/real_manuscripts \\")
        print(f"    --repo aksarantara/lontara-ocr-real")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Label real Lontara manuscript crops")
    parser.add_argument("--dir",  default="data/real_manuscripts/raw",
                        help="Directory of raw manuscript image crops")
    parser.add_argument("--meta", default="data/real_manuscripts/metadata.jsonl",
                        help="Output metadata file (appended, resumable)")
    args = parser.parse_args()

    run(Path(args.dir), Path(args.meta))
