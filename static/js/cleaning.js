const API = "/api/tags";
let statusTimer = null;
let plcCache = {};
let svgDoc = null;

/* =========================
   WAIT FOR SVG LOAD
========================= */
const svgObj = document.getElementById("svgObj");

svgObj.addEventListener("load", () => {
  svgDoc = svgObj.contentDocument;
  bindElevators(svgDoc);
  startPLCPolling();
});

/* =========================
   POPUP
========================= */
function showPopup(svgElement, title, startTag, stopTag, runTag) {
  closePopup();

  const rect = svgElement.getBoundingClientRect();

  const popup = document.createElement("div");
  popup.id = "machine-popup";
  popup.innerHTML = `
    <h4>${title}</h4>
    <p>Status: <span id="status-text">---</span></p>
    <button id="btn-start">START</button>
    <button id="btn-stop">STOP</button>
    <button id="btn-close">CLOSE</button>
  `;

  popup.style.position = "fixed";
  popup.style.left = rect.right + 10 + "px";
  popup.style.top = rect.top + "px";
  popup.style.zIndex = 9999;

  document.body.appendChild(popup);

  document.getElementById("btn-start").onclick = () =>
    writeTag(startTag, true);

  document.getElementById("btn-stop").onclick = () =>
    writeTag(stopTag, true);

  document.getElementById("btn-close").onclick = closePopup;

  statusTimer = setInterval(() => updateStatus(runTag), 1000);
}

function closePopup() {
  if (statusTimer) {
    clearInterval(statusTimer);
    statusTimer = null;
  }
  const p = document.getElementById("machine-popup");
  if (p) p.remove();
}

/* =========================
   TAG IO
========================= */
function writeTag(tag, value) {
  console.log("WRITE:", tag, value);

  fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag, value })
  })
    .then(r => r.json())
    .then(res => console.log("PLC:", res))
    .catch(err => console.error("API ERROR:", err));
}

function updateStatus(runTag) {
  const el = document.getElementById("status-text");
  if (!el) return;

  el.innerText = plcCache[runTag] ? "RUNNING" : "STOPPED";
  el.style.color = plcCache[runTag] ? "green" : "red";
}

/* =========================
   SVG BINDINGS
========================= */
function bindElevators(svgDoc) {
  bind(svgDoc, "e_1", "Elevator E1", "E1_CMD_START", "E1_CMD_STOP", "E1_RUN");
  bind(svgDoc, "e_2", "Elevator E2", "E2_CMD_START", "E2_CMD_STOP", "E2_RUN");
  bind(svgDoc, "e_3", "Elevator E3", "E3_CMD_START", "E3_CMD_STOP", "E3_RUN");
  bind(svgDoc, "e_4", "Elevator E4", "E4_CMD_START", "E4_CMD_STOP", "E4_RUN");
}

function bind(svgDoc, id, title, startTag, stopTag, runTag) {
  const el = svgDoc.getElementById(id);
  if (!el) {
    console.warn("SVG element not found:", id);
    return;
  }

  el.style.cursor = "pointer";
  el.addEventListener("click", () =>
    showPopup(el, title, startTag, stopTag, runTag)
  );
}

/* =========================
   PLC POLLING (ONE LOOP)
========================= */
function startPLCPolling() {
  setInterval(() => {
    fetch(API)
      .then(r => r.json())
      .then(tags => {
        plcCache = tags;
        updateElevatorAnimations();
        updateBinLevels();
      });
  }, 1000);
}

/* =========================
   ELEVATOR ANIMATION
========================= */
function updateElevatorAnimations() {
  animateElevator("e_1", "E1_RUN");
  animateElevator("e_2", "E2_RUN");
  animateElevator("e_3", "E3_RUN");
  animateElevator("e_4", "E4_RUN");
}

function animateElevator(elevatorId, runTag) {
  if (!svgDoc) return;

  const el = svgDoc.getElementById(elevatorId);
  if (!el) return;

  if (plcCache[runTag]) {
    el.classList.add("elevator-running");
  } else {
    el.classList.remove("elevator-running");
  }
}

/* =========================
   BIN LEVEL BARS
========================= */
function updateBinLevels() {
  updateBin("bin1-fill", plcCache.BIN1_LEVEL);
  updateBin("bin2-fill", plcCache.BIN2_LEVEL);
  updateBin("bin3-fill", plcCache.BIN3_LEVEL);
  updateBin("bin4-fill", plcCache.BIN4_LEVEL);
  updateBin("bin5-fill", plcCache.BIN5_LEVEL);
}

function updateBin(id, level) {
  const el = document.getElementById(id);
  if (!el || level === undefined) return;

  el.style.height = level + "%";

  if (level < 60) el.style.background = "green";
  else if (level < 85) el.style.background = "orange";
  else el.style.background = "red";
}
