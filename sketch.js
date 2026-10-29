
/*
  BODY AS GRID — CLASS DEMO / PRESET TEXTS
  Click blank canvas to start.
  Clear All, then click blank canvas for next preset.
  T = Test Turn (keyboard only)
  F = Calibrate Front
  P = PNG
  Space = Order
*/

// ===== EDIT YOUR CLASS PRESENTATION TEXTS HERE =====
// Add as many passages as you wish.
// Separate passages with commas.
// Use backticks for multi-line texts.


const PRESET_TEXTS = [

  // 01 — BLACK HOLES / ASTRONOMY
  `A black hole is a region of spacetime where gravity is so strong that nothing, including light, can escape from within its event horizon. Black holes may form when massive stars collapse at the end of their lives, while supermassive black holes are found at the centers of many galaxies. Although a black hole itself emits no visible light, astronomers can study the behavior of matter surrounding it. Gas falling toward a black hole may form a rapidly rotating accretion disk, heating to extremely high temperatures and producing intense radiation. The paths of nearby stars can reveal the presence of an otherwise invisible object. When two black holes merge, they create gravitational waves that travel across the universe, carrying information about distant cosmic events. Black holes are important subjects in the study of gravity, relativity, thermodynamics, and the fundamental structure of space and time.`,

  // 02 — CAPOEIRA / CULTURE & MOVEMENT
  `Capoeira is an Afro-Brazilian martial art that combines combat, dance, acrobatics, music, and game-like interaction. Developed through the experiences of African and Afro-Brazilian communities, it is practiced in a circle called a roda, where participants take turns engaging in a physical dialogue. Movements include sweeping kicks, evasive steps, handstands, cartwheels, and rapid changes of direction. The rhythm is often guided by the berimbau, a single-string percussion instrument, accompanied by singing and handclapping. Rather than relying only on direct confrontation, capoeira emphasizes timing, improvisation, deception, and the ability to respond to another person's movements. Its history is closely connected to slavery, resistance, cultural expression, and the transformation of traditional practices into a widely recognized art form.`,

  // 03 — ANTIKYTHERA MECHANISM / ANCIENT TECHNOLOGY
  `The Antikythera mechanism is an ancient Greek mechanical device recovered from a shipwreck near the island of Antikythera in 1901. Created during the Hellenistic period, it is widely regarded as the oldest known example of an analogue computer. Its complex arrangement of interlocking bronze gears was designed to model astronomical cycles and predict events such as eclipses. By turning a hand-operated mechanism, a user could follow the apparent movements of celestial bodies and consult displays relating to the passage of time. Modern researchers have studied the surviving fragments using advanced imaging techniques, revealing hidden inscriptions and details of the internal gear system. The extraordinary sophistication of the object has changed how historians understand ancient engineering. It demonstrates that mathematical knowledge, craftsmanship, and mechanical design were closely connected long before the development of modern computers.`,

  // 04 — TARDIGRADES / MICROSCOPIC ANIMALS
  `Tardigrades are microscopic eight-legged animals commonly known as water bears or moss piglets. They live in environments ranging from damp moss and soil to marine sediments and freshwater habitats. Despite their tiny size, some tardigrades can survive extraordinary environmental stress. When conditions become unfavorable, certain species enter a dehydrated state in which their bodies contract and their metabolic activity falls dramatically. In this condition, they may tolerate severe drying, very low temperatures, and other stresses that would be fatal to many animals. Their remarkable resilience has made them important subjects in research into cellular protection and survival. However, tardigrades are not indestructible, and their abilities vary between species and conditions. Their unusual appearance and life history have also made them popular symbols of biological adaptability.`,

  // 05 — BRUTALISM / ARCHITECTURE
  `Brutalist architecture emerged prominently in the decades following the Second World War. Associated with exposed concrete, powerful geometric forms, and the visible expression of structural systems, it became influential in public buildings, universities, housing projects, and cultural institutions. The name is commonly connected to the French expression beton brut, meaning raw concrete. Brutalist architects often preferred the direct presentation of materials and construction methods over decorative surfaces. Large blocks, repetitive windows, deep shadows, projecting elements, and massive sculptural shapes contribute to the distinctive appearance of many buildings. Supporters have praised the honesty, ambition, and dramatic character of the style, while critics have described some examples as cold, intimidating, or difficult to maintain. Brutalism remains a subject of debate, preservation efforts, and renewed architectural interest.`,

  // 06 — MYCORRHIZA / FUNGI & ECOLOGY
  `Mycorrhiza refers to a close association between a fungus and the roots of a plant. In many of these relationships, fungal structures extend into the surrounding soil and help plants obtain nutrients such as phosphorus and nitrogen. In exchange, the fungus receives carbon compounds produced by photosynthesis. These partnerships are widespread across terrestrial ecosystems and have played an important role in the evolutionary history of plants. Different types of mycorrhizal associations involve different arrangements of fungal tissue around or inside plant roots. Their effects can depend on environmental conditions, nutrient availability, and the species involved. Some fungal networks connect the roots of multiple plants, creating opportunities for exchanges and interactions below ground. Scientists study these relationships to better understand soil ecology, plant growth, nutrient cycling, forest ecosystems, and the complex dependencies between organisms.`,

  // 07 — VOYAGER GOLDEN RECORD / SPACE & COMMUNICATION
  `The Voyager Golden Records are two phonograph records carried aboard the Voyager spacecraft launched in 1977. Created as messages from Earth, they contain a selection of sounds and images intended to communicate something about life and culture on our planet. The recordings include natural sounds such as wind, thunder, surf, birds, and whales, as well as music from different traditions and spoken greetings in dozens of languages. The project was organized by a committee led by astronomer Carl Sagan. Images were encoded in analogue form, and instructions were placed on the record covers to explain how the information might be recovered. The records were not designed for an immediate audience. Instead, they represent an attempt to communicate across enormous distances and unknown periods of time. They raise questions about what a civilization chooses to preserve, how meaning can survive without shared language, and whether a message can ever be understood by an unfamiliar intelligence.`,

  // 08 — CHAOS THEORY / MATHEMATICS
  `Chaos theory studies the behavior of certain dynamical systems that are highly sensitive to their initial conditions. In such systems, tiny differences at the beginning of a process can produce increasingly different results over time. This sensitivity is popularly associated with the butterfly effect, an idea that became widely known through the work of meteorologist Edward Lorenz. Chaotic systems are not necessarily random: they may follow precise mathematical rules while remaining difficult to predict over long periods. The movement of fluids, changes in weather, and the behavior of some mechanical and biological systems can exhibit chaotic dynamics. Researchers use mathematical models to examine patterns, trajectories, and the limits of prediction. Chaos theory challenges the assumption that knowing the rules governing a system always makes its future behavior easy to forecast.`,

  // 09 — STARLING MURMURATIONS / COLLECTIVE BEHAVIOR
  `A murmuration is a striking flocking display associated with starlings. Hundreds or thousands of birds may fly together, changing direction in waves that seem to ripple through the sky. The flock can expand, fold, twist, contract, and transform without an obvious leader directing its overall shape. Each bird responds to the movement of nearby individuals, producing a coordinated pattern that emerges from many local interactions. These spectacular formations may help confuse predators and provide protection through collective movement. To an observer on the ground, the flock can resemble a shifting cloud, a moving sculpture, or a dark ribbon constantly redrawing itself. Murmurations have attracted interest from biologists, physicists, and mathematicians because they offer a vivid example of complex collective behavior.`
];


