// Client of the learned question classifier (scripts/question-classifier-server.py).
// Returns { topic, confidence } or null when the service is not running or fails, so the
// interrogation falls back to the offline rules.
import { topics } from './case-file.mjs';

export const CLASSIFIER_URL = 'http://127.0.0.1:1237/classify';
// Below this confidence the offline rules decide; measured on the test questions.
export const CLASSIFIER_THRESHOLD = 0.6;

export async function classifyWithLaya(question, { url = CLASSIFIER_URL, timeout = 1500 } = {}) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) return null;
    const result = await response.json();
    return topics.includes(result.topic) && typeof result.confidence === 'number'
      ? { topic: result.topic, confidence: result.confidence }
      : null;
  } catch {
    return null;
  }
}
