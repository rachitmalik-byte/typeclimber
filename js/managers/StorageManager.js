// LocalStorage Persistent Data, Match History & Analytics Manager

const STORAGE_KEY = "typeclimber_save_v2";

export class StorageManager {
  constructor() {
    this.data = this.getDefaults();
    this.load();
  }

  getDefaults() {
    return {
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        highestWpm: 0,
        bestAccuracy: 0,
        totalDistance: 0,
        bestCombo: 0,
        everestConquered: false
      },
      matchHistory: [], // Array of { timestamp, mode, mountain, wpm, accuracy, combo, won }
      keyMistakes: {},   // Map of { char: errorCount }
      player: {
        coins: 100,
        xp: 0,
        level: 1,
        equippedSkin: "skin-default",
        equippedRope: "rope-nylon",
        equippedAura: "aura-none",
        equippedFlag: "flag-red",
        unlockedItems: ["skin-default", "rope-nylon", "aura-none", "flag-red"]
      },
      unlockedMountains: ["green-hills"],
      unlockedAchievements: [],
      settings: {
        sfxVolume: 0,
        musicVolume: 0,
        ambienceVolume: 0,
        switchSound: "blue",
        theme: "theme-dark",
        particles: true,
        screenshake: true
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.getDefaults(),
          ...parsed,
          stats: { ...this.getDefaults().stats, ...(parsed.stats || {}) },
          player: { ...this.getDefaults().player, ...(parsed.player || {}) },
          settings: { ...this.getDefaults().settings, ...(parsed.settings || {}) },
          matchHistory: parsed.matchHistory || [],
          keyMistakes: parsed.keyMistakes || {}
        };
      }
    } catch (e) {
      console.warn("Storage load failed, using defaults:", e);
      this.data = this.getDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
  }

  recordMatch(gameResult, keyMistakes = {}) {
    const s = this.data.stats;
    s.totalGames++;
    if (gameResult.won) {
      s.wins++;
    } else {
      s.losses++;
    }

    if (gameResult.wpm > s.highestWpm) s.highestWpm = gameResult.wpm;
    if (gameResult.accuracy > s.bestAccuracy) s.bestAccuracy = gameResult.accuracy;
    if (gameResult.combo > s.bestCombo) s.bestCombo = gameResult.combo;
    s.totalDistance += gameResult.distance || 0;

    if (gameResult.mountainId === 'mount-everest' && gameResult.won) {
      s.everestConquered = true;
    }

    // Save match history log (Keep last 20 matches)
    this.data.matchHistory.unshift({
      timestamp: Date.now(),
      mode: gameResult.mode || "campaign",
      mountain: gameResult.mountainName || "Green Hills",
      wpm: gameResult.wpm || 0,
      accuracy: gameResult.accuracy || 100,
      combo: gameResult.combo || 0,
      won: gameResult.won
    });
    if (this.data.matchHistory.length > 20) {
      this.data.matchHistory.pop();
    }

    // Accumulate key mistake diagnostic heatmap data
    for (const [char, count] of Object.entries(keyMistakes)) {
      this.data.keyMistakes[char] = (this.data.keyMistakes[char] || 0) + count;
    }

    // Award Coins & XP
    this.addCoins(gameResult.coinsReward || 0);
    this.addXp(gameResult.xpReward || 0);

    this.save();
  }

  addCoins(amount) {
    this.data.player.coins += amount;
    this.save();
  }

  addXp(amount) {
    this.data.player.xp += amount;
    this.data.player.level = Math.floor(this.data.player.xp / 500) + 1;
    this.save();
  }

  unlockMountain(mountainId) {
    if (!this.data.unlockedMountains.includes(mountainId)) {
      this.data.unlockedMountains.push(mountainId);
      this.save();
    }
  }

  unlockItem(itemId) {
    if (!this.data.player.unlockedItems.includes(itemId)) {
      this.data.player.unlockedItems.push(itemId);
      this.save();
    }
  }

  equipItem(category, itemId) {
    if (category === 'skins') this.data.player.equippedSkin = itemId;
    if (category === 'ropes') this.data.player.equippedRope = itemId;
    if (category === 'auras') this.data.player.equippedAura = itemId;
    if (category === 'flags') this.data.player.equippedFlag = itemId;
    this.save();
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
  }

  resetAllData() {
    this.data = this.getDefaults();
    this.save();
  }
}
