class Clippy {
    constructor() {
        this.init();
    }

    init() {
        this.container = document.querySelector('.clippy-container');
        this.clippy = document.querySelector('.clippy');

        if (!this.container || !this.clippy) {
            console.error('Clippy elements not found');
            return;
        }

        this.showTimeout = null;
        this.initializeEventListeners();
    }

    /** Production GitHub Pages + custom domain; localhost for local testing. */
    static isAllowedPageOrigin() {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return true;
        return h === 'h3x89.github.io' || h === 'robertkubis.pl';
    }

    initializeEventListeners() {
        // `?showClippy=1` (or bare `showClippy`) helps QA on mobile without waiting 30s.
        const params = new URLSearchParams(window.location.search);
        const instant =
            params.has('showClippy') &&
            params.get('showClippy') !== '0' &&
            params.get('showClippy') !== 'false';
        const delayMs = instant ? 600 : 30000;

        this.showTimeout = setTimeout(() => {
            this.show();
        }, delayMs);

        // Hide Clippy when clicked
        this.clippy.addEventListener('click', (event) => {
            if (!Clippy.isAllowedPageOrigin()) {
                throw new Error('invalid origin');
            }
            if (!event.isTrusted) {
                throw new Error('untrusted event');
            }
            this.hide();
        });
    }

    show() {
        this.container.classList.add('active');
    }

    hide() {
        this.container.style.display = 'none';
        if (this.showTimeout) {
            clearTimeout(this.showTimeout);
        }
    }
}

// Export the Clippy class
export default Clippy; 