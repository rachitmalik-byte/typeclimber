// Enhanced HTML5 Canvas 2D Parallax Mountain & Dynamic Weather Renderer Engine

export class MountainRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    this.playerProgress = 0; // 0.0 to 1.0
    this.aiProgress = 0;     // 0.0 to 1.0

    this.mountainMeta = null;
    this.particles = [];
    this.animFrameId = null;

    this.playerCosmetics = {
      skin: "🧗‍♂️",
      color: "#3b82f6",
      ropeColor: "#3b82f6",
      auraColor: "transparent",
      flagIcon: "🚩"
    };

    this.climbFrame = 0;
    this.lightningTimer = 0;
    this.isLightning = false;

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
  }

  init(mountainMeta, cosmetics = {}) {
    this.mountainMeta = mountainMeta;
    this.playerCosmetics = { ...this.playerCosmetics, ...cosmetics };
    this.playerProgress = 0;
    this.aiProgress = 0;
    this.resize();
    this.initParticles();
    this.startLoop();
  }

  setCosmetics(cosmetics) {
    this.playerCosmetics = { ...this.playerCosmetics, ...cosmetics };
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  updateProgress(playerRatio, aiRatio) {
    this.playerProgress += (playerRatio - this.playerProgress) * 0.15;
    this.aiProgress += (aiRatio - this.aiProgress) * 0.15;
  }

  initParticles() {
    this.particles = [];
    const count = 60;
    const weather = this.mountainMeta ? this.mountainMeta.weather : 'snow';

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 4 + 1,
        speedX: (weather === 'snow' || weather === 'ice') ? (Math.random() * 2 - 3) : (Math.random() * 1 - 0.5),
        speedY: (weather === 'lava') ? (Math.random() * -2 - 1) : (weather === 'rocks' ? Math.random() * 4 + 2 : Math.random() * 2 + 1),
        opacity: Math.random() * 0.8 + 0.2
      });
    }
  }

  startLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const render = () => {
      this.climbFrame += 0.1;
      this.draw();
      this.animFrameId = requestAnimationFrame(render);
    };
    render();
  }

  stopLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Multi-layer Parallax Background
    this.drawBackgroundSky(w, h);
    this.drawParallaxMountains(w, h);

    // 2. Vertical Cliff Wall & Ropes
    const wallMargin = w * 0.25;
    const playerX = wallMargin;
    const aiX = w - wallMargin;

    const startY = h - 45;
    const summitY = 55;
    const totalClimbDist = startY - summitY;

    this.drawCliffTextures(w, h, playerX, aiX);
    this.drawRopes(playerX, aiX, startY, summitY);
    this.drawSummitFlag(w, summitY);

    // 3. Climber Avatars
    const playerY = startY - (this.playerProgress * totalClimbDist);
    const aiY = startY - (this.aiProgress * totalClimbDist);

    this.drawClimber(playerX, playerY, true);
    this.drawClimber(aiX, aiY, false);

    // 4. Weather & Atmospheric Particles
    this.drawWeatherEffects(w, h);
  }

  drawBackgroundSky(w, h) {
    const weather = this.mountainMeta ? this.mountainMeta.weather : 'sun';
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);

    if (weather === 'lava') {
      grad.addColorStop(0, '#180909');
      grad.addColorStop(0.5, '#2a0e0e');
      grad.addColorStop(1, '#450a0a');
    } else if (weather === 'snow' || weather === 'ice') {
      grad.addColorStop(0, '#030712');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#1e293b');
    } else if (weather === 'storm') {
      if (this.isLightning) {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, '#1e1b4b');
      } else {
        grad.addColorStop(0, '#09090b');
        grad.addColorStop(1, '#2e1065');
      }
    } else {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#1e3a8a');
      grad.addColorStop(1, '#065f46');
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    if (weather === 'storm') {
      this.lightningTimer++;
      if (this.lightningTimer > 160 && Math.random() < 0.06) {
        this.isLightning = true;
        setTimeout(() => { this.isLightning = false; }, 80);
        this.lightningTimer = 0;
      }
    }
  }

  drawParallaxMountains(w, h) {
    // Layer 1: Distant Sky Silhouette
    this.ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(0, h * 0.45);
    this.ctx.lineTo(w * 0.2, h * 0.25);
    this.ctx.lineTo(w * 0.45, h * 0.4);
    this.ctx.lineTo(w * 0.7, h * 0.2);
    this.ctx.lineTo(w, h * 0.35);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Layer 2: Mid-ground Peaks with Glowing Peaks
    this.ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(0, h * 0.55);
    this.ctx.lineTo(w * 0.3, h * 0.35);
    this.ctx.lineTo(w * 0.6, h * 0.5);
    this.ctx.lineTo(w * 0.85, h * 0.3);
    this.ctx.lineTo(w, h * 0.45);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawCliffTextures(w, h, playerX, aiX) {
    // Left Rock Face
    this.ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    this.ctx.fillRect(playerX - 60, 0, 120, h);

    // Right Rock Face
    this.ctx.fillRect(aiX - 60, 0, 120, h);

    // Crag texture details
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    this.ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(playerX - 50, y);
      this.ctx.lineTo(playerX + 50, y + 10);
      this.ctx.moveTo(aiX - 50, y + 15);
      this.ctx.lineTo(aiX + 50, y + 25);
      this.ctx.stroke();
    }
  }

  drawRopes(playerX, aiX, startY, summitY) {
    this.ctx.lineWidth = 4;

    // Player Rope
    this.ctx.strokeStyle = this.playerCosmetics.ropeColor || '#3b82f6';
    this.ctx.beginPath();
    this.ctx.moveTo(playerX, startY);
    this.ctx.lineTo(playerX, summitY);
    this.ctx.stroke();

    // AI Rope
    this.ctx.strokeStyle = "#ef4444";
    this.ctx.beginPath();
    this.ctx.moveTo(aiX, startY);
    this.ctx.lineTo(aiX, summitY);
    this.ctx.stroke();
  }

  drawSummitFlag(w, summitY) {
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.1, summitY);
    this.ctx.lineTo(w * 0.9, summitY);
    this.ctx.stroke();

    this.ctx.font = "24px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.playerCosmetics.flagIcon || "🚩", w * 0.5, summitY - 10);
  }

  drawClimber(x, y, isPlayer) {
    this.ctx.save();
    
    // Add micro climb wobble
    const wobbleY = Math.sin(this.climbFrame * 2) * (isPlayer && this.playerProgress > 0 ? 3 : 1);
    this.ctx.translate(x, y + wobbleY);

    if (isPlayer && this.playerCosmetics.auraColor && this.playerCosmetics.auraColor !== 'transparent') {
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
      this.ctx.fillStyle = this.playerCosmetics.auraColor;
      this.ctx.shadowColor = this.playerCosmetics.auraColor;
      this.ctx.shadowBlur = 15;
      this.ctx.globalAlpha = 0.5;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;
    }

    this.ctx.font = "28px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";

    const icon = isPlayer ? (this.playerCosmetics.skin || "🧗‍♂️") : "🤖";
    this.ctx.fillText(icon, 0, 0);

    this.ctx.font = "bold 11px Inter, sans-serif";
    this.ctx.fillStyle = isPlayer ? "#10b981" : "#ef4444";
    this.ctx.fillText(isPlayer ? "YOU" : "AI BOT", 0, -22);

    this.ctx.restore();
  }

  drawWeatherEffects(w, h) {
    const weather = this.mountainMeta ? this.mountainMeta.weather : 'sun';

    this.ctx.save();
    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y > h) p.y = 0;
      if (p.y < 0) p.y = h;
      if (p.x > w) p.x = 0;
      if (p.x < 0) p.x = w;

      this.ctx.beginPath();
      if (weather === 'lava') {
        this.ctx.fillStyle = `rgba(255, 69, 0, ${p.opacity})`;
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      } else if (weather === 'rocks') {
        this.ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
        this.ctx.fillRect(p.x, p.y, p.size * 2, p.size * 2);
      } else {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      this.ctx.fill();
    });
    this.ctx.restore();
  }
}
