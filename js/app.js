// TypeClimber Main Application Coordinator (V2 Update)

import { StorageManager } from './managers/StorageManager.js';
import { SoundManager } from './engine/SoundManager.js';
import { MountainRenderer } from './engine/MountainRenderer.js';
import { TypingEngine } from './engine/TypingEngine.js';
import { AIOpponent } from './engine/AIOpponent.js';
import { GameModeManager } from './managers/GameModeManager.js';
import { UIManager } from './managers/UIManager.js';
import { COSMETICS_DATABASE } from './data/cosmetics.js';
import { MOUNTAIN_DEFINITIONS } from './data/sentences.js';

class TypeClimberApp {
  constructor() {
    this.storage = new StorageManager();
    this.sound = new SoundManager();
    this.modeManager = new GameModeManager(this);
    this.ui = new UIManager(this);

    this.renderer = null;
    this.typingEngine = null;
    this.ai = null;

    this.playerAltitude = 0;
    this.aiAltitude = 0;
    this.isGameActive = false;
    this.isPaused = false;
    this.raceStarted = false;

    this.init();
  }

  init() {
    // Apply saved audio settings (Default = 0 muted per user specification)
    const set = this.storage.data.settings;
    this.sound.setVolumes(set.sfxVolume, set.musicVolume, set.ambienceVolume);
    this.sound.setSwitchProfile(set.switchSound);

    if (set.theme) {
      document.body.className = set.theme;
      const themeSelect = document.getElementById("select-theme");
      if (themeSelect) themeSelect.value = set.theme;
    }

    const sfxS = document.getElementById("slider-sfx-vol");
    const musicS = document.getElementById("slider-music-vol");
    const ambS = document.getElementById("slider-ambience-vol");
    if (sfxS) sfxS.value = set.sfxVolume;
    if (musicS) musicS.value = set.musicVolume;
    if (ambS) ambS.value = set.ambienceVolume;

    document.getElementById("val-sfx-vol").textContent = `${set.sfxVolume}%`;
    document.getElementById("val-music-vol").textContent = `${set.musicVolume}%`;
    document.getElementById("val-ambience-vol").textContent = `${set.ambienceVolume}%`;

    this.ui.updateMuteIcon();
    this.ui.updatePlayerHeader();

    const canvas = document.getElementById("mountain-canvas");
    if (canvas) {
      this.renderer = new MountainRenderer(canvas);
    }

    const promptDisplay = document.getElementById("typing-prompt-display");
    
    // Initialize Typing Engine with callbacks
    this.typingEngine = new TypingEngine({
      onRender: (html) => {
        if (promptDisplay) promptDisplay.innerHTML = html;
      },
      // FIRST KEYSTROKE RACE TRIGGER!
      onFirstKey: () => {
        this.startRaceClock();
      },
      onCorrect: (char, combo) => {
        this.sound.playKeyClick(char === " ");
        if (combo > 0 && combo % 10 === 0) {
          this.sound.playComboChime(combo);
        }
        this.updateGameplayMetrics();
      },
      onError: (char) => {
        this.sound.playErrorSound();
        if (this.storage.data.settings.screenshake) {
          const arena = document.querySelector(".typing-arena");
          if (arena) {
            arena.classList.add("shake-effect");
            setTimeout(() => arena.classList.remove("shake-effect"), 200);
          }
        }
        this.updateGameplayMetrics();
      },
      onComplete: () => {
        const targetAltitude = this.modeManager.currentMountain.altitude;
        if (this.playerAltitude >= targetAltitude || this.modeManager.currentMode === "freeplay" || this.modeManager.currentMode === "zen") {
          if (this.playerAltitude >= targetAltitude && this.modeManager.currentMode !== "zen") {
            this.endMatch(true);
          } else {
            this.loadNextPassage();
          }
        } else {
          this.loadNextPassage();
        }
      }
    });

    this.bindKeyboardInput();
  }

  toggleMute() {
    if (this.sound.isMuted) {
      this.sound.setVolumes(30, 20, 20);
      this.storage.updateSettings({ sfxVolume: 30, musicVolume: 20, ambienceVolume: 20 });
    } else {
      this.sound.setVolumes(0, 0, 0);
      this.storage.updateSettings({ sfxVolume: 0, musicVolume: 0, ambienceVolume: 0 });
    }

    const set = this.storage.data.settings;
    document.getElementById("slider-sfx-vol").value = set.sfxVolume;
    document.getElementById("slider-music-vol").value = set.musicVolume;
    document.getElementById("slider-ambience-vol").value = set.ambienceVolume;
    document.getElementById("val-sfx-vol").textContent = `${set.sfxVolume}%`;
    document.getElementById("val-music-vol").textContent = `${set.musicVolume}%`;
    document.getElementById("val-ambience-vol").textContent = `${set.ambienceVolume}%`;

    this.ui.updateMuteIcon();
  }

