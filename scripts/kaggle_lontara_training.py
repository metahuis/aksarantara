# %% [markdown]
# # Lontara OCR — PaliGemma2 Fine-tune (Unsloth LoRA)
#
# Fine-tunes **PaliGemma2 3B** to transcribe Lontara Bugis manuscript images
# into romanized Latin text.
#
# **Pipeline:**
# ```
# Lontara image crop  →  PaliGemma2-LoRA  →  "tau ri laleng"  →  Gemma 4 (Gemini API)  →  IPA + gloss
# ```
#
# **Run on:** Kaggle (T4 x2, 30h/week free) — ~3–4h training
#
# **Before running:**
# 1. Add HuggingFace token to Kaggle Secrets as `HF_TOKEN`
# 2. Enable internet access in notebook settings
# 3. Set `DATASET_REPO` below to your HF dataset repo
#
# **Rounds:**
# - Round 1: synthetic data only (establishes character recognition baseline)
# - Round 2: continue from Round 1 checkpoint + real manuscript crops

# %% [markdown]
# ## 0 · Environment setup

# %%
import os
import subprocess

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr[-2000:])
    return result.stdout

# Install Unsloth (Kaggle-specific build)
print(run("pip install -q unsloth"))
print(run("pip install -q datasets pillow jiwer"))

# %%
# Kaggle secrets → env vars
from kaggle_secrets import UserSecretsClient  # noqa: only on Kaggle
secrets = UserSecretsClient()
HF_TOKEN = secrets.get_secret("HF_TOKEN")
os.environ["HF_TOKEN"] = HF_TOKEN

# Configuration — edit these
DATASET_REPO  = "aksarantara/lontara-ocr-synthetic"   # HF dataset repo
MODEL_OUT     = "aksarantara/lontara-paligemma2"       # HF model repo to push to
ROUND         = 1                                       # 1 = synthetic only, 2 = add real crops
CHECKPOINT    = None                                    # set to local path for Round 2

# %%
import torch
print(f"CUDA available : {torch.cuda.is_available()}")
print(f"GPU            : {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'none'}")
print(f"BF16 supported : {torch.cuda.is_bf16_supported()}")

# %% [markdown]
# ## 1 · Load PaliGemma2 with Unsloth (4-bit quantized)

# %%
from unsloth import FastVisionModel

BASE_MODEL = "google/paligemma2-3b-pt-224"

model, tokenizer = FastVisionModel.from_pretrained(
    CHECKPOINT if CHECKPOINT else BASE_MODEL,
    load_in_4bit          = True,
    use_gradient_checkpointing = "unsloth",   # 30% VRAM savings
)
print(f"Loaded: {BASE_MODEL}")
print(f"Parameters: {sum(p.numel() for p in model.parameters()):,}")

# %% [markdown]
# ## 2 · Apply LoRA adapters

# %%
model = FastVisionModel.get_peft_model(
    model,
    # Fine-tune both vision encoder and language decoder
    finetune_vision_layers      = True,
    finetune_language_layers    = True,
    finetune_attention_modules  = True,
    finetune_mlp_modules        = True,
    r            = 16,     # LoRA rank — 16 is good balance of quality vs speed
    lora_alpha   = 32,     # scaling factor (2 × r is standard)
    lora_dropout = 0.05,
    bias         = "none",
    random_state = 42,
)
model.print_trainable_parameters()

# %% [markdown]
# ## 3 · Load dataset

# %%
from datasets import load_dataset

print(f"Loading {DATASET_REPO} ...")
ds = load_dataset(DATASET_REPO, token=HF_TOKEN)
print(ds)

# For Round 2: merge real manuscript crops on top of synthetic
if ROUND == 2:
    real_ds = load_dataset("aksarantara/lontara-ocr-real", token=HF_TOKEN)
    from datasets import concatenate_datasets
    ds["train"] = concatenate_datasets([ds["train"], real_ds["train"]])
    print(f"Round 2 — merged real crops. Train size: {len(ds['train']):,}")

# Quick sanity check
sample = ds["train"][0]
print(f"\nSample 0:")
print(f"  text   : {sample['text']}")
print(f"  script : {sample['script']}")
print(f"  type   : {sample['type']}")
print(f"  image  : {sample['image'].size}")

# %% [markdown]
# ## 4 · Format dataset for PaliGemma2

# %%
INSTRUCTION = "Transcribe this Lontara Bugis script to romanized Latin text:"

def to_conversation(sample):
    """Convert dataset row to Unsloth vision conversation format."""
    return {
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": sample["image"]},
                    {"type": "text",  "text":  INSTRUCTION},
                ],
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": sample["text"]},
                ],
            },
        ]
    }

train_ds = ds["train"].map(to_conversation, num_proc=2)
test_ds  = ds["test"].map(to_conversation,  num_proc=2)

print(f"Train: {len(train_ds):,}  |  Test: {len(test_ds):,}")

# %% [markdown]
# ## 5 · Training

# %%
from trl import SFTTrainer, SFTConfig
from unsloth.trainer import UnslothVisionDataCollator

USE_BF16 = torch.cuda.is_bf16_supported()

