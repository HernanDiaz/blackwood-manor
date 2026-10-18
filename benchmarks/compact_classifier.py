"""Shrinks the question classifier for phones: keeps only frequent Latin-script vocabulary
(Spanish and English) and quantizes to int8, then measures what is lost.

BPE merges are ordered by frequency, so keeping the first N Latin merges keeps the common
pieces. Removed pieces are never produced: their merges are dropped, so rare words split into
smaller kept pieces (and bytes as a last resort). Accuracy is measured on the test questions and
agreement with the full model on every bank question.

Usage: .venv-images/Scripts/python.exe -I benchmarks/compact_classifier.py <repo> <split.json> <out.json>
"""
import json
import re
import sys
import tempfile
import time
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
repo, split_path, out_path = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
sys.path.insert(0, str(repo / 'scripts'))
import torch  # noqa: E402
from transformers import PreTrainedTokenizerFast  # noqa: E402

import question_classifier as qc  # noqa: E402

model_dir = repo / 'models' / 'question-classifier'
split = json.loads(split_path.read_text(encoding='utf-8'))
questions = [q['question'] for q in split['test']] + [q['question'] for q in split['train']]
labels = [q['topic'] for q in split['test']]
tok_json = json.loads((model_dir / 'tokenizer.json').read_text(encoding='utf-8'))
vocab = tok_json['model']['vocab']
merges = [m.split(' ') if isinstance(m, str) else m for m in tok_json['model']['merges']]
special = {a['content'] for a in tok_json['added_tokens']}
latin = re.compile(r"^[▁ -~ -ÿ‐-‧€]+$")

# Rank of a piece = position of the first merge that produces it (lower = more frequent).
rank = {}
for i, (a, b) in enumerate(merges):
    piece = a + b
    if piece in vocab and piece not in rank:
        rank[piece] = i
base = [t for t in vocab if t not in rank]
latin_merged = sorted((t for t in rank if latin.match(t)), key=rank.get)
print(f'vocabulario {len(vocab)}: base {len(base)}, por fusión {len(rank)}, latinas por fusión {len(latin_merged)}')

model, tokenizer, topics, _ = qc.load(model_dir, 'cpu')
embedding = model.encoder.embeddings.tok_embeddings


def run(tok, mapping, mdl):
    out = []
    with torch.no_grad():
        for i in range(0, len(questions), 64):
            enc = tok(questions[i:i + 64], padding=True, truncation=True, max_length=qc.MAX_LENGTH, return_tensors='pt')
            ids = enc['input_ids'] if mapping is None else mapping[enc['input_ids']]
            out += mdl(ids, enc['attention_mask']).argmax(-1).tolist()
    return [topics[k] for k in out]


reference = run(tokenizer, None, model)
full_correct = sum(p == t for p, t in zip(reference, labels))
print(f'modelo completo: {full_correct}/{len(labels)} en prueba')
results = {'fullTestCorrect': full_correct, 'variants': []}


def compact(n):
    keep = {t for t in base if latin.match(t) or t in special or t.startswith('<0x')}
    keep |= set(latin_merged[:n]) | special
    pruned = json.loads(json.dumps(tok_json))
    pruned['model']['vocab'] = {t: i for t, i in vocab.items() if t in keep}
    pruned['model']['merges'] = [m for m in tok_json['model']['merges']
                                 if all(p in keep for p in (m.split(' ') if isinstance(m, str) else m))
                                 and ''.join(m.split(' ') if isinstance(m, str) else m) in keep]
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f:
        json.dump(pruned, f, ensure_ascii=False)
        path = f.name
    tok = PreTrainedTokenizerFast(tokenizer_file=path)
    tok.pad_token_id = tokenizer.pad_token_id
    old_ids = sorted(vocab[t] for t in keep)
    mapping = torch.zeros(len(vocab), dtype=torch.long)
    mapping[torch.tensor(old_ids)] = torch.arange(len(old_ids))
    return tok, mapping, old_ids, Path(path).stat().st_size


for n in (8000, 16000, 32000, 64000, len(latin_merged)):
    tok, mapping, old_ids, tok_bytes = compact(n)
    original = embedding.weight.data
    embedding.weight.data = original[torch.tensor(old_ids)]
    predictions = run(tok, mapping, model)
    embedding.weight.data = original
    params = sum(p.numel() for p in model.parameters()) - original.shape[0] * original.shape[1] + len(old_ids) * original.shape[1]
    row = {
        'mergedLatinKept': n,
        'vocabulary': len(old_ids),
        'parameters': params,
        'fp16MB': round(params * 2 / 1e6, 1),
        'int8MB': round(params / 1e6, 1),
        'tokenizerMB': round(tok_bytes / 1e6, 1),
        'testCorrect': sum(p == t for p, t in zip(predictions[:len(labels)], labels)),
        'agreementWithFull': round(sum(a == b for a, b in zip(predictions, reference)) / len(reference), 4),
    }
    results['variants'].append(row)
    print(row)

# int8: dynamic quantization of the linear layers plus per-row int8 embeddings, on the
# 32k variant, to check accuracy and CPU speed after quantization.
tok, mapping, old_ids, _ = compact(32000)
small = qc.Classifier(model.encoder.config, topics)
small.load_state_dict(model.state_dict())
emb = small.encoder.embeddings.tok_embeddings
rows = emb.weight.data[torch.tensor(old_ids)]
scale = rows.abs().amax(1, keepdim=True).clamp(min=1e-8) / 127
emb.weight.data = (rows / scale).round().clamp(-127, 127) * scale
emb.num_embeddings = rows.shape[0]
small = torch.ao.quantization.quantize_dynamic(small.eval(), {torch.nn.Linear}, dtype=torch.qint8)
predictions = run(tok, mapping, small)
with torch.no_grad():
    enc = tok(questions[:1], return_tensors='pt')
    small(mapping[enc['input_ids']], enc['attention_mask'])
    started = time.perf_counter()
    for q in questions[:60]:
        enc = tok([q], return_tensors='pt')
        small(mapping[enc['input_ids']], enc['attention_mask'])
    ms = (time.perf_counter() - started) * 1000 / 60
int8 = {
    'variant': 'vocabulario 32k latino + int8',
    'testCorrect': sum(p == t for p, t in zip(predictions[:len(labels)], labels)),
    'agreementWithFull': round(sum(a == b for a, b in zip(predictions, reference)) / len(reference), 4),
    'cpuMillisecondsPerQuestion': round(ms, 1),
}
results['int8'] = int8
print(int8)
out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
