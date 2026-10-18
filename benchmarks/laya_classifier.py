"""Fine-tunes the Laya multilingual encoder (mmBERT-base) as a question-topic classifier.

Only the encoder weights of models/laya-multilingual/model.safetensors are used; Laya's own
decision head and code are not loaded. Reads the split written by
benchmarks/route-split.mjs and writes predictions for the test questions.

Usage: .venv-images/Scripts/python.exe -I benchmarks/laya_classifier.py <repo> <split.json> <out.json>
"""
import json
import random
import sys
import time
from pathlib import Path

import torch
from safetensors import safe_open
from transformers import ModernBertConfig, ModernBertModel, PreTrainedTokenizerFast

repo, split_path, out_path = (Path(a) for a in sys.argv[1:4])
model_dir = repo / 'models' / 'laya-multilingual'
split = json.loads(split_path.read_text(encoding='utf-8'))
topics = split['topics']
device = 'cuda' if torch.cuda.is_available() else 'cpu'

config_raw = json.loads((model_dir / 'encoder' / 'config.json').read_text(encoding='utf-8'))
config = ModernBertConfig(
    vocab_size=config_raw['vocab_size'],
    hidden_size=config_raw['hidden_size'],
    intermediate_size=config_raw['intermediate_size'],
    num_hidden_layers=config_raw['num_hidden_layers'],
    num_attention_heads=config_raw['num_attention_heads'],
    global_attn_every_n_layers=config_raw['global_attn_every_n_layers'],
    local_attention=config_raw['local_attention'],
    max_position_embeddings=config_raw['max_position_embeddings'],
    pad_token_id=config_raw['pad_token_id'],
    bos_token_id=config_raw['bos_token_id'],
    eos_token_id=config_raw['eos_token_id'],
    cls_token_id=config_raw['cls_token_id'],
    sep_token_id=config_raw['sep_token_id'],
    # mmBERT uses the same rotary base for local and global layers.
    global_rope_theta=160000,
    local_rope_theta=160000,
)
tokenizer = PreTrainedTokenizerFast(tokenizer_file=str(model_dir / 'tokenizer' / 'tokenizer.json'))
tokenizer.pad_token_id = config_raw['pad_token_id']


def load_encoder():
    encoder = ModernBertModel(config)
    state = {}
    with safe_open(str(model_dir / 'model.safetensors'), 'pt') as f:
        for key in f.keys():
            if key.startswith('encoder.'):
                state[key[len('encoder.'):]] = f.get_tensor(key).float()
    missing, unexpected = encoder.load_state_dict(state, strict=False)
    return encoder, missing, unexpected


class Classifier(torch.nn.Module):
    def __init__(self, encoder):
        super().__init__()
        self.encoder = encoder
        self.dropout = torch.nn.Dropout(0.1)
        self.out = torch.nn.Linear(config.hidden_size, len(topics))

    def forward(self, ids, mask):
        hidden = self.encoder(input_ids=ids, attention_mask=mask).last_hidden_state
        pooled = (hidden * mask.unsqueeze(-1)).sum(1) / mask.sum(1, keepdim=True)
        return self.out(self.dropout(pooled))


def batch(texts):
    enc = tokenizer(texts, padding=True, truncation=True, max_length=64, return_tensors='pt')
    return enc['input_ids'], enc['attention_mask']


def run(seed):
    random.seed(seed)
    torch.manual_seed(seed)
    encoder, missing, unexpected = load_encoder()
    model = Classifier(encoder).to(device)
    optimizer = torch.optim.AdamW(
        [
            {'params': model.encoder.parameters(), 'lr': 3e-5},
            {'params': model.out.parameters(), 'lr': 1e-3},
        ],
        weight_decay=0.01,
    )
    train = [(q['question'], topics.index(q['topic'])) for q in split['train']]
    model.train()
    for epoch in range(12):
        random.shuffle(train)
        for i in range(0, len(train), 16):
            chunk = train[i:i + 16]
            ids, mask = batch([t for t, _ in chunk])
            labels = torch.tensor([y for _, y in chunk], device=device)
            loss = torch.nn.functional.cross_entropy(model(ids.to(device), mask.to(device)), labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
    model.eval()
    predictions = []
    with torch.no_grad():
        tests = [q['question'] for q in split['test']]
        for i in range(0, len(tests), 32):
            ids, mask = batch(tests[i:i + 32])
            probs = model(ids.to(device), mask.to(device)).softmax(-1).cpu()
            for p in probs:
                k = int(p.argmax())
                predictions.append({'topic': topics[k], 'confidence': float(p[k])})
    return model, predictions, missing, unexpected


results = []
model = None
for seed in (1, 2, 3):
    model, predictions, missing, unexpected = run(seed)
    correct = sum(p['topic'] == q['topic'] for p, q in zip(predictions, split['test']))
    results.append({'seed': seed, 'correct': correct, 'predictions': predictions})
    print(f'seed {seed}: {correct}/{len(predictions)}', flush=True)

# Latency on CPU, one question at a time, as a rough stand-in for a phone.
model = model.to('cpu').eval()
sample = [q['question'] for q in split['test'][:40]]
with torch.no_grad():
    ids, mask = batch(sample[:1])
    model(ids, mask)
    started = time.perf_counter()
    for text in sample:
        ids, mask = batch([text])
        model(ids, mask)
    cpu_ms = (time.perf_counter() - started) * 1000 / len(sample)

out_path.write_text(
    json.dumps(
        {
            'model': 'laya-multilingual encoder (mmBERT-base) + linear head, full fine-tune',
            'missingKeys': missing,
            'unexpectedKeys': unexpected,
            'parameters': sum(p.numel() for p in model.parameters()),
            'cpuMillisecondsPerQuestion': round(cpu_ms, 1),
            'runs': results,
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding='utf-8',
)
print(f'cpu {cpu_ms:.1f} ms/question; missing keys {len(missing)}, unexpected {len(unexpected)}')