const CAMERA_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

const VISION_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";

const VISION_JS =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs";

const SAMPLE_TEXT = "";
const MAX_CHARS = 1400;

const MIN_TORSO_VISIBILITY = 0.22;
const MIN_LIMB_VISIBILITY = 0.28;
const TURN_CONFIRM_MS = 340;
const RETURN_CONFIRM_MS = 140;
const LOST_POSE_RECESS_MS = 1100;

const POSE_LINKS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],[23,25],[25,27],
  [24,26],[26,28],[27,31],[28,32]
];

let poseModel = null;
let camera = null;
let cameraCanvas = null;
let cameraCtx = null;

let starting = false;
let ready = false;

let startMessage = "CLICK ANYWHERE TO START";

let lastVideoTime = -1;
let lastInferenceAt = 0;
let lastPoseAt = -100000;

let rawPose = null;
let layoutPose = null;

let frontShoulderSign = 0;
let frontHipSign = 0;
let frontShoulderRatio = 0;
let frontHipRatio = 0;

let trackingState = "LOOK AT THE CAMERA";
let suspicionSince = null;
let recoverySince = null;

let autoWander = false;
let testWander = false;
let poseQuality = false;

let typography = [];
let textLines = [];
let currentText = SAMPLE_TEXT;

let rowWidthsCache = [];
let glyphWidthsCache = [];

let inputBox = null;
let editorPanel = null;
let editorToggle = null;
let editorIdleTimer = null;
let typeTimer = null;
let statusLine = null;

let wanderAmount = 0;
let stretchAmount = 0;
let crouchAmount = 0;
let fontSize = 43;

const palette = {
  bg: "#090a0c",
  ink: "#fafafa"
};

// LEFT / RIGHT

let edgeSide = 0;
let edgeStrength = 0;
let smoothedEdgeSide = 0;
let smoothEdgeStrength = 0;

// JUMP

let groundAnkleY = null;
let groundHipY = null;
let jumping = false;
let jumpStartedAt = 0;
let jumpLastEndedAt = -100000;
let floatAmount = 0;

// RECORDING

let recorder = null;
let recordingStream = null;
let recordingCameraStream = null;
let recordingMicStream = null;
let recordedChunks = [];
let recordButton = null;
let recordStart = 0;
let mainCanvas = null;

// =====================================
// NEW: CLASSROOM PRESET QUEUE
// =====================================

let nextPresetIndex = -1;
let presetArmed = true;


function showNextPreset() {
  if (!presetArmed || PRESET_TEXTS.length === 0) {
    return;
  }

  // Pick a random passage.
  let randomIndex = Math.floor(
    Math.random() * PRESET_TEXTS.length
  );

  // Avoid showing the same passage twice in a row.
  if (
    PRESET_TEXTS.length > 1 &&
    randomIndex === nextPresetIndex
  ) {
    const offset = 1 + Math.floor(
      Math.random() * (PRESET_TEXTS.length - 1)
    );

    randomIndex =
      (randomIndex + offset) % PRESET_TEXTS.length;
  }

  nextPresetIndex = randomIndex;
  presetArmed = false;

  inputBox.value = String(
    PRESET_TEXTS[randomIndex] ?? ""
  ).slice(0, MAX_CHARS);

  rebuildText(inputBox.value);
}


// =====================================
// SETUP
// =====================================

function setup() {
  mainCanvas = createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);
  textFont("Arial");

  makeInterface();
  rebuildText("");

  window.addEventListener("pagehide", () => {
    camera?.srcObject?.getTracks()
      .forEach(t => t.stop());

    if (recorder?.state === "recording") {
      recorder.stop();
    }

    recordingMicStream?.getTracks()
      .forEach(t => t.stop());
  });
}

// =====================================
// INITIAL TEXT LAYOUT REFERENCE
// =====================================

// Not a visible frame.
// Does not constrain movement.

function typeFrame() {
  const marginX = Math.max(
    26,
    Math.min(68, width * 0.045)
  );

  const top = Math.max(
    122,
    Math.min(160, height * 0.17)
  );

  const bottom = height - 106;

  return {
    x: marginX,
    y: top,
    w: Math.max(100, width - marginX * 2),
    h: Math.max(110, bottom - top)
  };
}

// =====================================
// COLLAPSIBLE TEXT EDITOR
// =====================================

function closeEditor() {
  clearTimeout(editorIdleTimer);
  clearTimeout(typeTimer);

  if (
    !editorPanel ||
    editorPanel.style.display === "none"
  ) {
    return;
  }

  rebuildText(inputBox.value);

  editorPanel.style.display = "none";
  inputBox.blur();

  editorToggle.textContent =
    "TYPE ANYTHING";
}

function planEditorClose() {
  clearTimeout(editorIdleTimer);

  editorIdleTimer = setTimeout(
    closeEditor,
    3000
  );
}

// =====================================
// INTERFACE
// =====================================

