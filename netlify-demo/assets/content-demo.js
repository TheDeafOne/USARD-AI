(() => {
  "use strict";

  const story = document.getElementById("content-story");
  const sceneButtons = [...document.querySelectorAll("[data-content-scene-button]")];
  const panels = [...document.querySelectorAll("[data-content-panel]")];
  const backButton = document.getElementById("content-back");
  const nextButton = document.getElementById("content-next");
  const sceneLabel = document.getElementById("content-scene-label");
  const sceneTitle = document.getElementById("content-scene-title");
  const sceneCopy = document.getElementById("content-scene-copy");
  const status = document.getElementById("content-scene-status");
  const progress = document.getElementById("content-scene-progress");
  const tableCaption = document.getElementById("content-table-caption");
  const captionSymbol = document.querySelector(".content-caption-symbol");

  const scenes = [
    {
      label: "Step 1 of 5 / Change the evidence",
      title: "Describe the programs, not the neighbors.",
      copy: "Content-based filtering starts with Harbor’s own history and a feature profile for every program. It never needs outcomes from another branch.",
      caption: "<strong>Same question, different evidence.</strong> Known Harbor outcomes identify useful examples; content attributes describe tried and untried programs alike.",
      symbol: "≠",
      next: "Encode the content",
    },
    {
      label: "Step 2 of 5 / Encode the items",
      title: "Each program becomes a feature vector.",
      copy: "Subject-matter tags become numbers. Coding Club, for example, is strongly STEM-oriented, hands-on, and collaborative.",
      caption: "<strong>Features replace co-outcomes.</strong> The highlighted values are a content description of Coding Club—not ratings from similar branches.",
      symbol: "→",
      next: "Build Harbor’s profile",
    },
    {
      label: "Step 3 of 5 / Learn the profile",
      title: "What worked becomes a preference profile.",
      copy: "Harbor’s two strongest STEM-rich programs—Coding Club and Robotics Demo—contribute in proportion to their observed outcomes.",
      caption: "<strong>The profile belongs to Harbor.</strong> A weighted average summarizes the features of its strongest relevant programs.",
      symbol: "Σ",
      next: "Score unseen programs",
    },
    {
      label: "Step 4 of 5 / Match the content",
      title: "Compare the profile with every candidate.",
      copy: "Cosine similarity now compares Harbor’s learned feature profile with each untried program vector. A smaller angle means a closer content match.",
      caption: "<strong>Maker Lab is the closest content match.</strong> Its feature direction is almost parallel to Harbor’s learned profile.",
      symbol: "≃",
      next: "Explain the recommendation",
    },
    {
      label: "Step 5 of 5 / Recommend",
      title: "Recommend from shared attributes.",
      copy: "Maker Lab ranks first because it aligns on STEM, hands-on learning, collaboration, and beginner access—not because another branch liked it.",
      caption: "<strong>Provenance stays visible.</strong> The 0.9921 value is a content-match score; Harbor still has no observed Maker Lab outcome.",
      symbol: "✓",
      next: "Return to all concepts",
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
    nextButton.innerHTML = `${scene.next} <span aria-hidden="true">→</span>`;
    window.history.replaceState(null, "", `#scene-${currentScene + 1}`);
  }

  sceneButtons.forEach((button, index) => button.addEventListener("click", () => showScene(index)));
  backButton.addEventListener("click", () => showScene(currentScene - 1));
  nextButton.addEventListener("click", () => {
    if (currentScene === scenes.length - 1) {
      window.location.href = "index.html#demos-heading";
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

  window.addEventListener("hashchange", () => {
    const hashScene = Number.parseInt(window.location.hash.replace("#scene-", ""), 10) - 1;
    if (Number.isInteger(hashScene)) showScene(hashScene);
  });

  const hashScene = Number.parseInt(window.location.hash.replace("#scene-", ""), 10) - 1;
  if (Number.isInteger(hashScene)) currentScene = clamp(hashScene, 0, scenes.length - 1);
  showScene(currentScene);
})();
