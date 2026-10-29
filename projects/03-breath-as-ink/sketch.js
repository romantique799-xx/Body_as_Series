/*
  BREATH BLEED — SLOW CONTINUOUS DIFFUSION

  Original mirror condensation visual.
  Whole-phrase organic water diffusion.

  TYPE ANYTHING
  BREATHE TO REVEAL + DISSOLVE

  Diffusion never stops at a fixed time.
  Longer cumulative breath = more spreading.

  ESP32 + SHT40 / 115200
  HOLD B = test
  CAPTURE PNG = save artwork
*/

// =====================================
// SETTINGS
// =====================================

const BREATH_START = 1.5;
const BREATH_END = 0.8;
const BREATH_GRACE = 850;

const REVEAL_SPEED = 1.3;
const FADE_SPEED = 0.48;

// MAIN CONTROL
// Larger = slower diffusion.
// Try 18, 25 or 35.
const BLEED_SLOWNESS = 8;

// Overall strength of the wet edges.
const BLEED_STRENGTH = 1.0;

// Internal ink resolution.
const TYPE_W = 640;
const TYPE_H = 360;

// =====================================
// SENSOR STATE
// =====================================
let patternOffsetX = 0;
let patternOffsetY = 0;
let port = null;
let reader = null;
let serialActive = false;
let serialToken = 0;

let humidity = null;
let baseline = null;
let lastHumidity = null;

let lastSensorTime = 0;
let lastRiseTime = 0;

let sensorBreath = false;
let manualBreath = false;
let keyboardBreath = false;

let sensorStatus = "NOT CONNECTED";

let visibility = 0;

// This time is NEVER capped.
let totalBreathSeconds = 0;

// =====================================
// ARTWORK STATE
// =====================================

let originalInk;
let originalCtx;
let bleedInk;
let bleedCtx;

let originalPixels = null;
let lastBleedStep = -1;

let noiseX1 = [];
let noiseX2 = [];
let noiseX3 = [];

let noiseY1 = [];
let noiseY2 = [];
let noiseY3 = [];

let phraseInput;
let connectButton;
let breathButton;

// =====================================
// SETUP
// =====================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("Arial");

  originalInk = document.createElement("canvas");

  originalInk.width = TYPE_W;
  originalInk.height = TYPE_H;

  originalCtx = originalInk.getContext("2d", { willReadFrequently: true });

  bleedInk = document.createElement("canvas");

  bleedInk.width = TYPE_W;
  bleedInk.height = TYPE_H;

  bleedCtx = bleedInk.getContext("2d");

  prepareNoise();
  createInterface();
  resetArtwork();
}

// =====================================
// INTERFACE
// =====================================

function createInterface() {
  const bar = document.createElement("div");

  bar.style.cssText = `
    position:fixed;
    top:18px;
    left:18px;
    z-index:1000;
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:8px;
    max-width:94vw;
  `;

  document.body.appendChild(bar);

  phraseInput = document.createElement("input");

  phraseInput.type = "text";
  phraseInput.value = "";
  phraseInput.maxLength = 90;
  phraseInput.placeholder = "TYPE ANYTHING";

  phraseInput.style.cssText = `
    background:#1b1b1b;
    color:white;
    border:1px solid #666;
    padding:10px 13px;
    font:12px monospace;
    width:240px;
    max-width:60vw;
    outline:none;
  `;

  phraseInput.addEventListener("input", resetArtwork);

  bar.appendChild(phraseInput);

  function button(label, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;

    b.style.cssText = `
      background:#1b1b1b;
      color:white;
      border:1px solid #666;
      padding:10px 13px;
      font:12px monospace;
      cursor:pointer;
    `;

    b.addEventListener("click", action);
    bar.appendChild(b);

    return b;
  }

  connectButton = button("CONNECT SHT40", connectSensor);

  button("DISCONNECT", disconnectSensor);

  breathButton = button("TEST BREATH: OFF", () => {
    manualBreath = !manualBreath;

    breathButton.textContent = manualBreath
      ? "TEST BREATH: ON"
      : "TEST BREATH: OFF";
  });

  button("RESET", resetArtwork);
  button("CAPTURE PNG", captureArtwork);
}

