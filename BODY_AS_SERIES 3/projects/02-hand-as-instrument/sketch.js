let video;
let tracker;
let cameraFrame;
let frameContext;
let frameReady = false;
let context, oscillator, gain;
let recorderAudioDestination;
let captionLine = "";
let captionUpdatedAt = 0;
let archiveCanvas;
let archiveCtx;


const CAPTION_HOLD = 1400;
const CAPTION_FADE = 1600;

// SOFT TYPOGRAPHY + RECORDING
let mainCanvas;
let glyphContours = [];
let currentText = "A";
let typeface = null;
let fontLoading = true;
let typeStatus = "LOADING TYPEFACE";

let characterSelect;
let wordInput;
let captionButton;

// CONVERSATION CAPTIONS
let recognition = null;
let captionsEnabled = false;
let finalCaption = "";
let interimCaption = "";
let captionNotice = "";
let restartRecognitionTimer = null;

// RECORDING
let microphoneStream = null;
let microphoneSource = null;

let previousGesture = null;
let pokeSession = null;
let grabSession = null;

let recorder = null;
let recordingStream = null;
let videoChunks = [];
let recordStartedAt = 0;

let recordButton;
let captureButton;
let resetButton;

// ORIGINAL THEREMIN
let ready = false;
let busy = false;
let statusText = "CLICK TO START";
let detected = [];

let previousTime = -1;
let previousDetection = 0;
let lastResult = 0;
let testUntil = 0;

let smoothPitch = 0.5;
let smoothVolume = 0.25;
let playing = false;
let noteIndex = -1;
let noteLabel = "";

// C MAJOR SCALE
const SCALE_MIDI = [
  60, 62, 64, 65, 67, 69, 71, 72
];

const SCALE_NAMES = [
  "DO", "RE", "MI", "FA",
  "SOL", "LA", "SI", "DO +"
];

const LINKS = [
  [0, 1, 2, 3, 4],
  [0, 5, 6, 7, 8],
  [5, 9, 10, 11, 12],
  [9, 13, 14, 15, 16],
  [13, 17, 18, 19, 20],
  [0, 17]
];


// =====================================
// SETUP
// =====================================

function setup() {

  mainCanvas = createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);

  // Independent recording canvas — transparent background
  archiveCanvas = document.createElement("canvas");
  archiveCanvas.width = width;
  archiveCanvas.height = height;

  archiveCtx = archiveCanvas.getContext("2d", {
    alpha: true
  });

  buildLetter();
  buildControls();
  loadTypeface();

  textFont("monospace");

  document.addEventListener(
    "visibilitychange",
    () => {

      testUntil = 0;
      detected = [];
      mute();

    }
  );

  window.addEventListener(
    "pagehide",
    () => {

      mute();

      if (
        recorder &&
        recorder.state === "recording"
      ) {
        recorder.stop();
      }

      video?.srcObject?.getTracks()
        .forEach(t => t.stop());

      microphoneStream?.getTracks()
        .forEach(t => t.stop());

      captionsEnabled = false;

      if (recognition) {
        try {
          recognition.stop();
        } catch (_) {}
      }

    }
  );
}


// =====================================
// AUDIO
// =====================================

async function enableAudio() {

  if (!context) {

    context = new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    oscillator = context.createOscillator();
    gain = context.createGain();

    oscillator.type = "sine";
    gain.gain.value = 0;

    oscillator.connect(gain);

    gain.connect(context.destination);

    recorderAudioDestination =
      context.createMediaStreamDestination();

    gain.connect(recorderAudioDestination);

    oscillator.start();
  }

  await context.resume();
}


// =====================================
// START CAMERA + TRACKING
// =====================================

async function mousePressed(event) {

  if (
    event?.target?.closest?.(
      "button,input,select"
    )
  ) {
    return;
  }

  // SOUND TEST
  if (
    ready &&
    mouseY > height - 60 &&
    Math.abs(mouseX - width / 2) < 85
  ) {

    try {

      await enableAudio();

      testUntil =
        performance.now() + 700;

    } catch (error) {

      statusText = "AUDIO ERROR";

      console.error(error);
    }

    return;
  }

  if (busy) return;

  if (ready) {

    await enableAudio();
    return;
  }

  busy = true;
  statusText = "LOADING";

  try {

    await enableAudio();

    if (!tracker) {

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
    }

    statusText = "ALLOW CAMERA";

    const stream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode: "user",

          width: {
            ideal: 1280
          },

          height: {
            ideal: 720
          }

        },

        audio: false

      });

    video = document.createElement("video");

    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;

    video.style.cssText =
      "position:fixed;" +
      "width:1px;" +
      "height:1px;" +
      "opacity:0;" +
      "pointer-events:none";

    document.body.appendChild(video);

    await video.play();

    video.width = video.videoWidth;
    video.height = video.videoHeight;

    cameraFrame =
      document.createElement("canvas");

    cameraFrame.width =
      video.videoWidth;

    cameraFrame.height =
      video.videoHeight;

    frameContext =
      cameraFrame.getContext("2d");

    frameReady = false;
    previousTime = -1;
    detected = [];

    ready = true;

    statusText =
      "MOVE A HAND TO THE RIGHT";

  } catch (error) {

    console.error(error);

    mute();

    video?.srcObject?.getTracks()
      .forEach(t => t.stop());

    video?.remove();

    video = null;

    statusText =
      "START FAILED / CLICK TO RETRY";
  }

  busy = false;
}


// =====================================
// CAMERA BOUNDS
// =====================================

function bounds() {

  const vw =
    video.videoWidth || 640;

  const vh =
    video.videoHeight || 480;

  const scale = Math.min(
    width / vw,
    height / vh
  );

  return {

    x: (width - vw * scale) / 2,

    y: (height - vh * scale) / 2,

    w: vw * scale,

    h: vh * scale

  };
}


