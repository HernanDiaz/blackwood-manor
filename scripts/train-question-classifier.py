"""Trains the interrogation question classifier and saves it to models/question-classifier/.

Training data: the training split of the question bank plus the extra hand-written batches,
written by benchmarks/route-split.mjs with --extra. The test split is evaluated, never trained on.

Usage:
  node benchmarks/route-split.mjs benchmarks/results/question-split-extra.json --extra
  .venv-images/Scripts/python.exe -I scripts/train-question-classifier.py <repo> benchmarks/results/question-split-extra.json
"""
import json
import sys
from pathlib import Path

repo = Path(sys.argv[1])
sys.path.insert(0, str(repo / 'scripts'))
import question_classifier as qc  # noqa: E402

split = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
topics = split['topics']
laya = repo / 'models' / 'laya-multilingual'
model, tokenizer, raw = qc.train(laya, [(q['question'], q['topic']) for q in split['train']], topics, seed=1)
predictions = qc.predict(model, tokenizer, topics, next(model.parameters()).device, [q['question'] for q in split['test']])
correct = sum(p['topic'] == q['topic'] for p, q in zip(predictions, split['test']))
print(f'test: {correct}/{len(predictions)}')
qc.save(
    model,
    laya / 'tokenizer' / 'tokenizer.json',
    raw,
    topics,
    repo / 'models' / 'question-classifier',
    {
        'base': 'convaiinnovations/laya multilingual encoder (mmBERT-base), Apache 2.0',
        'trainingQuestions': len(split['train']),
        'testCorrect': correct,
        'testQuestions': len(predictions),
    },
)
print('saved to models/question-classifier')
