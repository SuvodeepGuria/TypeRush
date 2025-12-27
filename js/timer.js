export class Timer {
    constructor(callbacks) {
        this.initialTime = 30;
        this.remainingTime = 30;
        this.intervalId = null;
        this.isRunning = false;

        // callbacks: { onTick: (time) => {}, onComplete: () => {} }
        this.onTick = callbacks.onTick || (() => { });
        this.onComplete = callbacks.onComplete || (() => { });
    }

    setTime(seconds) {
        this.initialTime = parseInt(seconds);
        this.reset();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = Date.now();
        this.endTime = this.startTime + (this.remainingTime * 1000); // Calculate absolute end time

        // Immediate tick to show start state if needed
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const left = Math.ceil((this.endTime - now) / 1000);

            if (left <= 0) {
                this.remainingTime = 0;
                this.onTick(0);
                this.stop();
                this.onComplete();
            } else {
                this.remainingTime = left;
                this.onTick(left);
            }
        }, 1000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    reset() {
        this.stop();
        this.remainingTime = this.initialTime;
        this.onTick(this.remainingTime);
    }

    getTimeElapsed() {
        return this.initialTime - this.remainingTime;
    }
}