# Steps: ~500 for Round 1 (synthetic baseline), ~300 more for Round 2
MAX_STEPS = 500 if ROUND == 1 else 300

trainer = SFTTrainer(
    model          = model,
    tokenizer      = tokenizer,
    data_collator  = UnslothVisionDataCollator(model, tokenizer),
    train_dataset  = train_ds,
    args           = SFTConfig(
        per_device_train_batch_size  = 2,
        gradient_accumulation_steps  = 8,    # effective batch = 16
        warmup_steps                 = 20,
        max_steps                    = MAX_STEPS,
        learning_rate                = 2e-4,
        fp16                         = not USE_BF16,
        bf16                         = USE_BF16,
        logging_steps                = 25,
        optim                        = "adamw_8bit",
        weight_decay                 = 0.01,
        lr_scheduler_type            = "cosine",
        seed                         = 42,
        output_dir                   = f"outputs/round{ROUND}",
        report_to                    = "none",
        # Required for vision datasets
        remove_unused_columns        = False,
        dataset_text_field           = "",
        dataset_kwargs               = {"skip_prepare_dataset": True},
        max_seq_length               = 256,
        dataloader_num_workers       = 2,
    ),
)

# %%
print(f"Starting Round {ROUND} training — {MAX_STEPS} steps...")
trainer_stats = trainer.train()

print(f"\nTraining complete.")
print(f"  Total steps  : {trainer_stats.global_step}")
print(f"  Runtime      : {trainer_stats.metrics['train_runtime']:.0f}s")
print(f"  Final loss   : {trainer_stats.metrics['train_loss']:.4f}")

# %% [markdown]
# ## 6 · Evaluate — Character Error Rate (CER)

# %%
from jiwer import cer as compute_cer
import random

FastVisionModel.for_inference(model)

def predict(sample) -> str:
    """Run inference on one sample, return predicted romanization."""
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "image", "image": sample["image"]},
                {"type": "text",  "text":  INSTRUCTION},
            ],
        }
    ]
    input_text = tokenizer.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=False
    )
    inputs = tokenizer(
        sample["image"],
        input_text,
        add_special_tokens=False,
        return_tensors="pt",
    ).to("cuda")

    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens = 64,
            do_sample      = False,
        )
    decoded = tokenizer.decode(out[0], skip_special_tokens=True)
    # Strip the prompt from the output
    return decoded.split(INSTRUCTION)[-1].strip()

# %%
# Evaluate on 100 random test samples
N_EVAL   = min(100, len(ds["test"]))
indices  = random.sample(range(len(ds["test"])), N_EVAL)
samples  = [ds["test"][i] for i in indices]

references  = [s["text"] for s in samples]
predictions = [predict(s) for s in samples]

cer = compute_cer(references, predictions)
print(f"\n── Evaluation (n={N_EVAL}) ─────────────────")
print(f"  Character Error Rate : {cer:.3f}  ({cer*100:.1f}%)")
print(f"  Target for production: < 0.10  (10%)")

# Print 5 examples
print(f"\n── Sample predictions ──────────────────────")
for ref, pred in list(zip(references[:5], predictions[:5])):
    match = "✓" if ref == pred else "✗"
    print(f"  {match}  expected: {ref!r:20s}  got: {pred!r}")

# %% [markdown]
# ## 7 · Save checkpoint (LoRA only — fast)

# %%
checkpoint_path = f"outputs/round{ROUND}/checkpoint-final"
model.save_pretrained(checkpoint_path)
tokenizer.save_pretrained(checkpoint_path)
print(f"LoRA checkpoint saved → {checkpoint_path}")
print(f"(Use this path as CHECKPOINT in Round 2)")

# %% [markdown]
# ## 8 · Push merged model to HuggingFace

# %%
# Merge LoRA into base weights and push as a full model
# This is what the production API route will load
print(f"Pushing merged model → {MODEL_OUT} ...")

model.push_to_hub_merged(
    MODEL_OUT,
    tokenizer,
    save_method = "merged_16bit",   # full precision, ready for HF Inference
    token       = HF_TOKEN,
    private     = True,
)
print(f"\n✓ Model live at: https://huggingface.co/{MODEL_OUT}")
print(f"\nNext step: update src/app/api/ai/lontara-ocr/route.js")
print(f"  Stage 1: HF Inference API → {MODEL_OUT}")
print(f"  Stage 2: Gemini API (Gemma 4) for IPA + gloss")

# %% [markdown]
# ---
# ## Notes for Round 2
#
# 1. Download real manuscript crops from KITLV / British Library
# 2. Label them (romanized text) — see scripts/label_real_crops.py
# 3. Push as `aksarantara/lontara-ocr-real` to HuggingFace
# 4. Set `ROUND = 2` and `CHECKPOINT = "outputs/round1/checkpoint-final"`
# 5. Re-run this notebook — only 300 more steps needed
#
# Expected CER improvement:
#   Round 1 (synthetic only) : ~15–25% CER
#   Round 2 (+ real crops)   : ~5–12% CER
#   Round 2 + 500 real crops : < 5% CER  (production quality)
