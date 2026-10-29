
/*
  COOKING FONTS
  VOICE -> SIZE
  FALL -> SETTLE -> SHRINK

  Complete sketch.js
  Chrome recommended.

  No rubber, no wobble.
  Original hard-body gravity and hand deformation.
*/

// =====================================
// SETTINGS
// =====================================

const MAX_LETTERS = 520;
const SPAWN_INTERVAL = 65;
const BASE_FONT_SIZE = 200;

// Your current voice calibration
const QUIET_DB = -40;
const LOUD_DB = -15;

const MIN_VOICE_SCALE = 0.24;
const MAX_VOICE_SCALE = 2.7;
const VOICE_CURVE = 2;

// Speech recognition language (manual selection).
const LANGUAGE_OPTIONS = [
  { code: "en-US", label: "ENGLISH" },
  { code: "es-ES", label: "ESPAÑOL" },
  { code: "zh-CN", label: "中文" },
  { code: "ko-KR", label: "한국어" }
];

// NEW: LANDING / SHRINKING
const SHRINK_DELAY = 350;       // milliseconds
const SHRINK_DURATION = 2800;   // milliseconds
const SETTLED_SIZE_RATIO = 0.34;
const SETTLED_SIZE_EXTRA = 24;

const HAND_LINKS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [5, 9, 10, 11, 12],
  [9, 13, 14, 15, 16],
  [13, 17, 18, 19, 20],
  [0, 17]
];

// =====================================
// STATE
// =====================================

let camera = null;
let tracker = null;
let cameraFrame = null;
let frameContext = null;

let ready = false;
let starting = false;
let frameReady = false;

let previousVideoTime = -1;
let previousDetection = 0;
let lastDetection = 0;

let detectedHands = [];
let previousHands = [];
let handForces = [];

let letters = [];
let letterQueue = [];

let lastSpawn = 0;
let lastPhysicsFrame = 0;

let typeface = null;
let glyphCache = new Map();

let recognition = null;
let captionsEnabled = false;
let recognitionRestart = null;
let speechProgress = new Map();

let captionLine = "";
let captionUpdatedAt = 0;

let micStream = null;
let micContext = null;
let micSource = null;
let micAnalyser = null;
let micWaveform = null;
let voiceHistory = [];

let archiveCanvas = null;
let archiveCtx = null;

let recorder = null;
let recordingStream = null;
let recordingChunks = [];
let recordStartedAt = 0;

let captionButton = null;
let recordButton = null;
let languageSelect = null;
let selectedLanguage = "en-US";

// =====================================
// SETUP
// =====================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont("monospace");

  archiveCanvas = document.createElement("canvas");
  archiveCtx = archiveCanvas.getContext("2d", {
    alpha: true
  });

  buildControls();
  loadTypeface();

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        detectedHands = [];
        previousHands = [];
        handForces = [];
      }
    }
  );

  window.addEventListener("pagehide", () => {
    try { recognition?.stop(); } catch (_) {}

    if (recorder?.state === "recording") {
      try { recorder.stop(); } catch (_) {}
    }

    camera?.srcObject?.getTracks()
      .forEach(track => track.stop());

    micStream?.getTracks()
      .forEach(track => track.stop());
  });
}

// =====================================
// INTERFACE
// =====================================