// =====================================
// STABLE ORGANIC PATTERN
// =====================================

// These patterns stay fixed.
// Only their effect grows with breath.
// No random flickering per frame.

function prepareNoise() {
  for (let x = 0; x < TYPE_W; x++) {
    const px = x + patternOffsetX;

    noiseX1[x] = Math.sin(px * 0.024 + 0.7);

    noiseX2[x] = Math.sin(px * 0.067 + 2.4);

    noiseX3[x] = Math.cos(px * 0.038 + 1.3);
  }

  for (let y = 0; y < TYPE_H; y++) {
    const py = y + patternOffsetY;

    noiseY1[y] = Math.sin(py * 0.033 + 1.2);

    noiseY2[y] = Math.sin(py * 0.079 + 2.8);

    noiseY3[y] = Math.cos(py * 0.047 + 0.5);
  }
}

// =====================================
// CREATE WHOLE-PHRASE INK
// =====================================
function resetArtwork() {
  // Initialize the organic pattern inside the running p5 sketch.
  patternOffsetX = random(0, 2000);
  patternOffsetY = random(0, 2000);
  prepareNoise();
  visibility = 0;
  totalBreathSeconds = 0;
  lastBleedStep = -1;

  const phrase = (phraseInput?.value || "").trim();

  originalCtx.clearRect(0, 0, TYPE_W, TYPE_H);

if (!phrase) {
  originalPixels = originalCtx.getImageData(
    0, 0, TYPE_W, TYPE_H
  ).data;

  rebuildBleeding(0);
  return;
}

  originalCtx.fillStyle = "#fff";
  originalCtx.textAlign = "center";
  originalCtx.textBaseline = "middle";

  let fontSize = 115;
  let lines = [];

  for (let i = 0; i < 24; i++) {
    originalCtx.font =
      `900 ${fontSize}px Impact, ` + `"Arial Black", Arial, sans-serif`;

    lines = wrapPhrase(originalCtx, phrase, TYPE_W * 0.83);

    if (lines.length * fontSize * 1.16 <= TYPE_H * 0.74) {
      break;
    }

    fontSize *= 0.88;
  }

  const lineHeight = fontSize * 1.16;

  const firstY = TYPE_H / 2 - ((lines.length - 1) * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    originalCtx.fillText(lines[i], TYPE_W / 2, firstY + i * lineHeight);
  }

  originalPixels = originalCtx.getImageData(0, 0, TYPE_W, TYPE_H).data;

  rebuildBleeding(0);
}

// =====================================
// TEXT WRAPPING
// =====================================

function wrapPhrase(ctx, phrase, maxWidth) {
  const words = phrase.split(/\s+/);

  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? current + " " + word : word;

    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = "";
    }

    if (ctx.measureText(word).width <= maxWidth) {
      current = word;
      continue;
    }

    let piece = "";

    for (const ch of word) {
      if (piece && ctx.measureText(piece + ch).width > maxWidth) {
        lines.push(piece);
        piece = ch;
      } else {
        piece += ch;
      }
    }

    current = piece;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : ["BREATHE"];
}

// =====================================
// CONTINUOUS BLEED PROGRESS
// =====================================

// Unlike the previous version,
// this never reaches a fixed maximum.
//
// At 6 seconds: subtle.
// At 20 seconds: more fusion.
// At 40 seconds: stronger spreading.
// Further breathing keeps changing it.

function bleedProgress(seconds) {
  const normal = Math.log1p(seconds / BLEED_SLOWNESS);

  // Accelerate fusion after 4 seconds.
  const extra = Math.max(0, seconds - 4);

  return normal + 0.01 * extra * extra;
}

// =====================================
// ORGANIC INK DIFFUSION
// =====================================

