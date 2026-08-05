// Web Audio API Procedural Sound Synthesizer Engine
// Default volumes set to 0 (Muted by default per user specification)

export class SoundManager {
  constructor() {
    this.ctx = null;

    // Default volumes MUST be 0 (muted by default)
    this.sfxVolume = 0.0;
    this.musicVolume = 0.0;
    this.ambienceVolume = 0.0;

    this.switchProfile = "blue"; // 'blue', 'brown', 'red', 'topre'
    this.isMuted = true;

    this.ambienceSource = null;
    this.ambienceGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolumes(sfx, music, ambience) {
    this.sfxVolume = sfx / 100;
    this.musicVolume = music / 100;
    this.ambienceVolume = ambience / 100;
    this.isMuted = (this.sfxVolume === 0 && this.musicVolume === 0 && this.ambienceVolume === 0);

    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume * 0.15, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  setSwitchProfile(profile) {
    this.switchProfile = profile;
  }

  // Synthesize mechanical keyboard key stroke sound
  playKeyClick(isSpace = false) {
    if (this.sfxVolume <= 0 || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    // Noise buffer generation for key click thock/snap
    const bufferSize = this.ctx.sampleRate * (isSpace ? 0.08 : 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noise.buffer = buffer;

    // Filter based on switch profile
    const filter = this.ctx.createBiquadFilter();
    switch (this.switchProfile) {
      case "blue": // High crisp clicky
        filter.type = "highpass";
        filter.frequency.setValueAtTime(isSpace ? 1500 : 2500, now);
        osc.frequency.setValueAtTime(1200, now);
        break;
      case "brown": // Tactile bump
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(isSpace ? 800 : 1200, now);
        osc.frequency.setValueAtTime(600, now);
        break;
      case "red": // Smooth linear
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(isSpace ? 600 : 900, now);
        osc.frequency.setValueAtTime(450, now);
        break;
      case "topre": // Deep thock
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(isSpace ? 350 : 500, now);
        osc.frequency.setValueAtTime(250, now);
        break;
    }

    gain.gain.setValueAtTime(this.sfxVolume * (isSpace ? 0.4 : 0.3), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSpace ? 0.08 : 0.04));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Error crunch sound
  playErrorSound() {
    if (this.sfxVolume <= 0 || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Combo streak chime
  playComboChime(comboCount) {
    if (this.sfxVolume <= 0 || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch rises with combo level
    const baseFreq = 440;
    const pitchMultiplier = Math.min(2.5, 1 + (comboCount * 0.05));
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, now);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Victory Fanfare
  playVictoryFanfare() {
    if (this.sfxVolume <= 0 || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + (idx * 0.12));

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, now + (idx * 0.12));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.12) + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + (idx * 0.12));
      osc.stop(now + (idx * 0.12) + 0.3);
    });
  }

  // Button Click Feedback
  playButtonClick() {
    if (this.sfxVolume <= 0 || !this.ctx) return;
    this.init();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  startAmbience(weatherType) {
    if (this.ambienceVolume <= 0 || !this.ctx) return;
    this.init();
    this.stopAmbience();

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.ambienceSource = this.ctx.createBufferSource();
      this.ambienceSource.buffer = buffer;
      this.ambienceSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = (weatherType === 'lava') ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime((weatherType === 'lava') ? 180 : 350, now);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(this.ambienceVolume * 0.15, now);

      this.ambienceSource.connect(filter);
      filter.connect(this.ambienceGain);
      this.ambienceGain.connect(this.ctx.destination);

      this.ambienceSource.start(now);
    } catch (e) {
      console.warn("Ambience audio failed:", e);
    }
  }

  stopAmbience() {
    if (this.ambienceSource) {
      try {
        this.ambienceSource.stop();
        this.ambienceSource.disconnect();
      } catch (e) {}
      this.ambienceSource = null;
    }
  }
}