function buildControls() {
  const bar = document.createElement("div");

  bar.style.cssText = `
    position:fixed;
    top:18px;
    right:18px;
    z-index:9999;
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    justify-content:flex-end;
    max-width:90vw;
  `;

  document.body.appendChild(bar);

  // Language choice appears alongside existing controls.
  languageSelect = document.createElement("select");
  languageSelect.title = "Speech recognition language";
  languageSelect.setAttribute("aria-label", "Speech recognition language");
  languageSelect.style.cssText = `
    background:rgba(0,0,0,.8);
    color:white;
    border:1px solid #aaa;
    border-radius:3px;
    padding:10px 13px;
    font:12px monospace;
    cursor:pointer;
  `;

  for (const option of LANGUAGE_OPTIONS) {
    const item = document.createElement("option");
    item.value = option.code;
    item.textContent = option.label;
    languageSelect.appendChild(item);
  }
  languageSelect.value = selectedLanguage;

  languageSelect.addEventListener("change", () => {
    selectedLanguage = languageSelect.value;
    speechProgress.clear();
    letterQueue = [];          // Avoid mixing unfinished old-language words.
    captionLine = "";

    // Preserve letters already on the screen (mixed-language piles).
    // Abort triggers onend, which starts recognition in the new language.
    if (captionsEnabled && recognition) {
      clearTimeout(recognitionRestart);
      try {
        recognition.abort();
      } catch (error) {
        console.warn("LANGUAGE SWITCH:", error);
        recognition.lang = selectedLanguage;
      }
    }
  });
  bar.appendChild(languageSelect);

  function makeButton(label, action) {
    const b = document.createElement("button");

    b.type = "button";
    b.textContent = label;

    b.style.cssText = `
      background:rgba(0,0,0,.8);
      color:white;
      border:1px solid #aaa;
      border-radius:3px;
      padding:10px 13px;
      font:12px monospace;
      cursor:pointer;
    `;

    b.onclick = event => {
      event.stopPropagation();
      action();
    };

    bar.appendChild(b);
    return b;
  }

  makeButton("RESET", () => {
    letters = [];
    letterQueue = [];
    speechProgress.clear();

    previousHands = [];
    handForces = [];

    captionLine = "";
    lastSpawn = performance.now();
  });

  captionButton = makeButton(
    "CAPTIONS OFF",
    toggleCaptions
  );

  recordButton = makeButton(
    "● RECORD",
    toggleRecording
  );

  makeButton("SAVE PNG", savePNG);
}

// =====================================
// CAMERA START
// =====================================

async function mousePressed(event) {
  if (
    event?.target?.closest?.(
      "button,input,select"
    )
  ) {
    return;
  }

  if (ready || starting) return;

  starting = true;

  try {
    const {
      HandLandmarker,
      FilesetResolver
    } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs"
    );

    const files =
      await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm"
      );

    tracker =
      await HandLandmarker.createFromOptions(
        files,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        }
      );

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

    camera = document.createElement("video");

    camera.autoplay = true;
    camera.muted = true;
    camera.playsInline = true;
    camera.srcObject = stream;

    camera.style.cssText = `
      position:fixed;
      width:1px;
      height:1px;
      opacity:0;
      pointer-events:none;
    `;

    document.body.appendChild(camera);
    await camera.play();

    cameraFrame = document.createElement("canvas");

    cameraFrame.width = camera.videoWidth;
    cameraFrame.height = camera.videoHeight;

    frameContext = cameraFrame.getContext("2d");

    ready = true;

    startVoiceMeter().catch(console.warn);

  } catch (error) {
    console.error("START FAILED:", error);

    camera?.srcObject?.getTracks()
      .forEach(track => track.stop());

    camera?.remove();
    camera = null;
  }

  starting = false;
}

// =====================================
// MICROPHONE
// =====================================

async function startVoiceMeter() {
  if (micAnalyser) {
    await micContext.resume();
    return;
  }

  if (!micStream?.active) {
    micStream =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
  }

  micContext = new (
    window.AudioContext ||
    window.webkitAudioContext
  )();

  await micContext.resume();

  micSource =
    micContext.createMediaStreamSource(micStream);

  micAnalyser = micContext.createAnalyser();
  micAnalyser.fftSize = 1024;

  micWaveform =
    new Float32Array(micAnalyser.fftSize);

  micSource.connect(micAnalyser);
}

function updateVoiceMeter(now) {
  if (!micAnalyser) return;

  micAnalyser.getFloatTimeDomainData(
    micWaveform
  );

  let power = 0;

  for (let i = 0; i < micWaveform.length; i++) {
    power += micWaveform[i] ** 2;
  }

  const rms = Math.sqrt(
    power / micWaveform.length
  );

  voiceHistory.push({ t: now, rms });

  while (
    voiceHistory.length &&
    voiceHistory[0].t < now - 2300
  ) {
    voiceHistory.shift();
  }
}