function position(point, b) {

  return {

    x: b.x + (1 - point.x) * b.w,

    y: b.y + point.y * b.h

  };
}


// =====================================
// MAIN DRAW
// =====================================

function draw() {

  background(0);

  const now = performance.now();

  if (
    ready &&
    video.readyState >= 2
  ) {

    const b = bounds();

    const ctx = drawingContext;

    // CAPTURE AND DETECT SAME FRAME

    if (
      !document.hidden &&
      video.currentTime !== previousTime &&
      now - previousDetection >= 33
    ) {

      previousTime = video.currentTime;

      previousDetection = now;

      frameContext.drawImage(
        video,
        0,
        0,
        cameraFrame.width,
        cameraFrame.height
      );

      frameReady = true;

      try {

        const result =
          tracker.detectForVideo(
            cameraFrame,
            now
          );

        detected = result.landmarks;

        lastResult = now;

        // UPDATE TYPOGRAPHY
        updateLetterFromHands(
          detected,
          b
        );

      } catch (error) {

        console.error(error);

        detected = [];

        previousGesture = null;
        grabSession = null;
        pokeSession = null;

        mute();
      }
    }

    // ORIGINAL BLACK AND WHITE CAMERA

    if (frameReady) {

      ctx.save();

      ctx.translate(
        b.x + b.w,
        b.y
      );

      ctx.scale(-1, 1);

      ctx.filter = "grayscale(100%)";

      ctx.drawImage(
        cameraFrame,
        0,
        0,
        b.w,
        b.h
      );

      ctx.restore();
    }

    if (
      now - lastResult > 250 ||
      document.hidden
    ) {

      detected = [];

      previousGesture = null;
      grabSession = null;
      pokeSession = null;
    }

    // TYPOGRAPHY
    drawSoftLetter();

    // HAND SKELETON
    drawSkeletons(b);

    // ORIGINAL THEREMIN

    const ordered = [...detected].sort(
      (a, b) =>
        (1 - a[9].x) - (1 - b[9].x)
    );

    let pitchHand = null;
    let volumeHand = null;

    if (ordered.length >= 2) {

      volumeHand = ordered[0];

      pitchHand =
        ordered[ordered.length - 1];

    } else if (ordered.length === 1) {

      if (
        1 - ordered[0][9].x >= 0.5
      ) {

        pitchHand = ordered[0];

      } else {

        volumeHand = ordered[0];
      }
    }

    if (pitchHand) {

      const x =
        1 - pitchHand[9].x;

      const targetPitch = constrain(
        (x - 0.5) / 0.45,
        0,
        1
      );

      let targetVolume = 0.25;

      if (volumeHand) {

        const palm =
          volumeHand[9];

        targetVolume = constrain(
          (0.85 - palm.y) / 0.65,
          0,
          1
        );

        const thumb =
          volumeHand[4];

        const index =
          volumeHand[8];

        const wrist =
          volumeHand[0];

        const palmSize = Math.max(
          0.01,

          Math.hypot(
            palm.x - wrist.x,
            palm.y - wrist.y
          )
        );

        const pinch =
          Math.hypot(
            thumb.x - index.x,
            thumb.y - index.y
          ) / palmSize;

        if (pinch < 0.25) {
          targetVolume = 0;
        }
      }

      const scaled =
        targetPitch * SCALE_MIDI.length;

      if (
        noteIndex < 0 ||
        scaled < noteIndex - 0.12 ||
        scaled > noteIndex + 1 + 0.12
      ) {

        noteIndex = Math.min(
          7,
          Math.floor(scaled)
        );
      }

      noteLabel =
        SCALE_NAMES[noteIndex];

      smoothVolume = lerp(
        smoothVolume,
        targetVolume,
        0.2
      );

      const midi =
        SCALE_MIDI[noteIndex];

      const hz =
        440 * Math.pow(
          2,
          (midi - 69) / 12
        );

      playTone(
        hz,
        smoothVolume * 0.15
      );

      statusText =
        context.state !== "running"
          ? "CLICK TO ENABLE AUDIO"
          : volumeHand
            ? noteLabel + " / TWO HANDS"
            : noteLabel + " / ONE HAND";

    } else {

      mute();

      statusText =
        "MOVE A HAND TO THE RIGHT";
    }

  } else {

    drawSoftLetter();
    mute();
  }

  if (
    now < testUntil &&
    !document.hidden
  ) {

    playTone(440, 0.06);

    statusText = "TEST / 440 HZ";
  }

// drawScale();

  drawCaptions();

  drawLabels();

  drawRecordingBadge();
  
  renderArchiveFrame();

}


// =====================================
// HAND SKELETON
// =====================================

function drawSkeletons(b) {

  for (const points of detected) {

    noFill();

    stroke(255);
    strokeWeight(1.5);

    for (const chain of LINKS) {

      beginShape();

      for (const index of chain) {

        const p = position(
          points[index],
          b
        );

        vertex(p.x, p.y);
      }

      endShape();
    }

    noStroke();
    fill(255);

    for (const point of points) {

      const p = position(
        point,
        b
      );

      circle(
        p.x,
        p.y,
        6
      );
    }

    const palm = position(
      points[9],
      b
    );

    textSize(11);
    textAlign(CENTER, CENTER);

    text(
      1 - points[9].x >= 0.5
        ? "PITCH"
        : "VOLUME",

      palm.x,
      palm.y + 26
    );
  }
}


// =====================================
// THEREMIN SOUND
// =====================================

function playTone(hz, amplitude) {

  if (
    !context ||
    document.hidden
  ) {

    mute();
    return;
  }

  oscillator.frequency.setTargetAtTime(
    hz,
    context.currentTime,
    0.008
  );

  gain.gain.setTargetAtTime(
    amplitude,
    context.currentTime,
    0.03
  );

  playing =
    amplitude > 0.001;
}