function makeInterface() {
  const panel = document.createElement("div");

  panel.style.cssText = [
    "position:fixed",
    "z-index:9999",
    "top:20px",
    "left:20px",
    "display:flex",
    "flex-direction:column",
    "align-items:flex-start",
    "gap:9px",
    "color:white",
    "max-width:62vw"
  ].join(";");

  document.body.appendChild(panel);

  const title = document.createElement("div");

  title.textContent = "BODY AS GRID";

  title.style.cssText =
    "font:12px monospace;" +
    "letter-spacing:.08em;" +
    "text-shadow:0 1px 6px black";

  panel.appendChild(title);

  // EDITOR BUTTON

  editorToggle =
    document.createElement("button");

  editorToggle.type = "button";

  editorToggle.textContent =
    "TYPE ANYTHING";

  editorToggle.style.cssText = [
    "background:rgba(0,0,0,.78)",
    "color:#fff",
    "border:1px solid #777",
    "font:11px monospace",
    "padding:9px 12px",
    "cursor:pointer",
    "border-radius:2px"
  ].join(";");

  panel.appendChild(editorToggle);

  // HIDDEN EDITOR

  editorPanel = document.createElement("div");

  editorPanel.style.cssText = [
    "display:none",
    "width:350px",
    "max-width:62vw",
    "background:rgba(9,10,12,.96)",
    "border:1px solid #777",
    "padding:10px",
    "box-sizing:border-box"
  ].join(";");

  panel.appendChild(editorPanel);

  inputBox = document.createElement("textarea");

  inputBox.value = "";
  inputBox.placeholder = "TYPE ANYTHING...";
  inputBox.maxLength = MAX_CHARS;
  inputBox.rows = 5;
  inputBox.spellcheck = false;

  inputBox.style.cssText = [
    "display:block",
    "box-sizing:border-box",
    "width:100%",
    "min-height:90px",
    "max-height:38vh",
    "background:transparent",
    "color:white",
    "border:0",
    "outline:0",
    "resize:vertical",
    "font:12px/1.55 monospace"
  ].join(";");

  editorPanel.appendChild(inputBox);

  const editHint = document.createElement("div");

  editHint.textContent =
    "AUTO CLOSES AFTER TYPING · CMD/CTRL + ENTER TO FINISH";

  editHint.style.cssText =
    "font:9px/1.5 monospace;" +
    "opacity:.65;" +
    "margin-top:5px";

  editorPanel.appendChild(editHint);

  editorToggle.addEventListener(
    "click",
    event => {
      event.stopPropagation();

      if (
        editorPanel.style.display !== "none"
      ) {
        closeEditor();

      } else {
        editorPanel.style.display = "block";

        editorToggle.textContent =
          "CLOSE EDITOR −";

        inputBox.focus();

        inputBox.setSelectionRange(
          inputBox.value.length,
          inputBox.value.length
        );
      }
    }
  );

  inputBox.addEventListener("input", () => {
    // Manual typing overrides a pending preset.

    presetArmed = false;

    clearTimeout(typeTimer);

    typeTimer = setTimeout(() => {
      rebuildText(inputBox.value);
    }, 240);

    planEditorClose();
  });

  inputBox.addEventListener(
    "keydown",
    event => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key === "Enter"
      ) {
        event.preventDefault();
        closeEditor();
        inputBox.blur();

      } else if (
        event.key === "Escape"
      ) {
        event.preventDefault();
        closeEditor();
        inputBox.blur();
      }
    }
  );

  document.addEventListener(
    "pointerdown",
    event => {
      if (
        editorPanel.style.display !== "none" &&
        !panel.contains(event.target)
      ) {
        closeEditor();
      }
    }
  );

  // RIGHT-SIDE CONTROLS

  const controls = document.createElement("div");

  controls.style.cssText = [
    "position:fixed",
    "z-index:9999",
    "top:20px",
    "right:20px",
    "display:flex",
    "flex-wrap:wrap",
    "gap:8px",
    "justify-content:flex-end",
    "max-width:52vw"
  ].join(";");

  document.body.appendChild(controls);

  function button(label, callback) {
    const b = document.createElement("button");

    b.type = "button";
    b.textContent = label;

    b.style.cssText = [
      "background:rgba(0,0,0,.78)",
      "color:#fff",
      "border:1px solid #999",
      "font:11px monospace",
      "padding:10px 12px",
      "cursor:pointer",
      "border-radius:2px"
    ].join(";");

    b.addEventListener("click", event => {
      event.stopPropagation();
      callback();
    });

    controls.appendChild(b);

    return b;
  }

  button("RESET TYPE", () => {
    rebuildText(inputBox.value);
  });

  button("CLEAR ALL", () => {
    clearTimeout(typeTimer);

    inputBox.value = "";

    closeEditor();
    rebuildText("");

    // The next blank click loads the next text.
    presetArmed = true;
  });

  // No TEST TURN button.
  // Real turning stays unchanged.

  button("SAVE PNG", savePNG);

  recordButton = button(
    "● RECORD",
    toggleRecording
  );

  // BOTTOM-LEFT STATUS

  statusLine = document.createElement("div");

  statusLine.style.cssText = [
    "position:fixed",
    "left:20px",
    "bottom:14px",
    "z-index:999",
    "font:10px monospace",
    "color:white",
    "text-shadow:0 1px 7px black",
    "pointer-events:none",
    "max-width:90vw"
  ].join(";");

  statusLine.textContent = startMessage;

  document.body.appendChild(statusLine);
}

// =====================================
// CAMERA + PRESET CLICK HANDLING
// =====================================

async function mousePressed(event) {
  if (
    event?.target?.closest?.(
      "button,input,textarea,select"
    )
  ) {
    return;
  }

  // NEW:
  // After camera is running, a blank click
  // shows the next preset only if CLEAR ALL
  // has armed the next passage.

  if (ready) {
    if (presetArmed) {
      showNextPreset();
    }

    return;
  }

  if (starting) return;

  starting = true;
  startMessage = "LOADING BODY TRACKING...";

  try {
    const {
      PoseLandmarker,
      FilesetResolver
    } = await import(VISION_JS);

    const vision =
      await FilesetResolver.forVisionTasks(
        VISION_WASM
      );

    try {
      poseModel =
        await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: CAMERA_MODEL,
              delegate: "GPU"
            },

            runningMode: "VIDEO",
            numPoses: 1,

            minPoseDetectionConfidence: 0.36,
            minPosePresenceConfidence: 0.36,
            minTrackingConfidence: 0.35
          }
        );

    } catch (gpuError) {
      poseModel =
        await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: CAMERA_MODEL,
              delegate: "CPU"
            },

            runningMode: "VIDEO",
            numPoses: 1,

            minPoseDetectionConfidence: 0.36,
            minPosePresenceConfidence: 0.36,
            minTrackingConfidence: 0.35
          }
        );
    }

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

    camera.style.cssText =
      "position:fixed;" +
      "width:1px;" +
      "height:1px;" +
      "opacity:0;" +
      "pointer-events:none";

    document.body.appendChild(camera);

    await camera.play();

    cameraCanvas =
      document.createElement("canvas");

    cameraCanvas.width = camera.videoWidth;
    cameraCanvas.height = camera.videoHeight;

    cameraCtx =
      cameraCanvas.getContext("2d");

    ready = true;

    startMessage =
      "FACE CAMERA FIRST / SHOULDERS + HIPS IN FRAME";

    // First click also loads preset #1.
    if (presetArmed) {
      showNextPreset();
    }

  } catch (err) {
    console.error(
      "BODY TRACKING START ERROR",
      err
    );

    startMessage =
      "START FAILED / CHECK CAMERA PERMISSIONS / CLICK TO RETRY";

    camera?.srcObject?.getTracks()
      .forEach(t => t.stop());

    camera?.remove();

    camera = null;
    poseModel = null;
  }

  starting = false;
}

