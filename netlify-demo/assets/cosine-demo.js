(() => {
  "use strict";

  const story = document.getElementById("cosine-story");
  const sceneButtons = [...document.querySelectorAll("[data-scene-button]")];
  const panels = [...document.querySelectorAll("[data-concept-panel]")];
  const backButton = document.getElementById("cosine-back");
  const nextButton = document.getElementById("cosine-next");
  const sceneLabel = document.getElementById("scene-label");
  const sceneTitle = document.getElementById("scene-title");
  const sceneCopy = document.getElementById("scene-copy");
  const status = document.getElementById("scene-status");
  const progress = document.getElementById("scene-progress");
  const tableCaption = document.getElementById("table-caption");
  const captionSymbol = document.querySelector(".caption-symbol");

  const scenes = [
    {
      label: "Step 1 of 5 / Read the evidence",
      title: "A row is a pattern of outcomes.",
      copy: "Each value is follow-up completions per staff-hour for one library program. Harbor has never run a Maker Lab, so its blank is unknown—not zero.",
      caption: "<strong>Missing means unobserved.</strong> Replacing the blank with zero would turn ‘we do not know’ into ‘it failed.’",
      symbol: "—",
      next: "Make the vector",
    },
    {
      label: "Step 2 of 5 / Represent the row",
      title: "Numbers give the branch a direction.",
      copy: "For a three-dimensional teaching view, use Resume, Coding, and Robotics as axes. Harbor’s three values become the coordinates of one arrow.",
      caption: "<strong>Same row, new representation.</strong> The highlighted cells supply the three coordinates shown in the plot.",
      symbol: "→",
      next: "Normalize it",
    },
    {
      label: "Step 3 of 5 / Normalize",
      title: "Direction matters more than magnitude.",
      copy: "Move every branch vector onto the unit sphere. Nearby directions represent similar program patterns even when overall effectiveness differs.",
      caption: "<strong>The visible sphere uses three features for intuition.</strong> The final neighbor score uses all five programs observed at Harbor.",
      symbol: "θ",
      next: "Find neighbors",
    },
    {
      label: "Step 4 of 5 / Compare",
      title: "The closest directions become neighbors.",
      copy: "Cosine similarity measures the angle between Harbor and every other branch across their five shared observations. The three strongest matches carry the estimate.",
      caption: "<strong>Neighborhood selected.</strong> Riverside, Northside, and Maple most closely match Harbor’s observed outcome pattern.",
      symbol: "≃",
      next: "Estimate Maker Lab",
    },
    {
      label: "Step 5 of 5 / Fill the gap",
      title: "Use nearby evidence to estimate the unknown.",
      copy: "Weight each neighbor’s observed Maker Lab outcome by its similarity to Harbor. The result is traceable, but it remains a prediction until Harbor runs a pilot.",
      caption: "<strong>Provenance stays visible.</strong> The 0.777 cell is predicted from three neighbors; it is not an observed Harbor outcome.",
      symbol: "≈",
      next: "Walkthrough complete",
    },
  ];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let currentScene = 0;

  function showScene(index) {
    currentScene = clamp(index, 0, scenes.length - 1);
    const scene = scenes[currentScene];
    story.dataset.scene = String(currentScene);
    panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === currentScene;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", String(!isActive));
      panel.inert = !isActive;
    });
    sceneButtons.forEach((button, buttonIndex) => button.setAttribute("aria-selected", String(buttonIndex === currentScene)));
    sceneLabel.textContent = scene.label;
    sceneTitle.textContent = scene.title;
    sceneCopy.textContent = scene.copy;
    tableCaption.innerHTML = scene.caption;
    captionSymbol.textContent = scene.symbol;
    status.textContent = `${currentScene + 1} / ${scenes.length}`;
    progress.style.width = `${((currentScene + 1) / scenes.length) * 100}%`;
    backButton.disabled = currentScene === 0;
    nextButton.disabled = false;
    nextButton.innerHTML = currentScene === scenes.length - 1
      ? "Next: Content filtering <span aria-hidden=\"true\">→</span>"
      : `${scene.next} <span aria-hidden="true">→</span>`;
    window.history.replaceState(null, "", `#scene-${currentScene + 1}`);
    if (currentScene === 1) renderVectorPlot();
    if (currentScene === 2) renderSpherePlot();
  }

  sceneButtons.forEach((button, index) => button.addEventListener("click", () => showScene(index)));
  backButton.addEventListener("click", () => showScene(currentScene - 1));
  nextButton.addEventListener("click", () => {
    if (currentScene === scenes.length - 1) {
      window.location.href = "content-filtering.html";
      return;
    }
    showScene(currentScene + 1);
  });
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.matches("input, textarea, select, button, [contenteditable]")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      showScene(currentScene + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      showScene(currentScene - 1);
    }
  });

  const ns = "http://www.w3.org/2000/svg";
  const svgElement = (name, attributes = {}) => {
    const element = document.createElementNS(ns, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
  };
  const addText = (svg, value, x, y, className, anchor = "start") => {
    const text = svgElement("text", { x, y, class: className, "text-anchor": anchor });
    text.textContent = value;
    svg.appendChild(text);
    return text;
  };
  const normalize = (vector) => {
    const length = Math.hypot(...vector);
    return vector.map((value) => value / length);
  };

  let yaw = -0.62;
  let pitch = 0.32;
  const rotate = ([x, y, z], useYaw = yaw, usePitch = pitch) => {
    const x1 = x * Math.cos(useYaw) - z * Math.sin(useYaw);
    const z1 = x * Math.sin(useYaw) + z * Math.cos(useYaw);
    const y1 = y * Math.cos(usePitch) - z1 * Math.sin(usePitch);
    const z2 = y * Math.sin(usePitch) + z1 * Math.cos(usePitch);
    return [x1, y1, z2];
  };
  const project = (point, centerX = 260, centerY = 198, scale = 142, useYaw = yaw, usePitch = pitch) => {
    const [x, y, depth] = rotate(point, useYaw, usePitch);
    return { x: centerX + x * scale, y: centerY - y * scale, depth };
  };

  function renderVectorPlot() {
    const svg = document.getElementById("vector-plot");
    if (!svg) return;
    svg.replaceChildren();
    const plotYaw = -0.72;
    const plotPitch = 0.46;
    const origin = project([0, 0, 0], 235, 295, 205, plotYaw, plotPitch);
    const axes = [
      { vector: [1, 0, 0], label: "Resume" },
      { vector: [0, 1, 0], label: "Coding" },
      { vector: [0, 0, 1], label: "Robotics" },
    ];
    for (let step = .25; step <= 1; step += .25) {
      axes.forEach(({ vector }) => {
        const endpoint = project(vector.map((value) => value * step), 235, 295, 205, plotYaw, plotPitch);
        svg.appendChild(svgElement("line", { x1: origin.x, y1: origin.y, x2: endpoint.x, y2: endpoint.y, class: "cosine-grid-line" }));
      });
    }
    axes.forEach(({ vector, label }) => {
      const endpoint = project(vector, 235, 295, 205, plotYaw, plotPitch);
      svg.appendChild(svgElement("line", { x1: origin.x, y1: origin.y, x2: endpoint.x, y2: endpoint.y, class: "cosine-axis-line" }));
      addText(svg, label, endpoint.x, endpoint.y - 9, "cosine-axis-label", "middle");
    });
    const harbor = [.74 / .85, .81 / .85, .76 / .85];
    const endpoint = project(harbor, 235, 295, 205, plotYaw, plotPitch);
    svg.appendChild(svgElement("line", { x1: origin.x, y1: origin.y, x2: endpoint.x, y2: endpoint.y, class: "cosine-vector-line" }));
    svg.appendChild(svgElement("circle", { cx: endpoint.x, cy: endpoint.y, r: 6, class: "cosine-vector-point" }));
    addText(svg, "Harbor", endpoint.x + 10, endpoint.y - 10, "cosine-point-label");
    svg.appendChild(svgElement("circle", { cx: origin.x, cy: origin.y, r: 3.5, fill: "var(--ink)" }));
  }

  const libraries = [
    { name: "Harbor", vector: [.74, .81, .76], similarity: 1, type: "target" },
    { name: "Riverside", vector: [.69, .78, .71], similarity: .9999, type: "neighbor" },
    { name: "Northside", vector: [.55, .73, .75], similarity: .9899, type: "neighbor" },
    { name: "Maple", vector: [.80, .67, .59], similarity: .9829, type: "neighbor" },
    { name: "Cedar", vector: [.26, .65, .72], similarity: .9454, type: "" },
    { name: "Downtown", vector: [.88, .42, .38], similarity: .9229, type: "" },
    { name: "Lakeside", vector: [.32, .41, .29], similarity: .8613, type: "" },
    { name: "Hillcrest", vector: [.49, .30, .25], similarity: .8375, type: "" },
  ].map((library) => ({ ...library, point: normalize(library.vector) }));

  const spherePath = (latitude, longitudeMode = false) => {
    const points = [];
    for (let index = 0; index <= 72; index += 1) {
      const angle = (index / 72) * Math.PI * 2;
      const point = longitudeMode
        ? [Math.cos(angle) * Math.cos(latitude), Math.sin(angle), Math.cos(angle) * Math.sin(latitude)]
        : [Math.cos(latitude) * Math.cos(angle), Math.sin(latitude), Math.cos(latitude) * Math.sin(angle)];
      const projected = project(point);
      points.push(`${index ? "L" : "M"}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`);
    }
    return points.join(" ");
  };
  const arcPath = (first, second, radius = .34) => {
    const points = [];
    for (let index = 0; index <= 30; index += 1) {
      const progressValue = index / 30;
      const mixed = first.map((value, axis) => value * (1 - progressValue) + second[axis] * progressValue);
      const length = Math.hypot(...mixed);
      const projected = project(mixed.map((value) => (value / length) * radius));
      points.push(`${index ? "L" : "M"}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`);
    }
    return points.join(" ");
  };

  function renderSpherePlot() {
    const svg = document.getElementById("sphere-plot");
    if (!svg) return;
    svg.replaceChildren();
    const definitions = svgElement("defs");
    const gradient = svgElement("radialGradient", { id: "cosineSphereGlow", cx: "35%", cy: "25%", r: "72%" });
    gradient.append(
      svgElement("stop", { offset: "0%", "stop-color": "#26334d", "stop-opacity": ".55" }),
      svgElement("stop", { offset: "100%", "stop-color": "#0b101a", "stop-opacity": ".12" }),
    );
    definitions.appendChild(gradient);
    svg.appendChild(definitions);
    svg.appendChild(svgElement("circle", { cx: 260, cy: 198, r: 142, class: "cosine-sphere-outline" }));
    [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3].forEach((angle) => svg.appendChild(svgElement("path", { d: spherePath(angle), class: "cosine-sphere-grid" })));
    [0, Math.PI / 3, 2 * Math.PI / 3].forEach((angle) => svg.appendChild(svgElement("path", { d: spherePath(angle, true), class: "cosine-sphere-grid" })));
    svg.appendChild(svgElement("path", { d: arcPath(libraries[0].point, libraries[1].point), class: "cosine-angle" }));

    const center = project([0, 0, 0]);
    const projected = libraries.map((library) => ({ ...library, projected: project(library.point) })).sort((a, b) => a.projected.depth - b.projected.depth);
    projected.forEach((library) => {
      svg.appendChild(svgElement("line", { x1: center.x, y1: center.y, x2: library.projected.x, y2: library.projected.y, class: `cosine-school-vector ${library.type}` }));
      const circle = svgElement("circle", { cx: library.projected.x, cy: library.projected.y, r: library.type ? 6 : 4.5, class: `cosine-school-point ${library.type}` });
      const title = svgElement("title");
      title.textContent = library.type === "target" ? "Harbor · target" : `${library.name} · similarity ${library.similarity.toFixed(4)}`;
      circle.appendChild(title);
      const updateReadout = () => {
        const readout = document.getElementById("point-readout");
        readout.textContent = library.type === "target" ? "Harbor · target vector" : `${library.name} · cosine similarity ${library.similarity.toFixed(4)}`;
      };
      circle.addEventListener("pointerenter", updateReadout);
      circle.addEventListener("click", updateReadout);
      svg.appendChild(circle);
      if (library.type === "target" || library.name === "Riverside" || library.name === "Hillcrest") {
        const labelOffsets = {
          Harbor: { dx: -30, dy: -30, anchor: "end" },
          Riverside: { dx: 28, dy: -14, anchor: "start" },
          Hillcrest: { dx: 28, dy: 24, anchor: "start" },
        };
        const offset = labelOffsets[library.name];
        const labelX = library.projected.x + offset.dx;
        const labelY = library.projected.y + offset.dy;
        svg.appendChild(svgElement("line", {
          x1: library.projected.x,
          y1: library.projected.y,
          x2: labelX + (offset.anchor === "end" ? 4 : -4),
          y2: labelY - 4,
          class: "cosine-label-leader",
        }));
        addText(svg, library.name, labelX, labelY, "cosine-point-label", offset.anchor);
      }
    });
  }

  const sphere = document.getElementById("sphere-plot");
  let dragging = false;
  let previous = { x: 0, y: 0 };
  sphere.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dragging = true;
    previous = { x: event.clientX, y: event.clientY };
    sphere.setPointerCapture(event.pointerId);
  });
  sphere.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw += (event.clientX - previous.x) * .009;
    pitch = clamp(pitch - (event.clientY - previous.y) * .009, -1.25, 1.25);
    previous = { x: event.clientX, y: event.clientY };
    renderSpherePlot();
  });
  sphere.addEventListener("pointerup", () => { dragging = false; });
  sphere.addEventListener("pointercancel", () => { dragging = false; });

  window.addEventListener("hashchange", () => {
    const hashScene = Number.parseInt(window.location.hash.replace("#scene-", ""), 10) - 1;
    if (Number.isInteger(hashScene)) showScene(hashScene);
  });

  const hashScene = Number.parseInt(window.location.hash.replace("#scene-", ""), 10) - 1;
  if (Number.isInteger(hashScene)) currentScene = clamp(hashScene, 0, scenes.length - 1);
  showScene(currentScene);
})();
