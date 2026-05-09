class MatrixEffect {
    constructor() {
        this.init();
    }

    init() {
        this.canvas = document.getElementById('matrix');
        this.quote = document.querySelector('.quote');

        if (!this.canvas || !this.quote) {
            console.error('Matrix elements not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.matrixInterval = null;
        this.isActive = false;

        this.hideCanvas();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (window.origin === window.location.origin) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isActive) {
                    this.hideMatrix();
                }
            });

            this.canvas.addEventListener('dblclick', () => {
                if (this.isActive) {
                    this.hideMatrix();
                }
            });

            this.quote.addEventListener('dblclick', () => {
                if (!this.isActive) {
                    this.showMatrix();
                } else {
                    this.hideMatrix();
                }
            });

            window.addEventListener('resize', () => {
                if (this.isActive) {
                    this.resizeCanvas();
                }
            });
        } else {
            console.error('Security Error: Event origin mismatch detected in MatrixEffect');
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    hideCanvas() {
        this.canvas.style.display = 'none';
        this.isActive = false;
    }

    hideMatrix() {
        this.canvas.classList.remove('active');
        document.body.classList.remove('matrix-active');
        setTimeout(() => {
            this.hideCanvas();
            if (this.matrixInterval) {
                clearInterval(this.matrixInterval);
                this.matrixInterval = null;
            }
        }, 500);
    }

    showMatrix() {
        this.canvas.style.display = 'block';
        this.canvas.classList.add('active');
        document.body.classList.add('matrix-active');
        this.isActive = true;
        this.initMatrix();
    }

    initMatrix() {
        this.resizeCanvas();

        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッん';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums;

        const fontSize = 16;
        const columns = this.canvas.width / fontSize;
        const rainDrops = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#0F0';
            this.ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                this.ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

                if (rainDrops[i] * fontSize > this.canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        };

        if (this.matrixInterval) {
            clearInterval(this.matrixInterval);
        }
        this.matrixInterval = setInterval(draw, 30);
    }
}

export default MatrixEffect; 