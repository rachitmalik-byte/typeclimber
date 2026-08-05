// UI/UX Game Presentation & Interactive Motion Manager

import { MOUNTAIN_DEFINITIONS } from '../data/sentences.js';
import { COSMETICS_DATABASE } from '../data/cosmetics.js';
import { ACHIEVEMENTS_DATABASE, DAILY_MISSIONS_DATABASE } from '../data/achievements.js';

export class UIManager {
  constructor(app) {
    this.app = app;
    this.historyStack = ["main-menu-screen"];
    this.activeScreenId = "main-menu-screen";

    this.initElements();
    this.bindEvents();
    this.bindMagneticHoverAndTilt();
  }

  initElements() {
    this.backBtn = document.getElementById("global-back-btn");
    this.logoHome = document.getElementById("global-logo-home");
    this.screens = document.querySelectorAll(".screen");
  }

  bindEvents() {
    if (this.logoHome) {
      this.logoHome.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.app.sound.playButtonClick();
        this.showScreen("main-menu-screen");
      });
    }

    if (this.backBtn) {
      this.backBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goBack();
      });
    }

    const muteBtn = document.getElementById("quick-mute-btn");
    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        this.app.toggleMute();
      });
    }

    const quickSettingsBtn = document.getElementById("quick-settings-btn");
    if (quickSettingsBtn) {
      quickSettingsBtn.addEventListener("click", () => {
        this.showScreen("settings-screen");
      });
    }

    document.addEventListener("click", (e) => {
      const btnCampaign = e.target.closest("#btn-play-campaign");
      if (btnCampaign) {
        this.app.sound.playButtonClick();
        this.showScreen("campaign-screen");
        return;
      }

      const btnFreeplay = e.target.closest("#btn-play-freeplay");
      if (btnFreeplay) {
        this.app.sound.playButtonClick();
        this.app.startGame("freeplay", "green-hills", "medium");
        return;
      }

      // Mode Cards (Nitro Car Race, Z-Type Space Shooter, Boulder Dodge, Speed Sprint, Zen, Time Attack, Survival, Multiplayer)
      const modeCard = e.target.closest(".game-world-card");
      if (modeCard) {
        const mode = modeCard.dataset.mode;
        this.app.sound.playButtonClick();
        if (mode === "nitro") this.app.startGame("nitro", "green-hills", "medium");
        else if (mode === "ztype") this.app.startGame("ztype", "snow-mountain", "hard");
        else if (mode === "boulder") this.app.startGame("boulder", "rocky-cliffs", "medium");
        else if (mode === "sprint") this.app.startGame("sprint", "green-hills", "easy");
        else if (mode === "zen") this.app.startGame("zen", "green-hills", "easy");
        else if (mode === "timeattack") this.app.startGame("timeattack", "snow-mountain", "hard");
        else if (mode === "survival") this.app.startGame("survival", "volcano", "expert");
        else if (mode === "multiplayer") this.showScreen("multiplayer-screen");
        return;
      }

      const lockerBtn = e.target.closest("#menu-btn-locker");
      if (lockerBtn) { this.app.sound.playButtonClick(); this.showScreen("locker-screen"); return; }

      const statsBtn = e.target.closest("#menu-btn-stats");
      if (statsBtn) { this.app.sound.playButtonClick(); this.showScreen("stats-screen"); return; }

      const achBtn = e.target.closest("#menu-btn-achievements");
      if (achBtn) { this.app.sound.playButtonClick(); this.showScreen("achievements-screen"); return; }

      const setBtn = e.target.closest("#menu-btn-settings");
      if (setBtn) { this.app.sound.playButtonClick(); this.showScreen("settings-screen"); return; }

      const climbPeakBtn = e.target.closest(".climb-peak-btn");
      if (climbPeakBtn) {
        const mountainId = climbPeakBtn.dataset.mountainId;
        this.app.sound.playButtonClick();
        this.openDifficultySelect(mountainId);
        return;
      }

      const startDiffBtn = e.target.closest(".start-diff-btn");
      if (startDiffBtn) {
        const diff = startDiffBtn.dataset.diff;
        const mountainId = this.pendingMountainId || "green-hills";
        this.app.sound.playButtonClick();
        this.app.startGame("campaign", mountainId, diff);
        return;
      }

      const pauseBtn = e.target.closest("#game-pause-btn");
      if (pauseBtn) {
        this.app.sound.playButtonClick();
        this.app.pauseGame();
        return;
      }

      const modalNext = e.target.closest("#modal-btn-next");
      if (modalNext) {
        this.app.sound.playButtonClick();
        this.app.nextMountain();
        return;
      }

      const modalRetry = e.target.closest("#modal-btn-retry");
      if (modalRetry) {
        this.app.sound.playButtonClick();
        this.app.retryGame();
        return;
      }

      const modalMenu = e.target.closest("#modal-btn-menu");
      if (modalMenu) {
        this.app.sound.playButtonClick();
        this.app.closeModal();
        this.showScreen("main-menu-screen");
        return;
      }

      const pauseResume = e.target.closest("#pause-btn-resume");
      if (pauseResume) { this.app.resumeGame(); return; }

      const pauseRestart = e.target.closest("#pause-btn-restart");
      if (pauseRestart) { this.app.retryGame(); return; }

      const pauseQuit = e.target.closest("#pause-btn-quit");
      if (pauseQuit) { this.app.closeModal(); this.showScreen("main-menu-screen"); return; }

      const btnRanked = e.target.closest("#btn-start-ranked-match");
      if (btnRanked) {
        this.app.sound.playButtonClick();
        this.app.startGame("campaign", "rocky-cliffs", "hard");
        return;
      }

      const btnDuel = e.target.closest("#btn-start-local-duel");
      if (btnDuel) {
        this.app.sound.playButtonClick();
        this.app.startGame("duel", "rocky-cliffs", "medium");
        return;
      }

      const btnReset = e.target.closest("#btn-reset-data");
      if (btnReset) {
        if (confirm("Are you sure you want to reset all progress, coins, and settings?")) {
          this.app.storage.resetAllData();
          this.app.sound.playButtonClick();
          this.showToast("Progress reset to default!");
          this.updatePlayerHeader();
          this.showScreen("main-menu-screen");
        }
        return;
      }
    });

    const sfxSlider = document.getElementById("slider-sfx-vol");
    const musicSlider = document.getElementById("slider-music-vol");
    const ambSlider = document.getElementById("slider-ambience-vol");

    if (sfxSlider) {
      sfxSlider.addEventListener("input", (e) => {
        document.getElementById("val-sfx-vol").textContent = `${e.target.value}%`;
        this.saveAudioSettings();
      });
    }

    if (musicSlider) {
      musicSlider.addEventListener("input", (e) => {
        document.getElementById("val-music-vol").textContent = `${e.target.value}%`;
        this.saveAudioSettings();
      });
    }

    if (ambSlider) {
      ambSlider.addEventListener("input", (e) => {
        document.getElementById("val-ambience-vol").textContent = `${e.target.value}%`;
        this.saveAudioSettings();
      });
    }

    const switchSelect = document.getElementById("select-switch-sound");
    if (switchSelect) {
      switchSelect.addEventListener("change", (e) => {
        this.app.sound.setSwitchProfile(e.target.value);
        this.app.storage.updateSettings({ switchSound: e.target.value });
      });
    }

    const themeSelect = document.getElementById("select-theme");
    if (themeSelect) {
      themeSelect.addEventListener("change", (e) => {
        document.body.className = e.target.value;
        this.app.storage.updateSettings({ theme: e.target.value });
      });
    }

    const lockerTabs = document.querySelectorAll(".locker-tab-btn");
    lockerTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        lockerTabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.renderLockerItems(tab.dataset.category);
      });
    });

    const tabAch = document.getElementById("tab-btn-achievements");
    const tabDaily = document.getElementById("tab-btn-dailies");
    const achGrid = document.getElementById("achievements-list-grid");
    const dailyGrid = document.getElementById("dailies-list-grid");

    if (tabAch && tabDaily) {
      tabAch.addEventListener("click", () => {
        tabAch.classList.add("active");
        tabDaily.classList.remove("active");
        achGrid.classList.remove("hidden");
        dailyGrid.classList.add("hidden");
      });

      tabDaily.addEventListener("click", () => {
        tabDaily.classList.add("active");
        tabAch.classList.remove("active");
        dailyGrid.classList.remove("hidden");
        achGrid.classList.add("hidden");
      });
    }
  }

  bindMagneticHoverAndTilt() {
    document.querySelectorAll(".magnetic-btn").forEach(btn => {
      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = `translate(0px, 0px)`;
      });
    });
  }

  saveAudioSettings() {
    const sfx = parseInt(document.getElementById("slider-sfx-vol").value || 0, 10);
    const music = parseInt(document.getElementById("slider-music-vol").value || 0, 10);
    const amb = parseInt(document.getElementById("slider-ambience-vol").value || 0, 10);

    this.app.sound.setVolumes(sfx, music, amb);
    this.app.storage.updateSettings({ sfxVolume: sfx, musicVolume: music, ambienceVolume: amb });
    this.updateMuteIcon();
  }

  updateMuteIcon() {
    const btn = document.getElementById("quick-mute-btn");
    if (this.app.sound.isMuted) {
      if (btn) btn.classList.add("muted");
    } else {
      if (btn) btn.classList.remove("muted");
    }
  }

  showScreen(screenId, pushHistory = true) {
    const targetScreen = document.getElementById(screenId);
    if (!targetScreen) return;

    this.screens.forEach(s => s.classList.remove("active"));
    targetScreen.classList.add("active");

    if (pushHistory && this.activeScreenId !== screenId) {
      this.historyStack.push(this.activeScreenId);
    }
    this.activeScreenId = screenId;

    if (screenId === "main-menu-screen" || screenId === "game-screen") {
      if (this.backBtn) this.backBtn.classList.add("hidden");
    } else {
      if (this.backBtn) this.backBtn.classList.remove("hidden");
    }

    if (screenId === "campaign-screen") this.renderCampaignMountains();
    if (screenId === "locker-screen") this.renderLockerItems("skins");
    if (screenId === "stats-screen") this.renderStats();
    if (screenId === "achievements-screen") this.renderAchievements();
  }

  goBack() {
    if (this.historyStack.length > 0) {
      const prevScreen = this.historyStack.pop();
      this.showScreen(prevScreen, false);
    } else {
      this.showScreen("main-menu-screen", false);
    }
  }

  openDifficultySelect(mountainId) {
    this.pendingMountainId = mountainId;
    const m = MOUNTAIN_DEFINITIONS.find(item => item.id === mountainId);
    const subtitle = document.getElementById("difficulty-mountain-subtitle");
    if (subtitle && m) {
      subtitle.textContent = `${m.name} — ${m.subtitle}`;
    }
    this.showScreen("difficulty-screen");
  }

  updatePlayerHeader() {
    const p = this.app.storage.data.player;
    const coinsDisplay = document.getElementById("player-coins-display");
    const lvlDisplay = document.getElementById("player-level-display");

    if (coinsDisplay) coinsDisplay.textContent = p.coins;
    if (lvlDisplay) lvlDisplay.textContent = `Lvl ${p.level}`;
  }

  renderCampaignMountains() {
    const container = document.getElementById("mountains-list-container");
    if (!container) return;

    const unlocked = this.app.storage.data.unlockedMountains;

    container.innerHTML = MOUNTAIN_DEFINITIONS.map(m => {
      const isUnlocked = unlocked.includes(m.id);
      return `
        <div class="mountain-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="mountain-banner" style="background: ${m.bgGradient}">
            <div class="mountain-title-group">
              <h3>${m.name}</h3>
              <span class="diff-badge ${m.difficulty}">${m.difficulty.toUpperCase()}</span>
            </div>
          </div>
          <div class="mountain-card-body">
            <p>${m.desc}</p>
            <div class="mountain-meta">
              <span>Altitude: <strong>${m.altitude}m</strong></span>
              <span>AI Speed: <strong>~${m.aiSpeedWpm} WPM</strong></span>
            </div>
            ${isUnlocked ? `
              <button class="btn primary-game-btn climb-peak-btn" data-mountain-id="${m.id}">Climb Peak ➔</button>
            ` : `
              <button class="btn secondary-game-btn disabled" disabled>🔒 Locked</button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  renderLockerItems(category) {
    const grid = document.getElementById("cosmetics-items-grid");
    if (!grid) return;

    const p = this.app.storage.data.player;
    const items = COSMETICS_DATABASE.filter(i => i.category === category);

    grid.innerHTML = items.map(item => {
      const isUnlocked = p.unlockedItems.includes(item.id);
      let isEquipped = false;
      if (category === 'skins') isEquipped = (p.equippedSkin === item.id);
      if (category === 'ropes') isEquipped = (p.equippedRope === item.id);
      if (category === 'auras') isEquipped = (p.equippedAura === item.id);
      if (category === 'flags') isEquipped = (p.equippedFlag === item.id);

      return `
        <div class="cosmetic-card ${isEquipped ? 'equipped' : ''}">
          <div class="cosmetic-icon">${item.icon}</div>
          <div class="cosmetic-name">${item.name}</div>
          <div class="cosmetic-desc">${item.desc}</div>
          ${isEquipped ? `
            <span class="btn btn-sm btn-outline">Equipped</span>
          ` : isUnlocked ? `
            <button class="btn btn-sm primary-game-btn equip-btn" data-category="${category}" data-id="${item.id}">Equip</button>
          ` : `
            <button class="btn btn-sm secondary-game-btn buy-btn" data-category="${category}" data-id="${item.id}" data-price="${item.price}">
              Buy 🪙 ${item.price}
            </button>
          `}
        </div>
      `;
    }).join('');

    grid.querySelectorAll(".equip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        this.app.storage.equipItem(btn.dataset.category, btn.dataset.id);
        this.app.sound.playButtonClick();
        this.renderLockerItems(category);
      });
    });

    grid.querySelectorAll(".buy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const price = parseInt(btn.dataset.price, 10);
        if (p.coins >= price) {
          p.coins -= price;
          this.app.storage.unlockItem(btn.dataset.id);
          this.app.storage.equipItem(btn.dataset.category, btn.dataset.id);
          this.app.sound.playButtonClick();
          this.showToast(`Unlocked ${btn.dataset.id}!`);
          this.updatePlayerHeader();
          this.renderLockerItems(category);
        } else {
          this.showToast("Not enough Climb Coins!");
        }
      });
    });
  }

  renderStats() {
    const s = this.app.storage.data.stats;
    const history = this.app.storage.data.matchHistory || [];
    const mistakes = this.app.storage.data.keyMistakes || {};

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("stat-total-games", s.totalGames);
    set("stat-wins", s.wins);
    set("stat-highest-wpm", s.highestWpm);
    set("stat-best-accuracy", `${s.bestAccuracy}%`);
    set("stat-total-distance", `${s.totalDistance}m`);
    set("stat-best-combo", `${s.bestCombo}x`);

    const wpmContainer = document.getElementById("wpm-chart-bars");
    if (wpmContainer) {
      if (history.length === 0) {
        wpmContainer.innerHTML = `<span class="text-muted">No recent games. Play a match to plot WPM graph!</span>`;
      } else {
        const recent = history.slice(0, 10).reverse();
        const maxW = Math.max(...recent.map(r => r.wpm || 0), 100);
        wpmContainer.innerHTML = recent.map(r => {
          const hPercent = Math.max(10, Math.round(((r.wpm || 0) / maxW) * 100));
          return `
            <div class="wpm-bar" style="height: ${hPercent}%" title="${r.mode.toUpperCase()}: ${r.wpm} WPM">
              <span class="wpm-bar-val">${r.wpm}</span>
            </div>
          `;
        }).join('');
      }
    }

    const weakHeatmap = document.getElementById("weak-keys-heatmap");
    if (weakHeatmap) {
      const sortedKeys = Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 6);
      if (sortedKeys.length === 0) {
        weakHeatmap.innerHTML = `<span class="weak-tag">No key typos logged yet! Clean typing run.</span>`;
      } else {
        weakHeatmap.innerHTML = sortedKeys.map(([k, count]) => `
          <span class="weak-tag">Key '${k.toUpperCase()}': ${count} Typos</span>
        `).join('');
      }
    }

    const tbody = document.getElementById("match-history-tbody");
    if (tbody) {
      if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">No match history recorded yet. Play a game to view analytics!</td></tr>`;
      } else {
        tbody.innerHTML = history.slice(0, 8).map(m => `
          <tr>
            <td><strong>${m.mode.toUpperCase()}</strong></td>
            <td>${m.mountain}</td>
            <td class="highlight">${m.wpm} WPM</td>
            <td>${m.accuracy}%</td>
            <td>${m.combo}x</td>
            <td>${m.won ? '<span style="color:#10b981">WON 🏆</span>' : '<span style="color:#ef4444">LOST 💀</span>'}</td>
          </tr>
        `).join('');
      }
    }
  }

  renderAchievements() {
    const achGrid = document.getElementById("achievements-list-grid");
    const dailyGrid = document.getElementById("dailies-list-grid");
    const s = this.app.storage.data.stats;

    if (achGrid) {
      achGrid.innerHTML = ACHIEVEMENTS_DATABASE.map(a => {
        const isDone = a.check(s);
        return `
          <div class="achievement-card ${isDone ? 'unlocked' : ''}">
            <div class="ach-icon">${a.icon}</div>
            <div class="ach-body">
              <div class="ach-title">${a.title} ${isDone ? '✅' : ''}</div>
              <div class="ach-desc">${a.desc}</div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (dailyGrid) {
      dailyGrid.innerHTML = DAILY_MISSIONS_DATABASE.map(d => `
        <div class="achievement-card">
          <div class="ach-icon">${d.icon}</div>
          <div class="ach-body">
            <div class="ach-title">${d.title}</div>
            <div class="ach-desc">${d.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }

  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}
