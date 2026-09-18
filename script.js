// ---- background decoration: scattered yerba leaves + brand watermarks ----

const YERBA_BRANDS = ['Taragüí', 'Rosamonte', 'Playadito', 'CBSé', 'La Merced', 'Amanda', 'Nobleza Gaucha'];

function scatterLeaves() {
  const container = document.getElementById('bg-leaves');
  const count = 22;
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.style.left = Math.random() * 100 + 'vw';
    leaf.style.top = Math.random() * 100 + 'vh';
    leaf.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.7 + Math.random() * 0.8})`;
    container.appendChild(leaf);

    const stem = document.createElement('div');
    stem.className = 'stem';
    stem.style.left = Math.random() * 100 + 'vw';
    stem.style.top = Math.random() * 100 + 'vh';
    stem.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(stem);
  }
}

function scatterBrands() {
  const container = document.getElementById('bg-brands');
  const count = 14;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.textContent = YERBA_BRANDS[Math.floor(Math.random() * YERBA_BRANDS.length)];
    el.style.left = Math.random() * 90 + 'vw';
    el.style.top = Math.random() * 100 + 'vh';
    el.style.fontSize = (1 + Math.random() * 1.8) + 'rem';
    el.style.transform = `rotate(${-25 + Math.random() * 50}deg)`;
    container.appendChild(el);
  }
}

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

// ---- init ----

scatterLeaves();
scatterBrands();

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
