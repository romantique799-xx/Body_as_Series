/* AS SERIES — four original p5.js sketches in separate iframes.
 * Hand control: index fingertip = cursor, thumb+index pinch = grab.
 * Pinch on a title, drag 65px, release = enter; same for BACK.
 */
const PROJECTS = [
  { name: 'BODY AS MATTER', src: './projects/01-voice-as-matter/index.html' },
  { name: 'HAND AS INSTRUMENT', src: './projects/02-hand-as-instrument/index.html' },
  { name: 'BREATH AS INK', src: './projects/03-breath-as-ink/index.html' },
  { name: 'BODY AS GRID', src: './projects/04-body-as-grid/index.html' }
];
const $ = q => document.querySelector(q);
const home = $('#home');
const viewer = $('#viewer');
const frame = $('#project-frame');
const back = $('#back-button');
const handButton = $('#hands-button');
const camStatus = $('#camera-status');
const cursorEl = $('#hand-cursor');
const toast = $('#gesture-message');
const items = [...document.querySelectorAll('.project-item')];
let currentProject = -1;
let gesture = null;
let hovered = null;
let handVideo = null;
let handStream = null;
let landmarker = null;
let handRunning = false;
let handStarting = false;
let videoTime = -1;
let detectedAt = 0;
let lastSeen = 0;
let smoothing = null;
let wasPinched = false;
let messageTimeout = 0;
const DRAG_DISTANCE = 65;
const VISION_JS = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';
const VISION_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

function announce(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => toast.classList.remove('visible'), 2200);
}
function openProject(index) {
  if (index < 0 || index >= PROJECTS.length || currentProject >= 0) return;
  currentProject = index;
  hovered?.classList.remove('hovered');
  hovered = null;
  gesture = null;
  resetAllDrags();
  $('#viewer-name').textContent = PROJECTS[index].name;
  home.hidden = true;
  viewer.hidden = false;
  // Create each sketch fresh; isolates global p5 functions, audio, camera, state.
  frame.src = PROJECTS[index].src;
  if (handRunning) announce('PINCH + PULL BACK TO RETURN');
}
function goHome() {
  if (currentProject < 0) return;
  // Unmount to release each project's camera and audio before opening another.
  frame.src = 'about:blank';
  currentProject = -1;
  viewer.hidden = true;
  home.hidden = false;
  hovered?.classList.remove('hovered');
  hovered = null;
  gesture = null;
  resetAllDrags();
}
function resetDrag(target) {
  if (!target) return;
  target.classList.remove('dragging');
  target.classList.add('drag-return');
  target.style.setProperty('--drag-x','0px');
  target.style.setProperty('--drag-y','0px');
  setTimeout(() => target.classList.remove('drag-return'), 300);
}
function resetAllDrags() { [...items,back].forEach(resetDrag); }
function elementsAvailable() { return currentProject < 0 ? items : [back]; }
function hitTest(x,y) {
  return elementsAvailable().find(el => {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }) || null;
}
function setHovered(target) {
  if (target === hovered) return;
  if (hovered) hovered.classList.remove('hovered');
  hovered = target;
  if (hovered) hovered.classList.add('hovered');
}
function beginGrab(target,x,y,kind) {
  if (!target || gesture) return;
  gesture={target,startX:x,startY:y,kind};
  target.classList.add('dragging');
  target.classList.remove('drag-return');
}
function moveGrab(x,y) {
  if (!gesture) return;
  const dx = x-gesture.startX;
  const dy = y-gesture.startY;
  gesture.target.style.setProperty('--drag-x',`${dx}px`);
  gesture.target.style.setProperty('--drag-y',`${dy}px`);
}
function endGrab(x,y,clicked=false) {
  if (!gesture) return;
  const {target,startX,startY} = gesture;
  gesture = null;
  const distance = Math.hypot(x-startX,y-startY);
  const accepted = distance >= DRAG_DISTANCE || clicked;
  resetDrag(target);
  if (!accepted) return;
  if (target === back) goHome();
  else openProject(Number(target.dataset.project));
}
// Mouse and touch fallback for live projection and testing.
for (const el of [...items,back]) {
  let pointer = null;
  el.addEventListener('pointerenter', () => {if (!handRunning) setHovered(el);});
  el.addEventListener('pointerleave', () => {if (!handRunning && !pointer) setHovered(null);});
  el.addEventListener('pointerdown', e => {
    if (gesture || e.button !== 0) return;
    e.preventDefault();
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY};
    try{el.setPointerCapture(e.pointerId);}catch(_){}
    beginGrab(el,e.clientX,e.clientY,'mouse');
  });
  el.addEventListener('pointermove', e => {
    if (pointer?.id === e.pointerId && gesture?.kind === 'mouse') moveGrab(e.clientX,e.clientY);
  });
  el.addEventListener('pointerup', e => {
    if (pointer?.id !== e.pointerId) return;
    const wasClick = Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y) < 12;
    if (gesture?.kind === 'mouse') endGrab(e.clientX,e.clientY,wasClick);
    pointer=null;
  });
  el.addEventListener('pointercancel', () => {if(gesture?.kind==='mouse'){resetDrag(gesture.target);gesture=null;}pointer=null;});
}
// Keyboard backup: 1–4 launches, Escape returns.
window.addEventListener('keydown', e => {
  if (e.key === 'Escape' && currentProject >= 0) { goHome(); return; }
  if (currentProject < 0 && /^[1-4]$/.test(e.key) && e.target.tagName !== 'INPUT') openProject(Number(e.key)-1);
});

