// Background effects of the worlds: rain, snow, stars, golden dust and a storm with lightning.
// A canvas behind the page, few particles, about 30 frames per second, paused while the tab is
// hidden, and still (or nothing) when the system asks for reduced motion.
const calm = matchMedia('(prefers-reduced-motion: reduce)');
let canvas,
  ctx,
  current = null,
  particles = [],
  frame = 0,
  last = 0,
  flash = 0;

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'world-effect';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  ctx = canvas.getContext('2d');
  addEventListener('resize', size);
  document.addEventListener('visibilitychange', () => (document.hidden ? stopLoop() : startLoop()));
  size();
}
function size() {
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * ratio;
  canvas.height = innerHeight * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (current) seed(current);
}
const rand = (a, b) => a + Math.random() * (b - a);
// Fewer particles on small screens.
const count = n => Math.round(n * Math.min(1, (innerWidth * innerHeight) / (1280 * 800)) + n / 3);

function seed(kind) {
  const W = innerWidth,
    H = innerHeight;
  const make = {
    rain: () => ({ x: rand(0, W), y: rand(0, H), l: rand(10, 22), v: rand(9, 15) }),
    storm: () => ({ x: rand(0, W), y: rand(0, H), l: rand(14, 28), v: rand(13, 20) }),
    snow: () => ({ x: rand(0, W), y: rand(0, H), r: rand(1, 2.6), v: rand(0.3, 1), d: rand(0, 6) }),
    stars: () => ({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.4, 1.5),
      p: rand(0, 6),
      v: rand(0.02, 0.08),
    }),
    dust: () => ({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.8, 2.2),
      v: rand(0.1, 0.35),
      p: rand(0, 6),
    }),
  }[kind];
  const n = { rain: 120, storm: 160, snow: 90, stars: 110, dust: 50 }[kind];
  particles = Array.from({ length: count(n) }, make);
}
function draw() {
  const W = innerWidth,
    H = innerHeight;
  ctx.clearRect(0, 0, W, H);
  if (current === 'rain' || current === 'storm') {
    ctx.strokeStyle = current === 'storm' ? 'rgba(190,210,225,.22)' : 'rgba(180,200,215,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const p of particles) {
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.l * 0.25, p.y + p.l);
      p.y += p.v;
      p.x -= p.v * 0.25;
      if (p.y > H) {
        p.y = -p.l;
        p.x = rand(0, W + 60);
      }
    }
    ctx.stroke();
    // Now and then, lightning: the whole sky whitens for a moment.
    if (current === 'storm') {
      if (flash <= 0 && Math.random() < 0.002) flash = 1;
      if (flash > 0) {
        ctx.fillStyle = `rgba(220,230,255,${0.18 * flash})`;
        ctx.fillRect(0, 0, W, H);
        flash -= 0.08;
      }
    }
  } else if (current === 'snow') {
    ctx.fillStyle = 'rgba(235,240,245,.55)';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.3);
      ctx.fill();
      p.d += 0.01;
      p.y += p.v;
      p.x += Math.sin(p.d) * 0.4;
      if (p.y > H + 4) {
        p.y = -4;
        p.x = rand(0, W);
      }
    }
  } else if (current === 'stars') {
    for (const p of particles) {
      p.p += p.v;
      ctx.fillStyle = `rgba(210,235,240,${0.25 + 0.35 * (0.5 + Math.sin(p.p) / 2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.3);
      ctx.fill();
      // The station turns: the stars drift slowly.
      p.x -= 0.05;
      if (p.x < -2) p.x = W + 2;
    }
  } else if (current === 'dust') {
    for (const p of particles) {
      p.p += 0.02;
      ctx.fillStyle = `rgba(240,200,120,${0.2 + 0.25 * (0.5 + Math.sin(p.p) / 2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.3);
      ctx.fill();
      p.y -= p.v;
      p.x += Math.sin(p.p) * 0.2;
      if (p.y < -4) {
        p.y = H + 4;
        p.x = rand(0, W);
      }
    }
  }
}
function loop(t) {
  frame = requestAnimationFrame(loop);
  if (t - last < 33) return;
  last = t;
  draw();
}
function startLoop() {
  if (!current || frame || document.hidden) return;
  if (calm.matches) {
    // Reduced motion: one still frame of the effect, without lightning.
    draw();
    return;
  }
  frame = requestAnimationFrame(loop);
}
function stopLoop() {
  cancelAnimationFrame(frame);
  frame = 0;
}
// Shows an effect (rain, snow, stars, dust, storm) or none.
export function setEffect(kind) {
  if (kind === current) return;
  ensureCanvas();
  stopLoop();
  current = kind || null;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (!current) return;
  seed(current);
  startLoop();
}
