// Initialize Datadog RUM for the public portfolio website.
// Datadog RUM browser client tokens are public by design. Never put Datadog API keys here.
(function initializePortfolioDatadog() {

    const getPageType = () => {
        const path = window.location.pathname;

        if (path === '/' || path === '/index.html') {
            return 'home';
        }

        if (path.startsWith('/case-studies/agentic-sre/')) {
            return 'case_study';
        }

        if (path.startsWith('/agentic-sre/')) {
            return 'redirect';
        }

        return 'unknown';
    };

    const getCanonicalUrl = () => {
        const canonical = document.querySelector('link[rel="canonical"]');
        return canonical && canonical.href ? canonical.href : window.location.href;
    };

    const getReferrerDomain = () => {
        if (!document.referrer) {
            return '';
        }

        try {
            return new URL(document.referrer).hostname;
        } catch (error) {
            return 'invalid_referrer';
        }
    };

    const classifyVisitor = () => {
        const userAgent = (navigator.userAgent || '').toLowerCase();

        if (/gptbot|chatgpt-user|oai-searchbot|openai/.test(userAgent)) {
            return { likely_bot_or_ai: true, bot_family: 'chatgpt' };
        }

        if (/claudebot|claude-web|anthropic/.test(userAgent)) {
            return { likely_bot_or_ai: true, bot_family: 'claude' };
        }

        if (/perplexitybot|perplexity/.test(userAgent)) {
            return { likely_bot_or_ai: true, bot_family: 'perplexity' };
        }

        if (/googlebot|google-inspectiontool|adsbot-google/.test(userAgent)) {
            return { likely_bot_or_ai: true, bot_family: 'googlebot' };
        }

        if (/bingbot|bingpreview|msnbot/.test(userAgent)) {
            return { likely_bot_or_ai: true, bot_family: 'bingbot' };
        }

        if (/bot|crawler|spider|slurp|duckduckbot|baiduspider|yandex/.test(userAgent)) {
            return { likely_bot_or_ai: true, bot_family: 'other_bot' };
        }

        return { likely_bot_or_ai: false, bot_family: 'unknown' };
    };

    const getBaseActionAttributes = () => ({
        path: window.location.pathname,
        page_type: getPageType(),
        canonical_url: getCanonicalUrl(),
        referrer_domain: getReferrerDomain(),
        ...classifyVisitor()
    });

    const safeAddAction = (name, attributes = {}) => {
        if (!window.DD_RUM || typeof window.DD_RUM.addAction !== 'function') {
            return;
        }

        try {
            window.DD_RUM.addAction(name, {
                ...getBaseActionAttributes(),
                ...attributes
            });
        } catch (error) {
            console.error('Failed to add Datadog RUM action:', error);
        }
    };

    const describeLink = (link) => {
        const href = link.getAttribute('href') || '';
        const text = (link.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);

        try {
            const url = new URL(href, window.location.origin);
            return {
                href_host: url.hostname,
                href_path: url.pathname,
                link_text: text
            };
        } catch (error) {
            return {
                href_host: '',
                href_path: href,
                link_text: text
            };
        }
    };

    const classifyPortfolioLinkAction = (link) => {
        const href = link.getAttribute('href') || '';
        const normalizedHref = href.toLowerCase();

        if (normalizedHref.includes('robertkubisresume.pdf')) {
            return 'portfolio_click_cv';
        }

        if (normalizedHref.includes('github.com/h3x89')) {
            return 'portfolio_click_github';
        }

        if (normalizedHref.includes('linkedin.com/in/robertkubis89')) {
            return 'portfolio_click_linkedin';
        }

        if (normalizedHref.startsWith('mailto:')) {
            return 'portfolio_click_mail';
        }

        if (normalizedHref.includes('/agentic-sre') || normalizedHref.includes('/case-studies/agentic-sre')) {
            return 'portfolio_click_agentic_sre';
        }

        return null;
    };

    const registerPortfolioActions = () => {
        safeAddAction('portfolio_page_view');

        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');

            if (link) {
                const actionName = classifyPortfolioLinkAction(link);

                if (actionName) {
                    safeAddAction(actionName, describeLink(link));
                }
            }

            const modeButton = event.target.closest('.mode-button[data-mode]');
            if (modeButton) {
                safeAddAction('agentic_sre_graph_mode_change', {
                    mode: modeButton.dataset.mode || 'unknown'
                });
            }

            const graphNode = event.target.closest('.graph-node');
            if (graphNode) {
                safeAddAction('agentic_sre_graph_node_click', {
                    node_title: graphNode.dataset.title || graphNode.textContent.trim().slice(0, 80),
                    node_layer: graphNode.dataset.layer || 'unknown',
                    node_paths: graphNode.dataset.paths || 'unknown'
                });
            }
        });
    };

    try {
        (function loadRUM(config) {
            const { window: h, document: o, scriptPath: n } = config;
            const tagName = 'script';
            const globalName = 'DD_RUM';

            h[globalName] = h[globalName] || {
                q: [],
                onReady: function onReady(callback) {
                    h[globalName].q.push(callback);
                }
            };

            const scriptElement = o.createElement(tagName);
            scriptElement.async = 1;
            scriptElement.src = n;

            const firstScript = o.getElementsByTagName(tagName)[0];
            firstScript.parentNode.insertBefore(scriptElement, firstScript);
        })({
            window,
            document,
            scriptPath: 'https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js'
        });

        window.DD_RUM.onReady(function configureRUM() {
            window.DD_RUM.init({
                applicationId: 'ef98ba92-2942-4c3c-bccf-a0473752a05d',
                clientToken: 'pub36d6cdb75f01bb02ab01e805a1d01d0b',
                site: 'datadoghq.com',
                service: 'robertkubis.pl',
                env: 'production',
                sessionSampleRate: 100,
                sessionReplaySampleRate: 0,
                defaultPrivacyLevel: 'mask-user-input',
                trackUserInteractions: true,
                trackResources: true,
                trackLongTasks: true,
                trackFrustrations: true,
                enableDebug: false
            });

            const visitorClassification = classifyVisitor();
            if (typeof window.DD_RUM.setGlobalContextProperty === 'function') {
                window.DD_RUM.setGlobalContextProperty('portfolio_page_type', getPageType());
                window.DD_RUM.setGlobalContextProperty('likely_bot_or_ai', visitorClassification.likely_bot_or_ai);
                window.DD_RUM.setGlobalContextProperty('bot_family', visitorClassification.bot_family);
            }

            window.DD_RUM.isInitialized = true;
            registerPortfolioActions();
        });
    } catch (error) {
        console.error('Failed to initialize Datadog RUM:', error);
    }
})();
