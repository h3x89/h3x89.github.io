// Initialize Datadog RUM
// Datadog RUM browser client tokens are public by design, but sampling should stay conservative on a public portfolio page.
if (window.origin === window.location.origin) {
    document.addEventListener('DOMContentLoaded', function initializeDatadog() {
        try {
            (function initializeRUM(config) {
                const { window: h, document: o, scriptPath: n } = config;
                const u = 'script';
                const d = 'DD_RUM';

                h[d] = h[d] || {
                    q: [],
                    onReady: function onReady(c) {
                        h[d].q.push(c);
                    }
                };

                const scriptElement = o.createElement(u);
                scriptElement.async = 1;
                scriptElement.src = n;

                const firstScript = o.getElementsByTagName(u)[0];
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
                    service: 'h3x89.github.io',
                    env: 'production',
                    sessionSampleRate: 10,
                    sessionReplaySampleRate: 0,
                    defaultPrivacyLevel: 'mask-user-input',
                    trackUserInteractions: true,
                    trackResources: true,
                    trackLongTasks: true,
                    trackFrustrations: true,
                    enableDebug: false
                });

                window.DD_RUM.isInitialized = true;
            });
        } catch (error) {
            console.error('Failed to initialize Datadog RUM:', error);
        }
    });
} else {
    console.error('Security Error: Event origin mismatch detected in Datadog RUM');
}