// =====================================
// VOICE -> INITIAL LETTER SIZE
// =====================================

function voiceSizeFactor() {
  if (!micAnalyser) return 1;

  const now = performance.now();

  const levels = voiceHistory
    .filter(s =>
      now - s.t < 1600 &&
      s.rms > 0.003
    )
    .map(s => s.rms)
    .sort((a, b) => a - b);

  if (!levels.length) {
    return MIN_VOICE_SCALE;
  }

  // Avoid measuring just one loud spike.
  const rms = levels[
    Math.floor((levels.length - 1) * 0.65)
  ];

  const db = 20 * Math.log10(
    Math.max(rms, 0.00001)
  );

  const t = Math.max(
    0,
    Math.min(
      1,
      (db - QUIET_DB) /
      (LOUD_DB - QUIET_DB)
    )
  );

  return (
    MIN_VOICE_SCALE +
    Math.pow(t, VOICE_CURVE) *
    (MAX_VOICE_SCALE - MIN_VOICE_SCALE)
  );
}

// =====================================
// SPEECH RECOGNITION
// =====================================

function toggleCaptions() {
  if (captionsEnabled) {
    captionsEnabled = false;

    clearTimeout(recognitionRestart);

    captionButton.textContent =
      "CAPTIONS OFF";

    captionLine = "";

    try { recognition?.stop(); } catch (_) {}
    return;
  }

  if (!ready) return;

  const SpeechAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechAPI) {
    console.warn("SpeechRecognition requires Chrome");
    return;
  }

  startVoiceMeter().catch(console.warn);

  if (!recognition) {
    recognition = new SpeechAPI();

    recognition.lang = selectedLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = event => {
      if (!captionsEnabled) return;

      consumeSpeech(event);

      let interim = "";
      let finalText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const phrase = (
          event.results[i][0]?.transcript || ""
        ).trim();

        if (!phrase) continue;

        if (event.results[i].isFinal) {
          finalText = phrase;
        } else {
          interim += " " + phrase;
        }
      }

      const shown = interim.trim() || finalText;

      if (shown) {
        captionLine = shown;
        captionUpdatedAt = performance.now();
      }
    };

    recognition.onerror = event => {
      console.warn("SPEECH:", event.error);

      if (
        [
          "not-allowed",
          "service-not-allowed",
          "audio-capture"
        ].includes(event.error)
      ) {
        captionsEnabled = false;
        captionButton.textContent = "CAPTIONS OFF";
      }
    };

    recognition.onend = () => {
      speechProgress.clear();

      if (!captionsEnabled) return;

      recognitionRestart = setTimeout(() => {
        if (!captionsEnabled) return;

        recognition.lang = selectedLanguage;
        try { recognition.start(); } catch (_) {}
      }, 500);
    };
  }

  captionsEnabled = true;
  captionButton.textContent = "CAPTIONS ON";

  recognition.lang = selectedLanguage;
  try { recognition.start(); } catch (_) {}
}

