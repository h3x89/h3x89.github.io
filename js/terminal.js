// Terminal commands data
// Keep this easter egg safe and current: avoid hard-to-defend public metrics or outdated role claims.
const realCommands = [
    {
        cmd: 'whoami && id',
        output: 'robert@platform\nuid=1000(robert) gid=1000(platform) groups=1000(platform),4(cloud),20(observability),27(automation)'
    },
    {
        cmd: 'cat current_focus.md',
        output: 'Platform & Tools · Observability · Automation · AI-enabled Operations · Engineering Leadership'
    },
    {
        cmd: './show_platform_scope.sh',
        output: 'Streams: Monitoring, Automation & Orchestration, AI enablement, Portals, Operational Support'
    },
    {
        cmd: './observability_stack.sh',
        output: 'Grafana · Prometheus · VictoriaMetrics · Loki · Alloy · monitoring-as-code · Git-reviewed configuration'
    },
    {
        cmd: './leadership_principles.sh',
        output: 'Ownership over heroics\nUseful signals over noisy dashboards\nSafe automation over manual toil\nHuman-in-the-loop AI where actions matter'
    },
    {
        cmd: './last_mile_of_observability.sh',
        output: 'signal -> context -> owner -> decision -> action -> follow-up'
    },
    {
        cmd: './ai_ops_guardrails.sh',
        output: 'Deterministic inputs · read-only integrations · source timestamps · owner validation · human approval'
    },
    {
        cmd: './selected_work.sh --short',
        output: 'Platform leadership\nAI observability agent\nAutomation engine\nAI meeting intelligence'
    },
    {
        cmd: './delivery_style.sh',
        output: 'Convert unclear asks into requirements, owners, examples, acceptance criteria and measurable outcomes.'
    },
    {
        cmd: './platform_value.py',
        output: 'Reduce coordination cost. Improve incident context. Make ownership visible. Help teams move faster with safer defaults.'
    }
];

class Terminal {
    constructor() {
        this.init();
    }

    init() {
        this.terminalText = document.querySelector('.terminal-text');
        this.terminalInfo = document.querySelector('.terminal-info');

        if (!this.terminalText || !this.terminalInfo) {
            console.error('Terminal elements not found');
            return;
        }

        this.originalText = this.terminalText.textContent;
        this.isExpanded = false;
        this.overlay = document.createElement('div');
        this.overlay.className = 'terminal-overlay';
        document.body.appendChild(this.overlay);

        this.expandedTerminal = document.createElement('div');
        this.expandedTerminal.className = 'terminal-expanded';
        document.body.appendChild(this.expandedTerminal);

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (window.origin === window.location.origin) {
            this.terminalText.addEventListener('dblclick', (event) => {
                if (event.isTrusted && event.target === this.terminalText) {
                    if (!this.isExpanded) {
                        this.expandTerminal();
                    } else {
                        this.collapseTerminal();
                    }
                }
            });

            this.overlay.addEventListener('click', (event) => {
                if (event.isTrusted && event.target === this.overlay) {
                    this.collapseTerminal();
                }
            });
        } else {
            console.error('Security Error: Event origin mismatch detected in Terminal');
        }
    }

    expandTerminal() {
        if (window.origin !== window.location.origin) {
            console.error('Security Error: Invalid event origin');
            return;
        }

        while (this.expandedTerminal.firstChild) {
            this.expandedTerminal.removeChild(this.expandedTerminal.firstChild);
        }

        const historyContainer = document.createElement('ul');
        historyContainer.className = 'command-history';
        this.expandedTerminal.appendChild(historyContainer);

        this.overlay.classList.add('active');
        this.expandedTerminal.classList.add('active');
        this.isExpanded = true;

        let i = 0;
        const addCommand = () => {
            if (window.origin !== window.location.origin) {
                console.error('Security Error: Invalid event origin in timeout');
                return;
            }

            if (i < realCommands.length) {
                const { cmd, output } = realCommands[i];
                const li = document.createElement('li');
                const promptSpan = document.createElement('span');
                promptSpan.className = 'prompt';
                promptSpan.textContent = '[robert@platform] $';
                li.appendChild(promptSpan);
                li.appendChild(document.createTextNode(' ' + cmd));
                historyContainer.appendChild(li);

                setTimeout(() => {
                    if (window.origin === window.location.origin) {
                        const outputLi = document.createElement('li');
                        const outputSpan = document.createElement('span');
                        outputSpan.className = 'output';
                        outputSpan.textContent = output;
                        outputLi.appendChild(outputSpan);
                        historyContainer.appendChild(outputLi);
                        this.expandedTerminal.scrollTop = this.expandedTerminal.scrollHeight;
                    }
                }, 300);

                i++;
                setTimeout(addCommand, 850);
            }
        };

        addCommand();
    }

    collapseTerminal() {
        this.overlay.classList.remove('active');
        this.expandedTerminal.classList.remove('active');
        this.isExpanded = false;
    }
}

export default Terminal;
