"""Fine-tunes the Laya encoder with a pruned Latin vocabulary from the start, so the model
learns the new word segmentation, then measures accuracy before and after int8 quantization.

Usage: .venv-images/Scripts/python.exe -I benchmarks/compact_retrain.py <repo> <split.json> <out.json>
"""
import json
import random
import re
import sys
import tempfile
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
repo, split_path, out_path = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
sys.path.insert(0, str(repo / 'scripts'))
import torch  # noqa: E402
from safetensors import safe_open  # noqa: E402
from transformers import PreTrainedTokenizerFast  # noqa: E402

import question_classifier as qc  # noqa: E402

laya = repo / 'models' / 'laya-multilingual'
split = json.loads(split_path.read_text(encoding='utf-8'))
topics = split['topics']
raw = json.loads((laya / 'encoder' / 'config.json').read_text(encoding='utf-8'))
tok_json = json.loads((laya / 'tokenizer' / 'tokenizer.json').read_text(encoding='utf-8'))
vocab = tok_json['model']['vocab']
pairs = [m.split(' ') if isinstance(m, str) else m for m in tok_json['model']['merges']]
special = {a['content'] for a in tok_json['added_tokens']}
latin = re.compile(r"^[▁ -~ -ÿ‐-‧€]+$")
rank = {}
for i, (a, b) in enumerate(pairs):
    if a + b in vocab and a + b not in rank:
        rank[a + b] = i
base = [t for t in vocab if t not in rank]
latin_merged = sorted((t for t in rank if latin.match(t)), key=rank.get)
device = 'cuda' if torch.cuda.is_available() else 'cpu'
with safe_open(str(laya / 'model.safetensors'), 'pt') as f:
    encoder_state = {k[len('encoder.'):]: f.get_tensor(k).float() for k in f.keys() if k.startswith('encoder.')}


def pruned(n):
    keep = {t for t in base if latin.match(t) or t in special or t.startswith('<0x')} | set(latin_merged[:n]) | special
    data = json.loads(json.dumps(tok_json))
    data['model']['vocab'] = {t: i for t, i in vocab.items() if t in keep}
    data['model']['merges'] = [m for m, p in zip(tok_json['model']['merges'], pairs) if all(x in keep for x in p) and ''.join(p) in keep]
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False)
    tok = PreTrainedTokenizerFast(tokenizer_file=fh.name)
    tok.pad_token_id = raw['pad_token_id']
    old_ids = sorted(vocab[t] for t in keep)
    mapping = torch.zeros(len(vocab), dtype=torch.long)
    mapping[torch.tensor(old_ids)] = torch.arange(len(old_ids))
    return tok, mapping, old_ids


def encode(tok, mapping, texts):
    enc = tok(texts, padding=True, truncation=True, max_length=qc.MAX_LENGTH, return_tensors='pt')
    return mapping[enc['input_ids']], enc['attention_mask']


def evaluate(model, tok, mapping, dev):
    model.eval()
    correct = 0
    with torch.no_grad():
        for i in range(0, len(split['test']), 64):
            chunk = split['test'][i:i + 64]
            ids, mask = encode(tok, mapping, [q['question'] for q in chunk])
            pred = model(ids.to(dev), mask.to(dev)).argmax(-1).tolist()
            correct += sum(topics[k] == q['topic'] for k, q in zip(pred, chunk))
    return correct


results = []
for n in (16000, 32000):
    tok, mapping, old_ids = pruned(n)
    for seed in (1, 2):
        random.seed(seed)
        torch.manual_seed(seed)
        config = qc.encoder_config({**raw, 'vocab_size': len(old_ids)})
        model = qc.Classifier(config, topics)
        state = dict(encoder_state)
        state['embeddings.tok_embeddings.weight'] = encoder_state['embeddings.tok_embeddings.weight'][torch.tensor(old_ids)]
        model.encoder.load_state_dict(state, strict=False)
        model.to(device)
        opt = torch.optim.AdamW([{'params': model.encoder.parameters(), 'lr': 3e-5}, {'params': model.out.parameters(), 'lr': 1e-3}], weight_decay=0.01)
        data = [(q['question'], topics.index(q['topic'])) for q in split['train']]
        model.train()
        for _ in range(12):
            random.shuffle(data)
            for i in range(0, len(data), 16):
                chunk = data[i:i + 16]
                ids, mask = encode(tok, mapping, [q for q, _ in chunk])
                loss = torch.nn.functional.cross_entropy(model(ids.to(device), mask.to(device)), torch.tensor([y for _, y in chunk], device=device))
                opt.zero_grad()
                loss.backward()
                opt.step()
        fp = evaluate(model, tok, mapping, device)
        cpu = model.to('cpu').eval()
        q8 = torch.ao.quantization.quantize_dynamic(cpu, {torch.nn.Linear}, dtype=torch.qint8)
        emb = q8.encoder.embeddings.tok_embeddings
        w = emb.weight.data
        scale = w.abs().amax(1, keepdim=True).clamp(min=1e-8) / 127
        emb.weight.data = (w / scale).round().clamp(-127, 127) * scale
        int8 = evaluate(q8, tok, mapping, 'cpu')
        with torch.no_grad():
            started = time.perf_counter()
            for q in split['test'][:40]:
                ids, mask = encode(tok, mapping, [q['question']])
                q8(ids, mask)
            ms = (time.perf_counter() - started) * 1000 / 40
        params = sum(p.numel() for p in cpu.parameters())
        row = {'vocabulary': len(old_ids), 'seed': seed, 'fp16Correct': fp, 'int8Correct': int8,
               'int8MB': round(params / 1e6, 1), 'cpuMsInt8': round(ms, 1)}
        results.append(row)
        print(row, flush=True)
out_path.write_text(json.dumps(results, indent=2), encoding='utf-8')
