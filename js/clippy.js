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
        // Show Clippy after 30 seconds
        this.showTimeout = setTimeout(() => {
            this.show();
        }, 30000);

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