function consumeSpeech(event) {
  const voiceScale = voiceSizeFactor();

  for (
    let i = event.resultIndex;
    i < event.results.length;
    i++
  ) {
    const value = (
      event.results[i][0]?.transcript || ""
    ).normalize("NFC").toLocaleUpperCase(selectedLanguage);

    const previous = speechProgress.get(i) || "";

    let same = 0;

    while (
      same < previous.length &&
      same < value.length &&
      previous[same] === value[same]
    ) {
      same++;
    }

    if (same < previous.length) {
      speechProgress.set(i, value);
      continue;
    }

    const addition = value.slice(same);

    for (const ch of addition) {
      // Unicode letters/numbers preserve Chinese characters, Korean
      // syllable blocks, and Spanish accents such as Ñ, Á, Ü.
      if (/[\p{L}\p{N}¿¡?!.,;:'’\-]/u.test(ch)) {
        letterQueue.push({
          ch,
          voiceScale
        });
      } else if (ch === " ") {
        letterQueue.push(null);
      }
    }

    speechProgress.set(i, value);
  }

  if (letterQueue.length > 110) {
    letterQueue.splice(
      0,
      letterQueue.length - 110
    );
  }
}

// =====================================
// CAMERA COORDINATES
// =====================================

function cameraBounds() {
  const vw = camera.videoWidth || 640;
  const vh = camera.videoHeight || 480;

  const s = Math.min(
    width / vw,
    height / vh
  );

  return {
    x: (width - vw * s) / 2,
    y: (height - vh * s) / 2,
    w: vw * s,
    h: vh * s
  };
}

function landmarkPosition(p, b) {
  return {
    x: b.x + (1 - p.x) * b.w,
    y: b.y + p.y * b.h
  };
}

// =====================================
// MAIN DRAW
// =====================================

function draw() {
  background(0);

  const now = performance.now();
  updateVoiceMeter(now);

  if (ready && camera?.readyState >= 2) {
    const b = cameraBounds();

    if (
      !document.hidden &&
      camera.currentTime !== previousVideoTime &&
      now - previousDetection >= 33
    ) {
      previousVideoTime = camera.currentTime;
      previousDetection = now;

      frameContext.drawImage(
        camera,
        0,
        0,
        cameraFrame.width,
        cameraFrame.height
      );

      frameReady = true;

      try {
        const result = tracker.detectForVideo(
          cameraFrame,
          now
        );

        detectedHands = result.landmarks || [];
        lastDetection = now;
      } catch (error) {
        console.warn(error);
        detectedHands = [];
      }
    }

    if (frameReady) {
      drawingContext.save();

      drawingContext.translate(
        b.x + b.w,
        b.y
      );

      drawingContext.scale(-1, 1);
      drawingContext.filter = "grayscale(100%)";

      drawingContext.drawImage(
        cameraFrame,
        0,
        0,
        b.w,
        b.h
      );

      drawingContext.restore();
    }

    if (
      now - lastDetection > 250 ||
      document.hidden
    ) {
      detectedHands = [];
    }

    updateHands(detectedHands, b);
    updatePhysics(now);

    drawLetters(drawingContext);
    drawHandSkeletons(b);

  } else {
    handForces = [];
    previousHands = [];

    updatePhysics(now);
    drawLetters(drawingContext);
  }

  drawCaptions(now);
  drawOverlay(now);
  renderArchive();
}

// =====================================
// HANDS
// =====================================

function updateHands(landmarks, b) {
  const current = landmarks.map(points => {
    const palm = landmarkPosition(points[9], b);
    const tip = landmarkPosition(points[8], b);

    return {
      x: palm.x,
      y: palm.y,
      tipX: tip.x,
      tipY: tip.y
    };
  }).sort((a, b) => a.x - b.x);

  handForces = current.map((hand, i) => {
    const previous = previousHands[i];

    return {
      ...hand,

      dx: previous
        ? Math.max(
            -38,
            Math.min(38, hand.x - previous.x)
          )
        : 0,

      dy: previous
        ? Math.max(
            -38,
            Math.min(38, hand.y - previous.y)
          )
        : 0
    };
  });

  previousHands = current;
}

function drawHandSkeletons(b) {
  push();

  for (const points of detectedHands) {
    noFill();
    stroke(255, 185);
    strokeWeight(3.0);

    for (const chain of HAND_LINKS) {
      beginShape();

      for (const index of chain) {
        const p = landmarkPosition(
          points[index],
          b
        );

        vertex(p.x, p.y);
      }

      endShape();
    }

    noStroke();
    fill(255, 210);

    for (const joint of points) {
      const p = landmarkPosition(joint, b);
      circle(p.x, p.y, 4);
    }
  }

  pop();
}

// =====================================
// CREATE LETTER
// =====================================

function spawnLetter(item) {
  const viewportScale = Math.sqrt(
    width * height / (1440 * 900)
  );

  const birthSize = Math.max(
    30 * viewportScale,
    Math.min(
      325 * viewportScale,
      125 * item.voiceScale * viewportScale
    )
  );

  // NEW:
  // Large letters end up medium-sized.
  // Small letters stay small.
  // All keep their relative differences.

  const restSize = Math.min(
    birthSize,
    SETTLED_SIZE_EXTRA * viewportScale +
    birthSize * SETTLED_SIZE_RATIO
  );

  const spread = Math.min(
    28,
    birthSize * 0.16
  );

  letters.push({
    ch: item.ch,

    x:
      width / 2 +
      (Math.random() - 0.5) * spread,

    y:
      height * 0.44 +
      (Math.random() - 0.5) * spread,

    vx:
      (Math.random() - 0.5) * 2.4,

    vy:
      -1.1 - Math.random() * 0.6,

    angle:
      (Math.random() - 0.5) * 0.26,

    spin:
      (Math.random() - 0.5) * 0.018,

    // NEW SIZE STATE
    size: birthSize,
    birthSize: birthSize,
    restSize: restSize,
    landedAt: null,

    // Original hand deformation
    warpX: 1,
    warpY: 1
  });

  if (letters.length > MAX_LETTERS) {
    letters.splice(
      0,
      letters.length - MAX_LETTERS
    );
  }
}

// =====================================
// NEW: START SETTLING
// =====================================

function beginSettling(body, time) {
  // Only start once.
  // A letter never grows back on its own.
  if (body.landedAt !== null) return;

  body.landedAt = time;
}

// =====================================
// NEW: SMOOTH ONE-WAY SHRINK
// =====================================

function updateSettlingSize(body, time) {
  if (body.landedAt === null) {
    body.size = body.birthSize;
    return;
  }

  const age =
    time - body.landedAt - SHRINK_DELAY;

  const t = Math.max(
    0,
    Math.min(
      1,
      age / SHRINK_DURATION
    )
  );

  // Smoothstep:
  // starts gently, ends gently,
  // never oscillates or bounces.
  const eased = t * t * (3 - 2 * t);

  body.size =
    body.birthSize +
    (body.restSize - body.birthSize) * eased;
}

// =====================================
// ORIGINAL GRAVITY + COLLISIONS
// =====================================

function updatePhysics(time) {
  if (!lastPhysicsFrame) {
    lastPhysicsFrame = time;
  }

  const dt = Math.min(
    1.7,
    Math.max(
      0.4,
      (time - lastPhysicsFrame) / 16.667
    )
  );

  lastPhysicsFrame = time;

  // Speech queue
  if (
    letterQueue.length &&
    time - lastSpawn >= SPAWN_INTERVAL
  ) {
    const item = letterQueue.shift();

    if (item) spawnLetter(item);
    lastSpawn = time;
  }

  const floor = height - 7;
  const ceiling = 7;

  // -----------------------------
  // GRAVITY / HAND INTERACTION
  // -----------------------------

  for (const body of letters) {
    // Replaces previous global crowd shrink.
    // Nothing shrinks until first contact.
    updateSettlingSize(body, time);

    const r = body.size * 0.38;

    body.vy += 0.31 * dt;
    body.vx *= Math.pow(0.988, dt);
    body.spin *= Math.pow(0.986, dt);

    for (const hand of handForces) {
      const anchors = [
        {
          x: hand.x,
          y: hand.y,
          radius: Math.max(
            88,
            body.size * 0.78
          )
        },
        {
          x: hand.tipX,
          y: hand.tipY,
          radius: Math.max(
            49,
            body.size * 0.42
          )
        }
      ];

      for (const anchor of anchors) {
        const dx = body.x - anchor.x;
        const dy = body.y - anchor.y;

        const dist = Math.max(
          0.001,
          Math.hypot(dx, dy)
        );

        const reach = anchor.radius + r;

        if (dist >= reach) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const penetration = reach - dist;

        body.x += nx * penetration * 0.48;
        body.y += ny * penetration * 0.48;

        body.vx +=
          hand.dx * 0.27 * dt +
          nx * penetration * 0.08;

        body.vy +=
          hand.dy * 0.27 * dt +
          ny * penetration * 0.08;

        body.spin +=
          (hand.dx - hand.dy) * 0.0007;

        body.warpX = Math.max(
          0.42,
          Math.min(
            2,
            body.warpX +
            hand.dx * 0.007 -
            Math.abs(nx) *
            penetration * 0.0005
          )
        );

        body.warpY = Math.max(
          0.42,
          Math.min(
            2,
            body.warpY +
            hand.dy * 0.006 -
            Math.abs(ny) *
            penetration * 0.0005
          )
        );
      }
    }

    // MOVEMENT
    body.x += body.vx * dt;
    body.y += body.vy * dt;
    body.angle += body.spin * dt;

    // WALLS
    if (body.x < r) {
      body.x = r;
      body.vx = Math.abs(body.vx) * 0.24;
    }

    if (body.x > width - r) {
      body.x = width - r;
      body.vx = -Math.abs(body.vx) * 0.24;
    }

    if (body.y < ceiling + r) {
      body.y = ceiling + r;
      body.vy = Math.abs(body.vy) * 0.18;
    }

    // NEW: first floor contact
    if (body.y > floor - r) {
      beginSettling(body, time);

      body.y = floor - r;
      body.vy = -Math.abs(body.vy) * 0.12;
      body.vx *= 0.84;
      body.spin *= 0.80;
    }
  }

  // -----------------------------
  // LETTER-LETTER COLLISIONS
  // -----------------------------

  const biggest = letters.reduce(
    (m, a) => Math.max(m, a.size),
    40
  );

  const cellSize = Math.max(
    42,
    biggest * 1.3
  );

  for (let pass = 0; pass < 3; pass++) {
    const cells = new Map();

    for (let i = 0; i < letters.length; i++) {
      const body = letters[i];

      const cx = Math.floor(
        body.x / cellSize
      );

      const cy = Math.floor(
        body.y / cellSize
      );

      const key = cx + "," + cy;

      if (!cells.has(key)) {
        cells.set(key, []);
      }

      cells.get(key).push(i);
    }

    for (let i = 0; i < letters.length; i++) {
      const a = letters[i];

      const cx = Math.floor(
        a.x / cellSize
      );

      const cy = Math.floor(
        a.y / cellSize
      );

      for (let ix = -2; ix <= 2; ix++) {
        for (let iy = -2; iy <= 2; iy++) {
          const near = cells.get(
            (cx + ix) + "," + (cy + iy)
          );

          if (!near) continue;

          for (const j of near) {
            if (j <= i) continue;

            const b = letters[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;

            const minDist =
              (a.size + b.size) * 0.38;

            if (
              dx * dx + dy * dy >=
              minDist * minDist
            ) {
              continue;
            }

            const dist = Math.max(
              0.001,
              Math.hypot(dx, dy)
            );

            const nx =
              dist < 0.002
                ? 0.707
                : dx / dist;

            const ny =
              dist < 0.002
                ? 0.707
                : dy / dist;

            // NEW:
            // If a falling letter touches
            // an already-settled letter,
            // it begins shrinking too.
            //
            // This lets an actual pile form.

            if (
              a.landedAt !== null &&
              b.landedAt === null &&
              b.y < a.y
            ) {
              beginSettling(b, time);
            }

            if (
              b.landedAt !== null &&
              a.landedAt === null &&
              a.y < b.y
            ) {
              beginSettling(a, time);
            }

            // Original positional separation
            const push =
              (minDist - dist) * 0.51;

            a.x -= nx * push;
            a.y -= ny * push;

            b.x += nx * push;
            b.y += ny * push;

            const closing =
              (b.vx - a.vx) * nx +
              (b.vy - a.vy) * ny;

            if (closing < 0) {
              const impulse =
                -closing * 0.23;

              a.vx -= impulse * nx;
              a.vy -= impulse * ny;

              b.vx += impulse * nx;
              b.vy += impulse * ny;
            }
          }
        }
      }

      const r = a.size * 0.38;

      a.x = Math.max(
        r,
        Math.min(width - r, a.x)
      );

      a.y = Math.max(
        ceiling + r,
        Math.min(floor - r, a.y)
      );
    }
  }

  if (!detectedHands.length) {
    handForces = [];
    previousHands = [];
  }
}

// =====================================
// ANTON FONT
// =====================================

async function loadTypeface() {
  try {
    if (!window.opentype) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");

        s.src =
          "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js";

        s.onload = resolve;
        s.onerror = reject;

        document.head.appendChild(s);
      });
    }

    const response = await fetch(
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/anton/Anton-Regular.ttf"
    );

    if (!response.ok) {
      throw new Error("FONT DOWNLOAD FAILED");
    }

    typeface = opentype.parse(
      await response.arrayBuffer()
    );

  } catch (error) {
    console.warn("FONT FALLBACK:", error);
  }
}

