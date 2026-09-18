// ---- countdown ----

function getTargetTime() {
  const target = new Date();
  target.setHours(17, 30, 0, 0);
  return target;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function updateCountdown() {
  const now = new Date();
  const target = getTargetTime();
  const diff = target - now;

  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const timerEl = document.getElementById('timer');
  const doneEl = document.getElementById('done-message');

  if (diff <= 0) {
    timerEl.hidden = true;
    document.querySelector('.target-label').hidden = true;
    doneEl.hidden = false;
    return true;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
  return false;
}

// ---- confetti (hand-rolled, no dependencies) ----

function fireConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#75aadb', '#ffffff', '#f6b40e', '#d1223a', '#4e86bd'];
  const particles = [];
  const count = 180;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3,
      rot: Math.random() * 360,
      vrot: -8 + Math.random() * 16,
      life: 0
    });
  }

  let frame = 0;
  const maxFrames = 420;

  function tick() {
    frame++;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.rot += p.vrot;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (frame < maxFrames) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      window.removeEventListener('resize', resize);
    }
  }
  requestAnimationFrame(tick);
}

// ---- agua: click to fill, let go and it drains ----
// Everything is tracked in whole millilitres so repeated += 0.1 can't drift.

const WATER_MAX_ML = 2700;
const WATER_PER_CLICK_ML = 100;
const WATER_DRAIN_TICK_MS = 200;
const WATER_DRAIN_PER_TICK_ML = 20;   // 100 ml per second
const WATER_GRACE_MS = 800;           // pause draining right after a click
const TOAST_MS = 2200;

let waterMl = 0;
let lastPourAt = 0;
let toastTimer = null;

const waterEl = document.getElementById('water');
const waterAmountEl = document.getElementById('water-amount');
const waterCounterEl = document.getElementById('water-counter');
const waterBtn = document.getElementById('water-btn');
const waterErrorEl = document.getElementById('water-error');

function renderWater() {
  const level = waterMl / WATER_MAX_ML;
  document.documentElement.style.setProperty('--water-level', level.toFixed(4));
  waterAmountEl.textContent = (waterMl / 1000).toFixed(1);
  waterCounterEl.classList.toggle('is-full', waterMl >= WATER_MAX_ML);
  waterEl.classList.toggle('is-dry', waterMl <= 0);
}

function showToast() {
  waterErrorEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    waterErrorEl.classList.remove('is-visible');
  }, TOAST_MS);
}

function pourWater() {
  if (waterMl >= WATER_MAX_ML) {
    waterMl = WATER_MAX_ML;
    showToast();
    renderWater();
    return;
  }
  waterMl = Math.min(WATER_MAX_ML, waterMl + WATER_PER_CLICK_ML);
  lastPourAt = Date.now();
  renderWater();
}

waterBtn.addEventListener('click', pourWater);

setInterval(() => {
  if (waterMl <= 0) return;
  if (Date.now() - lastPourAt < WATER_GRACE_MS) return;
  waterMl = Math.max(0, waterMl - WATER_DRAIN_PER_TICK_ML);
  renderWater();
}, WATER_DRAIN_TICK_MS);

renderWater();

// ---- init ----

let confettiFired = false;
updateCountdown();
if (document.getElementById('done-message').hidden === false) {
  fireConfetti();
  confettiFired = true;
}

const interval = setInterval(() => {
  const done = updateCountdown();
  if (done && !confettiFired) {
    fireConfetti();
    confettiFired = true;
    clearInterval(interval);
  }
}, 1000);
