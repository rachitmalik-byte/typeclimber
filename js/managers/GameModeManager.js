// Game Mode Coordinator (Campaign, Free Play, Boulder Dodge, Speed Sprint, Zen, Time Attack, Survival, Duel)

import { SENTENCE_DATABASE, MOUNTAIN_DEFINITIONS, BOULDER_WORDS, SPRINT_WORDS, ZEN_PASSAGES } from '../data/sentences.js';

export class GameModeManager {
  constructor(app) {
    this.app = app;

    this.currentMode = "campaign"; // campaign, freeplay, boulder, sprint, zen, timeattack, survival, duel
    this.currentMountain = MOUNTAIN_DEFINITIONS[0];
    this.currentDifficulty = "medium";

    this.passageIndex = 0;
    this.passageList = [];

    this.timerSeconds = 0;
    this.timerInterval = null;
  }

  setupMatch(mode = "campaign", mountainId = "green-hills", difficulty = "medium") {
    this.currentMode = mode;
    this.currentDifficulty = difficulty;

    const foundMountain = MOUNTAIN_DEFINITIONS.find(m => m.id === mountainId);
    this.currentMountain = foundMountain || MOUNTAIN_DEFINITIONS[0];

    // Select passage pool based on mode & difficulty
    let pool = SENTENCE_DATABASE[this.currentDifficulty] || SENTENCE_DATABASE["medium"];

    if (mode === "boulder") {
      pool = BOULDER_WORDS;
    } else if (mode === "sprint") {
      pool = SPRINT_WORDS;
    } else if (mode === "zen") {
      pool = ZEN_PASSAGES;
    }

    this.passageList = [...pool].sort(() => Math.random() - 0.5);
    this.passageIndex = 0;

    // Reset timer
    if (mode === "sprint") {
      this.timerSeconds = 30;
    } else if (mode === "timeattack") {
      this.timerSeconds = 60;
    } else {
      this.timerSeconds = 0;
    }
  }

  getActivePassage() {
    if (this.passageList.length === 0) return "The mountain summit beckons every accurate typist.";
    return this.passageList[this.passageIndex % this.passageList.length];
  }

  getUpcomingPassage() {
    if (this.passageList.length <= 1) return "Keep climbing towards the peak!";
    return this.passageList[(this.passageIndex + 1) % this.passageList.length];
  }

  advancePassage() {
    this.passageIndex++;
    return this.getActivePassage();
  }

  startTimer(onTick) {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.currentMode === "timeattack" || this.currentMode === "sprint") {
        this.timerSeconds--;
        onTick(this.timerSeconds);
        if (this.timerSeconds <= 0) {
          this.stopTimer();
        }
      } else {
        this.timerSeconds++;
        onTick(this.timerSeconds);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds) {
    const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
    const s = (Math.abs(seconds) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
}