// =====================================
// GLYPH OUTLINES
// =====================================

function getGlyphOutline(ch) {
  if (!typeface) return null;

  if (glyphCache.has(ch)) {
    return glyphCache.get(ch);
  }

  const fontPath = typeface.getPath(
    ch,
    0,
    0,
    BASE_FONT_SIZE
  );

  const bb = fontPath.getBoundingBox();

  const ox = -(bb.x1 + bb.x2) / 2;
  const oy = -(bb.y1 + bb.y2) / 2;

  const path = new Path2D();

  for (const c of fontPath.commands) {
    if (c.type === "M") {
      path.moveTo(c.x + ox, c.y + oy);

    } else if (c.type === "L") {
      path.lineTo(c.x + ox, c.y + oy);

    } else if (c.type === "Q") {
      path.quadraticCurveTo(
        c.x1 + ox,
        c.y1 + oy,
        c.x + ox,
        c.y + oy
      );

    } else if (c.type === "C") {
      path.bezierCurveTo(
        c.x1 + ox,
        c.y1 + oy,
        c.x2 + ox,
        c.y2 + oy,
        c.x + ox,
        c.y + oy
      );

    } else if (c.type === "Z") {
      path.closePath();
    }
  }

  glyphCache.set(ch, path);
  return path;
}