function mute() {

  playing = false;

  noteIndex = -1;
  noteLabel = "";

  if (context && gain) {

    gain.gain.setTargetAtTime(
      0,
      context.currentTime,
      0.025
    );
  }
}


// =====================================
// ORIGINAL LABELS
// =====================================

function drawLabels() {

  noStroke();
  fill(255);
  textSize(12);

  drawingContext.shadowColor = "black";
  drawingContext.shadowBlur = 5;

  textAlign(LEFT, TOP);

  text(
    "VIRTUAL THEREMIN / BODY TYPE",
    20,
    20
  );

  if (typeStatus) {

    textSize(10);

    text(
      typeStatus,
      20,
      38
    );

    textSize(12);
  }

  textAlign(RIGHT, TOP);

  text(
    statusText,
    width - 20,
    20
  );

  textAlign(LEFT, BOTTOM);

  text(
    "LEFT HAND:VOLUME",
    20,
    height - 20
  );

  textAlign(RIGHT, BOTTOM);

  text(
    "RIGHT HAND:PITCH",
    width - 20,
    height - 20
  );

  textAlign(CENTER, BOTTOM);

  text(
    ready
      ? "[ TEST SOUND ]"
      : "CLICK TO START",

    width / 2,
    height - 20
  );
// INTERACTION HINT
textAlign(CENTER, BOTTOM);
textSize(10);
fill(210);

text(
  "ONE HAND: PINCH, DRAG & POKE  ·  TWO HANDS: STRETCH & SQUEEZE",
  width / 2,
  height - 52
);
  drawingContext.shadowBlur = 0;
}


// =====================================
// RESIZE
// =====================================

function windowResized() {

  resizeCanvas(
    windowWidth,
    windowHeight
  );
}


// =====================================
// MUSIC SCALE
// =====================================

function drawScale() {

  if (!ready || !video) return;

  const b = bounds();

  push();

  textAlign(CENTER, CENTER);
  textSize(12);

  drawingContext.shadowColor = "black";
  drawingContext.shadowBlur = 5;

  for (
    let i = 0;
    i < SCALE_NAMES.length;
    i++
  ) {

    const x =
      b.x +
      (
        0.5 +
        ((i + 0.5) / 8) * 0.45
      ) * b.w;

    const y =
      b.y + b.h - 65;

    noStroke();

    fill(
      255,
      playing && i === noteIndex
        ? 255
        : 150
    );

    text(
      SCALE_NAMES[i],
      x,
      y
    );

    if (
      playing &&
      i === noteIndex
    ) {

      circle(
        x,
        y + 15,
        4
      );
    }
  }

  drawingContext.shadowBlur = 0;

  pop();
}


// =====================================
// TYPOGRAPHY SYSTEM
// =====================================

// DEFAULT A

function buildLetter() {

  const outer = [
    [-182, 179],
    [-61, -181],
    [61, -181],
    [182, 179],
    [77, 179],
    [49, 90],
    [-49, 90],
    [-77, 179]
  ];

  const hole = [
    [-38, 23],
    [0, -90],
    [38, 23]
  ];

  glyphContours = [

    samplePolygon(
      outer,
      2.5
    ),

    samplePolygon(
      hole,
      2.5
    )

  ];

  clearInteraction();
}


// =====================================
// CLEAR INTERACTION
// =====================================

function clearInteraction() {

  previousGesture = null;
  pokeSession = null;
  grabSession = null;
}


// =====================================
// SAMPLE POLYGON
// =====================================

function samplePolygon(corners, step) {

  const result = [];

  for (
    let i = 0;
    i < corners.length;
    i++
  ) {

    const [x0, y0] = corners[i];

    const [x1, y1] =
      corners[
        (i + 1) % corners.length
      ];

    const n = Math.max(
      1,

      Math.ceil(
        Math.hypot(
          x1 - x0,
          y1 - y0
        ) / step
      )
    );

    for (
      let j = 0;
      j < n;
      j++
    ) {

      const t = j / n;

      result.push({

        x: x0 + (x1 - x0) * t,

        y: y0 + (y1 - y0) * t

      });
    }
  }

  return result;
}


// =====================================
// LOAD TYPEFACE
// =====================================

async function loadTypeface() {

  try {

    await new Promise(
      (resolve, reject) => {

        if (window.opentype) {

          resolve();
          return;
        }

        const script =
          document.createElement("script");

        script.src =
          "https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js";

        script.onload = resolve;

        script.onerror = () => reject(
          new Error(
            "Can't load opentype.js"
          )
        );

        document.head.appendChild(script);

      }
    );

    // LOAD ANTON

    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/anton/Anton-Regular.ttf"
    );

    if (!res.ok) {

      throw new Error(
        "Font download failed: " +
        res.status
      );
    }

    typeface = opentype.parse(
      await res.arrayBuffer()
    );

    fontLoading = false;

    typeStatus = "";

    setDisplayedText(currentText);

  } catch (err) {

    fontLoading = false;

    typeStatus =
      "FONT ERROR: " +
      err.message;

    console.error(
      "Typeface could not be loaded:",
      err
    );
  }
}


// =====================================
// OPEN TYPE PATH TO CONTOURS
// =====================================

