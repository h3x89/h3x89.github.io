// Terminal commands data
const realCommands = [
    { cmd: 'whoami && id', output: 'robert@devops\nuid=1000(robert) gid=1000(devops) groups=1000(devops),4(cloud),20(architect),27(automation)' },
    { cmd: './scan_profile.sh --target "Robert Kubis" --mode deep', output: 'Scanning professional profile...\n[FOUND] Experience: 10+ years in IT\n[FOUND] Current Role: Engineering Team Lead at Nordcloud (IBM)\n[FOUND] Teams Managed: 20+ professionals' },
    { cmd: 'cat /etc/security/access.log | grep "leadership"', output: '[ACCESS] Team Leadership: Granted\n[SKILLS] Strategic Planning: Verified\n[CERT] Management Experience: Confirmed\nTeam Size: 20+ members across development and operations' },
    { cmd: 'aws organizations list-accounts --query "Accounts[?Status==`ACTIVE`]"', output: '[\n    "prod-eu-central-1",\n    "prod-eu-west-1",\n    "staging-eu-central-1"\n]\nManaging multi-region cloud infrastructure' },
    { cmd: 'kubectl get deployments -n automation', output: 'NAME                    READY   UP-TO-DATE   AVAILABLE   AGE\nci-pipeline              3/3     3            3           180d\ncd-automation            2/2     2            2           180d\nmonitoring-stack         4/4     4            4           180d' },
    { cmd: './analyze_expertise.py --skills="cloud,devops,ai" --experience=10', output: 'Analyzing professional expertise...\n✓ Cloud Architecture: Advanced\n✓ DevOps Practices: Expert\n✓ AI Integration: Proficient\n✓ Team Leadership: Verified' },
    { cmd: 'docker ps --filter "label=project=automation"', output: 'CONTAINER ID   IMAGE                    STATUS          PORTS\nabc123def     automation-engine:latest   Up 45 days     0.0.0.0:8080->8080/tcp\ndef456ghi     monitoring-suite:v2.1      Up 30 days     0.0.0.0:9090->9090/tcp' },
    { cmd: 'top -b -n 1 | grep "Cost Optimization"', output: 'Running Cost Optimization Analysis...\nIdentified Savings: $250K+ annually\nOptimization Score: 94%\nEfficiency Rating: A+' },
    { cmd: 'git log --author="Robert Kubis" --oneline | head -n 5', output: 'f4e5d6c Implement AI-driven automation pipeline\n7g8h9i0 Optimize cloud resource allocation\na1b2c3d Deploy multi-region infrastructure\nx9y8z7w Enhance security protocols\nm4n5o6p Scale kubernetes cluster' },
    { cmd: './decrypt_achievements.sh --level=all', output: 'Decrypting professional achievements...\n[SUCCESS] Led transformation of cloud automation\n[SUCCESS] Reduced operational costs by 35%\n[SUCCESS] Improved system reliability to 99.99%\n[SUCCESS] Implemented AI-driven solutions' },
    { cmd: 'nmap -p- --script "cloud-* and not brute" nordcloud.com', output: 'Scanning Cloud Infrastructure...\nDiscovered Services:\n- Automated Deployment Systems\n- Continuous Integration Pipeline\n- Security Monitoring\n- Cost Management Tools' },
    { cmd: 'python3 -c "import career; print(career.get_specializations())"', output: '[\n    "Cloud Architecture",\n    "DevOps Leadership",\n    "AI & Automation",\n    "FinOps",\n    "Team Management"\n]' },
    { cmd: 'tail -f /var/log/projects/success.log', output: '[SUCCESS] Transformed cloud automation practices\n[SUCCESS] Scaled solutions for global customers\n[SUCCESS] Enhanced operational efficiency\n[SUCCESS] Reduced infrastructure costs' },
    { cmd: './analyze_impact.py --metrics="all" --timeframe="last_year"', output: 'Analyzing business impact...\n↑ Team Productivity: +45%\n↓ Operational Costs: -35%\n↑ System Reliability: 99.99%\n↑ Customer Satisfaction: 98%' },
    { cmd: 'openssl req -subject "/CN=Robert Kubis/O=Cloud Architecture/C=PL"', output: 'Generating certificate for secure operations...\nVerified: Cloud Architect & Engineering Team Lead\nExpertise: Confirmed\nAccess Level: Administrator' }
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

        // Clear the terminal safely
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
                promptSpan.textContent = '[robert@devops] $';
                li.appendChild(promptSpan);
                li.appendChild(document.createTextNode(' ' + cmd));
                historyContainer.appendChild(li);

                setTimeout(function displayOutput() {
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
                setTimeout(addCommand, 1000);
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

// Export the Terminal class
export default Terminal; 