  bindKeyboardInput() {
    const hiddenInput = document.getElementById("typing-hidden-input");

    document.getElementById("game-screen").addEventListener("click", () => {
      if (hiddenInput && this.isGameActive && !this.isPaused) {
        hiddenInput.focus();
      }
    });

    window.addEventListener("keydown", (e) => {
      if (!this.isGameActive || this.isPaused) return;

      if (e.key === "Escape") {
        this.pauseGame();
        return;
      }

      if (e.key === "Backspace" || e.key.length === 1) {
        if (e.key === " ") e.preventDefault();
        this.typingEngine.handleKey(e.key);
      }
    });
  }

  // Active Game Launch
  startGame(mode = "campaign", mountainId = "green-hills", difficulty = "medium") {
    this.isGameActive = true;
    this.isPaused = false;
    this.raceStarted = false;
    this.playerAltitude = 0;
    this.aiAltitude = 0;

    // Show ready start banner
    const readyBanner = document.getElementById("ready-start-banner");
    if (readyBanner) readyBanner.classList.remove("started");

    // 1. Setup Mode & Passages
    this.modeManager.setupMatch(mode, mountainId, difficulty);
    const m = this.modeManager.currentMountain;

    // 2. Setup HUD Overlays
    document.getElementById("active-mountain-name").textContent = (mode === "boulder") ? "Boulder Arcade" : (mode === "sprint") ? "Speed Sprint" : (mode === "zen") ? "Zen Practice" : m.name;
    const diffTag = document.getElementById("active-mountain-diff");
    if (diffTag) {
      diffTag.textContent = difficulty.toUpperCase();
      diffTag.className = `diff-tag diff-badge ${difficulty}`;
    }

    // 3. Setup Canvas Renderer & Cosmetics
    const p = this.storage.data.player;
    const findCos = (cat, id) => COSMETICS_DATABASE.find(c => c.category === cat && c.id === id);

    const skinObj = findCos("skins", p.equippedSkin);
    const ropeObj = findCos("ropes", p.equippedRope);
    const auraObj = findCos("auras", p.equippedAura);
    const flagObj = findCos("flags", p.equippedFlag);

    const cosmetics = {
      skin: skinObj ? skinObj.icon : "🧗‍♂️",
      ropeColor: ropeObj ? ropeObj.color : "#3b82f6",
      auraColor: auraObj ? auraObj.color : "transparent",
      flagIcon: flagObj ? flagObj.icon : "🚩"
    };

    if (this.renderer) {
      this.renderer.init(m, cosmetics);
    }

    this.sound.startAmbience(m.weather);

    // 4. Prepare AI Opponent (Deferred start until first key typed!)
    this.ai = new AIOpponent(m.aiSpeedWpm, "AI Bot");
    this.ai.prepare((aiRatio) => {
      this.aiAltitude = Math.round(aiRatio * m.altitude);
      this.updateAltitudeHUD();
      if (this.aiAltitude >= m.altitude && mode !== "freeplay" && mode !== "zen") {
        this.endMatch(false);
      }
    });

    // 5. Load First Passage on Millisecond 0!
    this.loadPassage(this.modeManager.getActivePassage());

    // 6. Switch Viewport Screen instantly to #game-screen
    this.ui.showScreen("game-screen");

    // 7. Focus hidden input for instant typing
    const hiddenInput = document.getElementById("typing-hidden-input");
    if (hiddenInput) hiddenInput.focus();
  }

  // Triggered on VERY FIRST KEYSTROKE
  startRaceClock() {
    if (this.raceStarted) return;
    this.raceStarted = true;

    // Hide ready banner
    const readyBanner = document.getElementById("ready-start-banner");
    if (readyBanner) readyBanner.classList.add("started");

    // Start AI Opponent climbing
    if (this.ai && this.modeManager.currentMode !== "zen") {
      this.ai.start();
    }

    // Start Timer
    this.modeManager.startTimer((sec) => {
      const timerEl = document.getElementById("hud-timer");
      if (timerEl) timerEl.textContent = this.modeManager.formatTime(sec);

      if ((this.modeManager.currentMode === "timeattack" || this.modeManager.currentMode === "sprint") && sec <= 0) {
        this.endMatch(this.playerAltitude >= this.aiAltitude);
      }
    });
  }

  loadPassage(text) {
    this.typingEngine.setPassage(text);
    const upcoming = document.getElementById("upcoming-prompt-text");
    if (upcoming) upcoming.textContent = this.modeManager.getUpcomingPassage();
  }

  loadNextPassage() {
    const nextText = this.modeManager.advancePassage();
    this.loadPassage(nextText);
  }

  updateGameplayMetrics() {
    const wpm = this.typingEngine.getWpm();
    const acc = this.typingEngine.getAccuracy();
    const combo = this.typingEngine.comboCount;

    const passageRatio = this.typingEngine.getProgressRatio();
    const m = this.modeManager.currentMountain;
    const baseAlt = this.modeManager.passageIndex * (m.altitude / 4);
    this.playerAltitude = Math.min(m.altitude, Math.round(baseAlt + (passageRatio * (m.altitude / 4))));

    document.getElementById("hud-wpm").textContent = wpm;
    document.getElementById("hud-accuracy").textContent = `${acc}%`;
    document.getElementById("hud-combo").textContent = `${combo}x`;

    this.updateAltitudeHUD();

    if (this.renderer) {
      this.renderer.updateProgress(this.playerAltitude / m.altitude, this.aiAltitude / m.altitude);
    }
  }