function pathToContours(commands) {

  const contours = [];

  let contour = [];

  let pen = {
    x: 0,
    y: 0
  };

  let start = {
    x: 0,
    y: 0
  };

  function finish() {

    if (contour.length >= 3) {

      contours.push(contour);
    }

    contour = [];
  }

  function addCurve(
    controls,
    evaluator
  ) {

    let length = 0;

    for (
      let i = 1;
      i < controls.length;
      i++
    ) {

      length += Math.hypot(

        controls[i].x -
        controls[i - 1].x,

        controls[i].y -
        controls[i - 1].y

      );
    }

    const steps = Math.min(
      140,

      Math.max(
        2,
        Math.ceil(length / 2.5)
      )
    );

    for (
      let i = 1;
      i <= steps;
      i++
    ) {

      contour.push(
        evaluator(i / steps)
      );
    }
  }

  for (const c of commands) {

    if (c.type === "M") {

      finish();

      pen = {
        x: c.x,
        y: c.y
      };

      start = {...pen};

      contour.push({...pen});

    } else if (c.type === "L") {

      const end = {
        x: c.x,
        y: c.y
      };

      addCurve(
        [pen, end],

        t => ({

          x:
            pen.x +
            (end.x - pen.x) * t,

          y:
            pen.y +
            (end.y - pen.y) * t

        })
      );

      pen = end;

    } else if (c.type === "Q") {

      const a = {...pen};

      const b = {
        x: c.x1,
        y: c.y1
      };

      const end = {
        x: c.x,
        y: c.y
      };

      addCurve(
        [a, b, end],

        t => {

          const u = 1 - t;

          return {

            x:
              u * u * a.x +
              2 * u * t * b.x +
              t * t * end.x,

            y:
              u * u * a.y +
              2 * u * t * b.y +
              t * t * end.y

          };
        }
      );

      pen = end;

    } else if (c.type === "C") {

      const a = {...pen};

      const b = {
        x: c.x1,
        y: c.y1
      };

      const d = {
        x: c.x2,
        y: c.y2
      };

      const end = {
        x: c.x,
        y: c.y
      };

      addCurve(
        [a, b, d, end],

        t => {

          const u = 1 - t;

          return {

            x:
              u * u * u * a.x +
              3 * u * u * t * b.x +
              3 * u * t * t * d.x +
              t * t * t * end.x,

            y:
              u * u * u * a.y +
              3 * u * u * t * b.y +
              3 * u * t * t * d.y +
              t * t * t * end.y

          };
        }
      );

      pen = end;

    } else if (c.type === "Z") {

      finish();

      pen = {...start};
    }
  }

  finish();

  return contours;
}


// =====================================
// DISPLAY LETTER OR WORD
// =====================================

