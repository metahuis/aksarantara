#!/usr/bin/env python3
"""
push_to_hub.py
──────────────
Push the generated Lontara synthetic dataset to a HuggingFace private repo.
Run this after generate_lontara_dataset.py.

Requirements:
  pip install datasets huggingface_hub pillow

Usage:
  huggingface-cli login          # paste your HF_TOKEN once
  python scripts/push_to_hub.py
  python scripts/push_to_hub.py --repo aksarantara/lontara-ocr-synthetic --private
"""

import argparse
from pathlib import Path
from datasets import Dataset, DatasetDict, Features, Value, Image as HFImage
from huggingface_hub import HfApi


def load_records(data_dir: Path) -> list[dict]:
    meta = data_dir / 'metadata.jsonl'
    if not meta.exists():
        raise FileNotFoundError(f"metadata.jsonl not found in {data_dir}. Run generate_lontara_dataset.py first.")
    import json
    records = []
    with open(meta, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                rec = json.loads(line)
                # Resolve absolute path
                rec['image_path'] = str(data_dir / rec['image_path'])
                records.append(rec)
    return records


def build_dataset(records: list[dict]) -> DatasetDict:
    # Shuffle then split 90/10 train/test
    import random
    random.shuffle(records)
    split = int(len(records) * 0.9)
    train_recs = records[:split]
    test_recs  = records[split:]

    def to_hf(recs):
        return Dataset.from_dict({
            'image':  [r['image_path'] for r in recs],
            'text':   [r['text']       for r in recs],
            'script': [r['script']     for r in recs],
            'type':   [r['type']       for r in recs],
        }).cast_column('image', HFImage())

    return DatasetDict({'train': to_hf(train_recs), 'test': to_hf(test_recs)})


def push(data_dir: str, repo_id: str, private: bool):
    data_dir = Path(data_dir)
    print(f"Loading records from {data_dir}...")
    records = load_records(data_dir)
    print(f"  {len(records):,} records loaded")

    print("Building HuggingFace DatasetDict...")
    ds = build_dataset(records)
    print(f"  train: {len(ds['train']):,}  test: {len(ds['test']):,}")

    print(f"Pushing to hub: {repo_id} (private={private})...")
    ds.push_to_hub(repo_id, private=private)

    print(f"\n✓ Pushed to https://huggingface.co/datasets/{repo_id}")
    print("  Use in Kaggle notebook:")
    print(f'    from datasets import load_dataset')
    print(f'    ds = load_dataset("{repo_id}", token=HF_TOKEN)')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Push Lontara dataset to HuggingFace Hub')
    parser.add_argument('--data',    default='data/lontara_synthetic')
    parser.add_argument('--repo',    default='aksarantara/lontara-ocr-synthetic',
                        help='HuggingFace dataset repo ID (org/name)')
    parser.add_argument('--private', action='store_true', default=True,
                        help='Keep dataset private (default: True)')
    parser.add_argument('--public',  action='store_true',
                        help='Make dataset public')
    args = parser.parse_args()

    push(args.data, args.repo, private=not args.public)