handButton.addEventListener('click', () => {
  if (handRunning) stopHandTracking();
  else startHandTracking();
});
async function startHandTracking() {
  if (handStarting || handRunning) return;
  handStarting=true;
  camStatus.textContent='STARTING HAND TRACKING…';
  handButton.textContent='LOADING HAND MODEL…';
  try {
    const {HandLandmarker,FilesetResolver}=await import(VISION_JS);
    const vision=await FilesetResolver.forVisionTasks(VISION_WASM);
    if(!landmarker) {
      try {
        landmarker=await HandLandmarker.createFromOptions(vision,{
          baseOptions:{modelAssetPath:HAND_MODEL,delegate:'GPU'},
          runningMode:'VIDEO',numHands:1,
          minHandDetectionConfidence:0.42,minHandPresenceConfidence:0.42,minTrackingConfidence:0.42
        });
      } catch(err) {
        landmarker=await HandLandmarker.createFromOptions(vision,{
          baseOptions:{modelAssetPath:HAND_MODEL,delegate:'CPU'},
          runningMode:'VIDEO',numHands:1,
          minHandDetectionConfidence:0.42,minHandPresenceConfidence:0.42,minTrackingConfidence:0.42
        });
      }
    }
    handStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:360}},audio:false});
    handVideo=document.createElement('video');
    handVideo.muted=true;
    handVideo.autoplay=true;
    handVideo.playsInline=true;
    handVideo.srcObject=handStream;
    handVideo.style.cssText='position:fixed;left:-2px;top:-2px;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(handVideo);
    await handVideo.play();
    handRunning=true;
    handButton.innerHTML='HAND CURSOR ON <span class="circle-indicator"></span>';
    handButton.classList.add('live');
    home.classList.add('hand-active');
    camStatus.textContent='SHOW YOUR INDEX FINGER TO THE CAMERA';
    requestAnimationFrame(handLoop);
  }catch(err){
    console.error('Hand cursor:',err);
    camStatus.textContent='CAMERA UNAVAILABLE · USE MOUSE INSTEAD';
    announce('ALLOW CAMERA ACCESS OR USE MOUSE');
    stopHandTracking();
  }finally{handStarting=false;if(!handRunning)handButton.innerHTML='ENABLE HAND CURSOR <span class="circle-indicator"></span>';}
}
function stopHandTracking(){
  handRunning=false;
  handStream?.getTracks().forEach(t=>t.stop());
  handVideo?.remove();
  handVideo=null;handStream=null;
  handButton.innerHTML='ENABLE HAND CURSOR <span class="circle-indicator"></span>';
  handButton.classList.remove('live');
  home.classList.remove('hand-active');
  camStatus.textContent='MOUSE READY · CAMERA OPTIONAL';
  cursorEl.classList.remove('visible','pinched');
  smoothing=null;wasPinched=false;
  if(gesture?.kind==='hand'){resetDrag(gesture.target);gesture=null;}
  setHovered(null);
}
function handLoop(now){
  if(!handRunning)return;
  requestAnimationFrame(handLoop);
  if(!handVideo || handVideo.readyState < 2 || document.hidden)return;
  if(now-detectedAt < 85 || handVideo.currentTime===videoTime)return;
  detectedAt=now;videoTime=handVideo.currentTime;
  try {
    const result=landmarker.detectForVideo(handVideo,now);
    const hand=result.landmarks?.[0];
    if(!hand){
      if(now-lastSeen>420){
        cursorEl.classList.remove('visible','pinched');
        if(gesture?.kind==='hand'){resetDrag(gesture.target);gesture=null;}
        setHovered(null);smoothing=null;wasPinched=false;
      }
      return;
    }
    lastSeen=now;
    // Webcam X is mirrored to match the performer's intuitive movement.
    const rawX=(1-hand[8].x)*innerWidth;
    const rawY=hand[8].y*innerHeight;
    if(!smoothing)smoothing={x:rawX,y:rawY};
    smoothing.x+=(rawX-smoothing.x)*.46;
    smoothing.y+=(rawY-smoothing.y)*.46;
    const {x,y}=smoothing;
    cursorEl.style.left=`${x}px`;cursorEl.style.top=`${y}px`;
    cursorEl.classList.add('visible');
    // Normalize pinch distance by palm width to tolerate camera distance.
    const palm=Math.max(.035,Math.hypot(hand[5].x-hand[17].x,hand[5].y-hand[17].y));
    const pinch=Math.hypot(hand[4].x-hand[8].x,hand[4].y-hand[8].y)/palm;
    const pinched=wasPinched ? pinch<.57 : pinch<.40;
    cursorEl.classList.toggle('pinched',pinched);
    if(!gesture)setHovered(hitTest(x,y));
    if(pinched && !wasPinched && hovered)beginGrab(hovered,x,y,'hand');
    if(pinched && gesture?.kind==='hand')moveGrab(x,y);
    if(!pinched && wasPinched && gesture?.kind==='hand')endGrab(x,y,false);
    wasPinched=pinched;
    camStatus.textContent=currentProject<0 ? 'HAND CONTROL ACTIVE · PINCH / DRAG / RELEASE' : 'PINCH BACK / DRAG / RELEASE';
  }catch(err){console.warn('Hand tracking frame:',err);}
}
window.addEventListener('pagehide',stopHandTracking);
