import Terminal from './terminal.js';
import MatrixEffect from './matrix.js';
import Clippy from './clippy.js';

// Initialize all components when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Terminal
    const terminal = new Terminal();

    // Initialize Matrix Effect
    const matrixEffect = new MatrixEffect();

    // Initialize Clippy
    const clippy = new Clippy();
}); 