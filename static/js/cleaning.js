const API = "/api/tags";
let plcCache = {};
let svgDoc = null;
let statusTimer = null;

/* =========================
   SVG LOAD
========================= */
const svgObj = document.getElementById("svgObj");

svgObj.addEventListener("load", () => {
  svgDoc = svgObj.contentDocument;
  bindMachines();
  bindPreCleaner();
  bindDestoner();
  startPLCPolling();
});

/* =========================
   SAFE SVG SELECTOR
========================= */
function getByIdSafe(id) {
  return svgDoc.querySelector(`[id="${id}"]`);
}

/* =========================
   POPUP
========================= */
function showPopup(svgElement, title, startTag, stopTag, runTag) {
  closePopup();

  const rect = svgElement.getBoundingClientRect();
  const popup = document.createElement("div");
  popup.id = "machine-popup";
  popup.style.position = "fixed";
  popup.style.left = rect.right + 10 + "px";
  popup.style.top = rect.top + "px";
  popup.style.zIndex = 9999;
  popup.style.background = "#111";
  popup.style.color = "#0f0";
  popup.style.padding = "10px";
  popup.style.border = "1px solid #0f0";

  popup.innerHTML = `
    <h4>${title}</h4>
    <p>Status: <span id="status-text">---</span></p>
    <button id="btn-start" data-tag="${startTag}">START</button>
    <button id="btn-stop" data-tag="${stopTag}">STOP</button>
    <button id="btn-close">CLOSE</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("btn-start").onclick = e =>
    writeTag(e.target.dataset.tag, true);

  document.getElementById("btn-stop").onclick = e =>
    writeTag(e.target.dataset.tag, false);

  document.getElementById("btn-close").onclick = closePopup;

  statusTimer = setInterval(() => updateStatus(runTag), 1000);
}

function closePopup() {
  if (statusTimer) clearInterval(statusTimer);
  const p = document.getElementById("machine-popup");
  if (p) p.remove();
}

function updateStatus(runTag) {
  const el = document.getElementById("status-text");
  if (!el) return;
  el.innerText = plcCache[runTag] ? "RUNNING" : "STOPPED";
  el.style.color = plcCache[runTag] ? "#0f0" : "red";
}

/* =========================
   TAG WRITE
========================= */
function writeTag(tag, value) {
  console.log("WRITE:", tag, value);
  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag, value })
  });
}

/* =========================
   MACHINE BINDINGS
========================= */
function bindMachines() {
  bind("e_1", "Elevator E1", "E1_RUN", "E1_RUN", "E1_RUN");
  bind("e_2", "Elevator E2", "E2_RUN", "E2_RUN", "E2_RUN");
  bind("e_3", "Elevator E3", "E3_RUN", "E3_RUN", "E3_RUN");
  bind("e_4", "Elevator E4", "E4_RUN", "E4_RUN", "E4_RUN");

  bind("cc_1", "Cleaner CC1", "CC1_RUN", "CC1_RUN", "CC1_RUN");

  bindSwitch("switch1", "SW1");
  bindSwitch("switch2", "SW2");
  bindSwitch("switch3", "SW3");
  bindSwitch("switch4", "SW4");
}

function bind(id, title, startTag, stopTag, runTag) {
  const el = svgDoc.getElementById(id);
  if (!el) return;
  el.style.cursor = "pointer";
  el.style.pointerEvents = "all";
  el.addEventListener("click", () =>
    showPopup(el, title, startTag, stopTag, runTag)
  );
}

/* =========================
   PRE-CLEANER
========================= */
function bindPreCleaner() {
  const pre = getByIdSafe("pre-cleaner 1");
  const blower = svgDoc.getElementById("blower");

  if (!pre || !blower) {
    console.warn("Pre-cleaner or blower not found");
    return;
  }

  // Make sure pre-cleaner itself is interactive
  pre.style.pointerEvents = "all";
  pre.style.cursor = "pointer";

  // Disable pointer events on pre-cleaner children
  pre.querySelectorAll("*").forEach(c => {
    c.style.pointerEvents = "none";
  });

  // 🔥 Intercept clicks on BLOWER and redirect if inside pre-cleaner
  blower.style.pointerEvents = "all";
  blower.style.cursor = "pointer";

  blower.addEventListener("click", e => {
    const { clientX, clientY } = e;

    if (isPointInsideBBox(pre, clientX, clientY)) {
      e.stopPropagation();
      showPopup(
        pre,
        "Pre-Cleaner 1",
        "CLASSIFIER_RUN",
        "CLASSIFIER_RUN",
        "CLASSIFIER_RUN"
      );
    }
  });

  // Direct click on pre-cleaner (if reachable)
  pre.addEventListener("click", () =>
    showPopup(
      pre,
      "Pre-Cleaner 1",
      "CLASSIFIER_RUN",
      "CLASSIFIER_RUN",
      "CLASSIFIER_RUN"
    )
  );
}


/* =========================
   DESTONER
========================= */
function bindDestoner() {
  const el = svgDoc.getElementById("destoner");
  if (!el) return;
  el.style.cursor = "pointer";
  el.style.pointerEvents = "all";
  el.addEventListener("click", () =>
    showPopup(el, "Destoner",
      "DESTONER_RUN", "DESTONER_RUN", "DESTONER_RUN")
  );
}

/* =========================
   SWITCHES
========================= */
function bindSwitch(id, tag) {
  const sw = svgDoc.getElementById(id);
  if (!sw) return;
  sw.style.cursor = "pointer";
  sw.style.pointerEvents = "all";
  sw.addEventListener("click", e => {
    e.stopPropagation();
    writeTag(tag, !plcCache[tag]);
  });
}

/* =========================
   PLC POLLING (FINAL)
========================= */
function startPLCPolling() {
  setInterval(() => {
    fetch(API)
      .then(r => r.json())
      .then(tags => {
        plcCache = tags;

        updateElevatorVisuals();   // 🔥 RESTORED
        updateMachineIndicators();
        updateBinLevels();         // 🔥 RESTORED
        updateDustMachines();      // 🔥 RESTORED
        updateSwitchIndicators();
      });
  }, 1000);
}

/* =========================
   ELEVATOR GLOW
========================= */
function updateElevatorVisuals() {
  glow("e_1", "E1_RUN");
  glow("e_2", "E2_RUN");
  glow("e_3", "E3_RUN");
  glow("e_4", "E4_RUN");
}

/* =========================
   MACHINE GLOW
========================= */
function updateMachineIndicators() {
  glow("cc_1", "CC1_RUN");
  glow("destoner", "DESTONER_RUN");
  glowBySafeId("pre-cleaner 1", "CLASSIFIER_RUN");
}

function glow(id, tag) {
  const el = svgDoc.getElementById(id);
  if (!el) return;
  el.style.filter = plcCache[tag]
    ? "drop-shadow(0 0 8px #00ff00)"
    : "none";
}

function glowBySafeId(id, tag) {
  const el = getByIdSafe(id);
  if (!el) return;
  el.style.filter = plcCache[tag]
    ? "drop-shadow(0 0 8px #00ff00)"
    : "none";
}

/* =========================
   BIN LEVELS (CLIPPED)
========================= */
const BIN_MAP = {
  BIN1_LEVEL: "bin_1",
  BIN2_LEVEL: "bin_2",
  BIN3_LEVEL: "bin_3",
  BIN4_LEVEL: "bin_4",
  BIN5_LEVEL: "bin_5"
};

function updateBinLevels() {
  Object.entries(BIN_MAP).forEach(([tag, id]) => {
    const bin = svgDoc.getElementById(id);
    if (!bin) return;

    const level = Math.max(0, Math.min(100, plcCache[tag] || 0));
    const paths = Array.from(bin.querySelectorAll("path"));
    if (!paths.length) return;

    let bodyPath = paths.reduce((a, b) =>
      b.getTotalLength() > a.getTotalLength() ? b : a);

    const bbox = bodyPath.getBBox();
    const clipId = `clip-${id}`;

    let clip = svgDoc.getElementById(clipId);
    if (!clip) {
      clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
      clip.setAttribute("id", clipId);
      const clone = bodyPath.cloneNode(true);
      clone.style.pointerEvents = "none";
      clip.appendChild(clone);

      let defs = svgDoc.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svgDoc.documentElement.insertBefore(defs, svgDoc.documentElement.firstChild);
      }
      defs.appendChild(clip);
    }

    let fill = bin.querySelector(".bin-fill");
    if (!fill) {
      fill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      fill.classList.add("bin-fill");
      fill.style.pointerEvents = "none";
      fill.setAttribute("clip-path", `url(#${clipId})`);
      bin.appendChild(fill);
    }

    const h = (bbox.height * level) / 100;
    fill.setAttribute("x", bbox.x);
    fill.setAttribute("width", bbox.width);
    fill.setAttribute("y", bbox.y + bbox.height - h);
    fill.setAttribute("height", h);
    fill.setAttribute(
      "fill",
      level >= 90 ? "#ff3333" :
      level >= 70 ? "#ffaa00" :
      "#00cc66"
    );
  });
}

