import { words as wordList, quotes as quoteList } from '../data/textData.js';
import { Timer } from './timer.js';
import { Stats } from './stats.js';
import { renderResultChart } from './chart.js';
import { VirtualKeyboard } from './keyboard.js';

class App {
    constructor() {
        this.dom = {
            typingBox: document.getElementById('typing-box'),
            wordsContainer: document.getElementById('words'),
            cursor: document.getElementById('cursor'),
            focusOverlay: document.getElementById('focus-overlay'),
            resModal: document.getElementById('results-modal'),
            restartBtn: document.getElementById('restart-btn'),
            configContainer: document.querySelector('.config-bar'),
            liveStats: document.querySelector('.live-stats'),
            liveWpm: document.getElementById('live-wpm'),
            liveTimer: document.getElementById('live-timer'),

            // Result elements
            resWpm: document.getElementById('res-wpm'),
            resAcc: document.getElementById('res-acc'),
            resRaw: document.getElementById('res-raw'),
            resChars: document.getElementById('res-chars'),
            resCon: document.getElementById('res-consistency'),
            resTime: document.getElementById('res-time'),
            nextBtn: document.getElementById('next-test-btn'),
            chartCanvas: document.getElementById('wpm-chart'),
        };

        this.config = {
            mode: 'time', // time | words | quote
            duration: 30, // seconds
            wordCount: 50,
            allowBackspace: true
        };

        this.state = {
            isRunning: false,
            isFinished: false,
            words: [], // Array of word strings
            currentWordIdx: 0,
            currentCharIdx: 0,
            timer: null,
            stats: null
        };

        this.timer = new Timer({
            onTick: (time) => this.updateTimerUI(time),
            onComplete: () => this.finishTest()
        });

        this.stats = new Stats();

        this.keyboard = new VirtualKeyboard('keyboard-container');

        this.init();
    }

    init() {
        this.bindEvents();
        this.resetTest();
    }

