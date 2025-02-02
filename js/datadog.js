// Initialize Datadog RUM
try {
    // Prevent multiple initializations
    // if (window.DD_RUM && window.DD_RUM.isInitialized) {
    //     console.warn('Datadog RUM is already initialized');
    //     return;
    // }

    (function (h, o, u, n, d) {
        h = h[d] = h[d] || { q: [], onReady: function (c) { h.q.push(c) } }
        d = o.createElement(u); d.async = 1; d.src = n
        n = o.getElementsByTagName(u)[0]; n.parentNode.insertBefore(d, n)
    })(window, document, 'script', 'https://www.datadoghq-browser-agent.com/us1/v6/datadog-rum.js', 'DD_RUM')

    window.DD_RUM.onReady(function () {
        window.DD_RUM.init({
            applicationId: 'ef98ba92-2942-4c3c-bccf-a0473752a05d',
            clientToken: 'pub36d6cdb75f01bb02ab01e805a1d01d0b',
            site: 'datadoghq.com',
            service: 'h3x89.github.io',
            env: 'development',
            sessionSampleRate: 100,
            sessionReplaySampleRate: 20,
            defaultPrivacyLevel: 'mask-user-input',
            trackUserInteractions: true,
            trackResources: true,
            trackLongTasks: true,
            trackFrustrations: true,
            enableDebug: true
        });

        // Mark as initialized
        window.DD_RUM.isInitialized = true;
        console.log('Datadog RUM initialized successfully');
    });
} catch (error) {
    console.error('Failed to initialize Datadog RUM:', error);
} 