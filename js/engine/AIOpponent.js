// Realistic Human-Simulated AI Typing Opponent Engine

export class AIOpponent {
  constructor(targetWpm = 45, botProfile = "Hazel") {
    this.targetWpm = targetWpm;
    this.botName = botProfile;

    this.currentRatio = 0.0;
    this.isRunning = false;
    this.timerId = null;

    this.mistakeChance = 0.03;
    this.isCorrectingMistake = false;
    this.onProgressCallback = null;
  }

  setSpeed(wpm) {
    this.targetWpm = wpm;
  }

  // Defer start until player types first key
  prepare(onProgressUpdate) {
    this.stop();
    this.currentRatio = 0.0;
    this.onProgressCallback = onProgressUpdate;
  }

  start() {
    if (this.isRunning || !this.onProgressCallback) return;
    this.isRunning = true;

    const charDelayMs = (60 / (this.targetWpm * 5)) * 1000;
    const totalCharsAssumed = 150;
    const stepIncrement = 1 / totalCharsAssumed;

    const tick = () => {
      if (!this.isRunning) return;

      if (!this.isCorrectingMistake && Math.random() < this.mistakeChance) {
        this.isCorrectingMistake = true;
        const correctionDelay = 400 + Math.random() * 400;
        setTimeout(() => {
          this.isCorrectingMistake = false;
          if (this.isRunning) {
            this.timerId = setTimeout(tick, charDelayMs);
          }
        }, correctionDelay);
        return;
      }

      const jitter = (Math.random() * 0.3 - 0.15) * charDelayMs;
      const actualDelay = Math.max(20, charDelayMs + jitter);

      this.currentRatio = Math.min(1.0, this.currentRatio + stepIncrement);
      this.onProgressCallback(this.currentRatio);

      if (this.currentRatio < 1.0) {
        this.timerId = setTimeout(tick, actualDelay);
      } else {
        this.isRunning = false;
      }
    };

    this.timerId = setTimeout(tick, charDelayMs);
  }

  stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
