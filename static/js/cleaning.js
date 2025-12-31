/* ===================== GLOBALS ===================== */

let PLC = {};
let svg, tooltip;

/* ===================== SVG LOAD ===================== */

document.getElementById("svgObj").addEventListener("load", () => {
  svg = document.getElementById("svgObj").contentDocument;

  // Responsive safety
  const rootSvg = svg.documentElement;
  rootSvg.setAttribute("width", "100%");
  rootSvg.setAttribute("height", "100%");
  rootSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  createTooltip();
  bindClicks();
  bindHoverGlow();

  setInterval(pollPLC, 1000);
});

/* ===================== TOOLTIP ===================== */

function createTooltip() {
  tooltip = document.createElement("div");
  tooltip.id = "tooltip";
  Object.assign(tooltip.style, {
    position: "fixed",
    background: "#111",
    color: "#0f0",
    padding: "6px 10px",
    fontSize: "12px",
    borderRadius: "6px",
    pointerEvents: "none",
    display: "none",
    zIndex: 9999
  });
  document.body.appendChild(tooltip);
}

function showTip(e, html) {
  tooltip.innerHTML = html;
  tooltip.style.left = e.clientX + 15 + "px";
  tooltip.style.top = e.clientY + 15 + "px";
  tooltip.style.display = "block";
}

function hideTip() {
  tooltip.style.display = "none";
}

/* ===================== PLC ===================== */

async function pollPLC() {
  const r = await fetch("/tags");
  PLC = await r.json();
  updateVisuals();
}

/* ===================== CLICKS ===================== */

function toggle(tag) {
  fetch(`/toggle/${tag}`);
}

function bindClicks() {
  const map = {
    e_1: "E1_RUN",
    e_2: "E2_RUN",
    e_3: "E3_RUN",
    e_4: "E4_RUN",
    cc_1: "CC1_RUN",
    classifier: "CLASSIFIER_RUN",
    destoner: "DESTONER_RUN",
    hulling_c: "HULLING_RUN",
    switch1: "SW1",
    switch2: "SW2",
    switch3: "SW3",
    switch4: "SW4"
  };

  Object.entries(map).forEach(([id, tag]) => {
    const el = svg.getElementById(id);
    if (!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", () => toggle(tag));
  });
}

/* ===================== HOVER GLOW ===================== */

function bindHoverGlow() {
  ["e_1","e_2","e_3","e_4"].forEach((id,i)=>{
    const el = svg.getElementById(id);
    if (!el) return;

    el.addEventListener("mouseenter", () =>
      applyGlow(id, true, "#00aaff")
    );

    el.addEventListener("mousemove", e => {
      const n = i + 1;
      showTip(e, `
<b>Elevator E${n}</b><br>
Status: ${PLC[`E${n}_RUN`] ? "RUNNING" : "STOPPED"}<br>
Speed: ${PLC[`E${n}_SPEED`]} RPM<br>
Run Hrs: ${PLC[`E${n}_HOURS`].toFixed(2)}<br>
Idle Hrs: ${PLC[`E${n}_IDLE`].toFixed(2)}
      `);
    });

    el.addEventListener("mouseleave", () => {
      hideTip();
      updateVisuals();
    });
  });
}

/* ===================== VISUAL UPDATE ===================== */

function updateVisuals() {

  /* ---- EQUIPMENT GLOW ---- */
  applyGlow("e_1", PLC.E1_RUN);
  applyGlow("e_2", PLC.E2_RUN);
  applyGlow("e_3", PLC.E3_RUN);
  applyGlow("e_4", PLC.E4_RUN);

  applyGlow("cc_1", PLC.CC1_RUN);
  applyGlow("classifier", PLC.CLASSIFIER_RUN);
  applyGlow("destoner", PLC.DESTONER_RUN);
  applyGlow("hulling_c", PLC.HULLING_RUN);

  applyGlow("switch1", PLC.SW1);
  applyGlow("switch2", PLC.SW2);
  applyGlow("switch3", PLC.SW3);
  applyGlow("switch4", PLC.SW4);

  /* ---- DUST ---- */
  applyGlow("dust_1", PLC.DUST1_FLOW, "orange");
  applyGlow("dust_2", PLC.DUST2_FLOW, "orange");
  applyGlow("dust_3", PLC.DUST3_FLOW, "orange");

/* ---- PIPE FLOW (DIRECTIONAL) ---- */

/* E1 → bin_1, bin_2 */
pipeFlow("pipe_1", PLC.E1_RUN, "down");
pipeFlow("pipe_12", PLC.E1_RUN, "down");
pipeFlow("pipe_13", PLC.E1_RUN, "down");

/* E2 → bin_3 */
pipeFlow("pipe_5", PLC.E2_RUN, "down");

/* bin_3 → classifier */
pipeFlow("pipe_4", PLC.CLASSIFIER_RUN, "right");

/* classifier → dust_1 */
pipeFlow("pipe_14", PLC.DUST1_FLOW, "right", true);

/* E3 → bin_4 */
pipeFlow("pipe_7", PLC.E3_RUN, "down");

/* bin_4 → destoner */
pipeFlow("pipe_3", PLC.DESTONER_RUN, "right");

/* destoner → dust_2 */
pipeFlow("pipe_8", PLC.DUST2_FLOW, "right", true);

/* E4 → bin_5 */
pipeFlow("pipe_10", PLC.E4_RUN, "down");

/* bin_5 → dust_3 */
pipeFlow("pipe_9", PLC.DUST3_FLOW, "right", true);

/* Main header / trunk pipe */
pipeFlow("e2d", PLC.E1_RUN || PLC.E2_RUN || PLC.E3_RUN || PLC.E4_RUN, "right");


  /* ---- BIN LEVEL ---- */
  fillBin("bin_1", PLC.BIN1_LEVEL);
  fillBin("bin_2", PLC.BIN2_LEVEL);
  fillBin("bin_3", PLC.BIN3_LEVEL);
  fillBin("bin_4", PLC.BIN4_LEVEL);
  fillBin("bin_5", PLC.BIN5_LEVEL);
}

/* ===================== SAFE GLOW ===================== */

function applyGlow(groupId, on, color = "#00ff00") {
  const g = svg.getElementById(groupId);
  if (!g) return;

  const glow = on ? `drop-shadow(0 0 8px ${color})` : "";
  g.querySelectorAll("rect, path, circle, polygon, ellipse, image")
    .forEach(el => el.style.filter = glow);
}

/* ===================== PIPE FLOW (DIRECTION) ===================== */

function pipeFlow(pipeId, on, direction = "right", dust = false) {
  const pipeGroup = svg.getElementById(pipeId);
  if (!pipeGroup) return;

  // 🔥 target real drawable elements
  const shapes = pipeGroup.matches("path, rect")
    ? [pipeGroup]
    : pipeGroup.querySelectorAll("path, rect");

  shapes.forEach(shape => {
    normalizePipe(shape);

    if (!on) {
      shape.style.animation = "";
      shape.style.strokeDasharray = "";
      shape.style.strokeDashoffset = "0";
      shape.style.stroke = "black";
      return;
    }

    shape.style.strokeDasharray = "14 14";
    shape.style.stroke = dust ? "orange" : "#00ff00";

    const dir = (direction === "left" || direction === "up") ? 1 : -1;
    const animName = `flow-${pipeId}-${direction}`;

    shape.style.animation = `${animName} ${dust ? 0.6 : 1}s linear infinite`;

    if (!svg.getElementById(animName)) {
      const style = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "style"
      );
      style.id = animName;
      style.textContent = `
        @keyframes ${animName} {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: ${28 * dir}; }
        }
      `;
      svg.documentElement.appendChild(style);
    }
  });
}



