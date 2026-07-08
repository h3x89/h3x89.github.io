(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealSelectors = [
    ".hero-copy",
    ".hero-stats article",
    ".section-heading",
    ".scenario-card",
    ".rail-card",
    ".workflow-panel",
    ".tower-card",
    ".matrix-card",
    ".glance-grid article",
    ".governance-grid article",
    ".architecture-strip article",
    ".outcome-grid article",
    ".case-footer-inner",
    ".impact-ribbon p",
    ".manual-flow div",
    ".prototype-banner",
    ".callout",
    ".flywheel"
  ];

  const revealGroups = [
    ".hero-stats",
    ".impact-ribbon",
    ".glance-grid",
    ".manual-flow",
    ".rail-grid",
    ".split-workflow",
    ".architecture-strip",
    ".governance-grid",
    ".control-grid",
    ".matrix-grid",
    ".outcome-grid"
  ];

  revealGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((group) => {
      group.setAttribute("data-reveal-group", "");
    });
  });

  const revealItems = [
    ...document.querySelectorAll("[data-reveal]"),
    ...revealSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
  ];

  const uniqueRevealItems = [...new Set(revealItems)];
  uniqueRevealItems.forEach((item) => {
    item.setAttribute("data-reveal", "");
  });

  uniqueRevealItems.forEach((item) => {
    const parent = item.closest("[data-reveal-group]");
    if (!parent) {
      return;
    }

    const siblings = Array.from(parent.querySelectorAll("[data-reveal]"));
    const siblingIndex = Math.max(0, siblings.indexOf(item));
    item.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 70, 280)}ms`);
  });

  root.classList.add("motion-ready");

  const markVisible = (element) => {
    element.classList.add("is-visible");
  };

  const flowSection = document.querySelector(".flow-section");
  const flowSteps = Array.from(document.querySelectorAll("[data-flow-step]"));
  const fallbackCards = Array.from(document.querySelectorAll(".fallback-card"));

  document.querySelectorAll(".fallback-strip span").forEach((step, index) => {
    step.style.setProperty("--step-index", index);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    uniqueRevealItems.forEach(markVisible);
    flowSteps.forEach((step) => {
      step.classList.add("is-complete");
    });
    fallbackCards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      markVisible(entry.target);
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.16
  });

  uniqueRevealItems.forEach((item) => revealObserver.observe(item));

  if (flowSection && flowSteps.length > 0) {
    let flowPlayed = false;

    const playFlow = () => {
      if (flowPlayed) {
        return;
      }

      flowPlayed = true;

      flowSteps.forEach((step, index) => {
        window.setTimeout(() => {
          flowSteps.forEach((candidate) => candidate.classList.remove("is-current"));
          step.classList.add("is-current", "is-observed");

          window.setTimeout(() => {
            step.classList.remove("is-current");
            step.classList.add("is-complete");
          }, 520);
        }, index * 180);
      });
    };

    const flowObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        playFlow();
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -25% 0px",
      threshold: 0.32
    });

    flowObserver.observe(flowSection);
  }

  const fallbackObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.25
  });

  fallbackCards.forEach((card) => fallbackObserver.observe(card));
})();
