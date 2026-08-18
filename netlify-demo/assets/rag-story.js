(() => {
  "use strict";

  const vocabulary = ["solar", "eclipse", "moon", "blocks", "sun", "earth", "orbits", "days", "panels", "sunlight", "energy", "year"];
  const passages = [
    { id: "p1", label: "Passage 1", text: "A solar eclipse happens when the moon blocks the sun.", words: ["solar", "eclipse", "moon", "blocks", "sun"], score: 0.96 },
    { id: "p2", label: "Passage 2", text: "The moon orbits Earth once every twenty-seven days.", words: ["moon", "earth", "orbits", "days"], score: 0.61 },
    { id: "p3", label: "Passage 3", text: "Solar panels turn sunlight into electrical energy.", words: ["solar", "panels", "sunlight", "energy"], score: 0.34 },
    { id: "p4", label: "Passage 4", text: "Earth travels around the sun in one year.", words: ["sun", "earth", "year"], score: 0.56 },
  ];
  const query = { id: "q", label: "Question", text: "What blocks the sun during an eclipse?", words: ["eclipse", "blocks", "sun"] };
  const scenes = [
    { label: "Step 1 of 6 / The puzzle", title: "How does a sentence become numbers?", copy: "Computers compare numbers, not sentences. Our first job is to turn this text into a vector: an ordered list of values.", next: "Count the words" },
    { label: "Step 2 of 6 / A simple bridge", title: "Give every word a coordinate.", copy: "Build a vocabulary, then use the arrow to place each sentence word into its coordinate. Read the finished row left to right and the sentence is now a vector.", next: "Add passages" },
    { label: "Step 3 of 6 / The knowledge base", title: "Embed every passage the same way.", copy: "A RAG system prepares a searchable collection in advance. Each passage becomes one row, using exactly the same coordinate system.", next: "Ask a question" },
    { label: "Step 4 of 6 / At question time", title: "The question becomes a vector, too.", copy: "Use the arrow to scan shared coordinates and reveal a first similarity score. This exact-word comparison is the bridge to semantic similarity.", next: "Compare directions" },
    { label: "Step 5 of 6 / Semantic search", title: "Modern embeddings capture meaning.", copy: "Bag-of-words makes the idea visible. A learned embedding model compresses meaning into a dense vector; cosine similarity then ranks the closest passage.", next: "Retrieve evidence" },
    { label: "Step 6 of 6 / Ground the answer", title: "Retrieve first. Generate second.", copy: "The best-matching passage is added to the prompt as evidence. The language model answers from that context and can point back to its source.", next: "Complete" },
  ];

  const story = document.getElementById("rag-story");
  const sceneLabel = document.getElementById("scene-label");
  const sceneTitle = document.getElementById("scene-title");
  const sceneCopy = document.getElementById("scene-copy");
  const backButton = document.getElementById("rag-back");
  const nextButton = document.getElementById("rag-next");
  const status = document.getElementById("scene-status");
  const progress = document.getElementById("scene-progress");
  const sceneButtons = [...document.querySelectorAll("[data-scene-button]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let currentScene = 0;
  let wordFillComplete = false;
  let corpusBuildComplete = true;
  let overlapComplete = false;
  let interactionBusy = false;
  let animationVersion = 0;

  const cleanWord = (word) => word.toLowerCase().replace(/[^a-z]/g, "");
  const seedWords = document.getElementById("seed-words");
  passages[0].text.split(/\s+/).forEach((word) => {
    const span = document.createElement("span");
    span.className = `word${vocabulary.includes(cleanWord(word)) ? " is-vocab-word" : ""}`;
    span.dataset.word = cleanWord(word);
    span.textContent = word;
    seedWords.appendChild(span);
  });

  const matrixHead = document.getElementById("matrix-head");
  vocabulary.forEach((word) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.dataset.word = word;
    const span = document.createElement("span");
    span.textContent = word;
    th.appendChild(span);
    matrixHead.appendChild(th);
  });

  const matrixBody = document.getElementById("matrix-body");
  const allRows = [...passages, query];
  allRows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    tr.dataset.row = row.id;
    if (row.id === "q") tr.className = "query-row";
    else tr.className = "passage-row";
    const th = document.createElement("th");
    th.scope = "row";
    th.title = row.text;
    th.innerHTML = `<b>${row.id === "q" ? "Q" : String(rowIndex + 1).padStart(2, "0")}</b>${row.text}`;
    if (row.id !== "q") {
      const sharedWords = row.words.filter((word) => query.words.includes(word)).length;
      const sparseScore = sharedWords / Math.sqrt(row.words.length * query.words.length);
      tr.dataset.sparseScore = sparseScore.toFixed(4);
      tr.style.setProperty("--row-tint", `rgb(77 231 255 / ${(sparseScore * 0.22).toFixed(3)})`);
      const similarity = document.createElement("span");
      similarity.className = "row-similarity";
      similarity.textContent = sparseScore.toFixed(2);
      similarity.title = `Sparse cosine similarity ${sparseScore.toFixed(2)}`;
      th.appendChild(similarity);
    }
    tr.appendChild(th);
    vocabulary.forEach((word) => {
      const value = row.words.includes(word) ? 1 : 0;
      const td = document.createElement("td");
      td.id = `cell-${row.id}-${word}`;
      td.dataset.value = String(value);
      td.textContent = value;
      if (value) td.classList.add("is-one");
      tr.appendChild(td);
    });
    matrixBody.appendChild(tr);
  });

  const sourceTray = document.getElementById("source-tray");
  passages.forEach((passage) => {
    const article = document.createElement("article");
    article.className = "source-chip";
    article.dataset.passage = passage.id;
    article.innerHTML = `<b>${passage.label}</b><p>${passage.text}</p>`;
    sourceTray.appendChild(article);
  });

  const scoreList = document.getElementById("score-list");
  [...passages].sort((a, b) => b.score - a.score).forEach((passage, index) => {
    const row = document.createElement("div");
    row.className = `score-row${index === 0 ? " top" : ""}`;
    row.innerHTML = `<span>${passage.label}</span><strong>${passage.score.toFixed(2)}</strong><i style="--score:${passage.score * 100}"></i>`;
    scoreList.appendChild(row);
  });

  function setVisibleRows(scene) {
    allRows.forEach((row, index) => {
      const tr = matrixBody.querySelector(`[data-row="${row.id}"]`);
      const visible = scene === 1 || scene === 2 ? index === 0 : scene >= 3;
      tr.hidden = !visible;
    });
  }

  function restoreMatrix() {
    matrixBody.querySelectorAll("td[data-value]").forEach((cell) => {
      cell.textContent = cell.dataset.value;
      cell.classList.toggle("is-one", cell.dataset.value === "1");
      cell.classList.remove("is-hot", "is-word-match", "is-query-source");
    });
    matrixBody.querySelectorAll("tr").forEach((row) => row.classList.remove("is-compared"));
    matrixHead.querySelectorAll("th").forEach((header) => header.classList.remove("is-scanning"));
    seedWords.querySelectorAll(".word").forEach((word) => word.classList.remove("is-flying", "is-placed"));
    sourceTray.querySelectorAll(".source-chip").forEach((card) => card.classList.remove("is-corpus-pending", "is-corpus-arriving", "is-first-handoff"));
    matrixBody.querySelectorAll("tr").forEach((row) => row.classList.remove("is-corpus-arriving"));
    story.classList.remove("is-filling-words", "similarity-revealed", "corpus-first-handoff");
    document.querySelectorAll(".token-ghost").forEach((ghost) => ghost.remove());
    document.querySelector(".query-arrow").textContent = "↑ same vocabulary, same coordinates";
  }

  function resetWordFill() {
    wordFillComplete = false;
    passages[0].words.forEach((word) => {
      const cell = document.getElementById(`cell-p1-${word}`);
      cell.textContent = "0";
      cell.classList.remove("is-one", "is-hot");
    });
  }

  function resetOverlap() {
    overlapComplete = false;
    story.classList.remove("similarity-revealed");
  }

  function prepareCorpusBuild() {
    corpusBuildComplete = false;
    interactionBusy = true;
    sourceTray.querySelectorAll(".source-chip").forEach((card) => card.classList.add("is-corpus-pending"));
    sourceTray.querySelector('[data-passage="p1"]').classList.add("is-first-handoff");
  }

  function updateNextButton() {
    if (currentScene === scenes.length - 1) {
      nextButton.disabled = true;
      nextButton.innerHTML = "Complete <span aria-hidden=\"true\">✓</span>";
      return;
    }
    nextButton.disabled = interactionBusy;
    let label = scenes[currentScene].next;
    if (currentScene === 1 && !wordFillComplete) label = interactionBusy ? "Placing words…" : "Place the words";
    if (currentScene === 2 && !corpusBuildComplete) label = "Building corpus…";
    if (currentScene === 3 && !overlapComplete) label = interactionBusy ? "Comparing…" : "Compare word overlap";
    nextButton.innerHTML = `${label} <span aria-hidden="true">→</span>`;
  }

  function animateWordsIntoVector() {
    if (wordFillComplete || interactionBusy) return;
    const runVersion = animationVersion;
    interactionBusy = true;
    story.classList.add("is-filling-words");
    updateNextButton();
    const words = [...seedWords.querySelectorAll(".word")].filter((span) => vocabulary.includes(span.dataset.word));
    if (reducedMotion) {
      words.forEach((span) => {
        const target = document.getElementById(`cell-p1-${span.dataset.word}`);
        target.textContent = "1";
        target.classList.add("is-one");
        span.classList.add("is-placed");
      });
      wordFillComplete = true;
      interactionBusy = false;
      story.classList.remove("is-filling-words");
      updateNextButton();
      return;
    }
    words.forEach((span, index) => {
      const target = document.getElementById(`cell-p1-${span.dataset.word}`);
      if (!target) return;
      window.setTimeout(() => {
        if (runVersion !== animationVersion || currentScene !== 1) return;
        const from = span.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const ghost = document.createElement("span");
        ghost.className = "token-ghost";
        ghost.textContent = span.dataset.word;
        ghost.style.left = `${from.left}px`;
        ghost.style.top = `${from.top}px`;
        document.body.appendChild(ghost);
        span.classList.add("is-flying");
        const animation = ghost.animate([
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${to.left + to.width / 2 - from.left - ghost.offsetWidth / 2}px, ${to.top + to.height / 2 - from.top - ghost.offsetHeight / 2}px) scale(.72)`, opacity: 1 },
        ], { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" });
        animation.finished.then(() => {
          if (runVersion !== animationVersion || currentScene !== 1) {
            ghost.remove();
            return;
          }
          target.textContent = "1";
          target.classList.add("is-one");
          target.classList.add("is-hot");
          span.classList.remove("is-flying");
          span.classList.add("is-placed");
          ghost.remove();
          window.setTimeout(() => target.classList.remove("is-hot"), 380);
        }).catch(() => ghost.remove());
      }, 160 + index * 150);
    });
    window.setTimeout(() => {
      if (runVersion !== animationVersion || currentScene !== 1) return;
      wordFillComplete = true;
      interactionBusy = false;
      story.classList.remove("is-filling-words");
      updateNextButton();
    }, 160 + (words.length - 1) * 150 + 700);
  }

  function animateOverlap() {
    if (overlapComplete || interactionBusy) return;
    const runVersion = animationVersion;
    interactionBusy = true;
    updateNextButton();
    const finish = () => {
      if (runVersion !== animationVersion || currentScene !== 3) return;
      matrixBody.querySelectorAll(".passage-row").forEach((row) => row.classList.add("is-compared"));
      story.classList.add("similarity-revealed");
      document.querySelector(".query-arrow").textContent = "↑ shared words → sparse cosine score";
      overlapComplete = true;
      interactionBusy = false;
      updateNextButton();
    };
    if (reducedMotion) {
      query.words.forEach((word) => {
        document.querySelector(`#matrix-head th[data-word="${word}"]`).classList.add("is-scanning");
        document.getElementById(`cell-q-${word}`).classList.add("is-query-source");
        passages.forEach((passage) => {
          const cell = document.getElementById(`cell-${passage.id}-${word}`);
          if (cell.dataset.value === "1") cell.classList.add("is-word-match");
        });
      });
      finish();
      return;
    }
    query.words.forEach((word, index) => {
      window.setTimeout(() => {
        if (runVersion !== animationVersion || currentScene !== 3) return;
        document.querySelector(`#matrix-head th[data-word="${word}"]`).classList.add("is-scanning");
        document.getElementById(`cell-q-${word}`).classList.add("is-query-source");
        passages.forEach((passage) => {
          const cell = document.getElementById(`cell-${passage.id}-${word}`);
          if (cell.dataset.value === "1") cell.classList.add("is-word-match");
        });
      }, 180 + index * 360);
    });
    window.setTimeout(finish, 180 + query.words.length * 360);
  }

  function animateCorpusBuild() {
    const runVersion = animationVersion;
    const revealItem = (index) => {
      if (runVersion !== animationVersion || currentScene !== 2) return;
      const passage = passages[index];
      const row = matrixBody.querySelector(`[data-row="${passage.id}"]`);
      const card = sourceTray.querySelector(`[data-passage="${passage.id}"]`);
      row.hidden = false;
      row.classList.add("is-corpus-arriving");
      card.classList.remove("is-corpus-pending");
      card.classList.add("is-corpus-arriving");
      window.setTimeout(() => {
        row.classList.remove("is-corpus-arriving");
        card.classList.remove("is-corpus-arriving");
      }, 620);
    };
    const finish = () => {
      if (runVersion !== animationVersion || currentScene !== 2) return;
      corpusBuildComplete = true;
      interactionBusy = false;
      updateNextButton();
    };
    if (reducedMotion) {
      const firstCard = sourceTray.querySelector('[data-passage="p1"]');
      firstCard.classList.remove("is-corpus-pending");
      [1, 2, 3].forEach((index) => revealItem(index));
      story.classList.add("corpus-first-handoff");
      finish();
      return;
    }
    window.setTimeout(() => {
      if (runVersion !== animationVersion || currentScene !== 2) return;
      sourceTray.querySelector('[data-passage="p1"]').classList.remove("is-corpus-pending");
      story.classList.add("corpus-first-handoff");
    }, 720);
    [1, 2, 3].forEach((index) => window.setTimeout(() => revealItem(index), 1020 + (index - 1) * 440));
    window.setTimeout(finish, 1020 + 3 * 440);
  }

  function showScene(index) {
    animationVersion += 1;
    interactionBusy = false;
    currentScene = Math.max(0, Math.min(scenes.length - 1, index));
    restoreMatrix();
    if (currentScene === 1) resetWordFill();
    if (currentScene === 2) prepareCorpusBuild();
    if (currentScene === 3) resetOverlap();
    const scene = scenes[currentScene];
    story.dataset.scene = String(currentScene);
    sceneLabel.textContent = scene.label;
    sceneTitle.textContent = scene.title;
    sceneCopy.textContent = scene.copy;
    status.textContent = `${currentScene + 1} / ${scenes.length}`;
    progress.style.width = `${((currentScene + 1) / scenes.length) * 100}%`;
    backButton.disabled = currentScene === 0;
    updateNextButton();
    sceneButtons.forEach((button, buttonIndex) => button.setAttribute("aria-selected", String(buttonIndex === currentScene)));
    setVisibleRows(currentScene);
    window.history.replaceState(null, "", `#scene-${currentScene + 1}`);
    if (currentScene === 2) window.setTimeout(animateCorpusBuild, 40);
    if (currentScene === 4) renderSphere();
  }

  function handleNext() {
    if (interactionBusy) return;
    if (currentScene === 1 && !wordFillComplete) {
      animateWordsIntoVector();
      return;
    }
    if (currentScene === 3 && !overlapComplete) {
      animateOverlap();
      return;
    }
    showScene(currentScene + 1);
  }

  sceneButtons.forEach((button, index) => button.addEventListener("click", () => showScene(index)));
  backButton.addEventListener("click", () => showScene(currentScene - 1));
  nextButton.addEventListener("click", handleNext);
  document.addEventListener("keydown", (event) => {
    if (event.target.matches("input, textarea, select, button")) return;
    if (event.key === "ArrowRight") handleNext();
    if (event.key === "ArrowLeft") showScene(currentScene - 1);
  });

  const svg = document.getElementById("rag-sphere");
  const ns = "http://www.w3.org/2000/svg";
  let yaw = -0.55;
  let pitch = 0.28;
  let dragging = false;
  let previous = { x: 0, y: 0 };
  const points = [
    { name: "Question", vector: [1, 0, 0], type: "query" },
    { name: "Passage 1", vector: [0.96, 0.28, 0], type: "top" },
    { name: "Passage 2", vector: [0.61, -0.46, 0.65], type: "" },
    { name: "Passage 3", vector: [0.34, 0.19, -0.92], type: "" },
    { name: "Passage 4", vector: [0.56, -0.78, -0.28], type: "" },
  ].map((point) => {
    const length = Math.hypot(...point.vector);
    return { ...point, vector: point.vector.map((value) => value / length) };
  });

  const el = (name, attrs = {}) => {
    const node = document.createElementNS(ns, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  const rotate = ([x, y, z]) => {
    const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
    const y1 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
    return [x1, y1, z2];
  };
  const project = (point) => {
    const [x, y, depth] = rotate(point);
    return { x: 280 + x * 154, y: 210 - y * 154, depth };
  };
  const spherePath = (latitude, longitudeMode = false) => {
    const path = [];
    for (let i = 0; i <= 72; i += 1) {
      const angle = (i / 72) * Math.PI * 2;
      const point = longitudeMode
        ? [Math.cos(angle) * Math.cos(latitude), Math.sin(angle), Math.cos(angle) * Math.sin(latitude)]
        : [Math.cos(latitude) * Math.cos(angle), Math.sin(latitude), Math.cos(latitude) * Math.sin(angle)];
      const p = project(point);
      path.push(`${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return path.join(" ");
  };
  const arcPath = (a, b) => {
    const path = [];
    for (let i = 0; i <= 30; i += 1) {
      const t = i / 30;
      const mix = a.map((value, axis) => value * (1 - t) + b[axis] * t);
      const length = Math.hypot(...mix);
      const p = project(mix.map((value) => value / length));
      path.push(`${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    return path.join(" ");
  };

  function renderSphere() {
    svg.replaceChildren();
    const defs = el("defs");
    const gradient = el("radialGradient", { id: "ragSphereGlow", cx: "35%", cy: "25%", r: "72%" });
    gradient.append(el("stop", { offset: "0%", "stop-color": "#26334d", "stop-opacity": ".55" }), el("stop", { offset: "100%", "stop-color": "#0b101a", "stop-opacity": ".12" }));
    defs.appendChild(gradient);
    svg.appendChild(defs);
    svg.appendChild(el("circle", { cx: 280, cy: 210, r: 154, class: "rag-sphere-outline" }));
    [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3].forEach((angle) => svg.appendChild(el("path", { d: spherePath(angle), class: "rag-sphere-grid" })));
    [0, Math.PI / 3, 2 * Math.PI / 3].forEach((angle) => svg.appendChild(el("path", { d: spherePath(angle, true), class: "rag-sphere-grid" })));
    svg.appendChild(el("path", { d: arcPath(points[0].vector, points[1].vector), class: "rag-angle" }));
    const center = project([0, 0, 0]);
    points.map((point) => ({ ...point, projected: project(point.vector) })).sort((a, b) => a.projected.depth - b.projected.depth).forEach((point) => {
      svg.appendChild(el("line", { x1: center.x, y1: center.y, x2: point.projected.x, y2: point.projected.y, class: `rag-vector ${point.type}` }));
      svg.appendChild(el("circle", { cx: point.projected.x, cy: point.projected.y, r: point.type ? 6.5 : 5, class: `rag-point ${point.type}` }));
      const label = el("text", { x: point.projected.x + 9, y: point.projected.y - 9, class: `rag-point-label ${point.type}` });
      label.textContent = point.name;
      svg.appendChild(label);
    });
  }

  svg.addEventListener("pointerdown", (event) => {
    dragging = true;
    previous = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    yaw -= (event.clientX - previous.x) * 0.009;
    pitch = Math.max(-1.25, Math.min(1.25, pitch + (event.clientY - previous.y) * 0.009));
    previous = { x: event.clientX, y: event.clientY };
    renderSphere();
  });
  svg.addEventListener("pointerup", () => { dragging = false; });
  svg.addEventListener("pointercancel", () => { dragging = false; });

  const hashScene = Number.parseInt(window.location.hash.replace("#scene-", ""), 10) - 1;
  if (Number.isInteger(hashScene)) currentScene = Math.max(0, Math.min(scenes.length - 1, hashScene));
  showScene(currentScene);
})();
