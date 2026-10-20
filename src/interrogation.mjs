// Answering a question without any model: the offline rules and the statistical router
// (question-router.mjs) decide the topic, and the reply is one of the person's authored
// wordings. It runs the same in the browser (the game on a phone) and on the server, which
// can add the neural classifier or the local model for what this cannot place
// (see prototype-llm.mjs).
import { predictLogistic } from './question-router.mjs';
import { CLASSIFIER_THRESHOLD } from './question-classifier.mjs';
import {
  prototypeFacts,
  prototypeOptions,
  prototypeReply,
  inferPrototypeTopic,
} from './prototype-engine.mjs';

// Below this confidence of the statistical router, the offline rules decide.
export const ROUTER_THRESHOLD = 0.5;
const norm = s => s.toLocaleLowerCase('es').normalize('NFD').replace(/[̀-ͯ]/g, '');
// Rules applied after the router, and the replies of the interrogation, in each language.
const local = {
  es: {
    invalid: 'Interrogatorio no disponible o pregunta inválida',
    social:
      /^(hola|buenas|buenos dias|buenas tardes|buenas noches)|como (te|se) sient|estas (nervios|preocup|tranquil)|tienes miedo/,
    identity:
      /como te llamas|quien eres|a que te dedicas|cual es tu trabajo|hablame de ti|como eres/,
    accusation: /mataste|asesinaste|fuiste tu|(?:admites|confiesa).*\b(?:crimen|asesinato)\b/,
    followUp: /^(por que|que quieres decir|explicate|cuentame mas|como es eso)/,
    name: actor => 'Me llamo ' + actor.name + '. Soy ' + actor.role + '.',
    accusationReply:
      'Una acusación necesita pruebas. Pregunta por mi coartada o por una prueba concreta y contrástalas.',
  },
  en: {
    invalid: 'The interrogation is not available or the question is not valid',
    social:
      /^(hi|hello|hey|good (morning|afternoon|evening))|how (are|do) you (feel|doing)|are you (nervous|worried|calm|ok|okay)|are you (scared|afraid)/,
    identity:
      /what('?s| is) your name|who are you|what do you do|what('?s| is) your job|tell me about yourself|what are you like/,
    accusation:
      /did you (kill|murder)|you killed|you murdered|was it you|(admit|confess).*\b(crime|murder|killing)\b/,
    followUp: /^(why|what do you mean|explain|tell me more|how so|meaning)/,
    name: actor => 'My name is ' + actor.name + ". I'm the " + actor.role + '.',
    accusationReply:
      'An accusation needs evidence. Ask me about my alibi or about a specific piece of evidence, and compare them.',
  },
};
const say = c => local[c.lang] || local.es;

export function validQuestion(c, state, person, question) {
  if (
    state.result ||
    !c.people.some(p => p.id === person) ||
    typeof question !== 'string' ||
    !question.trim() ||
    question.length > 1000
  )
    throw Error(say(c).invalid);
}
// The topic of a question, or null when nothing can place it.
// learned: { topic, confidence } from the neural classifier, when there is one.
export function routeQuestion(c, state, person, question, { learned = null, questionRouter } = {}) {
  const ids = prototypeFacts(c, state, person).map(f => f.id),
    q = norm(question);
  let topic = inferPrototypeTopic(question, c),
    router = topic === null ? 'none' : 'rules';
  if (learned && learned.confidence >= CLASSIFIER_THRESHOLD) {
    topic = learned.topic;
    router = 'classifier';
  } else if (questionRouter) {
    const routed = predictLogistic(questionRouter, question);
    if (routed.confidence >= ROUTER_THRESHOLD) {
      topic = routed.topic;
      router = 'statistical';
    }
  }
  // Evidence the person cannot discuss yet is answered like an unknown question.
  if (topic !== null && ![...ids, 'identity', 'social', 'unknown'].includes(topic))
    topic = 'unknown';
  const rules = say(c);
  if (topic === null && rules.social.test(q)) topic = 'social';
  else if ((topic === null || topic === 'motive') && rules.identity.test(q)) topic = 'identity';
  const accusation = (topic === null || topic === 'unknown') && rules.accusation.test(q);
  const history = state.chat
    .filter(m => m.person === person)
    .slice(-3)
    .map(m => ({ question: m.question.slice(0, 400), topic: m.topic }));
  // "¿Por qué?" continues the previous topic.
  if (topic === null && rules.followUp.test(q)) {
    const last = history.at(-1)?.topic;
    if ([...ids, 'identity', 'social'].includes(last)) topic = last;
  }
  return { topic: accusation ? 'unknown' : topic, router, accusation, ids, history };
}
// The reply for a topic: one of the person's wordings, rotating.
export function replyFor(c, state, person, topic) {
  const actor = c.people.find(p => p.id === person);
  if (topic === 'identity' && !prototypeOptions(c, state, person, topic).length)
    return say(c).name(actor);
  return prototypeReply(c, state, person, topic);
}
export const accusationReply = local.es.accusationReply;
export const accusationReplyFor = c => say(c).accusationReply;
// The whole answer without any model.
export function answerOffline(c, state, person, question, { learned, questionRouter } = {}) {
  validQuestion(c, state, person, question);
  const route = routeQuestion(c, state, person, question, { learned, questionRouter }),
    topic = route.topic ?? 'unknown';
  return {
    answer: route.accusation ? accusationReplyFor(c) : replyFor(c, state, person, topic),
    topic,
    router: route.router,
    // The topic was a guess: a server with a model could place the question better.
    unplaced: route.topic === null,
    mode: 'prototype-choice',
  };
}
