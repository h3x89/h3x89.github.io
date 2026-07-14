(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      id: "scale",
      title: "Operational Scale",
      kicker: "The reference environment",
      role: "A multi-service reference environment of approximately 70 services, spanning ingress, observability, automation, AI tooling, storage, backup, developer tooling and runtime applications.",
      how: "Services are grouped by operational responsibility rather than by team. The observability stack covers the environment, and engineering changes to its configuration and automation are governed through the auditable delivery workflow described on this page.",
      why: "It shows the operating model applied across a heterogeneous, multi-service platform rather than to a single agent workflow or an isolated automation script.",
      evidence: "Stack overview, per-service documentation, runtime configuration and monitoring coverage.",
      html: `<div><h3>Operational Scale</h3><span class="scale-number">~70 services</span><p>The multi-service reference environment this operating model is exercised against.</p></div><div><ul><li><strong>Domains:</strong> ingress, observability, automation, AI tooling, storage, backup, developer tooling and runtime applications.</li><li><strong>Scope:</strong> engineering changes are governed through one auditable delivery workflow, rather than a single scripted automation.</li></ul><div class="layer-note">Enough variety that a single-purpose automation would not hold — which is the condition the operating model is designed for.</div></div>`,
      scale: true,
      selected: true
    },
    {
      id: "boundary",
      title: "Scoped Tool Access",
      kicker: "Boundary · least privilege",
      role: "An explicit MCP boundary defines which tools an agent may call, and with which arguments.",
      how: "Tool contracts, allowlists and read-only toolsets are declared rather than assumed. Scheduled actors run with narrower scopes than interactive ones.",
      why: "Agents receive bounded capabilities instead of broad, implicit access to infrastructure, so what an agent can reach is reviewable before it runs.",
      evidence: "Tool contracts, allowlists and scoped toolset configuration.",
      html: `<span>01</span><h3>Scoped Tool Access</h3><p>An explicit boundary between agents and infrastructure.</p><ul><li><strong>Contracts:</strong> tools and arguments are declared, not implicit.</li><li><strong>Least privilege:</strong> read-only and guarded toolsets by default.</li><li><strong>Auditable:</strong> the reachable surface is reviewable up front.</li></ul><div class="layer-note">What an agent can touch is a design decision, not a side effect of its credentials.</div>`
    },
    {
      id: "knowledge",
      title: "Repository Knowledge Base",
      kicker: "Context · operating memory",
      role: "The repository doubles as a Markdown knowledge corpus that agents must read before proposing a change.",
      how: "Agent instructions point to knowledge indexes by host, service and task. CI validates knowledge structure and index coverage.",
      why: "Agents read the same documentation the engineers do, so proposed changes reflect how the environment actually works rather than a generic assumption.",
      evidence: "Knowledge indexes, repository instructions and structure checks in CI.",
      html: `<span>02</span><h3>Repository Knowledge Base</h3><p>The repository is the operating memory.</p><ul><li><strong>Indexes:</strong> knowledge routed by host, service and task.</li><li><strong>Rule:</strong> read existing knowledge before changing anything.</li><li><strong>Checks:</strong> structure and index coverage validated in CI.</li></ul><div class="layer-note">Context is a controlled input, not whatever the model happened to remember.</div>`
    },
    {
      id: "agents",
      title: "Coding Agents",
      kicker: "Delivery · repository work",
      role: "Coding agents open branches and pull requests directly, alongside the scheduled-automation path.",
      how: "Every agent follows the same route: branch, draft PR, local validation, CI, AI review, then a human merge decision. Each run closes with a session report.",
      why: "Day-to-day agent delivery passes through the same gates as scheduled automation. There is no fast path.",
      evidence: "Repository instructions, local validation scripts and CI feedback.",
      html: `<span>03</span><h3>Coding Agents</h3><p>Agents open pull requests; they do not change services directly.</p><ul><li><strong>Route:</strong> branch → draft PR → local checks → CI.</li><li><strong>Same gates:</strong> no shortcut around review.</li><li><strong>Closeout:</strong> a session report per run.</li></ul><div class="layer-note">Agent output enters the system as a proposal, in the same shape as a human change.</div>`
    },
    {
      id: "ci",
      title: "CI Control Plane",
      kicker: "Quality gates · deterministic rail",
      role: "Required checks and local/CI parity around every pull request, separating deterministic gates from advisory AI review.",
      how: "A change must pass PR quality, lint, knowledge validation, cost policy, review-thread state, CI/local parity and a session report. Local scripts run the same checks before handoff, so an agent cannot discover in CI what it could have caught locally.",
      why: "This is the deterministic rail around probabilistic output: generated work becomes acceptable only when policy, CI, evidence and review state all line up.",
      evidence: "Required checks, local parity scripts and AI review output.",
      html: `<span>04</span><h3>CI Control Plane</h3><p>Deterministic checks around every pull request.</p><ul><li><strong>Required:</strong> PR quality, lint, knowledge checks, review threads, session report.</li><li><strong>Parity:</strong> the local gate covers the same ground as CI.</li><li><strong>Cost policy:</strong> model spend is a merge-blocking concern.</li></ul><div class="layer-note">The strongest control surface in the model: probabilistic work has to satisfy deterministic gates.</div>`
    },
    {
      id: "review",
      title: "AI Review Matrix",
      kicker: "Review · specialist critique",
      role: "Advisory AI reviewers critique a pull request from technical, risk, business and documentation angles.",
      how: "Each reviewer produces comments, a verdict and follow-up recommendations. None of them can replace a deterministic check or a human approval.",
      why: "One agent's output is challenged by others before a human spends attention on it — but the reviewers advise, they do not decide.",
      evidence: "AI review workflows and reviewer role definitions.",
      html: `<span>05</span><h3>AI Review Matrix</h3><p>Specialist reviewers challenge the work before a human reads it.</p><ul><li><strong>Roles:</strong> technical, critical, business, documentation.</li><li><strong>Output:</strong> comments, verdicts, follow-up work.</li><li><strong>Advisory:</strong> never a substitute for CI or approval.</li></ul><div class="layer-note">Review is layered, so a single model's blind spot is not the last word.</div>`
    },
    {
      id: "governance",
      title: "Human Accountability",
      kicker: "Governance · decision rights",
      role: "A person reviews the change, the checks and the evidence, and owns the merge decision.",
      how: "Before merge, a human sees the pull request, CI results, review threads, the agent's session report and the blast radius of the change.",
      why: "Agents assist; accountability for risk stays with a named person. That boundary is what makes the rest of the model adoptable in an organization with on-call and a change process.",
      evidence: "Review threads, approval history and merge decisions in the delivery system.",
      html: `<span>06</span><h3>Human Accountability</h3><p>A person owns the merge decision.</p><ul><li><strong>Sees:</strong> diff, checks, review threads, session report.</li><li><strong>Owns:</strong> the risk and the call to merge.</li><li><strong>Boundary:</strong> agents propose; humans decide.</li></ul><div class="layer-note">Automation extends the engineer's reach; it does not inherit their authority.</div>`
    },
    {
      id: "provider",
      title: "Provider Routing & Fallback",
      kicker: "Resilience · model routing",
      role: "A routing layer keeps review and agent workflows running when a model provider is slow, unavailable or rate-limited.",
      how: "Shared execution profiles declare a primary provider and an explicit fallback chain. Workflow evidence records which provider and model served each run.",
      why: "When a provider degrades, review and delivery continue on the next provider in the chain, and the logs say which one ran — so failures are explainable rather than silent.",
      evidence: "Routing profiles, fallback chain and per-run provider status in workflow logs.",
      html: `<span>07</span><h3>Provider Routing & Fallback</h3><p>Model providers are treated as an operational dependency.</p><ul><li><strong>Profiles:</strong> a declared primary path per workflow.</li><li><strong>Fallback:</strong> alternates keep the loop moving.</li><li><strong>Evidence:</strong> the run records which provider served it.</li></ul><div class="layer-note">Provider instability degrades gracefully instead of blocking the engineering loop.</div>`
    },
    {
      id: "orchestration",
      title: "Scheduled Feedback Loops",
      kicker: "Improvement · recurring jobs",
      role: "Recurring jobs turn repository friction, stale work and session signals into tracked engineering work.",
      how: "Scheduled audits and post-merge analysis surface repeated failures, documentation gaps and improvement opportunities as issues rather than as folklore.",
      why: "Repeated problems become a backlog instead of recurring the same way twice, so the loop improves the way agents work rather than just using agents once.",
      evidence: "Scheduled audits, session reports and dashboard updates.",
      html: `<span>08</span><h3>Scheduled Feedback Loops</h3><p>The loop improves itself on a schedule.</p><ul><li><strong>Audits:</strong> repository health and coverage checks.</li><li><strong>Insights:</strong> merged-PR and session-report analysis.</li><li><strong>Output:</strong> tracked issues, not tribal knowledge.</li></ul><div class="layer-note">Friction observed once becomes work that stops it recurring.</div>`
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
    runtime: "scale",
    orchestration: "orchestration",
    mcp: "boundary",
    knowledge: "knowledge",
    agents: "agents",
    provider: "provider",
    delivery: "ci",
    ci: "ci",
    human: "governance"
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

  const setLayer = (layerId, source, sourceLabel) => {
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
    setField(layerFields.syncChip, source === "node" && sourceLabel ? `Selected from graph: ${sourceLabel}` : "Selected layer");
  };

  const setNode = (node) => {
    if (!node) return;
    nodes.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === node));
    setField(nodeFields.kicker, node.dataset.kicker || "System node");
    setField(nodeFields.title, node.dataset.title || "Node");
    setField(nodeFields.role, node.dataset.role || "");
    setField(nodeFields.how, node.dataset.how || "");
    setField(nodeFields.why, node.dataset.why || "");
    setLayer(nodeToLayer[node.dataset.layer] || node.dataset.layer, "node", node.dataset.title);
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