function setDisplayedText(textValue) {

  const next =
    String(textValue || "A")
      .toUpperCase()

      .replace(
        /[^A-Z 0-9?!.,'-]/g,
        ""
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim()

      .slice(0, 22) || "A";

  currentText = next;

  // KEEP ORIGINAL A

  if (next === "A") {

    buildLetter();

    if (resetButton) {

      resetButton.textContent =
        "RESET";
    }

    return;
  }

  if (!typeface) {

    typeStatus =
      "WAITING FOR TYPEFACE / ORIGINAL A ONLY";

    return;
  }

  const designFontSize = Math.min(
    380,
    2100 / currentText.length
  );

  const path =
    typeface.getPath(
      currentText,
      0,
      0,
      designFontSize
    );

  const rawContours =
    pathToContours(
      path.commands
    );

  const points =
    rawContours.flat();

  if (!points.length) return;

  const left = Math.min(
    ...points.map(p => p.x)
  );

  const right = Math.max(
    ...points.map(p => p.x)
  );

  const top = Math.min(
    ...points.map(p => p.y)
  );

  const bottom = Math.max(
    ...points.map(p => p.y)
  );

  const rawW = Math.max(
    1,
    right - left
  );

  const rawH = Math.max(
    1,
    bottom - top
  );

  const targetW =
    currentText.length === 1
      ? 365
      : 565;

  const ratio = Math.min(
    targetW / rawW,
    360 / rawH
  );

  const midX =
    (left + right) / 2;

  const midY =
    (top + bottom) / 2;

  glyphContours =
    rawContours.map(
      contour =>

        contour.map(
          p => ({

            x:
              (p.x - midX) * ratio,

            y:
              (p.y - midY) * ratio

          })
        )
    );

  clearInteraction();

  if (resetButton) {

    resetButton.textContent =
      "RESET ";
  }
}


// =====================================
// LETTER COORDINATES
// =====================================

function letterScale() {

  return Math.min(
    width / 720,
    height / 540
  );
}


function screenToLetter(point) {

  const s = letterScale();

  return {

    x:
      (point.x - width / 2) / s,

    y:
      (point.y - height / 2) / s

  };
}


// =====================================
// DRAW LETTER OR WORD
// =====================================

function drawSoftLetter() {

  const ctx = drawingContext;

  const s = letterScale();

  ctx.save();

  ctx.translate(
    width / 2,
    height / 2
  );

  ctx.scale(s, s);

  ctx.beginPath();

  for (
    const contour of glyphContours
  ) {

    traceGlyphContour(
      ctx,
      contour
    );
  }

  ctx.fillStyle = "white";

  ctx.shadowColor =
    "rgba(0,0,0,0.85)";

  ctx.shadowBlur = 12;

  ctx.shadowOffsetY = 2;

  ctx.fill("evenodd");

  ctx.restore();
}

function renderArchiveFrame() {
  if (!archiveCtx || !archiveCanvas) return;

  // Keep archive canvas the same size as the screen
  if (
    archiveCanvas.width !== width ||
    archiveCanvas.height !== height
  ) {
    archiveCanvas.width = width;
    archiveCanvas.height = height;
  }

  const ctx = archiveCtx;

  // Transparent background. No camera, no UI.
  ctx.clearRect(
    0,
    0,
    archiveCanvas.width,
    archiveCanvas.height
  );

  // Use exactly the same glyph geometry as the live screen
  const s = letterScale();

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(s, s);

  ctx.beginPath();

  for (const contour of glyphContours) {
    traceGlyphContour(ctx, contour);
  }

  // Only the white glyph is drawn
  ctx.fillStyle = "#ffffff";
  ctx.fill("evenodd");

  ctx.restore();
}


// =====================================
// DRAW CONTOUR
// =====================================

function traceGlyphContour(
  ctx,
  points
) {

  if (!points.length) return;

  ctx.moveTo(
    points[0].x,
    points[0].y
  );

  for (
    let i = 1;
    i < points.length;
    i++
  ) {

    ctx.lineTo(
      points[i].x,
      points[i].y
    );
  }

  ctx.closePath();
}


// =====================================
// LOCAL SCULPTING
// =====================================

function sculptLocal(
  cx,
  cy,
  dx,
  dy,
  radius = 58
) {

  if (
    !Number.isFinite(dx + dy) ||
    Math.hypot(dx, dy) < 0.65
  ) {

    return;
  }

  dx = constrain(
    dx,
    -17,
    17
  );

  dy = constrain(
    dy,
    -17,
    17
  );

  const denom =
    2 * radius * radius;

  for (
    const list of glyphContours
  ) {

    for (const p of list) {

      const r2 =
        (p.x - cx) ** 2 +
        (p.y - cy) ** 2;

      const effect = Math.exp(
        -r2 / denom
      );

      p.x += dx * effect;
      p.y += dy * effect;
    }
  }
}


// =====================================
// TWO-HAND SQUEEZE / STRETCH
// =====================================

function sculptTwoHands(
  prev,
  curr
) {

  const currentCx =
    (curr.a.x + curr.b.x) / 2;

  const currentCy =
    (curr.a.y + curr.b.y) / 2;

  const prevGapX =
    prev.b.x - prev.a.x;

  const nextGapX =
    curr.b.x - curr.a.x;

  const prevGapY =
    Math.abs(
      prev.b.y - prev.a.y
    );

  const nextGapY =
    Math.abs(
      curr.b.y - curr.a.y
    );

  let changeX = constrain(
    nextGapX - prevGapX,
    -20,
    20
  );

  let changeY = constrain(
    nextGapY - prevGapY,
    -20,
    20
  );

  if (
    Math.abs(changeX) < 1.2
  ) {

    changeX = 0;
  }

  if (
    Math.abs(changeY) < 1.2
  ) {

    changeY = 0;
  }

  if (
    !changeX &&
    !changeY
  ) {

    return;
  }

  for (
    const list of glyphContours
  ) {

    for (const p of list) {

      // HORIZONTAL

      if (changeX) {

        const yWeight = Math.exp(
          -((p.y - currentCy) ** 2) /
          (2 * 102 ** 2)
        );

        const signAndReach = constrain(
          (p.x - currentCx) / 155,
          -1.45,
          1.45
        );

        p.x +=
          changeX *
          signAndReach *
          0.68 *
          yWeight;
      }

      // VERTICAL

      if (changeY) {

        const xWeight = Math.exp(
          -((p.x - currentCx) ** 2) /
          (2 * 102 ** 2)
        );

        const signAndReach = constrain(
          (p.y - currentCy) / 152,
          -1.45,
          1.45
        );

        p.y +=
          changeY *
          signAndReach *
          0.68 *
          xWeight;
      }
    }
  }
}


// =====================================
// POINT INSIDE LETTER
// =====================================

const hitContext =
  document.createElement("canvas")
    .getContext("2d");


function isInsideInk(p) {

  const path = new Path2D();

  for (
    const contour of glyphContours
  ) {

    if (
      contour.length < 3
    ) {

      continue;
    }

    path.moveTo(
      contour[0].x,
      contour[0].y
    );

    for (
      let i = 1;
      i < contour.length;
      i++
    ) {

      path.lineTo(
        contour[i].x,
        contour[i].y
      );
    }

    path.closePath();
  }

  return hitContext.isPointInPath(
    path,
    p.x,
    p.y,
    "evenodd"
  );
}


// =====================================
// NEAREST GLYPH EDGE
// =====================================

function nearestGlyphEdge(p) {

  let best = null;

  let d2Best = Infinity;

  for (
    const contour of glyphContours
  ) {

    for (
      let i = 0;
      i < contour.length;
      i++
    ) {

      const a = contour[i];

      const b =
        contour[
          (i + 1) % contour.length
        ];

      const vx =
        b.x - a.x;

      const vy =
        b.y - a.y;

      const length2 = Math.max(
        0.001,
        vx * vx + vy * vy
      );

      const t = constrain(
        (
          (p.x - a.x) * vx +
          (p.y - a.y) * vy
        ) / length2,

        0,
        1
      );

      const x =
        a.x + t * vx;

      const y =
        a.y + t * vy;

      const d2 =
        (x - p.x) ** 2 +
        (y - p.y) ** 2;

      if (d2 < d2Best) {

        const length =
          Math.sqrt(length2);

        best = {

          x,
          y,

          nx: -vy / length,
          ny: vx / length,

          distance:
            Math.sqrt(d2)

        };

        d2Best = d2;
      }
    }
  }

  if (
    best &&
    !isInsideInk({

      x:
        best.x +
        best.nx * 3.5,

      y:
        best.y +
        best.ny * 3.5

    })
  ) {

    best.nx = -best.nx;
    best.ny = -best.ny;
  }

  return best;
}


// =====================================
// HANDS TO TYPOGRAPHY
// =====================================

function updateLetterFromHands(
  landmarks,
  b
) {

  const handsNow =
    landmarks.map(
      points => {

        const palm =
          screenToLetter(
            position(
              points[9],
              b
            )
          );

        const tip =
          screenToLetter(
            position(
              points[8],
              b
            )
          );

        const thumb =
          screenToLetter(
            position(
              points[4],
              b
            )
          );

        const wrist =
          screenToLetter(
            position(
              points[0],
              b
            )
          );

        const palmSize = Math.max(
          6,

          Math.hypot(
            palm.x - wrist.x,
            palm.y - wrist.y
          )
        );

        const pinching =
          Math.hypot(
            tip.x - thumb.x,
            tip.y - thumb.y
          ) <
          palmSize * 0.57;

        return {

          palm,
          tip,
          thumb,
          pinching,

          pinchPoint: {

            x:
              (tip.x + thumb.x) / 2,

            y:
              (tip.y + thumb.y) / 2

          }

        };

      }
    ).sort(
      (a, b) =>
        a.palm.x - b.palm.x
    );

  // TWO HANDS

  if (
    handsNow.length >= 2
  ) {

    const now = {

      a:
        handsNow[0].palm,

      b:
        handsNow[1].palm

    };

    if (
      previousGesture?.type === "two"
    ) {

      sculptTwoHands(
        previousGesture,
        now
      );
    }

    previousGesture = {

      type: "two",

      ...now

    };

    grabSession = null;
    pokeSession = null;

    return;
  }

  previousGesture = null;

  // NO HANDS

  if (
    handsNow.length === 0
  ) {

    pokeSession = null;
    grabSession = null;

    return;
  }

  // ONE HAND

  const hand =
    handsNow[0];

  // PINCH TO GRAB

  if (hand.pinching) {

    pokeSession = null;

    const p =
      hand.pinchPoint;

    if (!grabSession) {

      const edge =
        nearestGlyphEdge(p);

      if (
        isInsideInk(p) ||
        (
          edge &&
          edge.distance < 42
        )
      ) {

        grabSession = {
          previous: p
        };
      }

    } else {

      const old =
        grabSession.previous;

      sculptLocal(

        (p.x + old.x) / 2,

        (p.y + old.y) / 2,

        (p.x - old.x) * 1.5,

        (p.y - old.y) * 1.5,

        78

      );

      grabSession.previous = p;
    }

    return;
  }

  grabSession = null;

  // EDGE POKE

  const tip =
    hand.tip;

  if (!pokeSession) {

    const edge =
      nearestGlyphEdge(tip);

    if (
      edge &&
      edge.distance < 24 &&
      !isInsideInk(tip)
    ) {

      pokeSession = {

        x: edge.x,
        y: edge.y,

        nx: edge.nx,
        ny: edge.ny,

        previous: tip

      };
    }

  } else {

    const poke =
      pokeSession;

    const depth =
      (tip.x - poke.previous.x) *
      poke.nx +

      (tip.y - poke.previous.y) *
      poke.ny;

    if (
      depth > 1.1
    ) {

      sculptLocal(

        poke.x,
        poke.y,

        poke.nx * depth * 1.6,

        poke.ny * depth * 1.6,

        36

      );
    }

    poke.previous = tip;

    if (
      Math.hypot(
        tip.x - poke.x,
        tip.y - poke.y
      ) > 105
    ) {

      pokeSession = null;
    }
  }
}


// =====================================
// INTERFACE CONTROLS
// =====================================

function buildControls() {

  // TOP LEFT: LETTER + WORD

  const top =
    document.createElement("div");

  top.style.cssText =
    "position:fixed;" +
    "z-index:1000;" +
    "top:50px;" +
    "left:18px;" +
    "display:flex;" +
    "gap:9px;" +
    "align-items:center;" +
    "flex-wrap:wrap;" +
    "max-width:90vw;" +
    "font:12px monospace";

  document.body.appendChild(top);

  // LETTER SELECT

  characterSelect =
    document.createElement("select");

  characterSelect.title =
    "Choose a single letter";

  characterSelect.style.cssText =
    "background:rgba(0,0,0,.78);" +
    "color:#fff;" +
    "border:1px solid #fff;" +
    "padding:10px;" +
    "font:12px monospace";

  for (
    const ch of
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  ) {

    const op =
      document.createElement("option");

    op.value = ch;
    op.textContent = ch;

    characterSelect.appendChild(op);
  }

  characterSelect.value = "A";

  characterSelect.addEventListener(
    "change",
    () => {

      wordInput.value = "";

      setDisplayedText(
        characterSelect.value
      );

    }
  );


  // TYPE INPUT

  wordInput =
    document.createElement("input");

  wordInput.type = "text";

  wordInput.placeholder = "Type...";

  wordInput.maxLength = 22;

  wordInput.autocomplete = "off";

  wordInput.spellcheck = false;

  wordInput.setAttribute(
    "aria-label",
    "Type a word or short phrase"
  );

  wordInput.style.cssText =
    "background:rgba(0,0,0,.72);" +
    "color:#fff;" +
    "border:1px solid #fff;" +
    "padding:10px;" +
    "width:155px;" +
    "max-width:42vw;" +
    "font:12px monospace;" +
    "outline:none";

  let inputTimer = null;

  wordInput.addEventListener(
    "input",
    () => {

      clearTimeout(
        inputTimer
      );

      inputTimer = setTimeout(
        () => {

          const value =
            wordInput.value.trim();

          setDisplayedText(
            value ||
            characterSelect.value
          );

        },
        380
      );

    }
  );

  wordInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        clearTimeout(
          inputTimer
        );

        setDisplayedText(
          wordInput.value ||
          characterSelect.value
        );

        wordInput.blur();
      }

    }
  );

  top.appendChild(
    wordInput
  );

  // RIGHT SIDE CONTROLS

  const group =
    document.createElement("div");

  group.style.cssText =
    "position:fixed;" +
    "z-index:1000;" +
    "right:18px;" +
    "top:52px;" +
    "display:flex;" +
    "flex-wrap:wrap;" +
    "justify-content:flex-end;" +
    "gap:7px;" +
    "max-width:68vw";

  document.body.appendChild(group);

  const makeButton = (
    label,
    fn
  ) => {

    const button =
      document.createElement("button");

    button.type = "button";

    button.textContent = label;

    button.style.cssText =
      "font:12px monospace;" +
      "color:#fff;" +
      "background:rgba(0,0,0,.72);" +
      "border:1px solid rgba(255,255,255,.8);" +
      "padding:9px 12px;" +
      "border-radius:3px;" +
      "cursor:pointer;" +
      "min-height:36px";

    button.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        fn();

      }
    );

    group.appendChild(
      button
    );

    return button;
  };

  resetButton = makeButton(
    "RESET",

    () => setDisplayedText(
      currentText
    )
  );

  captureButton = makeButton(
    "SAVE GLYPH PNG",
    takeScreenshot
  );

  recordButton = makeButton(
    "● RECORD",
    toggleRecording
  );

  captionButton = makeButton(
    "CAPTIONS OFF",
    toggleCaptions
  );
}


