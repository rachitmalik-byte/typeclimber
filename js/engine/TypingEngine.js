// Typing Engine: Real-time Keystroke Validator & Analytics Diagnostic Tracker

export class TypingEngine {
  constructor(callbacks = {}) {
    this.passageText = "";
    this.currentIndex = 0;
    this.typedChars = [];

    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.mistakesCount = 0;

    this.keyMistakes = {}; // Diagnostic heatmap map of { char: errorCount }

    this.comboCount = 0;
    this.maxCombo = 0;

    this.hasStarted = false; // Deferred start trigger (Starts on first valid keystroke)
    this.startTime = null;
    this.endTime = null;
    this.isFinished = false;
    this.hasMistake = false;

    this.callbacks = {
      onFirstKey: callbacks.onFirstKey || (() => {}),
      onCorrect: callbacks.onCorrect || (() => {}),
      onError: callbacks.onError || (() => {}),
      onComplete: callbacks.onComplete || (() => {}),
      onRender: callbacks.onRender || (() => {})
    };
  }

  setPassage(text) {
    this.passageText = text || "";
    this.currentIndex = 0;
    this.typedChars = [];
    this.keyMistakes = {};

    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.mistakesCount = 0;
    this.comboCount = 0;
    this.maxCombo = 0;

    this.hasStarted = false; // Remains false until user types first key
    this.startTime = null;
    this.endTime = null;
    this.isFinished = false;
    this.hasMistake = false;

    this.render();
  }

  handleKey(key) {
    if (this.isFinished || !this.passageText) return;

    // Handle Backspace key
    if (key === "Backspace") {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.typedChars.pop();
        this.hasMistake = this.typedChars.some(item => item.status === 'wrong');
        this.render();
      }
      return;
    }

    // Ignore non-printable keys
    if (key.length > 1) return;

    // FIRST KEYSTROKE RACE TRIGGER!
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.startTime = Date.now();
      this.callbacks.onFirstKey();
    }

    this.totalKeystrokes++;
    const targetChar = this.passageText[this.currentIndex];

    // Keystroke Match Check
    if (key === targetChar && !this.hasMistake) {
      this.correctKeystrokes++;
      this.comboCount++;
      if (this.comboCount > this.maxCombo) {
        this.maxCombo = this.comboCount;
      }

      this.typedChars.push({ char: key, status: 'correct' });
      this.currentIndex++;

      this.callbacks.onCorrect(key, this.comboCount);

      if (this.currentIndex >= this.passageText.length) {
        this.isFinished = true;
        this.endTime = Date.now();
        this.callbacks.onComplete();
      }
    } else {
      // Mistake Keystroke!
      this.mistakesCount++;
      this.comboCount = 0;
      this.hasMistake = true;

      // Track weak key diagnostic
      const lowerTarget = targetChar ? targetChar.toLowerCase() : key.toLowerCase();
      this.keyMistakes[lowerTarget] = (this.keyMistakes[lowerTarget] || 0) + 1;

      this.typedChars.push({ char: key, status: 'wrong' });
      this.currentIndex++;

      this.callbacks.onError(key);
    }

    this.render();
  }

  render() {
    let html = "";
    const len = this.passageText.length;

    for (let i = 0; i < len; i++) {
      const char = this.passageText[i];
      const typed = this.typedChars[i];

      if (i < this.currentIndex) {
        if (typed && typed.status === 'correct') {
          html += `<span class="char-correct">${this.escapeHtml(char)}</span>`;
        } else {
          html += `<span class="char-wrong">${this.escapeHtml(char)}</span>`;
        }
      } else if (i === this.currentIndex) {
        html += `<span class="char-current">${this.escapeHtml(char)}</span>`;
      } else {
        html += `<span class="char-untyped">${this.escapeHtml(char)}</span>`;
      }
    }

    this.callbacks.onRender(html);
  }

  getWpm() {
    if (!this.hasStarted || !this.startTime) return 0;
    const now = this.endTime || Date.now();
    const elapsedSeconds = Math.max(1, (now - this.startTime) / 1000);
    const standardWords = this.correctKeystrokes / 5;
    return Math.round((standardWords / elapsedSeconds) * 60);
  }

  getAccuracy() {
    if (this.totalKeystrokes === 0) return 100;
    return Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100);
  }

  getProgressRatio() {
    if (!this.passageText) return 0;
    return Math.min(1.0, this.currentIndex / this.passageText.length);
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