// =====================================
// CAMERA COORDINATES
// =====================================

function cameraBounds() {
  if (!camera) {
    return {
      x: 0,
      y: 0,
      w: width,
      h: height
    };
  }

  const w = camera.videoWidth || 640;
  const h = camera.videoHeight || 480;

  const scale = Math.min(
    width / w,
    height / h
  );

  return {
    x: (width - w * scale) / 2,
    y: (height - h * scale) / 2,
    w: w * scale,
    h: h * scale
  };
}

function screenPoint(p, b) {
  return {
    x: b.x + (1 - p.x) * b.w,
    y: b.y + p.y * b.h
  };
}

// =====================================
// POSE TRACKING
// =====================================

function detectPose(now) {
  if (
    !ready ||
    !poseModel ||
    !camera ||
    camera.readyState < 2
  ) {
    return;
  }

  if (
    document.hidden ||
    camera.currentTime === lastVideoTime ||
    now - lastInferenceAt < 55
  ) {
    return;
  }

  lastVideoTime = camera.currentTime;
  lastInferenceAt = now;

  cameraCtx.drawImage(
    camera,
    0,
    0,
    cameraCanvas.width,
    cameraCanvas.height
  );

  try {
    const result =
      poseModel.detectForVideo(
        cameraCanvas,
        now
      );

    const points = result.landmarks?.[0];

    if (points?.length === 33) {
      const shouldersReliable =
        [11, 12].every(i =>
          (points[i].visibility ?? 0) >=
          MIN_TORSO_VISIBILITY
        );

      const hipsReliable =
        [23, 24].some(i =>
          (points[i].visibility ?? 0) >=
          MIN_TORSO_VISIBILITY * 0.75
        );

      if (
        shouldersReliable &&
        hipsReliable
      ) {
        rawPose = points;
        lastPoseAt = now;
        poseQuality = true;

        const b = cameraBounds();

        const newPose =
          points.map(p => screenPoint(p, b));

        if (!layoutPose) {
          layoutPose = newPose;

        } else {
          for (let i = 0; i < 33; i++) {
            const visible =
              points[i].visibility ?? 0;

            if (
              visible < 0.17 &&
              ![11, 12, 23, 24].includes(i)
            ) {
              continue;
            }

            const follow =
              visible > 0.65 ? 0.31 : 0.17;

            layoutPose[i].x +=
              (newPose[i].x - layoutPose[i].x) *
              follow;

            layoutPose[i].y +=
              (newPose[i].y - layoutPose[i].y) *
              follow;
          }
        }

        updatePosture(points, now);
        updateEdgeAndJump(points, now);
      }
    }

  } catch (err) {
    console.warn("Pose detect:", err);
  }
}

// =====================================
// HELPERS
// =====================================

function poseClamp(v, lo = 0, hi = 1) {
  return Math.max(
    lo,
    Math.min(hi, v)
  );
}

function dist2(a, b) {
  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );
}

