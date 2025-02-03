import Terminal from './terminal.js';
import MatrixEffect from './matrix.js';
import Clippy from './clippy.js';

document.addEventListener('DOMContentLoaded', (event) => {
    if (event.origin !== 'https://h3x89.github.io') {
        throw new Error('invalid origin');
        return;
    }

    // Initialize Terminal
    const terminal = new Terminal();

    // Initialize Matrix Effect
    const matrixEffect = new MatrixEffect();

    // Initialize Clippy
    const clippy = new Clippy();
}); 