// =====================================
// FILE NAME
// =====================================

function fileStamp() {

  return new Date()
    .toISOString()
    .replace(
      /[:.]/g,
      "-"
    );
}


// =====================================
// SAVE TRANSPARENT PNG
// =====================================

function takeScreenshot() {

  const points =
    glyphContours.flat();

  if (
    !points.length
  ) {

    return;
  }

  const minX = Math.min(
    ...points.map(p => p.x)
  );

  const maxX = Math.max(
    ...points.map(p => p.x)
  );

  const minY = Math.min(
    ...points.map(p => p.y)
  );

  const maxY = Math.max(
    ...points.map(p => p.y)
  );

  const padding = 24;

  const resolution = 4;

  const output =
    document.createElement("canvas");

  output.width = Math.max(
    2,

    Math.ceil(
      (
        maxX -
        minX +
        2 * padding
      ) * resolution
    )
  );

  output.height = Math.max(
    2,

    Math.ceil(
      (
        maxY -
        minY +
        2 * padding
      ) * resolution
    )
  );

  const ctx =
    output.getContext("2d");

  ctx.scale(
    resolution,
    resolution
  );

  ctx.translate(
    -minX + padding,
    -minY + padding
  );

  ctx.beginPath();

  for (
    const contour of glyphContours
  ) {

    traceGlyphContour(
      ctx,
      contour
    );
  }

  ctx.fillStyle = "white";

  ctx.fill("evenodd");

  output.toBlob(
    blob => {

      if (blob) {

        downloadBlob(

          blob,

          `BODY-TYPE-${currentText.replaceAll(" ", "_")}-${fileStamp()}.png`

        );
      }

    },

    "image/png"
  );
}


