export class Stats {
    constructor() {
        this.reset();
    }

    reset() {
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.extraChars = 0;
        this.missedChars = 0;
        this.totalKeystrokes = 0;
        this.history = []; // Array of { wpm, time } snapshots
    }

    // Called on every keypress
    registerKeystroke(isCorrect) {
        this.totalKeystrokes++;
        if (isCorrect) {
            this.correctChars++;
        } else {
            this.incorrectChars++;
        }
    }

    calculateWPM(timeElapsedSeconds) {
        if (timeElapsedSeconds <= 0) return 0;
        // Standard WPM formula: (All characters / 5) / time in minutes
        const minutes = timeElapsedSeconds / 60;
        const netWPM = ((this.correctChars) / 5) / minutes;
        // Note: Some simple tests use (correct / 5) / min. 
        // Monkeytype uses (correct chars + spaces) which is basically correctChars here.
        return Math.round(Math.max(0, netWPM));
    }

    calculateRawWPM(timeElapsedSeconds) {
        if (timeElapsedSeconds <= 0) return 0;
        const minutes = timeElapsedSeconds / 60;
        return Math.round(((this.correctChars + this.incorrectChars + this.extraChars) / 5) / minutes);
    }

    calculateAccuracy() {
        if (this.totalKeystrokes === 0) return 100;
        // Accuracy = (Correct / Total Keystrokes) * 100
        // Or sometimes (Total - Errors) / Total
        const acc = (this.correctChars / this.totalKeystrokes) * 100;
        return Math.max(0, Math.min(100, Math.round(acc)));
    }

    snapshot(timeRemaining, totalTime) {
        const timeElapsed = totalTime - timeRemaining;
        const wpm = this.calculateWPM(timeElapsed);
        const raw = this.calculateRawWPM(timeElapsed);
        const acc = this.calculateAccuracy();

        this.history.push({
            time: timeElapsed,
            wpm: wpm,
            raw: raw,
            acc: acc
        });
    }

    getFinalStats(totalTime) {
        return {
            wpm: this.calculateWPM(totalTime),
            raw: this.calculateRawWPM(totalTime),
            acc: this.calculateAccuracy(),
            correct: this.correctChars,
            incorrect: this.incorrectChars,
            history: this.history
        };
    }
}