function rebuildBleeding(seconds) {
  // Recalculate approximately 8 times
  // per second of accumulated breath.
  // No fixed 45-step limit.

  const step = Math.floor(seconds * 8);

  if (step === lastBleedStep) return;

  lastBleedStep = step;

  const time = step / 8;

  const wet = bleedProgress(time) * BLEED_STRENGTH;

  if (time === 0) {
    bleedCtx.clearRect(0, 0, TYPE_W, TYPE_H);

    bleedCtx.drawImage(originalInk, 0, 0);

    return;
  }

  const output = bleedCtx.createImageData(TYPE_W, TYPE_H);

  const dest = output.data;
  const source = originalPixels;

  // Both continue increasing with time,
  // but slowly, without an abrupt ending.

  const warp = 11 * Math.pow(wet, 1.2);

  const growth = 25 * Math.pow(wet, 1.4);

  function alphaAt(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);

    if (ix < 0 || iy < 0 || ix >= TYPE_W || iy >= TYPE_H) {
      return 0;
    }

    return source[(iy * TYPE_W + ix) * 4 + 3];
  }

  for (let y = 0; y < TYPE_H; y++) {
    const row = y * TYPE_W * 4;

    const y1 = noiseY1[y];
    const y2 = noiseY2[y];
    const y3 = noiseY3[y];

    for (let x = 0; x < TYPE_W; x++) {
      const x1 = noiseX1[x];
      const x2 = noiseX2[x];
      const x3 = noiseX3[x];

      // Continuous liquid displacement.
      // Entire phrases move as one ink field.

      const shiftX = warp * (y1 * 0.63 + x2 * y2 * 0.32 + x3 * 0.16);

      const shiftY = warp * (x1 * 0.63 + x3 * y3 * 0.32 + y2 * 0.16);

      const sx = x + shiftX;
      const sy = y + shiftY;

      // Different parts of the ink
      // absorb moisture at different rates.

      const texture = x1 * y1 * 0.54 + x2 * y2 * 0.31 + x3 * y3 * 0.15;

      const radius = growth * Math.max(0.3, 0.76 + texture * 0.38);

      const inner = radius * 0.4;
      const diag = radius * 0.707;

      // Original body of the type.
      const core = alphaAt(sx, sy);

      // Gentle spreading near the edges.
      const nearby = Math.max(
        alphaAt(sx + inner, sy),
        alphaAt(sx - inner, sy),
        alphaAt(sx, sy + inner),
        alphaAt(sx, sy - inner)
      );

      // Larger irregular moisture growth.
      const far = Math.max(
        alphaAt(sx + radius, sy),
        alphaAt(sx - radius, sy),
        alphaAt(sx, sy + radius),
        alphaAt(sx, sy - radius),

        alphaAt(sx + diag, sy + diag),

        alphaAt(sx - diag, sy + diag),

        alphaAt(sx + diag, sy - diag),

        alphaAt(sx - diag, sy - diag)
      );

      const alpha = Math.max(core * 0.98, nearby * 0.83, far * 0.7);

      const index = row + x * 4;

      dest[index] = 245;
      dest[index + 1] = 250;
      dest[index + 2] = 252;
      dest[index + 3] = alpha;
    }
  }

  bleedCtx.putImageData(output, 0, 0);
}

// =====================================
// CONNECT SHT40
// =====================================

async function connectSensor() {
  if (!("serial" in navigator)) {
    sensorStatus = "USE DESKTOP CHROME";
    return;
  }

  if (serialActive) return;

  try {
    if (port) {
      await disconnectSensor();
    }

    port = await navigator.serial.requestPort();

    await port.open({
      baudRate: 115200,
    });

    humidity = null;
    baseline = null;
    lastHumidity = null;

    lastSensorTime = 0;
    lastRiseTime = 0;

    sensorBreath = false;
    serialActive = true;
    serialToken++;

    sensorStatus = "WAITING FOR DATA";

    connectButton.textContent = "PORT OPEN";

    readSerial(serialToken);
  } catch (error) {
    console.error(error);

    sensorStatus = "CONNECT ERROR: " + error.message;
  }
}

