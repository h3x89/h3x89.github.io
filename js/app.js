import Terminal from './terminal.js';
import MatrixEffect from './matrix.js';
import Clippy from './clippy.js';

// Initialize all components when the DOM is loaded
if (window.origin === window.location.origin) {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize Terminal
        const terminal = new Terminal();

        // Initialize Matrix Effect
        const matrixEffect = new MatrixEffect();

        // Initialize Clippy
        const clippy = new Clippy();
    });
} else {
    console.error('Security Error: Event origin mismatch detected');
} 