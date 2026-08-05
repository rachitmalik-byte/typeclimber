// Advanced 2D Animated Character & Multi-Game Rendering Engine

export class MountainRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    this.renderMode = "climb"; // "climb", "nitro", "ztype"

    this.playerVisualProgress = 0;
    this.aiVisualProgress = 0;
    this.playerTargetProgress = 0;
    this.aiTargetProgress = 0;

    this.mountainMeta = null;
    this.particles = [];
    this.chalkDustParticles = [];
    this.asteroids = [];
    this.lasers = [];

    this.playerHolds = [];
    this.aiHolds = [];

    this.screenShakeTime = 0;
    this.playerSlipJitter = 0;

    this.animFrameId = null;
    this.climbCycle = 0;
    this.idleBreathe = 0;

    // Load Sprite Images
    this.climberSpriteImg = new Image();
    this.climberSpriteImg.src = "assets/images/climber_sprite.jpg";

    this.nitroCarImg = new Image();
    this.nitroCarImg.src = "assets/images/nitro_car.jpg";

    this.spaceShipImg = new Image();
    this.spaceShipImg.src = "assets/images/space_ship.jpg";

    this.playerCosmetics = {
      skin: "🧗‍♂️",
      ropeColor: "#38bdf8",
      auraColor: "transparent",
      flagIcon: "🚩"
    };

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
  }

  init(mountainMeta, cosmetics = {}, mode = "climb") {
    this.mountainMeta = mountainMeta;
    this.playerCosmetics = { ...this.playerCosmetics, ...cosmetics };
    this.renderMode = mode;

    this.playerVisualProgress = 0;
    this.aiVisualProgress = 0;
    this.playerTargetProgress = 0;
    this.aiTargetProgress = 0;

    this.resize();
    if (mode === "climb") this.generateClimbingHolds();
    if (mode === "ztype") this.initZTypeAsteroids();
    this.initWeatherParticles();
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  generateClimbingHolds() {
    this.playerHolds = [];
    this.aiHolds = [];

    const holdCount = 32;
    const h = this.canvas.height;
    const startY = h - 60;
    const summitY = 70;
    const distY = startY - summitY;

    const wallMargin = this.canvas.width * 0.25;
    const playerX = wallMargin;
    const aiX = this.canvas.width - wallMargin;

    for (let i = 0; i <= holdCount; i++) {
      const ratio = i / holdCount;
      const baseHoldY = startY - (ratio * distY);

      const pOffsetX = (Math.sin(i * 1.5) * 16);
      const aiOffsetX = (Math.cos(i * 1.5) * 16);

      this.playerHolds.push({
        x: playerX + pOffsetX,
        y: baseHoldY,
        type: i % 3 === 0 ? 'slate' : (i % 2 === 0 ? 'granite' : 'ledge'),
        size: 14 + (i % 4) * 3,
        ratio
      });

      this.aiHolds.push({
        x: aiX + aiOffsetX,
        y: baseHoldY,
        type: i % 3 === 0 ? 'slate' : (i % 2 === 0 ? 'granite' : 'ledge'),
        size: 14 + (i % 4) * 3,
        ratio
      });
    }
  }

  initZTypeAsteroids() {
    this.asteroids = [];
    const words = ["SPECTRUM", "APEX", "NITRO", "CYBER", "VELOCITY", "TITAN", "AURORA"];
    const w = this.canvas.width;
    for (let i = 0; i < words.length; i++) {
      this.asteroids.push({
        x: Math.random() * (w - 200) + 100,
        y: -100 - (i * 120),
        word: words[i],
        speedY: 0.8 + Math.random() * 0.5,
        radius: 30
      });
    }
  }

  updateProgress(playerRatio, aiRatio) {
    this.playerTargetProgress = playerRatio;
    this.aiTargetProgress = aiRatio;
  }

  triggerTypoShake() {
    this.screenShakeTime = 14;
    this.playerSlipJitter = 16;
  }

  emitChalkDust(x, y) {
    for (let i = 0; i < 14; i++) {
      this.chalkDustParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.5) * 3.5 - 1.2,
        radius: Math.random() * 4 + 2,
        alpha: 0.85
      });
    }
  }

  initWeatherParticles() {
    this.particles = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 1.5 - 0.75,
        speedY: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2
      });
    }
  }

  startLoop() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const render = () => {
      this.updatePhysics();
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

  updatePhysics() {
    this.climbCycle += 0.08;
    this.idleBreathe += 0.04;

    const oldPlayerVisual = this.playerVisualProgress;
    this.playerVisualProgress += (this.playerTargetProgress - this.playerVisualProgress) * 0.15;
    this.aiVisualProgress += (this.aiTargetProgress - this.aiVisualProgress) * 0.15;

    if (Math.abs(this.playerVisualProgress - oldPlayerVisual) > 0.02 && this.renderMode === "climb") {
      const activeHold = this.getActiveHold(true);
      if (activeHold) this.emitChalkDust(activeHold.x, activeHold.y);
    }

    if (this.screenShakeTime > 0) this.screenShakeTime--;
    if (this.playerSlipJitter > 0) this.playerSlipJitter *= 0.85;

    this.chalkDustParticles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.chalkDustParticles.splice(idx, 1);
    });

    if (this.renderMode === "ztype") {
      this.asteroids.forEach(a => {
        a.y += a.speedY;
        if (a.y > this.canvas.height) a.y = -100;
      });
    }
  }

  getActiveHold(isPlayer) {
    const holds = isPlayer ? this.playerHolds : this.aiHolds;
    const progress = isPlayer ? this.playerVisualProgress : this.aiVisualProgress;
    if (holds.length === 0) return null;

    const index = Math.min(holds.length - 1, Math.floor(progress * (holds.length - 1)));
    return holds[index];
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.save();

    if (this.screenShakeTime > 0) {
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      this.ctx.translate(dx, dy);
    }

    this.ctx.clearRect(0, 0, w, h);

    if (this.renderMode === "nitro") {
      this.drawNitroCarRace(w, h);
    } else if (this.renderMode === "ztype") {
      this.drawZTypeSpaceShooter(w, h);
    } else {
      // Default Mountain Climb Mode
      this.drawSkyLayer(w, h);
      this.drawDistantMountains(w, h);
      this.drawRockWallLayer(w, h);
      this.drawClimbingHolds();
      this.drawRopesAndSummit(w, h);

      // Render Realistic 2D Character Climbers
      this.drawRealisticClimber(true);
      this.drawRealisticClimber(false);

      this.drawParticles(w, h);
    }

    this.ctx.restore();
  }

  drawSkyLayer(w, h) {
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0b1120');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#090d16');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
  }

  drawDistantMountains(w, h) {
    const scrollOffset = (this.playerVisualProgress * h * 0.35);

    this.ctx.fillStyle = "rgba(30, 41, 59, 0.65)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(0, h * 0.45 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.25, h * 0.25 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.55, h * 0.45 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.8, h * 0.25 + scrollOffset * 0.1);
    this.ctx.lineTo(w, h * 0.4 + scrollOffset * 0.1);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawRockWallLayer(w, h) {
    const wallMargin = w * 0.25;

    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(wallMargin - 55, 0, 110, h);
    this.ctx.fillRect((w - wallMargin) - 55, 0, 110, h);

    this.ctx.strokeStyle = "rgba(248, 250, 252, 0.05)";
    this.ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(wallMargin - 50, y);
      this.ctx.lineTo(wallMargin + 50, y + 8);
      this.ctx.moveTo((w - wallMargin) - 50, y + 12);
      this.ctx.lineTo((w - wallMargin) + 50, y + 20);
      this.ctx.stroke();
    }
  }

  drawClimbingHolds() {
    const drawHoldList = (list, color) => {
      list.forEach(hold => {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        if (hold.type === 'slate') {
          this.ctx.roundRect(hold.x - hold.size / 2, hold.y - 4, hold.size, 8, 3);
        } else if (hold.type === 'granite') {
          this.ctx.arc(hold.x, hold.y, hold.size / 2.2, 0, Math.PI * 2);
        } else {
          this.ctx.moveTo(hold.x - hold.size / 2, hold.y + 4);
          this.ctx.lineTo(hold.x, hold.y - 6);
          this.ctx.lineTo(hold.x + hold.size / 2, hold.y + 4);
          this.ctx.closePath();
        }

        this.ctx.fill();

        this.ctx.fillStyle = "rgba(248, 250, 252, 0.4)";
        this.ctx.fillRect(hold.x - 4, hold.y - 2, 8, 3);
      });
    };

    drawHoldList(this.playerHolds, "#38bdf8");
    drawHoldList(this.aiHolds, "#ef4444");
  }

  drawRopesAndSummit(w, h) {
    const wallMargin = w * 0.25;
    const playerX = wallMargin;
    const aiX = w - wallMargin;

    const startY = h - 60;
    const summitY = 70;

    this.ctx.strokeStyle = "rgba(248, 250, 252, 0.3)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.1, summitY);
    this.ctx.lineTo(w * 0.9, summitY);
    this.ctx.stroke();

    this.ctx.font = "26px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.playerCosmetics.flagIcon || "🚩", w * 0.5, summitY - 12);

    this.ctx.strokeStyle = this.playerCosmetics.ropeColor || "#38bdf8";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(playerX, startY);
    this.ctx.lineTo(playerX, summitY);
    this.ctx.stroke();

    this.ctx.strokeStyle = "#ef4444";
    this.ctx.beginPath();
    this.ctx.moveTo(aiX, startY);
    this.ctx.lineTo(aiX, summitY);
    this.ctx.stroke();
  }

  // Render Realistic 2D Animated Character Climber (With Joints & Sprite Overlay)
  drawRealisticClimber(isPlayer) {
    const activeHold = this.getActiveHold(isPlayer);
    if (!activeHold) return;

    let x = activeHold.x;
    let y = activeHold.y;

    if (isPlayer) {
      x += this.playerSlipJitter;
    }

    this.ctx.save();
    const breatheY = Math.sin(this.idleBreathe) * 2.5;
    this.ctx.translate(x, y + breatheY);

    const bodyColor = isPlayer ? "#10b981" : "#ef4444";
    const skinTone = "#fbcfe8";

    const reachOffset = Math.sin(this.climbCycle * 2) * (isPlayer && this.playerTargetProgress > 0 ? 8 : 3);

    // 1. Hands Gripping Hold
    this.ctx.fillStyle = skinTone;
    this.ctx.beginPath();
    this.ctx.arc(-8, -activeHold.size / 2, 4, 0, Math.PI * 2);
    this.ctx.arc(8, -activeHold.size / 2, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Muscular Articulated Arms Reaching
    this.ctx.strokeStyle = isPlayer ? "#38bdf8" : "#f8fafc";
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = "round";

    this.ctx.beginPath();
    this.ctx.moveTo(-6, 10);
    this.ctx.lineTo(-14, -6 + reachOffset);
    this.ctx.lineTo(-8, -activeHold.size / 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(6, 10);
    this.ctx.lineTo(14, -6 - reachOffset);
    this.ctx.lineTo(8, -activeHold.size / 2);
    this.ctx.stroke();

    // 3. Realistic Character Sprite Badge or Anatomical Torso
    if (this.climberSpriteImg.complete && isPlayer) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(0, 16, 16, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(this.climberSpriteImg, -16, 0, 32, 32);
      this.ctx.restore();
    } else {
      this.ctx.fillStyle = bodyColor;
      this.ctx.beginPath();
      this.ctx.roundRect(-9, 8, 18, 24, 6);
      this.ctx.fill();

      // Head & Helmet
      this.ctx.fillStyle = isPlayer ? "#38bdf8" : "#334155";
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // 4. Legs pushing off lower footholds
    this.ctx.strokeStyle = bodyColor;
    this.ctx.lineWidth = 5;
    
    this.ctx.beginPath();
    this.ctx.moveTo(-6, 32);
    this.ctx.lineTo(-12, 44);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(6, 32);
    this.ctx.lineTo(12, 42);
    this.ctx.stroke();

    // 5. Label Tag
    this.ctx.font = "800 11px Inter, sans-serif";
    this.ctx.fillStyle = isPlayer ? "#10b981" : "#ef4444";
    this.ctx.textAlign = "center";
    this.ctx.fillText(isPlayer ? "YOU" : "AI BOT", 0, -22);

    this.ctx.restore();
  }

  // 🏎️ Nitro Car Highway Race Mode Canvas Renderer
  drawNitroCarRace(w, h) {
    // Cyber Highway Sky
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#0284c7');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Highway Road Lines
    const roadTop = h * 0.4;
    this.ctx.fillStyle = "#1e293b";
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.3, roadTop);
    this.ctx.lineTo(w * 0.7, roadTop);
    this.ctx.lineTo(w, h);
    this.ctx.lineTo(0, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Dash lines
    this.ctx.strokeStyle = "#f59e0b";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.5, roadTop);
    this.ctx.lineTo(w * 0.5, h);
    this.ctx.stroke();

    // Render Player Sports Car
    if (this.nitroCarImg.complete) {
      const carX = w * 0.5 - 60;
      const carY = h - 140;
      this.ctx.drawImage(this.nitroCarImg, carX, carY, 120, 80);
    }
  }

  // 🚀 Z-Type Space Shooter Canvas Renderer
  drawZTypeSpaceShooter(w, h) {
    this.ctx.fillStyle = "#090d16";
    this.ctx.fillRect(0, 0, w, h);

    // Render Fighter Ship
    if (this.spaceShipImg.complete) {
      const shipX = w * 0.5 - 45;
      const shipY = h - 100;
      this.ctx.drawImage(this.spaceShipImg, shipX, shipY, 90, 70);
    }

    // Render Falling Word Asteroids
    this.asteroids.forEach(a => {
      this.ctx.fillStyle = "#ef4444";
      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = "700 14px Fira Code, monospace";
      this.ctx.fillStyle = "#f8fafc";
      this.ctx.textAlign = "center";
      this.ctx.fillText(a.word, a.x, a.y - a.radius - 8);
    });
  }

  drawParticles(w, h) {
    this.ctx.save();
    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y > h) p.y = 0;
      if (p.x > w) p.x = 0;
      if (p.x < 0) p.x = w;

      this.ctx.fillStyle = `rgba(248, 250, 252, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.chalkDustParticles.forEach(p => {
      this.ctx.fillStyle = `rgba(248, 250, 252, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }
}