// =====================================
// SERIAL READING
// =====================================

async function readSerial(token) {
  const localPort = port;

  if (!localPort?.readable) return;

  const localReader = localPort.readable.getReader();

  reader = localReader;

  const decoder = new TextDecoder();
  let buffer = "";

  function release() {
    try {
      localReader.releaseLock();
    } catch (_) {}

    if (reader === localReader) {
      reader = null;
    }
  }

  function readNext() {
    if (!serialActive || token !== serialToken) {
      release();
      return;
    }

    localReader
      .read()
      .then(({ value, done }) => {
        if (done) {
          release();
          return;
        }

        buffer += decoder.decode(value);

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          parseHumidity(line.trim());
        }

        if (buffer.length > 2048) {
          buffer = "";
        }

        setTimeout(readNext, 0);
      })
      .catch((error) => {
        if (serialActive) {
          sensorStatus = "READ ERROR: " + error.message;

          serialActive = false;
        }

        release();
      });
  }

  readNext();
}

// =====================================
// SENSOR VALUES
// =====================================

function parseHumidity(line) {
  if (!line) return;

  const match = line.match(/HUMIDITY:\s*([0-9]+(?:\.[0-9]+)?)/i);

  let value = null;

  if (match) {
    value = Number(match[1]);
  } else if (/^\d+(\.\d+)?$/.test(line)) {
    value = Number(line);
  }

  if (value === null || !Number.isFinite(value) || value < 0 || value > 100) {
    if (line.includes("NOT FOUND")) {
      sensorStatus = line;
    }
    return;
  }

  humidity = value;
  lastSensorTime = millis();

  sensorStatus = "SHT40 RECEIVING DATA";

  detectBreath(value);
}

// =====================================
// BREATH DETECTION
// =====================================

function detectBreath(value) {
  const now = millis();

  if (baseline === null) {
    baseline = value;
    lastHumidity = value;
    return;
  }

  const rise = value - lastHumidity;

  const difference = value - baseline;

  if (!sensorBreath) {
    baseline = lerp(baseline, value, 0.003);
  }

  if (rise > 0.045) {
    lastRiseTime = now;
  }

  if (!sensorBreath) {
    if (difference > BREATH_START && rise > 0.04) {
      sensorBreath = true;
      lastRiseTime = now;
    }
  } else {
    if (difference < BREATH_END || now - lastRiseTime > BREATH_GRACE) {
      sensorBreath = false;
    }
  }

  lastHumidity = value;
}

// =====================================
// DISCONNECT SHT40
// =====================================

