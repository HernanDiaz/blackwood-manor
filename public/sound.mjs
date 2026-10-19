// Sound of the worlds, made in the browser with Web Audio: no audio files, works offline.
// Ambiences follow the world's background effect; short effects mark what the player does.
// Nothing sounds until the player turns the sound on (browsers also require a gesture).
let ctx = null,
  master = null,
  noiseBuffer = null,
  enabled = false,
  wanted = null,
  playing = null;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
const noise = () => {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer;
  s.loop = true;
  return s;
};
const filter = (type, frequency, Q = 0.7) => {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = Q;
  return f;
};
const gain = value => {
  const g = ctx.createGain();
  g.gain.value = value;
  return g;
};
// A slow oscillation added to an audio parameter.
function lfo(param, rate, depth) {
  const o = ctx.createOscillator(),
    g = gain(depth);
  o.frequency.value = rate;
  o.connect(g).connect(param);
  o.start();
  return o;
}
const chain = (...nodes) => nodes.reduce((a, b) => (a.connect(b), b));

// Each ambience returns the nodes to stop and the timers to clear.
const ambiences = {
  // Rain on the windows and a wall clock: a soft, muffled wash that comes and goes, drops
  // tapping the glass now and then, and the clock far away.
  rain() {
    const out = gain(0),
      n = noise(),
      wash = gain(0.06);
    chain(n, filter('highpass', 300), filter('lowpass', 1800), wash, out);
    const l = lfo(wash.gain, 0.06, 0.02);
    const patter = setInterval(() => drops(out, 4), 250);
    const tick = setInterval(() => click(0.012, 3000), 1000);
    return { out, sources: [n, l], timers: [patter, tick] };
  },
  // Ventilation and the hum of the machines.
  stars() {
    const out = gain(0),
      n = noise(),
      hum = [55, 110.4].map(f => {
        const o = ctx.createOscillator();
        o.frequency.value = f;
        chain(o, gain(0.035), out);
        o.start();
        return o;
      });
    const g = gain(0.05);
    chain(n, filter('lowpass', 420), g, out);
    const l = lfo(g.gain, 0.08, 0.02);
    return { out, sources: [n, ...hum, l], timers: [] };
  },
  // Wind between the battlements.
  snow() {
    const out = gain(0),
      n = noise(),
      f = filter('bandpass', 500, 1.4),
      g = gain(0.06);
    chain(n, f, g, out);
    const l1 = lfo(f.frequency, 0.07, 250),
      l2 = lfo(g.gain, 0.05, 0.035);
    return { out, sources: [n, l1, l2], timers: [] };
  },
  // The sea against the cliff, rain and far thunder.
  storm() {
    const out = gain(0),
      sea = noise(),
      rain = noise(),
      waves = gain(0.07);
    chain(sea, filter('lowpass', 400), waves, out);
    chain(rain, filter('highpass', 300), filter('lowpass', 1600), gain(0.04), out);
    const l = lfo(waves.gain, 0.09, 0.05);
    const patter = setInterval(() => drops(out, 5), 250);
    const thunder = setInterval(() => Math.random() < 0.3 && rumble(out), 6000);
    return { out, sources: [sea, rain, l], timers: [patter, thunder] };
  },
  // A soft chord of the court, slowly breathing.
  dust() {
    const out = gain(0),
      voices = [146.8, 220, 293.7, 370].map((f, i) => {
        const o = ctx.createOscillator(),
          g = gain(0.018);
        o.type = 'sine';
        o.frequency.value = f;
        chain(o, g, out);
        o.start();
        return [o, lfo(g.gain, 0.04 + i * 0.013, 0.012)];
      });
    return { out, sources: voices.flat(), timers: [] };
  },
};
function rumble(destination) {
  const n = noise(),
    g = gain(0),
    t = ctx.currentTime;
  chain(n, filter('lowpass', 140), g, destination);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
  n.start(t);
  n.stop(t + 3.6);
}
// A few raindrops on the glass during the next quarter of a second: tiny taps, each with its
// own pitch and loudness, so the rain never repeats.
function drops(destination, most) {
  const t0 = ctx.currentTime;
  for (let i = Math.floor(Math.random() * (most + 1)); i > 0; i--) {
    const n = noise(),
      g = gain(0),
      t = t0 + Math.random() * 0.25;
    chain(n, filter('bandpass', 1800 + Math.random() * 3000, 4), g, destination);
    g.gain.setValueAtTime(0.01 + Math.random() * 0.025, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025 + Math.random() * 0.03);
    n.start(t, Math.random());
    n.stop(t + 0.07);
  }
}
function click(level, frequency) {
  const n = noise(),
    g = gain(0),
    t = ctx.currentTime;
  chain(n, filter('highpass', frequency), g, master);
  g.gain.setValueAtTime(level, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  n.start(t);
  n.stop(t + 0.04);
}
function startAmbience() {
  stopAmbience();
  if (!enabled || !wanted || !ambiences[wanted]) return;
  audio();
  playing = ambiences[wanted]();
  // Oscillators are already running; the noise sources start here.
  playing.sources.forEach(tryStart);
  playing.out.connect(master);
  playing.out.gain.linearRampToValueAtTime(1, ctx.currentTime + 2);
}
function tryStart(s) {
  try {
    s.start();
  } catch {}
}
function stopAmbience() {
  if (!playing) return;
  const old = playing,
    t = ctx.currentTime;
  playing = null;
  old.timers.forEach(clearInterval);
  old.out.gain.cancelScheduledValues(t);
  old.out.gain.setValueAtTime(old.out.gain.value, t);
  old.out.gain.linearRampToValueAtTime(0, t + 0.8);
  setTimeout(() => {
    old.sources.forEach(s => {
      try {
        s.stop();
      } catch {}
    });
    old.out.disconnect();
  }, 1000);
}

// Short effects.
const effects = {
  // A sheet of paper.
  paper() {
    const n = noise(),
      g = gain(0),
      t = ctx.currentTime;
    chain(n, filter('bandpass', 2800, 0.9), g, master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.start(t);
    n.stop(t + 0.2);
  },
  // Two footsteps.
  steps() {
    [0, 0.28].forEach(d => {
      const o = ctx.createOscillator(),
        g = gain(0),
        t = ctx.currentTime + d;
      o.frequency.setValueAtTime(95, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
      chain(o, g, master);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.start(t);
      o.stop(t + 0.12);
    });
  },
  // A bell, for a solved case.
  bell() {
    [523.3, 1046.5, 1568, 2093].forEach((f, i) => {
      const o = ctx.createOscillator(),
        g = gain(0),
        t = ctx.currentTime;
      o.frequency.value = f;
      chain(o, g, master);
      g.gain.setValueAtTime(0.18 / (i + 1), t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 3 - i * 0.5);
      o.start(t);
      o.stop(t + 3);
    });
  },
  // A soft chime, for a hint.
  chime() {
    [880, 1318.5].forEach((f, i) => {
      const o = ctx.createOscillator(),
        g = gain(0),
        t = ctx.currentTime + i * 0.12;
      o.frequency.value = f;
      chain(o, g, master);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.8);
      o.start(t);
      o.stop(t + 0.9);
    });
  },
};

export function setSound(on) {
  enabled = on;
  if (on) startAmbience();
  else stopAmbience();
}
// The ambience of a world, named after its background effect.
export function setAmbience(kind) {
  if (kind === wanted) return;
  wanted = kind || null;
  if (enabled) startAmbience();
}
export function play(name) {
  if (!enabled || !effects[name]) return;
  audio();
  effects[name]();
}
// Browsers only let sound start after a gesture: the first touch or click resumes it.
addEventListener(
  'pointerdown',
  () => {
    if (enabled && !playing) startAmbience();
    else if (ctx?.state === 'suspended') ctx.resume();
  },
  { capture: true },
);
