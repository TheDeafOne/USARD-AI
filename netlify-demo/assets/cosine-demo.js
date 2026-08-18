(() => {
  "use strict";

  const steps = [...document.querySelectorAll("[data-step]")];
  const stepButtons = [...document.querySelectorAll("[data-step-button]")];
  const previousButton = document.getElementById("previous-step");
  const nextButton = document.getElementById("next-step");
  const status = document.getElementById("step-status");
  let currentStep = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const hashStep = Number.parseInt(window.location.hash.replace("#step-", ""), 10) - 1;
  if (Number.isInteger(hashStep)) currentStep = clamp(hashStep, 0, steps.length - 1);

  function showStep(index, moveFocus = false) {
    currentStep = clamp(index, 0, steps.length - 1);
    steps.forEach((step, stepIndex) => {
      const active = stepIndex === currentStep;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });
    stepButtons.forEach((button, buttonIndex) => {
      button.setAttribute("aria-selected", String(buttonIndex === currentStep));
    });
    stepButtons[currentStep].parentElement.scrollLeft = 0;
    previousButton.disabled = currentStep === 0;
    nextButton.disabled = currentStep === steps.length - 1;
    nextButton.innerHTML = currentStep === steps.length - 1
      ? "Complete <span aria-hidden=\"true\">✓</span>"
      : "Next <span aria-hidden=\"true\">→</span>";
    status.textContent = `${currentStep + 1} / ${steps.length}`;
    window.history.replaceState(null, "", `#step-${currentStep + 1}`);
    if (moveFocus) steps[currentStep].querySelector("h2")?.focus({ preventScroll: true });
    if (currentStep === 1) renderVectorPlot();
    if (currentStep === 2) renderSpherePlot();
  }

  stepButtons.forEach((button, index) => button.addEventListener("click", () => showStep(index)));
  previousButton.addEventListener("click", () => showStep(currentStep - 1));
  nextButton.addEventListener("click", () => {
    if (currentStep < steps.length - 1) showStep(currentStep + 1);
  });

  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select")) return;
    if (event.key === "ArrowRight") showStep(currentStep + 1);
    if (event.key === "ArrowLeft") showStep(currentStep - 1);
  });

  const svgNamespace = "http://www.w3.org/2000/svg";
  const createSvg = (name, attributes = {}) => {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };

  const normalize = ([x, y, z]) => {
    const length = Math.hypot(x, y, z);
    return [x / length, y / length, z / length];
  };

  const rotate = ([x, y, z], yaw, pitch) => {
    const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
    const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    return [x1, y1, z2];
  };

  const project = (point, yaw, pitch, centerX = 360, centerY = 235, scale = 175) => {
    const [x, y, depth] = rotate(point, yaw, pitch);
    return { x: centerX + x * scale, y: centerY - y * scale, depth };
  };

  const pathFromPoints = (points, yaw, pitch, centerY = 235, scale = 175) => points.map((point, index) => {
    const projected = project(point, yaw, pitch, 360, centerY, scale);
    return `${index ? "L" : "M"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
  }).join(" ");

  function addText(svg, text, x, y, className, anchor = "start") {
    const label = createSvg("text", { x, y, class: className, "text-anchor": anchor });
    label.textContent = text;
    svg.appendChild(label);
    return label;
  }

  function renderVectorPlot() {
    const svg = document.getElementById("vector-plot");
    if (!svg) return;
    svg.replaceChildren();
    const yaw = -0.72;
    const pitch = 0.46;
    const center = project([0, 0, 0], yaw, pitch, 330, 330, 255);
    const axisData = [
      { point: [1, 0, 0], label: "Cyber" },
      { point: [0, 1, 0], label: "STEM" },
      { point: [0, 0, 1], label: "Recruiting table" },
    ];

    for (let gridValue = 0.25; gridValue <= 1; gridValue += 0.25) {
      axisData.forEach(({ point }) => {
        const gridPoint = point.map((value) => value * gridValue);
        const end = project(gridPoint, yaw, pitch, 330, 330, 255);
        svg.appendChild(createSvg("line", { x1: center.x, y1: center.y, x2: end.x, y2: end.y, class: "grid-line" }));
      });
    }

    axisData.forEach(({ point, label }) => {
      const end = project(point, yaw, pitch, 330, 330, 255);
      svg.appendChild(createSvg("line", { x1: center.x, y1: center.y, x2: end.x, y2: end.y, class: "axis-line" }));
      addText(svg, label, end.x, end.y - 10, "axis-label", "middle");
    });

    const vectors = [
      { name: "Jefferson", values: [0.767, 0.765, 0.429], className: "jefferson" },
    ];
    vectors.forEach((vector) => {
      const scaled = vector.values.map((value) => value / 0.85);
      const end = project(scaled, yaw, pitch, 330, 330, 255);
      svg.appendChild(createSvg("line", { x1: center.x, y1: center.y, x2: end.x, y2: end.y, class: `vector-line ${vector.className}` }));
      svg.appendChild(createSvg("circle", { cx: end.x, cy: end.y, r: 6, class: `vector-point ${vector.className}`, fill: vector.className === "jefferson" ? "var(--cyan)" : "var(--violet)" }));
      addText(svg, vector.name, end.x + 10, end.y - 11, "point-label");
    });
    svg.appendChild(createSvg("circle", { cx: center.x, cy: center.y, r: 4, fill: "var(--ink)" }));
  }

  const schools = [
    { name: "Jefferson High", short: "Jefferson", values: [0.767, 0.765, 0.429], similarity: 1, target: true },
    { name: "Washington High", short: "Washington", values: [0.652, 0.667, 0.333], similarity: 0.9993, neighbor: true },
    { name: "Madison High", short: "Madison", values: [0.333, 0.560, 0.222], similarity: 0.9638, neighbor: true },
    { name: "North County Tech", short: "North County", values: [0.542, 0.476, 0.125], similarity: 0.9628, neighbor: true },
    { name: "Lincoln High", short: "Lincoln", values: [0.194, 0.364, 0.111], similarity: 0.9458 },
    { name: "Redstone High", short: "Redstone", values: [0.290, 0.778, 0.188], similarity: 0.8745 },
    { name: "Monroe High", short: "Monroe", values: [0.913, 0.208, 0.000], similarity: 0.7988 },
    { name: "Wilson High", short: "Wilson", values: [0.857, 0.200, 0.045], similarity: 0.7498 },
    { name: "Pioneer High", short: "Pioneer", values: [0.154, 0.150, 0.353], similarity: 0.6984 },
    { name: "Westfield High", short: "Westfield", values: [0.227, 0.077, 0.800], similarity: 0.6098 },
    { name: "Franklin High", short: "Franklin", values: [0.077, 0.138, 0.267], similarity: 0.5759 },
    { name: "Horizon High", short: "Horizon", values: [0.000, 0.182, 0.118], similarity: 0.4331 },
    { name: "Hamilton High", short: "Hamilton", values: [0.056, 0.045, 0.143], similarity: 0.4187 },
    { name: "Summit High", short: "Summit", values: [0.000, 0.158, 0.111], similarity: 0.3944 },
  ].map((school) => ({ ...school, point: normalize(school.values) }));

  let sphereYaw = -0.65;
  let spherePitch = 0.35;

  function sphereLine(latitude, longitudeMode = false) {
    const points = [];
    for (let index = 0; index <= 72; index += 1) {
      const angle = (index / 72) * Math.PI * 2;
      if (longitudeMode) {
        points.push([Math.cos(angle) * Math.cos(latitude), Math.sin(angle), Math.cos(angle) * Math.sin(latitude)]);
      } else {
        points.push([Math.cos(angle) * Math.cos(latitude), Math.sin(latitude), Math.sin(angle) * Math.cos(latitude)]);
      }
    }
    return points;
  }

  function greatCircleArc(a, b) {
    const dot = clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1);
    const angle = Math.acos(dot);
    if (angle < 0.0001) return [a, b];
    const points = [];
    for (let index = 0; index <= 32; index += 1) {
      const t = index / 32;
      const weightA = Math.sin((1 - t) * angle) / Math.sin(angle);
      const weightB = Math.sin(t * angle) / Math.sin(angle);
      points.push([
        weightA * a[0] + weightB * b[0],
        weightA * a[1] + weightB * b[1],
        weightA * a[2] + weightB * b[2],
      ]);
    }
    return points;
  }

  function renderSpherePlot() {
    const svg = document.getElementById("sphere-plot");
    if (!svg) return;
    svg.replaceChildren();

    const definitions = createSvg("defs");
    const gradient = createSvg("radialGradient", { id: "sphereGlow", cx: "35%", cy: "25%", r: "70%" });
    gradient.appendChild(createSvg("stop", { offset: "0%", "stop-color": "#253148", "stop-opacity": "0.48" }));
    gradient.appendChild(createSvg("stop", { offset: "100%", "stop-color": "#0b101a", "stop-opacity": "0.12" }));
    definitions.appendChild(gradient);
    svg.appendChild(definitions);

    svg.appendChild(createSvg("circle", { cx: 360, cy: 245, r: 178, class: "sphere-outline" }));
    [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3].forEach((latitude) => {
      svg.appendChild(createSvg("path", { d: pathFromPoints(sphereLine(latitude), sphereYaw, spherePitch, 245, 178), class: "sphere-grid" }));
    });
    [0, Math.PI / 3, 2 * Math.PI / 3].forEach((longitude) => {
      svg.appendChild(createSvg("path", { d: pathFromPoints(sphereLine(longitude, true), sphereYaw, spherePitch, 245, 178), class: "sphere-grid" }));
    });

    const axes = [
      { point: [1, 0, 0], label: "Cyber" },
      { point: [0, 1, 0], label: "STEM" },
      { point: [0, 0, 1], label: "Table" },
    ];
    axes.forEach(({ point, label }) => {
      const start = project([0, 0, 0], sphereYaw, spherePitch, 360, 245, 178);
      const end = project(point, sphereYaw, spherePitch, 360, 245, 178);
      svg.appendChild(createSvg("line", { x1: start.x, y1: start.y, x2: end.x, y2: end.y, class: "sphere-axis" }));
      addText(svg, label, end.x, end.y - 8, "axis-label", "middle");
    });

    const target = schools.find((school) => school.target);
    const washington = schools.find((school) => school.name === "Washington High");
    svg.appendChild(createSvg("path", {
      d: pathFromPoints(greatCircleArc(target.point, washington.point), sphereYaw, spherePitch, 245, 178),
      class: "angle-arc",
    }));

    const projectedSchools = schools.map((school) => ({
      ...school,
      projected: project(school.point, sphereYaw, spherePitch, 360, 245, 178),
    })).sort((a, b) => a.projected.depth - b.projected.depth);

    projectedSchools.forEach((school) => {
      const center = project([0, 0, 0], sphereYaw, spherePitch, 360, 245, 178);
      const group = createSvg("g", { class: "school-group" });
      group.appendChild(createSvg("line", {
        x1: center.x, y1: center.y, x2: school.projected.x, y2: school.projected.y,
        class: `school-vector${school.target ? " is-target" : ""}`,
      }));
      const pointClass = ["school-point", school.target ? "target" : "", school.neighbor ? "neighbor" : ""].filter(Boolean).join(" ");
      const circle = createSvg("circle", { cx: school.projected.x, cy: school.projected.y, r: school.target ? 7 : 5, class: pointClass });
      const title = createSvg("title");
      title.textContent = `${school.name}: ${school.target ? "target" : `${school.similarity.toFixed(4)} similarity`}`;
      circle.appendChild(title);
      group.appendChild(circle);
      if (school.target || school.neighbor || school.name === "Summit High") {
        const labelPositions = {
          "Jefferson High": { dx: -10, dy: -7, anchor: "end" },
          "Washington High": { dx: 10, dy: 9, anchor: "start" },
          "North County Tech": { dx: 10, dy: -13, anchor: "start" },
          "Madison High": { dx: 10, dy: 24, anchor: "start" },
          "Hamilton High": { dx: 10, dy: -13, anchor: "start" },
          "Summit High": { dx: 10, dy: 22, anchor: "start" },
        };
        const labelPosition = labelPositions[school.name] ?? { dx: 9, dy: -9, anchor: "start" };
        addText(
          group,
          school.short,
          school.projected.x + labelPosition.dx,
          school.projected.y + labelPosition.dy,
          "point-label",
          labelPosition.anchor,
        );
      }
      const updateReadout = () => {
        const readout = document.getElementById("point-readout");
        if (readout) readout.textContent = school.target
          ? "Jefferson High · target vector"
          : `${school.name} · cosine similarity ${school.similarity.toFixed(4)}`;
      };
      group.addEventListener("pointerenter", updateReadout);
      group.addEventListener("click", updateReadout);
      svg.appendChild(group);
    });
  }

  const sphere = document.getElementById("sphere-plot");
  if (sphere) {
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    sphere.addEventListener("pointerdown", (event) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      sphere.setPointerCapture(event.pointerId);
    });
    sphere.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      sphereYaw -= (event.clientX - previousX) * 0.009;
      spherePitch = clamp(spherePitch + (event.clientY - previousY) * 0.009, -1.35, 1.35);
      previousX = event.clientX;
      previousY = event.clientY;
      renderSpherePlot();
    });
    sphere.addEventListener("pointerup", () => { dragging = false; });
    sphere.addEventListener("pointercancel", () => { dragging = false; });
  }

  window.addEventListener("hashchange", () => {
    const nextHashStep = Number.parseInt(window.location.hash.replace("#step-", ""), 10) - 1;
    if (Number.isInteger(nextHashStep)) showStep(nextHashStep);
  });

  showStep(currentStep);
})();