// =====================================
// DOWNLOAD BLOB
// =====================================

function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    15000
  );
}


// =====================================
// RECORDING FORMAT
// =====================================

function chosenRecordingMime() {

  if (
    !window.MediaRecorder
  ) {

    return "";
  }

  for (
    const type of [

      "video/webm;codecs=vp9,opus",

      "video/webm;codecs=vp8,opus",

      "video/webm",

      "video/mp4"

    ]
  ) {

    if (
      MediaRecorder.isTypeSupported(
        type
      )
    ) {

      return type;
    }
  }

  return "";
}


// =====================================
// RECORD VIDEO + AUDIO
// =====================================

async function toggleRecording() {

  // STOP

  if (
    recorder &&
    recorder.state === "recording"
  ) {

    recorder.stop();
    return;
  }

  if (!ready) {

    statusText =
      "CLICK THE CANVAS TO START FIRST";

    return;
  }

  if (
    !window.MediaRecorder ||
    !archiveCanvas?.captureStream
  ) {

    statusText =
      "RECORDING NOT SUPPORTED / USE CHROME";

    return;
  }

  try {

    await enableAudio();

    // MICROPHONE
    // Audio goes into recording only

    try {

      if (!microphoneStream) {

        microphoneStream =
          await navigator.mediaDevices.getUserMedia({

            audio: {

              echoCancellation: true,

              noiseSuppression: true,

              autoGainControl: true

            },

            video: false

          });

        microphoneSource =
          context.createMediaStreamSource(
            microphoneStream
          );

        microphoneSource.connect(
          recorderAudioDestination
        );
      }

    } catch (err) {

      console.warn(
        "Microphone unavailable.",
        err
      );

      captionNotice =
        "MIC UNAVAILABLE: RECORDING THEREMIN ONLY";
    }

    // VIDEO
   
renderArchiveFrame();

const canvasStream =
  archiveCanvas.captureStream(30);


    // COMBINE VIDEO AND AUDIO

    recordingStream =
      new MediaStream([

        ...canvasStream.getVideoTracks(),

        ...recorderAudioDestination
          .stream
          .getAudioTracks()

      ]);

    videoChunks = [];

    const mime =
      chosenRecordingMime();

    const options = {

      videoBitsPerSecond: 5500000

    };

    if (mime) {

      options.mimeType = mime;
    }

    recorder =
      new MediaRecorder(
        recordingStream,
        options
      );

    const currentRecorder =
      recorder;

    currentRecorder.ondataavailable =
      event => {

        if (
          event.data &&
          event.data.size > 0
        ) {

          videoChunks.push(
            event.data
          );
        }
      };

    currentRecorder.onerror =
      event => {

        console.error(
          "Recording error",
          event
        );

        statusText =
          "RECORD ERROR";
      };

    currentRecorder.onstop = () => {

      const type =
        currentRecorder.mimeType ||
        mime ||
        "video/webm";

      const extension =
        type.includes("mp4")
          ? "mp4"
          : "webm";

      const blob =
        new Blob(
          videoChunks,
          { type }
        );

      if (
        blob.size > 0
      ) {

        downloadBlob(

          blob,

          `body-as-tool-${fileStamp()}.${extension}`

        );
      }

      recordingStream
        ?.getVideoTracks()
        .forEach(
          t => t.stop()
        );

      microphoneSource
        ?.disconnect();

      microphoneSource = null;

      microphoneStream
        ?.getTracks()
        .forEach(
          t => t.stop()
        );

      microphoneStream = null;

      recordingStream = null;

      recordStartedAt = 0;

      recordButton.textContent =
        "● RECORD";
    };

    currentRecorder.start(500);

    recordStartedAt =
      performance.now();

    recordButton.textContent =
      "■ STOP + SAVE";

  } catch (error) {

    console.error(error);

    statusText =
      "RECORD ERROR / CHECK CONSOLE";

    recordButton.textContent =
      "● RECORD";
  }
}


