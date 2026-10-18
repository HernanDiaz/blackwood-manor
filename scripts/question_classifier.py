"""Question-topic classifier for the interrogations: the Laya multilingual encoder
(mmBERT-base, Apache 2.0) with a linear head trained on our labelled questions.

Only the encoder weights of Laya are used; its own decision head and code are not loaded.
"""
import json
import random
from pathlib import Path

import torch
from safetensors import safe_open
from safetensors.torch import load_file, save_file
from transformers import ModernBertConfig, ModernBertModel, PreTrainedTokenizerFast

MAX_LENGTH = 64


def encoder_config(raw):
    return ModernBertConfig(
        vocab_size=raw['vocab_size'],
        hidden_size=raw['hidden_size'],
        intermediate_size=raw['intermediate_size'],
        num_hidden_layers=raw['num_hidden_layers'],
        num_attention_heads=raw['num_attention_heads'],
        global_attn_every_n_layers=raw['global_attn_every_n_layers'],
        local_attention=raw['local_attention'],
        max_position_embeddings=raw['max_position_embeddings'],
        pad_token_id=raw['pad_token_id'],
        bos_token_id=raw['bos_token_id'],
        eos_token_id=raw['eos_token_id'],
        cls_token_id=raw['cls_token_id'],
        sep_token_id=raw['sep_token_id'],
        # mmBERT uses the same rotary base for local and global layers.
        global_rope_theta=160000,
        local_rope_theta=160000,
    )


class Classifier(torch.nn.Module):
    def __init__(self, config, topics):
        super().__init__()
        self.encoder = ModernBertModel(config)
        self.dropout = torch.nn.Dropout(0.1)
        self.out = torch.nn.Linear(config.hidden_size, len(topics))

    def forward(self, ids, mask):
        hidden = self.encoder(input_ids=ids, attention_mask=mask).last_hidden_state
        pooled = (hidden * mask.unsqueeze(-1)).sum(1) / mask.sum(1, keepdim=True)
        return self.out(self.dropout(pooled))


def tokenizer_from(path, pad_id):
    tokenizer = PreTrainedTokenizerFast(tokenizer_file=str(path))
    tokenizer.pad_token_id = pad_id
    return tokenizer


def encode(tokenizer, texts):
    enc = tokenizer(texts, padding=True, truncation=True, max_length=MAX_LENGTH, return_tensors='pt')
    return enc['input_ids'], enc['attention_mask']


def train(laya_dir, examples, topics, seed=1, epochs=12, device=None):
    """examples: list of (question, topic). Returns (model, tokenizer, config_raw)."""
    laya_dir = Path(laya_dir)
    device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
    raw = json.loads((laya_dir / 'encoder' / 'config.json').read_text(encoding='utf-8'))
    tokenizer = tokenizer_from(laya_dir / 'tokenizer' / 'tokenizer.json', raw['pad_token_id'])
    random.seed(seed)
    torch.manual_seed(seed)
    model = Classifier(encoder_config(raw), topics)
    state = {}
    with safe_open(str(laya_dir / 'model.safetensors'), 'pt') as f:
        for key in f.keys():
            if key.startswith('encoder.'):
                state[key[len('encoder.'):]] = f.get_tensor(key).float()
    missing, unexpected = model.encoder.load_state_dict(state, strict=False)
    if missing or unexpected:
        raise RuntimeError(f'Laya encoder mismatch: missing {missing}, unexpected {unexpected}')
    model.to(device)
    optimizer = torch.optim.AdamW(
        [
            {'params': model.encoder.parameters(), 'lr': 3e-5},
            {'params': model.out.parameters(), 'lr': 1e-3},
        ],
        weight_decay=0.01,
    )
    data = [(q, topics.index(t)) for q, t in examples]
    model.train()
    for _ in range(epochs):
        random.shuffle(data)
        for i in range(0, len(data), 16):
            chunk = data[i:i + 16]
            ids, mask = encode(tokenizer, [q for q, _ in chunk])
            labels = torch.tensor([y for _, y in chunk], device=device)
            loss = torch.nn.functional.cross_entropy(model(ids.to(device), mask.to(device)), labels)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
    model.eval()
    return model, tokenizer, raw


def save(model, tokenizer_path, raw, topics, out_dir, meta):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    weights = {k: v.detach().to('cpu', torch.float16).contiguous() for k, v in model.state_dict().items()}
    save_file(weights, str(out_dir / 'model.safetensors'))
    (out_dir / 'tokenizer.json').write_bytes(Path(tokenizer_path).read_bytes())
    (out_dir / 'classifier.json').write_text(
        json.dumps({'topics': topics, 'encoder': raw, 'maxLength': MAX_LENGTH, **meta}, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )


def load(model_dir, device=None):
    model_dir = Path(model_dir)
    device = device or ('cuda' if torch.cuda.is_available() else 'cpu')
    info = json.loads((model_dir / 'classifier.json').read_text(encoding='utf-8'))
    model = Classifier(encoder_config(info['encoder']), info['topics'])
    weights = {k: v.float() for k, v in load_file(str(model_dir / 'model.safetensors')).items()}
    model.load_state_dict(weights)
    model.to(device).eval()
    tokenizer = tokenizer_from(model_dir / 'tokenizer.json', info['encoder']['pad_token_id'])
    return model, tokenizer, info['topics'], device


def predict(model, tokenizer, topics, device, questions):
    with torch.no_grad():
        ids, mask = encode(tokenizer, questions)
        probs = model(ids.to(device), mask.to(device)).softmax(-1).cpu()
    results = []
    for p in probs:
        k = int(p.argmax())
        results.append({
            'topic': topics[k],
            'confidence': round(float(p[k]), 4),
            'probabilities': {t: round(float(x), 4) for t, x in zip(topics, p)},
        })
    return results
