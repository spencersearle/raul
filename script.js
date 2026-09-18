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
// Two modes sharing one particle pool and one rAF loop: a one-shot burst
// fired when the countdown ends, and a continuous rain toggled by the
// switch that appears once that burst has fully fallen off-screen.

const CONFETTI_COLORS = ['#75aadb', '#ffffff', '#f6b40e', '#d1223a', '#4e86bd'];
const CONFETTI_BURST_COUNT = 260;
const CONFETTI_MAX_LIVE = 500;
const CONFETTI_SPAWN_INTERVAL_MS = 90;
const CONFETTI_SPAWN_PER_TICK = 3;

const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
const confettiToggleEl = document.getElementById('confetti-toggle');
const confettiToggleInput = document.getElementById('confetti-toggle-input');

let confettiParticles = [];
let confettiRunning = false;
let confettiContinuous = false;
let confettiLastSpawn = 0;
let confettiIdleCallback = null;

function resizeConfettiCanvas() {
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeConfettiCanvas();
window.addEventListener('resize', resizeConfettiCanvas);

function spawnConfettiPiece(y) {
  return {
    x: Math.random() * window.innerWidth,
    y,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    vx: -2 + Math.random() * 4,
    vy: 2 + Math.random() * 3,
    rot: Math.random() * 360,
    vrot: -8 + Math.random() * 16
  };
}

function startConfettiLoop() {
  if (confettiRunning) return;
  confettiRunning = true;
  confettiLastSpawn = 0;
  requestAnimationFrame(confettiTick);
}

function burstConfetti(count, onDone) {
  if (onDone) confettiIdleCallback = onDone;
  for (let i = 0; i < count; i++) {
    confettiParticles.push(spawnConfettiPiece(-20 - Math.random() * window.innerHeight * 0.6));
  }
  startConfettiLoop();
}

function confettiTick(timestamp) {
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  if (confettiContinuous) {
    if (!confettiLastSpawn || timestamp - confettiLastSpawn > CONFETTI_SPAWN_INTERVAL_MS) {
      for (let i = 0; i < CONFETTI_SPAWN_PER_TICK; i++) {
        if (confettiParticles.length < CONFETTI_MAX_LIVE) {
          confettiParticles.push(spawnConfettiPiece(-20));
        }
      }
      confettiLastSpawn = timestamp;
    }
  }

  confettiParticles = confettiParticles.filter((p) => p.y < window.innerHeight + 40);

  for (const p of confettiParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.rot += p.vrot;

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rot * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();
  }

  if (confettiContinuous || confettiParticles.length > 0) {
    requestAnimationFrame(confettiTick);
  } else {
    confettiRunning = false;
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (confettiIdleCallback) {
      const done = confettiIdleCallback;
      confettiIdleCallback = null;
      done();
    }
  }
}

function revealConfettiToggle() {
  confettiToggleEl.hidden = false;
  requestAnimationFrame(() => confettiToggleEl.classList.add('is-visible'));
}

confettiToggleInput.addEventListener('change', () => {
  confettiContinuous = confettiToggleInput.checked;
  if (confettiContinuous) startConfettiLoop();
});

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
  burstConfetti(CONFETTI_BURST_COUNT, revealConfettiToggle);
  confettiFired = true;
}

const interval = setInterval(() => {
  const done = updateCountdown();
  if (done && !confettiFired) {
    burstConfetti(CONFETTI_BURST_COUNT, revealConfettiToggle);
    confettiFired = true;
    clearInterval(interval);
  }
}, 1000);