// =====================================
// RECORDING INDICATOR
// =====================================

function drawRecordingBadge() {

  if (
    !recorder ||
    recorder.state !== "recording"
  ) {

    return;
  }

  push();

  noStroke();
  fill(255);

  const sec = Math.floor(
    (
      performance.now() -
      recordStartedAt
    ) / 1000
  );

  textAlign(
    LEFT,
    CENTER
  );

  textSize(12);

  text(

    `● REC  ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`,

    20,
    52

  );

  pop();
}


// =====================================
// LIVE ENGLISH CAPTIONS
// =====================================

function toggleCaptions() {

  // TURN OFF
  if (captionsEnabled) {

    captionsEnabled = false;

    clearTimeout(restartRecognitionTimer);
    restartRecognitionTimer = null;

    captionLine = "";
    captionUpdatedAt = 0;
    captionNotice = "";

    captionButton.textContent = "CAPTIONS OFF";

    try {
      recognition?.stop();
    } catch (error) {
      console.warn(error);
    }

    return;
  }


  // TURN ON
  const SpeechAPI =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechAPI) {
    statusText = "LIVE CAPTIONS NEED CHROME";
    return;
  }


  if (!recognition) {

    recognition = new SpeechAPI();

    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;


    recognition.onresult = event => {

      if (!captionsEnabled) return;

      let latestInterim = "";
      let latestFinal = "";

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

          latestFinal = phrase;

        } else {

          latestInterim += " " + phrase;
        }
      }

      const nextLine =
        latestInterim.trim() || latestFinal;

      if (nextLine) {

        captionLine = nextLine;

        captionUpdatedAt = performance.now();
      }
    };


    recognition.onerror = event => {

      if (!captionsEnabled) return;

      console.warn(
        "Speech recognition:",
        event.error
      );

      if (
        [
          "not-allowed",
          "service-not-allowed",
          "audio-capture"
        ].includes(event.error)
      ) {

        captionsEnabled = false;

        captionLine = "";
        captionUpdatedAt = 0;

        captionButton.textContent =
          "CAPTIONS OFF";

        statusText = "MICROPHONE UNAVAILABLE";
      }
    };


    recognition.onend = () => {

      if (!captionsEnabled) return;

      restartRecognitionTimer = setTimeout(() => {

        if (captionsEnabled) {

          try {
            recognition.start();
          } catch (error) {
            console.warn(error);
          }
        }

      }, 500);
    };
  }


  captionsEnabled = true;

  captionLine = "";
  captionUpdatedAt = 0;
  captionNotice = "";

  captionButton.textContent = "CAPTIONS ON";

  try {

    recognition.start();

  } catch (error) {

    console.warn(error);

    captionsEnabled = false;

    captionButton.textContent =
      "CAPTIONS OFF";
  }
}


// =====================================
// DRAW LIVE CAPTIONS
// =====================================

function drawCaptions() {

  if (!captionsEnabled || !captionLine) {
    return;
  }


  // =========================
  // FADE TIMING
  // =========================

  const elapsed =
    performance.now() - captionUpdatedAt;

  if (elapsed > CAPTION_HOLD + CAPTION_FADE) {

    captionLine = "";

    return;
  }


  let opacity = 255;

  if (elapsed > CAPTION_HOLD) {

    const t = constrain(
      (elapsed - CAPTION_HOLD) / CAPTION_FADE,
      0,
      1
    );

    // Smooth fade-out
    const eased = t * t * (3 - 2 * t);

    opacity = 255 * (1 - eased);
  }


  // =========================
  // TYPOGRAPHY
  // =========================

  push();

  textFont("Arial");

  textSize(
    constrain(width * 0.019, 16, 23)
  );

  textAlign(CENTER, CENTER);
  textStyle(NORMAL);

  noStroke();

  // WHITE TEXT ONLY
  fill(255, opacity);


  // =========================
  // AUTOMATIC LINE BREAKS
  // =========================

  const maxWidth = Math.max(
    180,
    width - 90
  );

  const words = captionLine.split(/\s+/);

  const lines = [];

  let current = "";

  for (const word of words) {

    const trial = current
      ? current + " " + word
      : word;

    if (
      current &&
      textWidth(trial) > maxWidth
    ) {

      lines.push(current);
      current = word;

    } else {

      current = trial;
    }
  }

  if (current) {
    lines.push(current);
  }


  // Maximum two visible lines
  const visibleLines = lines.slice(-2);


  // =========================
  // CENTER POSITION
  // =========================

  const lineHeight = 28;

  const centerY = height - 100;

  const firstY =
    centerY -
    (visibleLines.length - 1) *
    lineHeight / 2;


  for (
    let i = 0;
    i < visibleLines.length;
    i++
  ) {

    text(
      visibleLines[i],
      width / 2,
      firstY + i * lineHeight
    );
  }

  pop();
}