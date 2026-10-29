# AS SERIES — VS Code website

A single homepage with four original interactive projects. Four irregular bubble-shaped headings at the top, white background. Colors: red / blue / green / magenta (`rgb(233, 0, 255)`).

## Start (recommended)
1. Open the **BODY_AS_SERIES** folder in Visual Studio Code.
2. Install **Live Server** (Ritwick Dey extension) if needed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Use **Chrome** and allow camera/microphone permissions when prompted.

**Hand navigation:** click **ENABLE HAND CURSOR** at bottom right, hover your INDEX finger over a bubble, pinch thumb+index together, drag at least ~65 pixels, release to open. In a project, find **BACK** at bottom right and perform the same gesture.

**Mouse fallback:** simply click any bubble to open; click **BACK** to return. You can also click-drag and release. Keyboard 1-4 opens projects; Escape returns.

Each p5.js sketch runs in a separate iframe to keep its global variables independent. If a sketch needs a camera, click its drawing area to begin. Chrome must access MediaPipe CDN and Google font CDN online. For Breath as Ink, connect an SHT40 ESP32 for breath control, or use its test breath control.

## Layout
- `index.html` — four bubbles and project viewer
- `style.css` — all colors and bubble styling
- `app.js` — webcam hand cursor and pinch navigation
- `projects/*/index.html` and `sketch.js` — your complete four sketches

## Colors
- Body as Matter: `#ff4638`
- Hand as Instrument: `#1d4eff`
- Breath as Ink: `#79c600`
- Body as Grid: `rgb(233, 0, 255)`

The sketches are not rewritten or merged; only the home presentation changed.


## GitHub Pages (public classroom link)
Create a PUBLIC GitHub repository, upload the CONTENTS of BODY_AS_SERIES (index.html, style.css, app.js, projects/), and commit. In Settings > Pages set Deploy from a branch, Branch main, /(root), Save. Wait for the GitHub Pages URL `https://YOUR-USERNAME.github.io/YOUR-REPO/`. The four projects load inside same-origin iframes, and browser permissions for camera/microphone must be allowed on the published HTTPS site. Chrome recommended. After class delete the repo from Settings > General > Danger Zone if you want to remove the public source. Deleting the repo removes the GitHub Pages site, but cannot undo previous clones or copies.
