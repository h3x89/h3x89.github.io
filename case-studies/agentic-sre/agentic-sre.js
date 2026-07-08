const flowSteps = [...document.querySelectorAll("[data-flow-step]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (flowSteps.length > 0 && !prefersReducedMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        flowSteps.forEach((step) => step.classList.remove("is-observed"));
        entry.target.classList.add("is-observed");
      });
    },
    { rootMargin: "-35% 0px -45% 0px", threshold: 0.2 }
  );

  flowSteps.forEach((step) => observer.observe(step));
}