  updateAltitudeHUD() {
    const m = this.modeManager.currentMountain;
    document.getElementById("hud-player-alt").textContent = `${this.playerAltitude}m`;
    document.getElementById("hud-ai-alt").textContent = `${this.aiAltitude}m`;

    const playerRatio = Math.min(100, Math.round((this.playerAltitude / m.altitude) * 100));
    const aiRatio = Math.min(100, Math.round((this.aiAltitude / m.altitude) * 100));

    document.getElementById("player-progress-bar").style.width = `${playerRatio}%`;
    document.getElementById("ai-progress-bar").style.width = `${aiRatio}%`;
  }

  pauseGame() {
    if (!this.isGameActive) return;
    this.isPaused = true;
    this.modeManager.stopTimer();
    if (this.ai) this.ai.stop();

    const pauseModal = document.getElementById("pause-modal");
    if (pauseModal) pauseModal.classList.remove("hidden");
  }

  resumeGame() {
    this.isPaused = false;
    const pauseModal = document.getElementById("pause-modal");
    if (pauseModal) pauseModal.classList.add("hidden");

    if (this.ai && this.raceStarted && this.modeManager.currentMode !== "zen") {
      this.ai.start();
    }

    if (this.raceStarted) {
      this.modeManager.startTimer((sec) => {
        document.getElementById("hud-timer").textContent = this.modeManager.formatTime(sec);
      });
    }

    const hiddenInput = document.getElementById("typing-hidden-input");
    if (hiddenInput) hiddenInput.focus();
  }

  retryGame() {
    this.closeModal();
    this.startGame(this.modeManager.currentMode, this.modeManager.currentMountain.id, this.modeManager.currentDifficulty);
  }

  nextMountain() {
    this.closeModal();
    const currentId = this.modeManager.currentMountain.id;
    const idx = MOUNTAIN_DEFINITIONS.findIndex(m => m.id === currentId);
    if (idx >= 0 && idx < MOUNTAIN_DEFINITIONS.length - 1) {
      const nextM = MOUNTAIN_DEFINITIONS[idx + 1];
      this.startGame("campaign", nextM.id, nextM.difficulty);
    } else {
      this.ui.showScreen("campaign-screen");
    }
  }

  endMatch(won = true) {
    this.isGameActive = false;
    this.modeManager.stopTimer();
    if (this.ai) this.ai.stop();
    this.sound.stopAmbience();

    const m = this.modeManager.currentMountain;
    const wpm = this.typingEngine.getWpm();
    const acc = this.typingEngine.getAccuracy();
    const maxCombo = this.typingEngine.maxCombo;
    const timeStr = this.modeManager.formatTime(this.modeManager.timerSeconds);

    const coinsReward = won ? m.rewardCoins : Math.round(m.rewardCoins * 0.3);
    const xpReward = won ? m.rewardXp : Math.round(m.rewardXp * 0.3);

    if (won) {
      this.sound.playVictoryFanfare();
      const idx = MOUNTAIN_DEFINITIONS.findIndex(item => item.id === m.id);
      if (idx >= 0 && idx < MOUNTAIN_DEFINITIONS.length - 1) {
        this.storage.unlockMountain(MOUNTAIN_DEFINITIONS[idx + 1].id);
      }
    }

    // Save Stats, Match History & Key Diagnostic Analytics
    this.storage.recordMatch({
      won,
      wpm,
      accuracy: acc,
      combo: maxCombo,
      distance: this.playerAltitude,
      mountainId: m.id,
      mountainName: m.name,
      mode: this.modeManager.currentMode,
      coinsReward,
      xpReward
    }, this.typingEngine.keyMistakes);

    this.ui.updatePlayerHeader();

    const modal = document.getElementById("game-over-modal");
    const icon = document.getElementById("modal-result-icon");
    const title = document.getElementById("modal-result-title");
    const sub = document.getElementById("modal-result-sub");

    if (icon) icon.textContent = won ? "🏆" : "💀";
    if (title) title.textContent = won ? "SUMMIT CONQUERED!" : "MATCH COMPLETED!";
    if (sub) sub.textContent = won ? `You conquered ${m.name}!` : `Match finished on ${m.name}!`;

    document.getElementById("m-wpm").textContent = wpm;
    document.getElementById("m-acc").textContent = `${acc}%`;
    document.getElementById("m-combo").textContent = `${maxCombo}x`;
    document.getElementById("m-time").textContent = timeStr;
    document.getElementById("m-coins").textContent = coinsReward;
    document.getElementById("m-xp").textContent = xpReward;

    if (modal) modal.classList.remove("hidden");
  }

  closeModal() {
    const modal = document.getElementById("game-over-modal");
    const pauseModal = document.getElementById("pause-modal");
    if (modal) modal.classList.add("hidden");
    if (pauseModal) pauseModal.classList.add("hidden");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new TypeClimberApp();
});