/* ===================== BIN FILL ===================== */

function fillBin(binId, level = 0) {
  const bin = svg.getElementById(binId);
  if (!bin) return;

  level = Math.max(0, Math.min(level, 100));

  const rectBody = bin.querySelector("rect");
  const cone = bin.querySelector("path, polygon");
  if (!rectBody || !cone) return;

  const rectBox = rectBody.getBBox();
  const coneBox = cone.getBBox();

  const CONE_PART = 30;
  const RECT_PART = 70;

  /* ---- CONE ---- */
  let coneFill = bin.querySelector(".bin-fill-cone");
  if (!coneFill) {
    coneFill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    coneFill.setAttribute("class", "bin-fill-cone");
    coneFill.setAttribute("fill", "#7CFC00");
    coneFill.setAttribute("opacity", "0.85");
    bin.appendChild(coneFill);
  }

  const coneLevel = Math.min(level, CONE_PART) / CONE_PART;
  const coneHeight = coneBox.height * coneLevel;

  coneFill.setAttribute("x", coneBox.x);
  coneFill.setAttribute("y", coneBox.y + coneBox.height - coneHeight);
  coneFill.setAttribute("width", coneBox.width);
  coneFill.setAttribute("height", coneHeight);

  const clipId = `${binId}-clip`;
  if (!svg.getElementById(clipId)) {
    const clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clip.setAttribute("id", clipId);
    clip.appendChild(cone.cloneNode(true));
    svg.documentElement.appendChild(clip);
  }
  coneFill.setAttribute("clip-path", `url(#${clipId})`);

  /* ---- RECT ---- */
  let rectFill = bin.querySelector(".bin-fill-rect");
  if (!rectFill) {
    rectFill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rectFill.setAttribute("class", "bin-fill-rect");
    rectFill.setAttribute("fill", "#7CFC00");
    rectFill.setAttribute("opacity", "0.85");
    bin.appendChild(rectFill);
  }

  const rectLevel = Math.max(0, (level - CONE_PART) / RECT_PART);
  const rectHeight = rectBox.height * rectLevel;

  rectFill.setAttribute("x", rectBox.x);
  rectFill.setAttribute("y", rectBox.y + rectBox.height - rectHeight);
  rectFill.setAttribute("width", rectBox.width);
  rectFill.setAttribute("height", rectHeight);
}
function normalizePipe(shape) {
  if (shape.dataset.normalized) return;

  const fillColor = shape.getAttribute("fill") || "black";
  shape.setAttribute("fill", "none");
  shape.setAttribute("stroke", fillColor);
  shape.setAttribute("stroke-width", "6");
  shape.setAttribute("stroke-linecap", "round");
  shape.setAttribute("stroke-linejoin", "round");

  shape.dataset.normalized = "true";
}

