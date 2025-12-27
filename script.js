const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* =====================
   CANVAS
===================== */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* =====================
   UI
===================== */
const colorPicker = document.getElementById("colorPicker");
const ballCountInput = document.getElementById("ballCount");
const angleInput = document.getElementById("angle");
const angleValue = document.getElementById("angleValue");
const startBtn = document.getElementById("startBtn");

angleInput.addEventListener("input", () => {
  angleValue.textContent = angleInput.value + "°";
});

/* =====================
   WORLD
===================== */
let balls = [];
let ground = null;

const gravity = 0.5;
const friction = 0.98;
const wallBounce = 0.8;

/* =====================
   CREATE GROUND
===================== */
function createGround(angleDeg) {
  const angle = angleDeg * Math.PI / 180;
  const length = canvas.width;

  const x1 = 0;
  const y1 = canvas.height - 200;
  const x2 = Math.cos(angle) * length;
  const y2 = y1 + Math.sin(angle) * length;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);

  ground = {
    x1, y1, x2, y2,
    nx: -dy / len,
    ny: dx / len
  };
}

function groundYAt(x) {
  const t = (x - ground.x1) / (ground.x2 - ground.x1);
  return ground.y1 + t * (ground.y2 - ground.y1);
}

/* =====================
   SPAWN BALLS
===================== */
function spawnBalls(count, color) {
  balls = [];
  for (let i = 0; i < count; i++) {
    balls.push({
      x: 150 + i * 25,
      y: 50,
      radius: 12,
      vx: Math.random() * 2 - 1,
      vy: 0,
      bounce: 0.6,
      color
    });
  }
}

/* =====================
   BALL–BALL COLLISION
===================== */
function resolveBallCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  const minDist = a.radius + b.radius;

  if (dist === 0 || dist >= minDist) return;

  // normal
  const nx = dx / dist;
  const ny = dy / dist;

  // penetration correction
  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;

  // relative velocity
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;

  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return;

  const restitution = Math.min(a.bounce, b.bounce);
  const impulse = -(1 + restitution) * velAlongNormal / 2;

  const ix = impulse * nx;
  const iy = impulse * ny;

  a.vx -= ix;
  a.vy -= iy;
  b.vx += ix;
  b.vy += iy;
}

/* =====================
   PHYSICS UPDATE
===================== */
function update(ball) {
  // gravity
  ball.vy += gravity;

  // integrate
  ball.x += ball.vx;
  ball.y += ball.vy;

  /* ---- WALLS ---- */
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.vx *= -wallBounce;
  }

  if (ball.x + ball.radius > canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.vx *= -wallBounce;
  }

  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.vy *= -wallBounce;
  }

  /* ---- GROUND ---- */
  if (!ground) return;

  const gY = groundYAt(ball.x);

  if (ball.y + ball.radius > gY) {
    ball.y = gY - ball.radius;

    const vDotN = ball.vx * ground.nx + ball.vy * ground.ny;

    ball.vx -= (1 + ball.bounce) * vDotN * ground.nx;
    ball.vy -= (1 + ball.bounce) * vDotN * ground.ny;

    ball.vx *= friction;
    ball.vy *= friction;
  }
}

/* =====================
   DRAWING
===================== */
function drawGround() {
  if (!ground) return;
  ctx.beginPath();
  ctx.moveTo(ground.x1, ground.y1);
  ctx.lineTo(ground.x2, ground.y2);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawWalls() {
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = ball.color;
  ctx.fill();
}

/* =====================
   LOOP
===================== */
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawWalls();
  drawGround();

  balls.forEach(update);

  // ball–ball collisions
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }

  balls.forEach(drawBall);

  requestAnimationFrame(loop);
}

loop();

/* =====================
   START
===================== */
startBtn.addEventListener("click", () => {
  const color = colorPicker.value;
  const count = Number(ballCountInput.value);
  const angle = Number(angleInput.value);

  createGround(angle);
  spawnBalls(count, color);
});
