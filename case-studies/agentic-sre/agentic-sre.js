(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const heroSpacing = document.createElement("style");
  heroSpacing.textContent = `
    .hero .subtitle {
      display: block;
      max-width: 52rem;
      margin: 1rem auto 0;
      line-height: 1.3;
    }

    .hero .subtitle + .hero-summary {
      margin-top: 1rem;
    }
  `;
  document.head.appendChild(heroSpacing);

  const normalizeMainOnePagerNav = () => {
    const nav = document.querySelector('.site-header nav[aria-label="Page sections"]');
    const isMainOnePager = Boolean(
      nav &&
      document.querySelector('#system-graph') &&
      document.querySelector('#delivery-loop') &&
      document.querySelector('#control-plane') &&
      document.querySelector('#outcomes')
    );

    if (!isMainOnePager) {
      return;
    }

    nav.innerHTML = `
      <a href="#top">Overview</a>
      <a href="#system-graph">System Graph</a>
      <a href="#delivery-loop">Delivery Loop</a>
      <a href="#control-plane">Control Plane</a>
      <a href="#outcomes">Outcomes</a>
    `;

    const footerCopy = document.querySelector('.case-footer p');
    if (footerCopy) {
      footerCopy.textContent = 'This one-pager includes the System Graph directly and is ready as the final public Agentic SRE case study.';
    }
  };

  normalizeMainOnePagerNav();

  root.classList.add("motion-ready");

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  revealItems.forEach((item) => {
    const parent = item.closest("[data-reveal-group]");
    if (!parent) {
      return;
    }

    const siblings = Array.from(parent.querySelectorAll("[data-reveal]"));
    const siblingIndex = Math.max(0, siblings.indexOf(item));
    item.style.setProperty("--reveal-delay", `${Math.min(siblingIndex * 70, 280)}ms`);
  });

  const markVisible = (element) => element.classList.add("is-visible");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(markVisible);
    document.querySelectorAll("[data-flow-step]").forEach((step) => step.classList.add("is-complete"));
    document.querySelectorAll(".fallback-strip span").forEach((step, index) => {
      step.style.setProperty("--step-index", index);
    });
    document.querySelectorAll(".fallback-card").forEach((card) => card.classList.add("is-visible"));
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

  revealItems.forEach((item) => revealObserver.observe(item));

  const flowSection = document.querySelector("[data-flow-section]");
  const flowSteps = Array.from(document.querySelectorAll("[data-flow-step]"));
  let flowPlayed = false;
  let activeTimer = null;

  const playFlow = () => {
    if (flowPlayed) {
      return;
    }

    flowPlayed = true;

    flowSteps.forEach((step, index) => {
      window.setTimeout(() => {
        if (activeTimer) {
          window.clearTimeout(activeTimer);
        }

        flowSteps.forEach((candidate) => candidate.classList.remove("is-current"));
        step.classList.add("is-current", "is-observed");

        activeTimer = window.setTimeout(() => {
          step.classList.remove("is-current");
          step.classList.add("is-complete");
        }, 520);
      }, index * 180);
    });
  };

  if (flowSection && flowSteps.length > 0) {
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

  document.querySelectorAll(".fallback-strip span").forEach((step, index) => {
    step.style.setProperty("--step-index", index);
  });

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

  document.querySelectorAll(".fallback-card").forEach((card) => fallbackObserver.observe(card));
})();