// =====================================
// MULTILINGUAL FONT FALLBACK
// =====================================

// Anton has strong Latin display glyphs, but not full CJK coverage.
// Use the original Anton outlines for ASCII letters/digits and native
// Canvas fonts for Chinese, Korean and accented Latin characters.
// Native font fallback also works in the transparent PNG / recording.
function useAnton(ch) {
  return !!typeface && /^[A-Z0-9]$/.test(ch);
}

function characterFont(ch, size) {
  if (/[\u3400-\u9FFF\uF900-\uFAFF]/u.test(ch)) {
    return `900 ${size}px "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif`;
  }
  if (/[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u.test(ch)) {
    return `900 ${size}px "Apple SD Gothic Neo", "Noto Sans CJK KR", "Malgun Gothic", sans-serif`;
  }
  return `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
}

// =====================================
// DRAW LETTERS
// =====================================

function drawLetters(ctx) {
  ctx.save();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const body of letters) {
    ctx.save();

    ctx.translate(body.x, body.y);
    ctx.rotate(body.angle);

    if (useAnton(body.ch)) {
      const s = body.size / BASE_FONT_SIZE;

      ctx.scale(
        body.warpX * s,
        body.warpY * s
      );

      ctx.fill(
        getGlyphOutline(body.ch),
        "evenodd"
      );

    } else {
      ctx.scale(
        body.warpX,
        body.warpY
      );

      ctx.font = characterFont(body.ch, body.size);

      ctx.fillText(body.ch, 0, 0);
    }

    ctx.restore();
  }

  ctx.restore();
}

// =====================================
// CAPTIONS — CENTERED
// =====================================

function drawCaptions(now) {
  if (!captionsEnabled || !captionLine) {
    return;
  }

  const age = now - captionUpdatedAt;

  if (age > 3000) {
    captionLine = "";
    return;
  }

  const alpha =
    age < 1400
      ? 255
      : 255 * (
          1 - (age - 1400) / 1600
        );

  push();

  fill(255, alpha);
  noStroke();
  textFont("Arial");
  textSize(
    Math.max(
      16,
      Math.min(23, width * 0.019)
    )
  );

  textAlign(CENTER, CENTER);

  // Correctly centered text box
  text(
    captionLine,
    45,
    height - 125,
    width - 90,
    70
  );

  pop();
}

// =====================================
// SCREEN LABELS
// =====================================

function drawOverlay(now) {
  push();

  noStroke();
  fill(255);
  textFont("monospace");

  textAlign(LEFT, TOP);
  textSize(13);

  text("COOKING FONTS", 20, 22);

  textSize(11);
  textAlign(LEFT, BOTTOM);

  const instruction = !ready
    ? (
        starting
          ? "LOADING CAMERA..."
          : "CLICK ANYWHERE TO START"
      )
    : (
        captionsEnabled
          ? "WHISPER / SPEAK LOUDLY / MOVE YOUR HANDS"
          : "TURN CAPTIONS ON TO START"
      );

  text(
    instruction,
    20,
    height - 20
  );

  if (recorder?.state === "recording") {
    const sec = Math.floor(
      (now - recordStartedAt) / 1000
    );

    textAlign(LEFT, TOP);
    textSize(12);

    text(
      "● REC " +
      Math.floor(sec / 60) +
      ":" +
      String(sec % 60).padStart(2, "0"),
      20,
      48
    );
  }

  pop();
}

// =====================================
// TRANSPARENT ARCHIVE
// =====================================

function renderArchive() {
  if (
    archiveCanvas.width !== width ||
    archiveCanvas.height !== height
  ) {
    archiveCanvas.width = width;
    archiveCanvas.height = height;
  }

  archiveCtx.clearRect(
    0,
    0,
    width,
    height
  );

  drawLetters(archiveCtx);
}

// =====================================
// SAVE TRANSPARENT PNG
// =====================================

function savePNG() {
  if (!letters.length) return;

  const output = document.createElement("canvas");

  output.width = width * 2;
  output.height = height * 2;

  const ctx = output.getContext("2d", {
    alpha: true
  });

  ctx.scale(2, 2);
  drawLetters(ctx);

  output.toBlob(blob => {
    if (blob) {
      downloadBlob(
        blob,
        "COOKING-FONTS-" +
        fileStamp() +
        ".png"
      );
    }
  }, "image/png");
}

// =====================================
// FILE DOWNLOAD
// =====================================

function fileStamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);

  a.click();
  a.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    15000
  );
}

// =====================================
// RECORD VIDEO + AUDIO
// =====================================

function recordingMime() {
  if (!window.MediaRecorder) return "";

  for (const type of [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4"
  ]) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

async function toggleRecording() {
  if (recorder?.state === "recording") {
    recorder.stop();
    return;
  }

  if (
    !ready ||
    !window.MediaRecorder ||
    !archiveCanvas.captureStream
  ) {
    return;
  }

  try {
    if (!micStream?.active) {
      try {
        await startVoiceMeter();
      } catch (error) {
        console.warn("RECORD WITHOUT AUDIO", error);
      }
    }

    renderArchive();

    const canvasStream =
      archiveCanvas.captureStream(30);

    recordingStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...(
        micStream?.active
          ? micStream.getAudioTracks()
          : []
      )
    ]);

    const mime = recordingMime();

    recorder = new MediaRecorder(
      recordingStream,
      {
        ...(mime ? { mimeType: mime } : {}),
        videoBitsPerSecond: 5500000
      }
    );

    const active = recorder;
    recordingChunks = [];

    active.ondataavailable = event => {
      if (event.data?.size) {
        recordingChunks.push(event.data);
      }
    };

    active.onstop = () => {
      const type =
        active.mimeType ||
        mime ||
        "video/webm";

      const blob = new Blob(
        recordingChunks,
        { type }
      );

      if (blob.size) {
        downloadBlob(
          blob,
          "COOKING-FONTS-" +
          fileStamp() +
          (
            type.includes("mp4")
              ? ".mp4"
              : ".webm"
          )
        );
      }

      recordingStream?.getVideoTracks()
        .forEach(track => track.stop());

      recordingStream = null;
      recordStartedAt = 0;

      recordButton.textContent = "● RECORD";
    };

    active.start(500);

    recordStartedAt = performance.now();
    recordButton.textContent = "■ STOP + SAVE";

  } catch (error) {
    console.error("RECORD ERROR:", error);
    recordButton.textContent = "● RECORD";
  }
}

// =====================================
// RESIZE
// =====================================

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
