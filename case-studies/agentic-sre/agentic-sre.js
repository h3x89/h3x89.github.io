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

/* Merged from agentic-sre.js */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const graphSection = document.querySelector("[data-system-graph]");

  const setField = (field, value) => {
    if (field) field.textContent = value || "";
  };

  const escapeAttr = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const makeLayerButton = (layer) => {
    const classes = ["layer-card"];
    if (layer.scale) classes.push("scale-card");
    if (layer.selected) classes.push("is-layer-selected");

    return `<button class="${classes.join(" ")}" type="button" data-layer-id="${escapeAttr(layer.id)}" data-layer-title="${escapeAttr(layer.title)}" data-layer-kicker="${escapeAttr(layer.kicker)}" data-layer-role="${escapeAttr(layer.role)}" data-layer-how="${escapeAttr(layer.how)}" data-layer-why="${escapeAttr(layer.why)}" data-layer-evidence="${escapeAttr(layer.evidence)}" data-reveal>${layer.html}</button>`;
  };

  const layersModel = [
    {
      id: "runtime",
      title: "Runtime Scale",
      kicker: "Scale · Managed operations",
      role: "The Agentic SRE loop maintains and monitors roughly 70 services or containers across the managed runtime.",
      how: "The runtime is presented through grouped operating domains such as ingress, observability, automation, AI tooling, storage, backup, developer tooling and runtime applications.",
      why: "The scale makes the portfolio story concrete: this is not a toy PR bot, but an operating model for a real multi-service platform.",
      evidence: "Repository stack overview · service docs · compose and runtime docs",
      html: `<div><h3>Runtime Scale</h3><span class="scale-number">~70 services / containers</span><p>Maintained and monitored across the managed runtime.</p></div><div><ul><li><strong>Service groups:</strong> ingress, observability, automation, AI tooling and runtime applications.</li><li><strong>Operational scope:</strong> a shared delivery model applied across the platform, not a single workflow.</li></ul><div class="layer-note">Outcome: the delivery loop is grounded in a runtime large enough to require repeatable operational discipline.</div></div>`,
      scale: true,
      selected: true
    },
    {
      id: "ci",
      title: "CI Control Plane",
      kicker: "Quality gates · deterministic rail",
      role: "Required checks and local parity around every PR, separating deterministic gates from advisory AI review.",
      how: "PR work is expected to pass title/body quality, GitHub Actions lint, Markdown and knowledge validation, fast lint, cost policy, review-thread state, CI/local parity and Agent Session Report. Local scripts such as check-pr.sh and wait-for-pr-ci.sh make agents verify the same flow before handoff.",
      why: "This is the strongest control surface around probabilistic agent output: generated work becomes acceptable only when repo policy, CI, session evidence and review state line up.",
      evidence: "Required checks · local parity scripts · AI review outputs",
      html: `<span>01</span><h3>CI Control Plane</h3><p>Required checks and local parity around every PR.</p><ul><li><strong>Required:</strong> PR quality, lint, knowledge checks, review threads, session report.</li><li><strong>Local parity:</strong> agents verify the same checks before handoff.</li><li><strong>Advisory:</strong> AI actors add critique without replacing CI.</li></ul><div class="layer-note">Outcome: PRs reach human review with deterministic checks and supporting evidence already in place.</div>`
    },
    {
      id: "orchestration",
      title: "Scheduled Feedback Loops",
      kicker: "Self-improvement · recurring jobs",
      role: "Recurring jobs convert repository friction, stale work and agent-session signals into reports, dashboard issues and follow-up tasks.",
      how: "Scheduled audits and post-merge analysis surface repeated failures, missing documentation gaps and improvement opportunities as trackable engineering work.",
      why: "This shows the system improving the way agents work, not just using agents once.",
      evidence: "Scheduled audits · session reports · dashboard updates",
      html: `<span>02</span><h3>Scheduled Feedback Loops</h3><p>Recurring jobs turn agent friction into improvement work.</p><ul><li><strong>Audit loop:</strong> repository health and dashboard updates.</li><li><strong>Session insights:</strong> merged PR and session-report analysis.</li><li><strong>Other loops:</strong> health, reminders and cost checks.</li></ul><div class="layer-note">Outcome: recurring operations generate a backlog of concrete improvements instead of repeating the same failures.</div>`
    },
    {
      id: "knowledge",
      title: "Repository Knowledge Base",
      kicker: "Context · Markdown operating memory",
      role: "The repository works as a Markdown knowledge corpus and operating memory for agents.",
      how: "Agent instructions point to knowledge indexes by host, service and task before changes. CI validates knowledge structure and index coverage.",
      why: "This explains why agent output can be repo-grounded.",
      evidence: "Knowledge index · repository instructions · knowledge structure checks",
      html: `<span>03</span><h3>Repository Knowledge Base</h3><p>The repo is an operating memory for agents.</p><ul><li><strong>Indexes:</strong> host, service and task knowledge.</li><li><strong>Rule:</strong> read existing knowledge before changing.</li><li><strong>Checks:</strong> structure and index coverage in CI.</li></ul><div class="layer-note">Outcome: agent decisions stay grounded in repository context instead of generic assumptions.</div>`
    },
    {
      id: "platform",
      title: "Runtime Platform",
      kicker: "Runtime · Managed platform",
      role: "The concrete operating environment that Agentic SRE helps keep maintainable.",
      how: "Repository docs describe containerized services, ingress, automation, monitoring and AI-stack components. The public story is framed around roughly 70 services or containers being maintained and observed across the runtime.",
      why: "This anchors the portfolio story in real operations.",
      evidence: "Stack overview · compose/runtime docs · monitoring docs",
      html: `<span>04</span><h3>Runtime Platform</h3><p>The system maintains a real multi-service runtime.</p><ul><li><strong>Host class:</strong> managed runtime environment.</li><li><strong>Runtime:</strong> containerized services and automation.</li><li><strong>Scale:</strong> around 70 services / containers.</li></ul><div class="layer-note">Outcome: the operating model is tied to a live platform with measurable responsibilities.</div>`
    },
    {
      id: "agents",
      title: "Coding Agents",
      kicker: "Delivery · direct repo work",
      role: "Direct coding agents work on repository PRs outside the scheduled-automation-only path.",
      how: "Coding agents operate through branch, draft PR, local checks, CI, AI review and human merge decision. They must follow repo rules, use local validation scripts and close the loop with an agent session report.",
      why: "This makes clear that Agentic SRE includes normal coding-agent delivery.",
      evidence: "Repository instructions · local validation · CI feedback",
      html: `<span>05</span><h3>Coding Agents</h3><p>Not only scheduled jobs: coding agents work directly on repo PRs.</p><ul><li><strong>Agents:</strong> coding and implementation assistants.</li><li><strong>Path:</strong> branch → draft PR → local checks → CI.</li><li><strong>Closeout:</strong> agent session report.</li></ul><div class="layer-note">Outcome: direct implementation work stays inside the same governed delivery loop as scheduled automation.</div>`
    },
    {
      id: "review",
      title: "AI Review Matrix",
      kicker: "Review · specialist critique",
      role: "A set of advisory AI reviewer roles critique PRs from different angles.",
      how: "Technical, critical, business and documentation-focused reviewers produce comments, verdicts and follow-up recommendations without replacing deterministic CI or human approval.",
      why: "The system does not trust one agent blindly; other agents challenge the work.",
      evidence: "AI review workflows · review actor docs",
      html: `<span>06</span><h3>AI Review Matrix</h3><p>Specialist reviewers critique agent output before merge.</p><ul><li><strong>Roles:</strong> technical, critical and business reviewers.</li><li><strong>Docs:</strong> documentation review and summaries.</li><li><strong>Output:</strong> comments, verdicts, follow-up work.</li></ul><div class="layer-note">Outcome: changes are challenged from multiple perspectives before merge or deployment.</div>`
    },
    {
      id: "provider",
      title: "Provider Routing & Fallback",
      kicker: "Resilience · model routing",
      role: "A model-provider routing layer keeps AI review and agent workflows available when a provider is slow, unavailable or rate-limited.",
      how: "Agent workflows use shared execution profiles with explicit primary and fallback provider paths. Routing status stays visible in workflow evidence, so failures are explainable instead of silent.",
      why: "AI delivery is treated as an operational dependency: provider instability degrades gracefully instead of blocking the engineering loop.",
      evidence: "LiteLLM profiles · fallback chain · provider status evidence · review workflow logs",
      html: `<span>07</span><h3>Provider Routing & Fallback</h3><p>Resilient model-provider routing for agent execution.</p><ul><li><strong>Profiles:</strong> shared execution profiles define the primary path.</li><li><strong>Fallback chain:</strong> alternate providers keep workflows moving when capacity shifts.</li><li><strong>Status:</strong> provider and model state remain visible in workflow evidence.</li></ul><div class="layer-note">Outcome: provider instability degrades gracefully instead of blocking review and delivery.</div>`
    },
    {
      id: "human",
      title: "Service Landscape",
      kicker: "Runtime · service groups",
      role: "A grouped view of the managed runtime behind the Agentic SRE operating model.",
      how: "The runtime is organized into service groups such as ingress, observability, automation, AI tooling, storage, backup, developer tooling and runtime applications.",
      why: "It shows that the workflow supports a real multi-service platform with operational complexity, not an isolated demo.",
      evidence: "Stack overview · service documentation · compose/runtime docs · monitoring docs",
      html: `<span>08</span><h3>Service Landscape</h3><p>A grouped view of the managed runtime behind the operating model.</p><ul><li><strong>Service groups:</strong> ingress, observability, automation, AI tooling, storage and backup.</li><li><strong>Runtime categories:</strong> developer tooling and runtime applications complete the platform view.</li><li><strong>Operational scale:</strong> roughly 70 services / containers under management.</li></ul><div class="layer-note">Outcome: the case study is anchored in a real platform with enough complexity to justify governed AI operations.</div>`
    }
  ];

  const layerGrid = document.querySelector("[data-layer-grid]");
  if (layerGrid) {
    layerGrid.classList.add("is-rich-layer-grid");
    layerGrid.innerHTML = layersModel.map(makeLayerButton).join("");
  }

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  revealItems.forEach((item) => {
    const parent = item.closest("[data-reveal-group]");
    if (!parent) return;
    const siblings = Array.from(parent.querySelectorAll("[data-reveal]"));
    const index = Math.max(0, siblings.indexOf(item));
    item.style.setProperty("--reveal-delay", `${Math.min(index * 75, 300)}ms`);
  });

  const show = (element) => element.classList.add("is-visible");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(show);
  } else {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        show(entry.target);
        instance.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.14 });
    revealItems.forEach((item) => observer.observe(item));
  }

  if (!graphSection) return;

  const graphStage = graphSection.querySelector("[data-graph-stage]");
  const modeButtons = Array.from(graphSection.querySelectorAll("[data-mode]"));
  const nodes = Array.from(graphSection.querySelectorAll(".graph-node"));
  const layers = Array.from(document.querySelectorAll("[data-layer-grid] .layer-card"));
  const mobileSteps = Array.from(graphSection.querySelectorAll("[data-mobile-path]"));
  const mobileTitle = graphSection.querySelector("[data-mobile-title]");
  const selectedPanel = document.querySelector("#selected-layer .selected-panel");

  const providerNode = nodes.find((node) => node.dataset.title === "Provider fallback chain");
  if (providerNode) {
    providerNode.dataset.title = "Provider fallback chain";
    providerNode.dataset.kicker = "Fallback · Provider routing";
    providerNode.dataset.role = "The provider fallback path for shared agent execution profiles.";
    providerNode.dataset.how = "Shared execution profiles define primary and fallback provider paths, and workflow evidence shows which provider and model served the run.";
    const label = providerNode.querySelector("strong");
    const sublabel = providerNode.querySelector("span");
    setField(label, "Provider fallback chain");
    setField(sublabel, "primary → fallback");
  }

  mobileSteps
    .filter((step) => step.dataset.nodeTarget === "Provider fallback chain")
    .forEach((step) => {
      step.dataset.nodeTarget = "Provider fallback chain";
      setField(step.querySelector("strong"), "Provider fallback chain");
    });

  const nodeFields = {
    kicker: graphSection.querySelector("[data-node-kicker]"),
    title: graphSection.querySelector("[data-node-title]"),
    role: graphSection.querySelector("[data-node-role]"),
    how: graphSection.querySelector("[data-node-how]"),
    why: graphSection.querySelector("[data-node-why]")
  };

  const layerFields = {
    kicker: selectedPanel?.querySelector("[data-layer-kicker]"),
    title: selectedPanel?.querySelector("[data-layer-title]"),
    role: selectedPanel?.querySelector("[data-layer-role]"),
    how: selectedPanel?.querySelector("[data-layer-how]"),
    why: selectedPanel?.querySelector("[data-layer-why]"),
    evidence: selectedPanel?.querySelector("[data-layer-evidence]"),
    syncChip: selectedPanel?.querySelector("[data-sync-chip]")
  };

  const nodeToLayer = {
    runtime: "runtime",
    orchestration: "orchestration",
    mcp: "runtime",
    knowledge: "knowledge",
    agents: "agents",
    provider: "provider",
    delivery: "ci",
    ci: "ci",
    human: "human"
  };

  const modeTitles = {
    event: "Event remediation path",
    scheduled: "Scheduled improvement path",
    provider: "Provider fallback path"
  };

  const pathMatches = (value, mode) => (value || "").split(/\s+/).includes(mode);

  const setMode = (mode) => {
    if (graphStage) {
      graphStage.classList.remove("is-mode-event", "is-mode-scheduled", "is-mode-provider");
      graphStage.classList.add(`is-mode-${mode}`);
    }

    modeButtons.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    nodes.forEach((node) => {
      const active = pathMatches(node.dataset.paths, mode);
      node.classList.toggle("is-muted", !active);
      node.classList.toggle("is-path-active", active);
    });

    mobileSteps.forEach((step) => step.classList.toggle("is-visible-step", pathMatches(step.dataset.mobilePath, mode)));
    if (mobileTitle) mobileTitle.textContent = modeTitles[mode] || "Selected path";
  };

  const setLayer = (layerId, source) => {
    const layer = layers.find((candidate) => candidate.dataset.layerId === layerId) || layers[0];
    if (!layer) return;

    layers.forEach((candidate) => {
      const active = candidate === layer;
      candidate.classList.toggle("is-layer-selected", active);
      candidate.setAttribute("aria-pressed", String(active));
    });

    setField(layerFields.kicker, layer.dataset.layerKicker || "Operating layer");
    setField(layerFields.title, layer.dataset.layerTitle || "Layer");
    setField(layerFields.role, layer.dataset.layerRole || "");
    setField(layerFields.how, layer.dataset.layerHow || "");
    setField(layerFields.why, layer.dataset.layerWhy || "");
    setField(layerFields.evidence, layer.dataset.layerEvidence || "");
    setField(layerFields.syncChip, source === "node" ? "graph-linked" : "layer-selected");
  };

  const setNode = (node) => {
    if (!node) return;
    nodes.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === node));
    setField(nodeFields.kicker, node.dataset.kicker || "System node");
    setField(nodeFields.title, node.dataset.title || "Node");
    setField(nodeFields.role, node.dataset.role || "");
    setField(nodeFields.how, node.dataset.how || "");
    setField(nodeFields.why, node.dataset.why || "");
    setLayer(nodeToLayer[node.dataset.layer] || node.dataset.layer, "node");
  };

  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  nodes.forEach((node) => {
    node.addEventListener("click", () => setNode(node));
    node.addEventListener("focus", () => setNode(node));
  });
  layers.forEach((layer) => {
    layer.setAttribute("aria-pressed", String(layer.classList.contains("is-layer-selected")));
    layer.addEventListener("click", () => setLayer(layer.dataset.layerId, "layer"));
    layer.addEventListener("focus", () => setLayer(layer.dataset.layerId, "layer"));
  });
  mobileSteps.forEach((step) => {
    step.addEventListener("click", () => {
      const targetNode = nodes.find((node) => node.dataset.title === step.dataset.nodeTarget);
      setNode(targetNode);
      document.querySelector("#selected-layer")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  setMode("event");
  setNode(nodes.find((node) => node.classList.contains("is-selected")) || nodes[0]);
})();