async function disconnectSensor() {
  serialActive = false;
  serialToken++;
  sensorBreath = false;

  try {
    await reader?.cancel();
  } catch (_) {}

  for (let i = 0; i < 12 && port?.readable?.locked; i++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  try {
    if (port && !port.readable?.locked) {
      await port.close();
    }
  } catch (error) {
    console.warn(error);
  }

  port = null;
  reader = null;

  sensorStatus = "DISCONNECTED";

  connectButton.textContent = "CONNECT SHT40";
}

// =====================================
// MAIN DRAW LOOP
// =====================================

function draw() {
  background(5, 6, 8);

  const dt = Math.min(deltaTime / 1000, 0.05);

  const sensorFresh = lastSensorTime > 0 && millis() - lastSensorTime < 2500;

  if (!sensorFresh) {
    sensorBreath = false;
  }

  const breathing =
    manualBreath || keyboardBreath || (sensorFresh && sensorBreath);

  if (breathing) {
    // No cap, no maximum seconds.
    totalBreathSeconds += dt;

    visibility = Math.min(1, visibility + dt * REVEAL_SPEED);
  } else {
    visibility = Math.max(0, visibility - dt * FADE_SPEED);
  }

  rebuildBleeding(totalBreathSeconds);

  drawBreathImage(visibility);
  drawStatus(breathing);
}

// =====================================
// ORIGINAL CONDENSATION VISUAL
// =====================================

function drawBreathImage(amount, ctx = drawingContext) {
  if (amount <= 0.001) return;

  const FOG_DENSITY = 0.23;
  const EDGE_SOFTNESS = 0.8;
  const DROPLET_AMOUNT = 95;

  const w = width;
const h = height;

const x = 0;
const y = 0;

  if (!drawBreathImage.buffers) {
    const ink = document.createElement("canvas");

    const mask = document.createElement("canvas");

    drawBreathImage.buffers = {
      ink,
      mask,
    };
  }

  const { ink, mask } = drawBreathImage.buffers;

  const resolution = Math.min(1, 900 / Math.max(w, h));

  const bw = Math.max(2, Math.round(w * resolution));

  const bh = Math.max(2, Math.round(h * resolution));

  if (ink.width !== bw || ink.height !== bh) {
    ink.width = mask.width = bw;
    ink.height = mask.height = bh;
  }

  const ic = ink.getContext("2d");
  const mc = mask.getContext("2d");

  ic.clearRect(0, 0, bw, bh);
  mc.clearRect(0, 0, bw, bh);

  // ---------------------------------
  // 1. ORIGINAL FOG MASK
  // ---------------------------------

  const spread = 0.12 + amount * 0.85;

  const centerGradient = mc.createRadialGradient(
    bw * 0.5,
    bh * 0.5,
    0,
    bw * 0.5,
    bh * 0.5,
    Math.max(bw, bh) * spread
  );

  centerGradient.addColorStop(
    0,
    `rgba(255,255,255,${Math.min(1, amount * 1.4)})`
  );

  centerGradient.addColorStop(0.42, `rgba(255,255,255,${amount * 0.88})`);

  centerGradient.addColorStop(1, "rgba(255,255,255,0)");

  mc.fillStyle = centerGradient;

  mc.fillRect(0, 0, bw, bh);

  const clouds = [
    [-0.27, -0.12, 0.31, 0.42],
    [0.22, -0.18, 0.39, 0.3],
    [-0.13, 0.2, 0.43, 0.36],
    [0.28, 0.17, 0.3, 0.45],
    [0.02, -0.26, 0.32, 0.31],
    [-0.34, 0.1, 0.29, 0.37],
    [0.33, -0.02, 0.27, 0.39],
  ];

  for (const cloud of clouds) {
    const [px, py, rx, ry] = cloud;

    const cx = bw * (0.5 + px * amount);

    const cy = bh * (0.5 + py * amount);

    const radiusX = bw * rx * spread;

    const radiusY = bh * ry * spread;

    mc.save();
    mc.translate(cx, cy);

    mc.scale(Math.max(0.01, radiusX), Math.max(0.01, radiusY));

    const gradient = mc.createRadialGradient(0, 0, 0, 0, 0, 1);

    gradient.addColorStop(0, `rgba(255,255,255,${amount * 0.85})`);

    gradient.addColorStop(EDGE_SOFTNESS, `rgba(255,255,255,${amount * 0.32})`);

    gradient.addColorStop(1, "rgba(255,255,255,0)");

    mc.fillStyle = gradient;
    mc.beginPath();

    mc.arc(0, 0, 1, 0, Math.PI * 2);

    mc.fill();
    mc.restore();
  }

  // ---------------------------------
  // 2. ORGANIC WET TYPOGRAPHY
  // ---------------------------------

  const wet = bleedProgress(totalBreathSeconds) * BLEED_STRENGTH;

  ic.save();

  // Diffuse moisture halo.
  ic.globalAlpha = 0.48;

  ic.filter = `blur(${1.5 + wet * 7.5}px)`;

  ic.drawImage(bleedInk, 0, 0, bw, bh);

  // Main ink body.
  ic.globalAlpha = 0.96;

  ic.filter = `blur(${(1 - amount) * 5 + 0.5 + wet * 2.3}px)`;

  ic.drawImage(bleedInk, 0, 0, bw, bh);

  ic.filter = "none";

  ic.globalAlpha = 1;

  ic.globalCompositeOperation = "destination-in";

  ic.drawImage(mask, 0, 0);

  ic.restore();

  ctx.save();

  ctx.globalCompositeOperation = "screen";

  ctx.drawImage(ink, x, y, w, h);

  ctx.restore();

  // ---------------------------------
  // 3. ORIGINAL MILKY FOG
  // ---------------------------------

  ctx.save();

  ctx.globalCompositeOperation = "screen";

  const fog = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,

    width / 2,
    height / 2,

    Math.max(w, h) * (0.2 + amount * 0.65)
  );

  fog.addColorStop(0, `rgba(175,190,195,${FOG_DENSITY * amount})`);

  fog.addColorStop(0.45, `rgba(165,180,186,${FOG_DENSITY * amount * 0.45})`);

  fog.addColorStop(1, "rgba(160,180,190,0)");

  ctx.fillStyle = fog;

  ctx.fillRect(x, y, w, h);

  ctx.restore();

  // ---------------------------------
  // 4. ORIGINAL MICRO DROPLETS
  // ---------------------------------

  ctx.save();

  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  for (let i = 0; i < DROPLET_AMOUNT; i++) {
    const a = Math.sin(i * 127.1) * 43758.5453;

    const b = Math.sin(i * 311.7) * 96321.9123;

    const u = a - Math.floor(a);
    const v = b - Math.floor(b);

    const dx = (u - 0.5) * 2;
    const dy = (v - 0.5) * 2;

    if (Math.hypot(dx, dy) > 0.95 * amount + 0.12) {
      continue;
    }

    const px = x + u * w;
    const py = y + v * h;

    const r = 0.4 + (i % 6) * 0.27;

    ctx.beginPath();

    ctx.ellipse(px, py, r, r * (1.2 + (i % 3) * 0.25), 0, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(230,240,245,${amount * 0.1})`;

    ctx.fill();
  }

  ctx.restore();
}

// =====================================
// CAPTURE PNG
// =====================================

function captureArtwork() {
  // Use exactly the same accumulated
  // breath time and diffusion formula.
  const time = Math.floor(totalBreathSeconds * 8) / 8;
  const wet = bleedProgress(time) * BLEED_STRENGTH;

  const warp = 11 * Math.pow(wet, 1.2);
  const growth = 25 * Math.pow(wet, 1.4);

  // Extra canvas area around the original type.
  // This lets the wet shape continue beyond
  // the screen's original 16:9 frame.
  const pad = Math.ceil(Math.max(50, warp * 2 + growth * 2 + 25));

  const W = TYPE_W + pad * 2;
  const H = TYPE_H + pad * 2;

  const fullInk = document.createElement("canvas");
  fullInk.width = W;
  fullInk.height = H;

  const fullCtx = fullInk.getContext("2d");
  const image = fullCtx.createImageData(W, H);
  const dest = image.data;

  // Sample the original letters.
  function alphaAt(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);

    if (ix < 0 || iy < 0 || ix >= TYPE_W || iy >= TYPE_H) {
      return 0;
    }

    return originalPixels[(iy * TYPE_W + ix) * 4 + 3];
  }

  // Reconstruct the same organic diffusion
  // across a larger, UNCLIPPED canvas.
  for (let py = 0; py < H; py++) {
    const y = py - pad;
    const ny = y + patternOffsetY;
    const y1 = Math.sin(ny * 0.033 + 1.2);
    const y2 = Math.sin(ny * 0.079 + 2.8);
    const y3 = Math.cos(ny * 0.047 + 0.5);

    for (let px = 0; px < W; px++) {
      const x = px - pad;
const nx = x + patternOffsetX;
    const x1 = Math.sin(nx * 0.024 + 0.7);
const x2 = Math.sin(nx * 0.067 + 2.4);
const x3 = Math.cos(nx * 0.038 + 1.3);

      const shiftX = warp * (y1 * 0.63 + x2 * y2 * 0.32 + x3 * 0.16);

      const shiftY = warp * (x1 * 0.63 + x3 * y3 * 0.32 + y2 * 0.16);

      const sx = x + shiftX;
      const sy = y + shiftY;

      const texture = x1 * y1 * 0.54 + x2 * y2 * 0.31 + x3 * y3 * 0.15;

      const radius = growth * Math.max(0.3, 0.76 + texture * 0.38);

      const inner = radius * 0.4;
      const diag = radius * 0.707;

      const core = alphaAt(sx, sy);

      const nearby = Math.max(
        alphaAt(sx + inner, sy),
        alphaAt(sx - inner, sy),
        alphaAt(sx, sy + inner),
        alphaAt(sx, sy - inner)
      );

      const far = Math.max(
        alphaAt(sx + radius, sy),
        alphaAt(sx - radius, sy),
        alphaAt(sx, sy + radius),
        alphaAt(sx, sy - radius),
        alphaAt(sx + diag, sy + diag),
        alphaAt(sx - diag, sy + diag),
        alphaAt(sx + diag, sy - diag),
        alphaAt(sx - diag, sy - diag)
      );

      const alpha = Math.max(core * 0.98, nearby * 0.83, far * 0.7);

      const i = (py * W + px) * 4;

      dest[i] = 245;
      dest[i + 1] = 250;
      dest[i + 2] = 252;
      dest[i + 3] = Math.round(alpha);
    }
  }

  fullCtx.putImageData(image, 0, 0);

  // Preserve the on-screen type scale,
  // but let the exported canvas grow
  // beyond the original display area.
  const scale = Math.min((width * 0.78) / 16, (height * 0.74) / 9);

  const scaleX = (16 * scale) / TYPE_W;
  const scaleY = (9 * scale) / TYPE_H;

  const output = document.createElement("canvas");

  output.width = Math.ceil(W * scaleX);
  output.height = Math.ceil(H * scaleY);

  const ctx = output.getContext("2d", {
    alpha: true,
  });

  ctx.clearRect(0, 0, output.width, output.height);

  // Same soft diffusion as the screen,
  // but WITHOUT the fog reveal mask,
  // background rectangle or clipping.
  ctx.globalAlpha = 0.48;
  ctx.filter = `blur(${1.5 + wet * 7.5}px)`;

  ctx.drawImage(fullInk, 0, 0, output.width, output.height);

  ctx.globalAlpha = 0.96;
  ctx.filter = `blur(${0.5 + wet * 2.3}px)`;

  ctx.drawImage(fullInk, 0, 0, output.width, output.height);

  ctx.filter = "none";
  ctx.globalAlpha = 1;

  output.toBlob((blob) => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "BREATH-TYPE-FULL-" + Date.now() + ".png";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 12000);
  }, "image/png");
}

// =====================================
// STATUS
// =====================================

function drawStatus(breathing) {
  push();

  noStroke();
  textFont("Arial");

  textAlign(CENTER, CENTER);

  fill(210);
  textSize(12);

  text(
    breathing ? "BREATH DETECTED / INK ABSORBING MOISTURE" : "EXHALE TO REVEAL",
    width / 2,
    height - 88
  );

  fill(125);
  textSize(10);

  text(
    "TOTAL BREATH " +
      totalBreathSeconds.toFixed(1) +
      "s / CONTINUOUS DIFFUSION",
    width / 2,
    height - 65
  );

  const humidityInfo =
    humidity === null
      ? "NO HUMIDITY DATA"
      : "HUMIDITY " +
        humidity.toFixed(1) +
        "% / BASELINE " +
        baseline.toFixed(1) +
        "%";

  text(humidityInfo, width / 2, height - 45);

  text(sensorStatus + " / HOLD B TO TEST", width / 2, height - 26);

  pop();
}

// =====================================
// KEYBOARD TEST
// =====================================

function keyPressed() {
  if (document.activeElement === phraseInput) {
    return;
  }

  if (key === "b" || key === "B") {
    keyboardBreath = true;
    return false;
  }
}

function keyReleased() {
  if (key === "b" || key === "B") {
    keyboardBreath = false;
    return false;
  }
}

// =====================================
// RESIZE
// =====================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
