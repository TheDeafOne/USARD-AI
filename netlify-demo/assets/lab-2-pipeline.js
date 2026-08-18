(() => {
  "use strict";

  const slides = [...document.querySelectorAll("[data-slide]")];
  const stepButtons = [...document.querySelectorAll("[data-go]")];
  const previousButton = document.getElementById("previous");
  const nextButton = document.getElementById("next");
  const currentLabel = document.getElementById("step-current");
  const phaseLabel = document.getElementById("phase-label");
  const railProgress = document.getElementById("rail-progress");
  const phases = ["FRAME", "WHERE", "WHERE", "WHERE", "WHERE", "WHAT", "WHAT", "WHAT", "DECIDE"];
  let current = 0;

  const hashMatch = window.location.hash.match(/^#step-(\d+)$/);
  if (hashMatch) current = Math.min(slides.length - 1, Math.max(0, Number(hashMatch[1]) - 1));

  function showSlide(index, updateHash = true) {
    const next = Math.min(slides.length - 1, Math.max(0, index));
    if (next === current && slides[current].classList.contains("is-active")) return;
    current = next;

    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.hidden = !active;
      slide.classList.toggle("is-active", active);
      if (active) slide.scrollTop = 0;
    });
    stepButtons.forEach((button, buttonIndex) => {
      if (buttonIndex === current) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });

    previousButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    nextButton.innerHTML = current === slides.length - 1
      ? "Walkthrough complete <span aria-hidden=\"true\">✓</span>"
      : `${current === 0 ? "Explore pipeline" : "Next step"} <span aria-hidden="true">→</span>`;
    currentLabel.textContent = String(current + 1).padStart(2, "0");
    phaseLabel.textContent = phases[current];
    railProgress.style.height = `${(current / (slides.length - 1)) * 100}%`;
    if (updateHash) window.history.replaceState(null, "", `#step-${current + 1}`);
  }

  stepButtons.forEach((button, index) => button.addEventListener("click", () => showSlide(index)));
  previousButton.addEventListener("click", () => showSlide(current - 1));
  nextButton.addEventListener("click", () => showSlide(current + 1));

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.matches("input, textarea, select, [contenteditable]")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      showSlide(current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      showSlide(current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      showSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showSlide(slides.length - 1);
    }
  });

  window.addEventListener("hashchange", () => {
    const match = window.location.hash.match(/^#step-(\d+)$/);
    if (match) showSlide(Number(match[1]) - 1, false);
  });

  slides[current].classList.remove("is-active");
  showSlide(current, false);
})();
