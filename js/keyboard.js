
export class VirtualKeyboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.keys = new Map(); // Map key code -> DOM element

        this.layout = [
            // Row 1
            [
                { key: 'q', code: 'KeyQ' }, { key: 'w', code: 'KeyW' }, { key: 'e', code: 'KeyE' }, { key: 'r', code: 'KeyR' },
                { key: 't', code: 'KeyT' }, { key: 'y', code: 'KeyY' }, { key: 'u', code: 'KeyU' }, { key: 'i', code: 'KeyI' },
                { key: 'o', code: 'KeyO' }, { key: 'p', code: 'KeyP' }, { key: '[', code: 'BracketLeft' }, { key: ']', code: 'BracketRight' }
            ],
            // Row 2
            [
                { key: 'a', code: 'KeyA' }, { key: 's', code: 'KeyS' }, { key: 'd', code: 'KeyD' }, { key: 'f', code: 'KeyF' },
                { key: 'g', code: 'KeyG' }, { key: 'h', code: 'KeyH' }, { key: 'j', code: 'KeyJ' }, { key: 'k', code: 'KeyK' },
                { key: 'l', code: 'KeyL' }, { key: ';', code: 'Semicolon' }, { key: "'", code: 'Quote' }
            ],
            // Row 3
            [
                { key: 'z', code: 'KeyZ' }, { key: 'x', code: 'KeyX' }, { key: 'c', code: 'KeyC' }, { key: 'v', code: 'KeyV' },
                { key: 'b', code: 'KeyB' }, { key: 'n', code: 'KeyN' }, { key: 'm', code: 'KeyM' }, { key: ',', code: 'Comma' },
                { key: '.', code: 'Period' }, { key: '/', code: 'Slash' }
            ],
            // Row 4
            [
                { key: 'space', code: 'Space', width: 'space' }
            ]
        ];

        this.init();
    }

    init() {
        if (!this.container) return;
        this.render();
        this.bindEvents();
    }

    render() {
        this.container.innerHTML = '';
        this.container.classList.add('keyboard');

        this.layout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'key-row';

            row.forEach(k => {
                const keyDiv = document.createElement('div');
                keyDiv.className = `key ${k.width || ''}`;
                keyDiv.textContent = k.key;
                keyDiv.dataset.code = k.code;

                rowDiv.appendChild(keyDiv);
                this.keys.set(k.code, keyDiv);
            });

            this.container.appendChild(rowDiv);
        });
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        const keyDiv = this.keys.get(e.code);
        if (keyDiv) {
            keyDiv.classList.add('active');
        }
    }

    handleKeyUp(e) {
        const keyDiv = this.keys.get(e.code);
        if (keyDiv) {
            keyDiv.classList.remove('active');
        }
    }
}
