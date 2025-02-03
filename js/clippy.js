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

    initializeEventListeners() {
        if (window.origin === window.location.origin) {
            // Show Clippy after 30 seconds
            this.showTimeout = setTimeout(() => {
                this.show();
            }, 30000);
            if (window.origin === window.location.origin) {
                // Show Clippy after 30 seconds
                this.showTimeout = setTimeout(() => {
                    this.show();
                }, 30000);

                // Hide Clippy when clicked
                this.clippy.addEventListener('click', (event) => {
                    if (event.isTrusted && event.target === this.clippy && event.currentTarget.ownerDocument.defaultView.origin === window.location.origin) {
                        this.hide();
                    } else {
                        console.error('Invalid event source detected');
                    }
                });
            } else {
                console.error('Security Error: Event origin mismatch detected in Clippy');
            }
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