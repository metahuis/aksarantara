# Lontara OCR Training Pipeline

Fine-tunes **PaliGemma2 3B** to transcribe Lontara Bugis manuscript images
into romanized Latin text. Trained on Kaggle free T4 GPU (~3–4h).

## Full pipeline

```
Manuscript photo
      ↓
[PaliGemma2-LoRA]  ←  fine-tuned here
      ↓
romanized text (e.g. "tau ri laleng bola")
      ↓
[Gemma 4 via Gemini API]  ←  existing lontara-ocr route
      ↓
IPA + Indonesian gloss + English gloss
      ↓
Supabase entry (status: pending)
```

## Scripts

| Script | What it does |
|---|---|
| `generate_lontara_dataset.py` | Generate synthetic (image, romanization) pairs from Lontara.ttf |
| `push_to_hub.py` | Push generated dataset to HuggingFace |
| `kaggle_lontara_training.py` | Kaggle notebook — PaliGemma2 LoRA fine-tune |
| `label_real_crops.py` | CLI tool for labeling real manuscript image crops |

## Week 1 — Data

```bash
# Install Python deps
pip install pillow numpy datasets huggingface_hub

# Generate ~6,000 synthetic training images from Lontara.ttf
python scripts/generate_lontara_dataset.py
# → data/lontara_synthetic/ (gitignored)

# Push to HuggingFace (login first)
huggingface-cli login
python scripts/push_to_hub.py --repo aksarantara/lontara-ocr-synthetic

# Collect real manuscript crops from KITLV / British Library
# → put in data/real_manuscripts/raw/
# Label them:
python scripts/label_real_crops.py
python scripts/push_to_hub.py \
  --data data/real_manuscripts \
  --repo aksarantara/lontara-ocr-real
```

## Week 2 — Training (Kaggle)

1. Go to kaggle.com → New Notebook
2. Enable GPU accelerator (T4 x2) and internet access
3. Add `HF_TOKEN` to Kaggle Secrets
4. Copy-paste cells from `kaggle_lontara_training.py`
5. Set `ROUND = 1`, run all cells (~3–4h)
6. Model pushed to `aksarantara/lontara-paligemma2` on HuggingFace

For Round 2 (real crops):
- Set `ROUND = 2`, `CHECKPOINT = "outputs/round1/checkpoint-final"`
- Re-run (~1–2h more)

## Week 3 — Integration

Update `src/app/api/ai/lontara-ocr/route.js` to two-stage pipeline:
1. Call HuggingFace Inference API → PaliGemma2 → romanized text
2. Call Gemini API → Gemma 4 → IPA + gloss + translation

## Expected CER targets

| Stage | Character Error Rate |
|---|---|
| Current (Gemma 4 vision, no fine-tune) | ~40–60% on manuscripts |
| Round 1 (synthetic only) | ~15–25% |
| Round 2 (+ 50–100 real crops) | ~8–12% |
| Round 2 (+ 300+ real crops) | < 5% |