/* =========================
   DUST INDICATORS
========================= */
const DUST_MAP = {
  DUST1_FLOW: "dust_1",
  DUST2_FLOW: "dust_2",
  DUST3_FLOW: "dust_3",
  DUST4_FLOW: "dust_4",
  DUST5_FLOW: "dust_5",
  DUST6_FLOW: "dust_6"
};

function updateDustMachines() {
  Object.entries(DUST_MAP).forEach(([tag, id]) => {
    const el = svgDoc.getElementById(id);
    if (!el) return;
    el.style.opacity = plcCache[tag] ? "1" : "0.3";
    el.style.filter = plcCache[tag]
      ? "drop-shadow(0 0 6px #f1c40f)"
      : "none";
  });
}

/* =========================
   SWITCH INDICATORS
========================= */
function updateSwitchIndicators() {
  ["SW1","SW2","SW3","SW4"].forEach((tag,i)=>{
    const el = svgDoc.getElementById(`switch${i+1}`);
    if (!el) return;
    el.style.filter = plcCache[tag]
      ? "drop-shadow(0 0 6px #00ff00)"
      : "none";
    el.style.opacity = plcCache[tag] ? "1" : "0.6";
  });
}
function isPointInsideBBox(el, x, y) {
  const box = el.getBoundingClientRect();
  return (
    x >= box.left &&
    x <= box.right &&
    y >= box.top &&
    y <= box.bottom
  );
}