    bindEvents() {
        // Global Keydown
        document.addEventListener('keydown', (e) => {
            if (this.state.isFinished && (e.key === 'Enter' || e.key === 'Tab')) {
                e.preventDefault();
                this.resetTest();
                return;
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.resetTest();
                return;
            }

            // Focus check
            if (this.dom.focusOverlay.classList.contains('hidden') === false) {
                this.dom.focusOverlay.classList.add('hidden');
            }

            if (!this.state.isFinished) {
                this.handleTyping(e);
            }
        });

        // Config buttons
        this.dom.configContainer.addEventListener('click', (e) => {
            if (e.target.dataset.mode) {
                // Handle mode switch
                this.updateConfig(e.target, 'mode');
            } else if (e.target.dataset.val) {
                this.updateConfig(e.target, 'duration');
            }
        });

        // Theme Switcher
        document.querySelectorAll('.theme-toggles button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.className = btn.dataset.theme;
            });
        });

        // Focus Overlay
        this.dom.focusOverlay.addEventListener('click', () => {
            this.dom.focusOverlay.classList.add('hidden');
        });

        // Restart & Next
        this.dom.restartBtn.addEventListener('click', () => {
            this.resetTest();
            this.dom.restartBtn.blur(); // Remove focus
        });
        this.dom.nextBtn.addEventListener('click', () => {
            this.dom.resModal.classList.add('hidden');
            this.resetTest();
        });
    }

    updateConfig(target, type) {
        if (this.state.isRunning) return; // Prevent config change during run

        // Update active class
        target.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        target.classList.add('active');

        if (type === 'mode') {
            this.config.mode = target.dataset.mode;
            // Show/Hide options based on mode (simplified for now only Time mode fully robust)
        } else if (type === 'duration') {
            this.config.duration = parseInt(target.dataset.val);
            // Also need to update word mode count etc if needed
        }

        this.resetTest();
    }

    resetTest() {
        this.timer.stop();
        this.timer.setTime(this.config.duration);
        this.stats.reset();

        this.state.isRunning = false;
        this.state.isFinished = false;
        this.state.currentWordIdx = 0;
        this.state.currentCharIdx = 0;

        this.dom.resModal.classList.add('hidden');
        this.dom.liveStats.classList.remove('visible');
        this.dom.liveTimer.textContent = this.config.duration;
        this.dom.liveWpm.textContent = '0';

        // Generate Text
        this.generateText();
        this.renderWords();

        // Reset Cursor
        this.updateCursorPosition();
    }

    generateText() {
        this.state.words = [];
        const count = 300; // Generate enough words
        for (let i = 0; i < count; i++) {
            const rand = wordList[Math.floor(Math.random() * wordList.length)];
            this.state.words.push(rand);
        }
    }

    renderWords() {
        this.dom.wordsContainer.innerHTML = '';
        this.state.words.forEach(word => {
            const wDiv = document.createElement('div');
            wDiv.className = 'word';

            for (let char of word) {
                const lSpan = document.createElement('span');
                lSpan.className = 'letter';
                lSpan.textContent = char;
                wDiv.appendChild(lSpan);
            }
            this.dom.wordsContainer.appendChild(wDiv);
        });
    }

    startTest() {
        if (!this.state.isRunning) {
            this.state.isRunning = true;
            this.timer.start();
            this.dom.liveStats.classList.add('visible');
        }
    }

    handleTyping(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Shift' || e.key === 'CapsLock') return;

        // Auto start
        if (!this.state.isRunning && !this.state.isFinished && e.key.length === 1) {
            this.startTest();
        }

        if (!this.state.isRunning) return;

        const currentWordDiv = this.dom.wordsContainer.children[this.state.currentWordIdx];
        const currentWord = this.state.words[this.state.currentWordIdx];
        const letters = currentWordDiv.children;

        // Stats snapshot
        // We do this periodically in timer, but maybe we want per keystroke? Let's stick to timer ticks for graphs.

        // Backspace
        if (e.key === 'Backspace') {
            const isCtrl = e.ctrlKey; // support ctrl+backspace later

            if (this.state.currentCharIdx > 0) {
                // Go back in current word
                this.state.currentCharIdx--;
                const charSpan = letters[this.state.currentCharIdx];
                charSpan.className = 'letter'; // reset
            } else if (this.state.currentWordIdx > 0 && this.state.currentCharIdx === 0) {
                // Go back to previous word (optional, Monkeytype allows this)
                // For MVP simplicity: Strict mode, no going back to previous word once space pressed? 
                // Let's implement: Can go back if previous word has errors? 
                // For now, let's stick to: ONLY BACKSPACE WITHIN CURRENT WORD.
                // Doing complicated line-wrapping logic is hard.
            }
            this.updateCursorPosition();
            return;
        }

        // Space -> Next Word
        if (e.key === ' ') {
            e.preventDefault(); // Prevent scroll

            // Mark remaining letters as incorrect if skipped? Or just move on?
            // Monkeytype styling: incorrect letters if word incomplete.

            // Validate word
            // currently typed so far

            this.state.currentWordIdx++;
            this.state.currentCharIdx = 0;

            // Should scroll?
            this.checkScroll(currentWordDiv);

            this.updateCursorPosition();

            // Register space as correct/incorrect? typically counted as keystroke
            this.stats.registerKeystroke(true);
            return;
        }

        if (e.key.length === 1) {
            // Check overflow
            if (this.state.currentCharIdx >= currentWord.length) {
                // Extra characters handling
                // For MVP: append extra letter visually
                const extraSpan = document.createElement('span');
                extraSpan.className = 'letter incorrect extra';
                extraSpan.textContent = e.key;
                currentWordDiv.appendChild(extraSpan);

                this.state.currentCharIdx++;
                this.stats.registerKeystroke(false);
            } else {
                // Normal character
                const expected = currentWord[this.state.currentCharIdx];
                const typed = e.key;
                const charSpan = letters[this.state.currentCharIdx];

                if (typed === expected) {
                    charSpan.classList.add('correct');
                    this.stats.registerKeystroke(true);
                } else {
                    charSpan.classList.add('incorrect');
                    this.stats.registerKeystroke(false);
                }

                this.state.currentCharIdx++;
            }

            this.updateCursorPosition();

            // Live WPM update
            const wpm = this.stats.calculateWPM(this.timer.getTimeElapsed());
            this.dom.liveWpm.textContent = wpm;
        }
    }

    updateCursorPosition() {
        // Find current target
        const wordDiv = this.dom.wordsContainer.children[this.state.currentWordIdx];
        if (!wordDiv) return;

        const letters = wordDiv.children;
        let target;

        if (this.state.currentCharIdx < letters.length) {
            target = letters[this.state.currentCharIdx];
        } else {
            // After last letter, cursor should be to the right of last letter
            // We can simulate this by targeting the last letter and adding its width
            // Or just use the wordDiv position + width?
            target = letters[letters.length - 1];
            // Logic handled below
        }

        // Calculation
        // Since we are using flex, it is easiest to get bounding rect relative to container
        const containerRect = this.dom.typingBox.getBoundingClientRect();

        if (this.state.currentCharIdx === 0) {
            // Beginning of word
            const rect = wordDiv.getBoundingClientRect();
            this.dom.cursor.style.left = (rect.left - containerRect.left - 2) + 'px'; // -2 for padding
            this.dom.cursor.style.top = (rect.top - containerRect.top + 5) + 'px';
        } else if (this.state.currentCharIdx > 0 && this.state.currentCharIdx <= wordDiv.querySelectorAll('.letter:not(.extra)').length) {
            // Inside word
            // Target is the letter we are ABOUT to type. So cursor should be LEFT of target.
            // If we used logic above, target is correct.
            const rect = target.getBoundingClientRect();
            this.dom.cursor.style.left = (rect.left - containerRect.left - 1) + 'px';
            this.dom.cursor.style.top = (rect.top - containerRect.top + 5) + 'px';
        } else {
            // At the end or extra chars
            // Target is the last element
            const last = letters[letters.length - 1];
            const rect = last.getBoundingClientRect();
            this.dom.cursor.style.left = (rect.right - containerRect.left - 1) + 'px';
            this.dom.cursor.style.top = (rect.top - containerRect.top + 5) + 'px';
        }
    }

    checkScroll(currentWordDiv) {
        const wordTop = currentWordDiv.offsetTop;
        const containerTop = this.dom.typingBox.scrollTop;

        // If word is on a new line (approx > 50px diff)
        if (wordTop - containerTop > 50) {
            // Scroll down
            // But we want to keep current line visible.
            // Let's just scrollIntoView if getting low
            const rect = currentWordDiv.getBoundingClientRect();
            const boxRect = this.dom.typingBox.getBoundingClientRect();
            if (rect.bottom > boxRect.bottom - 20) {
                currentWordDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    updateTimerUI(time) {
        this.dom.liveTimer.textContent = time;
        // Snapshot for graph
        if (this.state.isRunning) {
            this.stats.snapshot(time, this.config.duration);
        }
    }

    finishTest() {
        this.state.isRunning = false;
        this.state.isFinished = true;
        this.dom.liveStats.classList.remove('visible');

        const final = this.stats.getFinalStats(this.config.duration);

        // Populate modal
        this.dom.resWpm.textContent = final.wpm;
        this.dom.resAcc.textContent = final.acc + '%';
        this.dom.resRaw.textContent = final.raw;
        this.dom.resChars.textContent = `${final.correct}/${final.incorrect}/0/0`;
        this.dom.resTime.textContent = this.config.duration + 's';

        this.dom.resModal.classList.remove('hidden');

        // Render Chart
        const ctx = this.dom.chartCanvas.getContext('2d');
        renderResultChart(ctx, final.history);
    }
}

// Start App
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
