"""Serves the interrogation question classifier on 127.0.0.1 for the game server.

POST /classify {"question": "..."} -> {"topic", "confidence", "probabilities"}
GET  /health

Usage: .venv-images/Scripts/python.exe -I scripts/question-classifier-server.py <repo> [port]
Set BLACKWOOD_CLASSIFIER_DEVICE=cpu to measure the speed a phone-like CPU would give.
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

repo = Path(sys.argv[1])
port = int(sys.argv[2]) if len(sys.argv) > 2 else 1237
sys.path.insert(0, str(repo / 'scripts'))
import question_classifier as qc  # noqa: E402

model, tokenizer, topics, device = qc.load(
    repo / 'models' / 'question-classifier', os.environ.get('BLACKWOOD_CLASSIFIER_DEVICE')
)


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, body):
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == '/health':
            self.reply(200, {'status': 'ok', 'device': device, 'topics': topics})
        else:
            self.reply(404, {'error': 'not found'})

    def do_POST(self):
        if self.path != '/classify':
            self.reply(404, {'error': 'not found'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length > 4000:
                raise ValueError('request too large')
            question = json.loads(self.rfile.read(length))['question']
            if not isinstance(question, str) or not question.strip():
                raise ValueError('question required')
            self.reply(200, qc.predict(model, tokenizer, topics, device, [question[:1000]])[0])
        except Exception as e:  # noqa: BLE001 - any bad request gets a 400
            self.reply(400, {'error': str(e)})

    def log_message(self, *args):
        pass


print(f'question classifier on http://127.0.0.1:{port} ({device})', flush=True)
HTTPServer(('127.0.0.1', port), Handler).serve_forever()
