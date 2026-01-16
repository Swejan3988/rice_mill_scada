/* =========================================================
   GLOBALS
========================================================= */

let PLC = {};
let svg;

/* =========================================================
   MACHINE CONFIG (SVG ID → PLC TAG)
   (Excel & SVG remain unchanged)
========================================================= */

const MACHINE_MAP = {
  // Elevators
  e_1: { name: "Elevator E1", runTag: "E1_RUN" },
  e_2: { name: "Elevator E2", runTag: "E2_RUN" },
  e_3: { name: "Elevator E3", runTag: "E3_RUN" },
  e_4: { name: "Elevator E4", runTag: "E4_RUN" },

  // Cleaning section
  cc_1: { name: "Classifier", runTag: "CC1_RUN" },
  destoner: { name: "Destoner", runTag: "DESTONER_RUN" },
  hulling_c: { name: "Hulling Machine", runTag: "HULLING_RUN" },

  // Add more machines here safely later
};

/* =========================================================
   SVG LOAD
========================================================= */

document.getElementById("svgObj").addEventListener("load", () => {
  svg = document.getElementById("svgObj").contentDocument;

  bindMachineClicks();
  setInterval(pollPLC, 1000);
});

/* =========================================================
   PLC POLLING
========================================================= */

async function pollPLC() {
  const r = await fetch("/tags");
  PLC = await r.json();
  updateVisuals();
}

/* =========================================================
   MACHINE CLICK → POPUP
========================================================= */

function bindMachineClicks() {
  Object.keys(MACHINE_MAP).forEach(svgId => {
    const el = svg.getElementById(svgId);
    if (!el) return;

    el.style.cursor = "pointer";
    el.addEventListener("click", () => openMachinePopup(svgId));
  });
}

/* =========================================================
   POPUP UI
========================================================= */

function openMachinePopup(svgId) {
  closePopup();

  const m = MACHINE_MAP[svgId];
  const running = PLC[m.runTag];

  const overlay = document.createElement("div");
  overlay.id = "machine-popup-overlay";

  overlay.innerHTML = `
    <div class="machine-popup">
      <h3>${m.name}</h3>
      <p>Status:
        <span class="${running ? "run" : "stop"}">
          ${running ? "RUNNING" : "STOPPED"}
        </span>
      </p>

      <div class="btn-row">
        <button class="start" onclick="sendCommand('${m.runTag}', true)">START</button>
        <button class="stop" onclick="sendCommand('${m.runTag}', false)">STOP</button>
      </div>

      <button class="close" onclick="closePopup()">CLOSE</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

/* =========================================================
   COMMAND HANDLER (SIM MODE)
========================================================= */

function sendCommand(tag, desiredState) {
  // For dummy PLC: toggle if needed
  if (PLC[tag] !== desiredState) {
    fetch(`/toggle/${tag}`);
  }
  closePopup();
}

/* =========================================================
   POPUP CLOSE
========================================================= */

function closePopup() {
  const p = document.getElementById("machine-popup-overlay");
  if (p) p.remove();
}

/* =========================================================
   VISUAL UPDATE
========================================================= */

function updateVisuals() {
  Object.entries(MACHINE_MAP).forEach(([svgId, m]) => {
    applyGlow(svgId, PLC[m.runTag]);
  });
}

/* =========================================================
   GLOW EFFECT
========================================================= */

function applyGlow(svgId, on) {
  const g = svg.getElementById(svgId);
  if (!g) return;

  const glow = on ? "drop-shadow(0 0 8px #00ff00)" : "";

  g.querySelectorAll("path, rect, circle, polygon, ellipse, image")
    .forEach(el => el.style.filter = glow);
}

/* =========================================================
   BASIC POPUP STYLES (Injected)
========================================================= */

const style = document.createElement("style");
style.textContent = `
#machine-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.machine-popup {
  background: #111;
  color: #fff;
  padding: 20px 24px;
  border-radius: 10px;
  min-width: 260px;
  text-align: center;
  box-shadow: 0 0 20px #00ff00;
}

.machine-popup h3 {
  margin: 0 0 10px;
}

.machine-popup p {
  margin: 8px 0 16px;
}

.machine-popup .run {
  color: #00ff00;
  font-weight: bold;
}

.machine-popup .stop {
  color: #ff4444;
  font-weight: bold;
}

.btn-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 12px;
}

.machine-popup button {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}

.machine-popup button.start {
  background: #00aa00;
  color: #fff;
}

.machine-popup button.stop {
  background: #cc0000;
  color: #fff;
}

.machine-popup button.close {
  background: #555;
  color: #fff;
  width: 100%;
}
`;
document.head.appendChild(style);