function average(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function angleAt(a, b, c) {
  const ux = a.x - b.x;
  const uy = a.y - b.y;

  const vx = c.x - b.x;
  const vy = c.y - b.y;

  const denom = Math.max(
    0.00001,
    Math.hypot(ux, uy) *
    Math.hypot(vx, vy)
  );

  return Math.acos(
    poseClamp(
      (ux * vx + uy * vy) / denom,
      -1,
      1
    )
  ) * 180 / Math.PI;
}

// =====================================
// FRONT CALIBRATION
// =====================================

function calibrateFront() {
  if (
    !rawPose ||
    performance.now() - lastPoseAt > 1800
  ) {
    return;
  }

  const p = rawPose;

  const sh =
    p[11].x - p[12].x;

  const hp =
    p[23].x - p[24].x;

  if (Math.abs(sh) < 0.025) {
    trackingState =
      "FACE STRAIGHT TOWARD THE CAMERA TO CALIBRATE";

    return;
  }

  const torso = Math.max(
    0.06,
    Math.abs(
      (
        p[11].y +
        p[12].y -
        p[23].y -
        p[24].y
      ) * 0.5
    )
  );

  frontShoulderSign = Math.sign(sh);

  frontHipSign =
    Math.abs(hp) > 0.018
      ? Math.sign(hp)
      : frontShoulderSign;

  frontShoulderRatio =
    Math.abs(sh) / torso;

  frontHipRatio =
    Math.abs(hp) / torso;

  suspicionSince = null;
  recoverySince = null;
  autoWander = false;

  trackingState = "FRONT CALIBRATED";
}

// =====================================
// ORIGINAL POSTURE + TURN DETECTION
// =====================================

function updatePosture(points, now) {
  const L = layoutPose;

  // STRETCH

  const shoulder =
    dist2(L[11], L[12]);

  const armSpan =
    dist2(L[15], L[16]);

  const shoulderWidth =
    Math.max(40, shoulder);

  const armsVisible =
    [15, 16].every(i =>
      (points[i].visibility ?? 0) >
      MIN_LIMB_VISIBILITY
    );

  const spread = poseClamp(
    (
      armSpan / shoulderWidth -
      1.25
    ) / 2.1
  );

  const targetStretch =
    armsVisible
      ? spread
      : stretchAmount * 0.99;

  stretchAmount +=
    (targetStretch - stretchAmount) *
    0.14;

  // CROUCH

  const legsVisible =
    [25, 26, 27, 28].every(i =>
      (points[i].visibility ?? 0) >
      MIN_LIMB_VISIBILITY
    );

  if (legsVisible) {
    const leftKnee = angleAt(
      L[23], L[25], L[27]
    );

    const rightKnee = angleAt(
      L[24], L[26], L[28]
    );

    const knees =
      (leftKnee + rightKnee) / 2;

    const bend =
      poseClamp((158 - knees) / 72);

    crouchAmount +=
      (bend - crouchAmount) * 0.12;

  } else {
    crouchAmount *= 0.993;
  }

  // TURN — UNCHANGED

  const shoulderDX =
    points[11].x - points[12].x;

  const hipDX =
    points[23].x - points[24].x;

  const torsoHeight = Math.max(
    0.06,
    Math.abs(
      (
        points[11].y +
        points[12].y -
        points[23].y -
        points[24].y
      ) * 0.5
    )
  );

  const shoulderRatio =
    Math.abs(shoulderDX) / torsoHeight;

  const hipRatio =
    Math.abs(hipDX) / torsoHeight;

  if (
    !frontShoulderSign &&
    shoulderRatio > 0.28 &&
    Math.abs(shoulderDX) > 0.028
  ) {
    calibrateFront();
  }

  if (!frontShoulderSign) {
    trackingState =
      "FACE CAMERA / CALIBRATING";

    return;
  }

  const flipShoulders =
    shoulderDX * frontShoulderSign <
    -torsoHeight * 0.12;

  const flipHips =
    hipDX * frontHipSign <
    -torsoHeight * 0.10;

  const sideways =
    shoulderRatio <
    Math.max(
      0.14,
      frontShoulderRatio * 0.48
    );

  const back =
    flipShoulders ||
    (
      flipHips &&
      shoulderRatio <
      frontShoulderRatio * 0.88
    );

  const appearsTurned =
    back || sideways;

  const appearsFront =
    shoulderDX * frontShoulderSign >
      torsoHeight * 0.20 &&
    shoulderRatio >
      frontShoulderRatio * 0.61 &&
    !flipHips;

  trackingState =
    back
      ? "BACK / TURNED AWAY"
      : sideways
        ? "SIDEWAYS"
        : appearsFront
          ? "FRONT"
          : "TURNING";

  if (appearsTurned) {
    recoverySince = null;

    if (suspicionSince === null) {
      suspicionSince = now;
    }

    if (
      now - suspicionSince >
      TURN_CONFIRM_MS
    ) {
      autoWander = true;
    }

  } else if (appearsFront) {
    suspicionSince = null;

    if (recoverySince === null) {
      recoverySince = now;
    }

    if (
      now - recoverySince >
      RETURN_CONFIRM_MS
    ) {
      autoWander = false;
    }

    frontShoulderRatio +=
      (
        shoulderRatio -
        frontShoulderRatio
      ) * 0.012;

    frontHipRatio +=
      (
        hipRatio -
        frontHipRatio
      ) * 0.012;

  } else {
    suspicionSince = null;
    recoverySince = null;
  }
}

// =====================================
// EDGE + JUMP
// =====================================

function updateEdgeAndJump(points, now) {
  const b = cameraBounds();

  const mid = average(
    average(
      layoutPose[11],
      layoutPose[12]
    ),
    average(
      layoutPose[23],
      layoutPose[24]
    )
  );

  const pos = poseClamp(
    (mid.x - b.x) /
    Math.max(1, b.w)
  );

  // LEFT / RIGHT

  if (pos < 0.32) {
    edgeSide = -1;

    edgeStrength = poseClamp(
      (0.32 - pos) / 0.17
    );

  } else if (pos > 0.68) {
    edgeSide = 1;

    edgeStrength = poseClamp(
      (pos - 0.68) / 0.17
    );

  } else {
    edgeSide = 0;
    edgeStrength = 0;
  }

  // JUMP

  const anklesVisible =
    [27, 28].every(i =>
      (points[i].visibility ?? 0) > 0.34
    );

  const hipsVisible =
    [23, 24].every(i =>
      (points[i].visibility ?? 0) > 0.24
    );

  if (!anklesVisible || !hipsVisible) {
    if (
      jumping &&
      now - jumpStartedAt > 1100
    ) {
      jumping = false;
      jumpLastEndedAt = now;
    }

    return;
  }

  const ankleY =
    (
      points[27].y +
      points[28].y
    ) * 0.5;

  const hipY =
    (
      points[23].y +
      points[24].y
    ) * 0.5;

  if (
    groundAnkleY === null ||
    groundHipY === null
  ) {
    groundAnkleY = ankleY;
    groundHipY = hipY;

    return;
  }

  const footLift =
    groundAnkleY - ankleY;

  const hipLift =
    groundHipY - hipY;

  if (!jumping) {
    if (
      footLift > 0.045 &&
      hipLift > 0.025 &&
      now - jumpLastEndedAt > 500
    ) {
      jumping = true;
      jumpStartedAt = now;

    } else if (
      Math.abs(footLift) < 0.03
    ) {
      groundAnkleY +=
        (ankleY - groundAnkleY) *
        0.014;

      groundHipY +=
        (hipY - groundHipY) *
        0.009;
    }

  } else if (
    (
      footLift < 0.020 &&
      now - jumpStartedAt > 190
    ) ||
    now - jumpStartedAt > 1650
  ) {
    jumping = false;
    jumpLastEndedAt = now;

    groundAnkleY = ankleY;
    groundHipY = hipY;
  }
}

// =====================================
// TEXT WRAPPING
// =====================================

function wrapTextAtSize(
  value,
  size,
  maxTextWidth
) {
  const ctx = drawingContext;

  ctx.save();

  ctx.font =
    `900 ${size}px Arial, Helvetica, sans-serif`;

  const rows = [];

  for (
    const paragraph of
    value.split("\n")
  ) {
    if (paragraph.trim() === "") {
      rows.push("");
      continue;
    }

    let line = "";

    for (
      const word of
      paragraph.split(/\s+/)
    ) {
      const candidate =
        line
          ? line + " " + word
          : word;

      if (
        ctx.measureText(candidate).width <=
        maxTextWidth
      ) {
        line = candidate;
        continue;
      }

      if (line) {
        rows.push(line);
      }

      line = "";

      for (
        const ch of
        Array.from(word)
      ) {
        if (
          line &&
          ctx.measureText(line + ch).width >
          maxTextWidth
        ) {
          rows.push(line);
          line = "";
        }

        line += ch;
      }
    }

    if (line) {
      rows.push(line);
    }
  }

  ctx.restore();

  return rows;
}

// =====================================
// BUILD TYPOGRAPHY
// =====================================

function rebuildText(value) {
  currentText =
    String(value || "").slice(
      0,
      MAX_CHARS
    );

  typography = [];
  textLines = [];

  rowWidthsCache = [];
  glyphWidthsCache = [];

  if (!currentText.trim()) {
    return;
  }

  const f = typeFrame();

  const maxTextWidth = Math.max(
    90,
    Math.min(f.w * 0.79, 900)
  );

  const charsPerLine = Math.max(
    9,
    Math.floor(maxTextWidth / 25)
  );

  const roughRows =
    currentText.length / charsPerLine;

  let chosenSize = poseClamp(
    Math.min(
      55,
      43 - roughRows * 1.45
    ),
    25,
    55
  );

  let rows = wrapTextAtSize(
    currentText,
    chosenSize,
    maxTextWidth
  );

  while (
    chosenSize > 9 &&
    rows.length * chosenSize * 1.34 >
    f.h * 0.83
  ) {
    chosenSize -= 1;

    rows = wrapTextAtSize(
      currentText,
      chosenSize,
      maxTextWidth
    );
  }

  fontSize = chosenSize;
  textLines = rows;

  const ctx = drawingContext;

  ctx.save();

  ctx.font =
    `900 ${fontSize}px Arial, Helvetica, sans-serif`;

  for (const line of textLines) {
    rowWidthsCache.push(
      ctx.measureText(line).width
    );

    let prefix = "";
    const metrics = [];

    for (
      const ch of
      Array.from(line)
    ) {
      metrics.push({
        offset:
          ctx.measureText(prefix).width,

        charWidth:
          ctx.measureText(ch).width
      });

      prefix += ch;
    }

    glyphWidthsCache.push(metrics);
  }

  ctx.restore();

  let globalIndex = 0;

  for (
    let row = 0;
    row < textLines.length;
    row++
  ) {
    const graphemes =
      Array.from(textLines[row]);

    for (
      let col = 0;
      col < graphemes.length;
      col++
    ) {
      typography.push({
        ch: graphemes[col],

        row,
        col,

        count: graphemes.length,
        index: globalIndex++,

        x: width * 0.5,
        y: height * 0.5,

        rotation: 0,

        vx: 0,
        vy: 0,
        vr: 0,

        seed: Math.random() * 1000,
        size: fontSize
      });
    }
  }
}

// =====================================
// BODY ANCHORS
// =====================================

function linePosition(row, count) {
  const f = typeFrame();

  const t =
    count <= 1
      ? 0.5
      : row / (count - 1);

  const L = layoutPose;

  const centralX =
    f.x + f.w * 0.51;

  const centralY =
    f.y + f.h * 0.50;

  const defaultTop =
    centralY -
    (
      count > 11
        ? (count - 1) *
          fontSize * 0.67

        : Math.min(
            f.h * 0.33,
            (count - 1) *
            fontSize * 0.66
          )
    );

  const defaultY =
    defaultTop +
    row * fontSize * 1.34;

  if (
    !L ||
    performance.now() - lastPoseAt > 2600
  ) {
    return {
      x: centralX,
      y: defaultY,
      lean: 0
    };
  }

  const shoulders = average(
    L[11], L[12]
  );

  const wrists = average(
    L[15], L[16]
  );

  const hips = average(
    L[23], L[24]
  );

  const knees = average(
    L[25], L[26]
  );

  const ankles = average(
    L[27], L[28]
  );

  const topAnchor = {
    x:
      shoulders.x * 0.76 +
      wrists.x * 0.24,

    y:
      shoulders.y * 0.82 +
      wrists.y * 0.18
  };

  const middleAnchor = hips;

  const bottomAnchor = {
    x:
      knees.x * 0.78 +
      ankles.x * 0.22,

    y:
      knees.y * 0.74 +
      ankles.y * 0.26
  };

  const interpolation =
    t < 0.5
      ? t * 2
      : (t - 0.5) * 2;

  const p =
    t < 0.5
      ? {
          x:
            topAnchor.x *
            (1 - interpolation) +
            middleAnchor.x *
            interpolation,

          y:
            topAnchor.y *
            (1 - interpolation) +
            middleAnchor.y *
            interpolation
        }
      : {
          x:
            middleAnchor.x *
            (1 - interpolation) +
            bottomAnchor.x *
            interpolation,

          y:
            middleAnchor.y *
            (1 - interpolation) +
            bottomAnchor.y *
            interpolation
        };

  const reference = average(
    shoulders,
    hips
  );

  const x =
    centralX +
    (p.x - reference.x) * 0.42;

  const y =
    defaultY +
    (p.y - reference.y) * 0.25;

  const lean = poseClamp(
    (
      L[12].y - L[11].y
    ) /
    Math.max(
      45,
      dist2(L[11], L[12])
    ),
    -0.32,
    0.32
  );

  return { x, y, lean };
}

// =====================================
// TYPOGRAPHY MOTION
// =====================================

function layoutTargets(now) {
  const rows = textLines.length;

  if (!rows) return;

  const squeeze = crouchAmount;
  const spread = stretchAmount;

  const targetSpacing =
    1 +
    spread * 0.68 -
    squeeze * 0.58;

  const leadingScale =
    1 +
    spread * 0.88 -
    squeeze * 0.82;

  const rowWidths = rowWidthsCache;
  const rowCenters = [];

  for (
    let i = 0;
    i < rows;
    i++
  ) {
    rowCenters.push(
      linePosition(i, rows)
    );
  }

  for (const body of typography) {
    const i = body.row;

    const metric =
      glyphWidthsCache[i]?.[body.col];

    const offset =
      metric?.offset ?? 0;

    const chWidth =
      metric?.charWidth ??
      fontSize * 0.5;

    const p = rowCenters[i];

    const normalizedX =
      (
        offset +
        chWidth * 0.5 -
        rowWidths[i] * 0.5
      ) * targetSpacing;

    const lineOffset =
      (
        i -
        (rows - 1) * 0.5
      ) *
      fontSize *
      1.34 *
      (leadingScale - 1);

    const rowStretch =
      spread *
      0.18 *
      Math.sin(
        i * 2.4 +
        body.seed * 0.01
      );

    const crouchX =
      Math.sin(
        body.index * 2.32
      ) *
      fontSize *
      0.24 *
      squeeze;

    const crouchY =
      Math.cos(
        body.index * 0.87
      ) *
      fontSize *
      0.13 *
      squeeze;

    let orderlyX =
      p.x +
      normalizedX +
      crouchX;

    let orderlyY =
      p.y +
      lineOffset +
      crouchY;

    const orderlyRotation =
      p.lean * 0.45 +
      rowStretch +
      squeeze *
      Math.sin(
        body.index * 0.71
      ) *
      0.17;

    // LEFT / RIGHT

    if (smoothEdgeStrength > 0.001) {
      const side =
        smoothedEdgeSide < 0
          ? -1
          : 1;

      const anchor =
        side < 0
          ? width * 0.13
          : width * 0.87;

      const compactX = poseClamp(
        anchor +
        (orderlyX - width * 0.5) * 0.16,

        side < 0
          ? width * 0.025
          : width * 0.72,

        side < 0
          ? width * 0.28
          : width * 0.975
      );

      const compactY =
        height * 0.52 +
        (
          orderlyY -
          height * 0.5
        ) * 0.72;

      orderlyX +=
        (compactX - orderlyX) *
        smoothEdgeStrength;

      orderlyY +=
        (compactY - orderlyY) *
        smoothEdgeStrength;
    }

    // JUMP

    if (floatAmount > 0.001) {
      const floatY =
        height * 0.12 +
        (
          i -
          (rows - 1) * 0.5
        ) *
        fontSize *
        0.20 +

        Math.sin(
          body.index * 0.73
        ) *
        fontSize *
        0.14;

      orderlyY +=
        (floatY - orderlyY) *
        floatAmount;
    }

    // ORIGINAL TURN / WANDERING

    const t = now * 0.001;
    const id = body.index;

    const roamX =
      Math.sin(
        t * 0.43 +
        body.seed
      ) *
      width * 0.23 +

      Math.cos(
        t * 0.24 +
        id * 1.72
      ) *
      width * 0.18;

    const roamY =
      Math.cos(
        t * 0.37 +
        body.seed * 0.7
      ) *
      height * 0.26 +

      Math.sin(
        t * 0.21 +
        id * 2.6
      ) *
      height * 0.19;

    // No movement boundaries.

    const runningX =
      orderlyX + roamX;

    const runningY =
      orderlyY + roamY;

    const k = wanderAmount;

    const tx =
      orderlyX * (1 - k) +
      runningX * k;

    const ty =
      orderlyY * (1 - k) +
      runningY * k;

    const tr =
      orderlyRotation +

      Math.sin(
        t * 0.77 +
        body.seed
      ) *
      1.25 *
      k;

    // ORIGINAL RETURN SPEED

    const speed =
      k < 0.12
        ? 0.28
        : 0.09;

    body.x +=
      (tx - body.x) *
      speed;

    body.y +=
      (ty - body.y) *
      speed;

    body.rotation +=
      (tr - body.rotation) *
      (
        k < 0.12
          ? 0.30
          : 0.12
      );
  }
}

// =====================================
// MAIN DRAW
// =====================================

function draw() {
  background(palette.bg);

  const now = performance.now();

  detectPose(now);
  drawCamera();

  const poseFresh =
    now - lastPoseAt < 1400;

  if (!poseFresh) {
    poseQuality = false;
  }

  // ORIGINAL TURN LOSS LOGIC

  if (
    ready &&
    frontShoulderSign &&
    now - lastPoseAt >
    LOST_POSE_RECESS_MS
  ) {
    autoWander = true;

    trackingState =
      "BODY NOT VISIBLE / RECESS";
  }

  const wanderTarget =
    testWander || autoWander
      ? 1
      : 0;

  wanderAmount +=
    (wanderTarget - wanderAmount) *
    (
      wanderTarget
        ? 0.046
        : 0.20
    );

  // EDGE

  const edgeTarget =
    poseFresh
      ? edgeStrength
      : 0;

  smoothedEdgeSide +=
    (edgeSide - smoothedEdgeSide) *
    0.18;

  smoothEdgeStrength +=
    (edgeTarget - smoothEdgeStrength) *
    0.12;

  // JUMP

  if (!poseFresh && jumping) {
    jumping = false;
  }

  const floatTarget =
    jumping ? 1 : 0;

  floatAmount +=
    (floatTarget - floatAmount) *
    (
      floatTarget
        ? 0.21
        : 0.035
    );

  layoutTargets(now);

  drawType(drawingContext);

  if (typography.length === 0) {
    drawEmptyHint();
  }

  drawPoseSkeleton();

  drawHeadsUp(now, poseFresh);
  drawInteractionHint();
  drawRecordBadge(now);
}

// =====================================
// CAMERA
// =====================================

function drawCamera() {
  if (
    !cameraCanvas ||
    !ready
  ) {
    return;
  }

  const b = cameraBounds();
  const ctx = drawingContext;

  ctx.save();

  ctx.translate(
    b.x + b.w,
    b.y
  );

  ctx.scale(-1, 1);

  ctx.filter =
    "grayscale(100%) " +
    "brightness(45%) " +
    "contrast(115%)";

  ctx.drawImage(
    cameraCanvas,
    0,
    0,
    b.w,
    b.h
  );

  ctx.restore();

  ctx.save();

  ctx.fillStyle =
    "rgba(5,6,8,.35)";

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  ctx.restore();
}

// =====================================
// DRAW TYPE / NO CLIPPING
// =====================================

function drawType(ctx, scaleFactor = 1) {
  ctx.save();

  ctx.fillStyle = palette.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font =
    `900 ${fontSize * scaleFactor}px Arial, Helvetica, sans-serif`;

  for (const body of typography) {
    if (body.ch === " ") {
      continue;
    }

    ctx.save();

    ctx.translate(
      body.x * scaleFactor,
      body.y * scaleFactor
    );

    ctx.rotate(body.rotation);

    ctx.fillText(
      body.ch,
      0,
      0
    );

    ctx.restore();
  }

  ctx.restore();
}

// =====================================
// EMPTY SCREEN PROMPT
// =====================================

function drawEmptyHint() {
  const ctx = drawingContext;

  ctx.save();

  ctx.font =
    `${Math.min(16, width * 0.025)}px Arial, sans-serif`;

  ctx.fillStyle =
    "rgba(175,175,175,.70)";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const hint =
    presetArmed && ready
      ? "CLICK ANYWHERE TO SHOW THE NEXT TEXT"
      : "CLICK ANYWHERE OR TYPE ANYTHING TO BEGIN";

  ctx.fillText(
    hint,
    width / 2,
    height / 2
  );

  ctx.restore();
}

// =====================================
// SKELETON
// =====================================

function drawPoseSkeleton() {
  if (
    !poseQuality ||
    !layoutPose
  ) {
    return;
  }

  const ctx = drawingContext;

  ctx.save();

  ctx.lineWidth = 2;

  ctx.strokeStyle =
    "rgba(230,235,245,.48)";

  for (
    const [a, b] of
    POSE_LINKS
  ) {
    if (
      (rawPose?.[a]?.visibility ?? 0) < 0.28 ||
      (rawPose?.[b]?.visibility ?? 0) < 0.28
    ) {
      continue;
    }

    ctx.beginPath();

    ctx.moveTo(
      layoutPose[a].x,
      layoutPose[a].y
    );

    ctx.lineTo(
      layoutPose[b].x,
      layoutPose[b].y
    );

    ctx.stroke();
  }

  ctx.fillStyle =
    "rgba(255,255,255,.84)";

  for (
    const i of
    [11,12,15,16,23,24,25,26,27,28]
  ) {
    if (
      (rawPose?.[i]?.visibility ?? 0) < 0.28
    ) {
      continue;
    }

    ctx.beginPath();

    ctx.arc(
      layoutPose[i].x,
      layoutPose[i].y,
      3.6,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.restore();
}

// =====================================
// STATUS
// =====================================

function drawHeadsUp(now, poseFresh) {
  if (!statusLine) return;

  let state = "ORDER";

  if (wanderAmount > 0.48) {
    state =
      "RECESS / LETTERS ON THE LOOSE";

  } else if (floatAmount > 0.35) {
    state =
      "JUMP / TEXT FLOATING";

  } else if (
    smoothEdgeStrength > 0.42
  ) {
    state =
      (
        edgeSide < 0
          ? "LEFT"
          : "RIGHT"
      ) +
      " / COMPRESSED";

  } else if (crouchAmount > 0.48) {
    state =
      "CROUCH / STACK";

  } else if (stretchAmount > 0.42) {
    state =
      "STRETCH / OPEN SPACE";
  }

  if (!ready) {
    statusLine.textContent =
      startMessage;

  } else if (!poseFresh) {
    statusLine.textContent =
      "TRACKING LOST / COME A LITTLE CLOSER · F = FRONT";

  } else {
    statusLine.textContent =
      state +
      " · " +
      trackingState +
      " · F = CALIBRATE FRONT";
  }
}

// =====================================
// BOTTOM CENTER INSTRUCTIONS
// =====================================

function drawInteractionHint() {
  const ctx = drawingContext;

  ctx.save();

  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle =
    "rgba(255,255,255,0.85)";

  const line =
    "STRETCH · CROUCH · JUMP · TURN AWAY & BACK · MOVE LEFT & RIGHT";

  if (
    ctx.measureText(line).width <
    width - 32
  ) {
    ctx.fillText(
      line,
      width / 2,
      height - 65
    );

  } else {
    ctx.fillText(
      "STRETCH · CROUCH · JUMP · TURN AWAY & BACK",
      width / 2,
      height - 76
    );

    ctx.fillText(
      "MOVE LEFT & RIGHT",
      width / 2,
      height - 59
    );
  }

  ctx.restore();
}

// =====================================
// RECORD INDICATOR
// =====================================

function drawRecordBadge(now) {
  if (
    recorder?.state !== "recording"
  ) {
    return;
  }

  const sec = Math.floor(
    (now - recordStart) / 1000
  );

  const stamp =
    `● REC ${
      String(
        Math.floor(sec / 60)
      ).padStart(2, "0")
    }:${
      String(
        sec % 60
      ).padStart(2, "0")
    }`;

  const ctx = drawingContext;

  ctx.save();

  ctx.fillStyle = "#fff";
  ctx.font = "12px monospace";
  ctx.textAlign = "right";

  ctx.fillText(
    stamp,
    width - 24,
    height - 24
  );

  ctx.restore();
}

// =====================================
// TRANSPARENT PNG
// =====================================

function savePNG() {
  if (!typography.length) return;

  const out =
    document.createElement("canvas");

  const scale = 2;

  out.width =
    Math.round(width * scale);

  out.height =
    Math.round(height * scale);

  const ctx = out.getContext(
    "2d",
    { alpha: true }
  );

  ctx.clearRect(
    0,
    0,
    out.width,
    out.height
  );

  drawType(ctx, scale);

  out.toBlob(blob => {
    if (!blob) return;

    downloadBlob(
      blob,
      "BODY-AS-GRID-" +
      Date.now() +
      ".png"
    );

  }, "image/png");
}

// =====================================
// DOWNLOAD
// =====================================

function downloadBlob(blob, filename) {
  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement("a");

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
// VIDEO RECORDING
// =====================================

function bestVideoMime() {
  if (!window.MediaRecorder) {
    return "";
  }

  return [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4"
  ].find(type =>
    MediaRecorder.isTypeSupported(type)
  ) || "";
}

async function toggleRecording() {
  if (
    recorder?.state === "recording"
  ) {
    recorder.stop();
    return;
  }

  if (
    !ready ||
    !window.MediaRecorder ||
    !mainCanvas?.elt?.captureStream
  ) {
    console.warn(
      "START CAMERA FIRST / USE CHROME FOR RECORDING"
    );

    return;
  }

  try {
    recordingCameraStream =
      mainCanvas.elt.captureStream(30);

    let tracks = [
      ...recordingCameraStream.getVideoTracks()
    ];

    try {
      recordingMicStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });

      tracks.push(
        ...recordingMicStream.getAudioTracks()
      );

    } catch (error) {
      console.warn(
        "Recording without microphone audio:",
        error
      );
    }

    recordingStream =
      new MediaStream(tracks);

    const mime =
      bestVideoMime();

    const settings = {
      videoBitsPerSecond: 6500000
    };

    if (mime) {
      settings.mimeType = mime;
    }

    recorder = new MediaRecorder(
      recordingStream,
      settings
    );

    const active = recorder;

    recordedChunks = [];

    active.ondataavailable = event => {
      if (event.data?.size) {
        recordedChunks.push(event.data);
      }
    };

    active.onerror = error => {
      console.error(
        "Recording error:",
        error
      );
    };

    active.onstop = () => {
      const type =
        active.mimeType ||
        mime ||
        "video/webm";

      const blob = new Blob(
        recordedChunks,
        { type }
      );

      if (blob.size) {
        downloadBlob(
          blob,
          "BODY-AS-GRID-" +
          Date.now() +
          (
            type.includes("mp4")
              ? ".mp4"
              : ".webm"
          )
        );
      }

      recordingCameraStream?.getTracks()
        .forEach(t => t.stop());

      recordingMicStream?.getTracks()
        .forEach(t => t.stop());

      recordingStream?.getTracks()
        .forEach(t => t.stop());

      recordingCameraStream = null;
      recordingMicStream = null;
      recordingStream = null;

      recordStart = 0;

      if (recordButton) {
        recordButton.textContent =
          "● RECORD";
      }
    };

    active.start(500);

    recordStart =
      performance.now();

    recordButton.textContent =
      "■ STOP + SAVE";

  } catch (error) {
    console.error(
      "RECORD ERROR:",
      error
    );

    recordingCameraStream?.getTracks()
      .forEach(t => t.stop());

    recordingMicStream?.getTracks()
      .forEach(t => t.stop());

    recordButton.textContent =
      "● RECORD";
  }
}

// =====================================
// KEYBOARD SHORTCUTS
// =====================================

function keyPressed() {
  if (
    document.activeElement === inputBox
  ) {
    return;
  }

  if (
    key === "t" ||
    key === "T"
  ) {
    testWander = !testWander;
    return false;
  }

  if (
    key === "f" ||
    key === "F"
  ) {
    calibrateFront();
    return false;
  }

  if (
    key === "p" ||
    key === "P"
  ) {
    savePNG();
    return false;
  }

  if (key === " ") {
    testWander = false;
    autoWander = false;
    return false;
  }
}

// =====================================
// RESIZE
// =====================================

function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  rebuildText(
    inputBox?.value ?? currentText
  );
}
