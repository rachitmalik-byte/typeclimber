// 100% Cross-Browser Safe 2D Animated Character & Multi-Game Renderer

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
    this.lasers = [];
    this.asteroids = [];

    this.playerHolds = [];
    this.aiHolds = [];

    this.screenShakeTime = 0;
    this.playerSlipJitter = 0;

    this.animFrameId = null;
    this.climbCycle = 0;
    this.idleBreathe = 0;

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
    this.renderMode = mode || "climb";

    this.playerVisualProgress = 0;
    this.aiVisualProgress = 0;
    this.playerTargetProgress = 0;
    this.aiTargetProgress = 0;

    this.resize();
    this.generateClimbingHolds();
    if (this.renderMode === "ztype") this.initZTypeAsteroids();
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

    const holdCount = 30;
    const h = this.canvas.height || 400;
    const startY = h - 50;
    const summitY = 60;
    const distY = startY - summitY;

    const wallMargin = (this.canvas.width || 800) * 0.25;
    const playerX = wallMargin;
    const aiX = (this.canvas.width || 800) - wallMargin;

    for (let i = 0; i <= holdCount; i++) {
      const ratio = i / holdCount;
      const baseHoldY = startY - (ratio * distY);

      const pOffsetX = (Math.sin(i * 1.5) * 16);
      const aiOffsetX = (Math.cos(i * 1.5) * 16);

      this.playerHolds.push({
        x: playerX + pOffsetX,
        y: baseHoldY,
        type: i % 3 === 0 ? 'slate' : (i % 2 === 0 ? 'granite' : 'ledge'),
        size: 20 + (i % 4) * 4,
        ratio
      });

      this.aiHolds.push({
        x: aiX + aiOffsetX,
        y: baseHoldY,
        type: i % 3 === 0 ? 'slate' : (i % 2 === 0 ? 'granite' : 'ledge'),
        size: 20 + (i % 4) * 4,
        ratio
      });
    }
  }

  initZTypeAsteroids() {
    this.asteroids = [];
    const words = ["NITRO", "CYBER", "APEX", "VELOCITY", "TITAN", "SPECTRUM", "PULSE", "ORBIT"];
    const w = this.canvas.width || 800;
    for (let i = 0; i < words.length; i++) {
      this.asteroids.push({
        x: Math.random() * (w - 240) + 120,
        y: -80 - (i * 120),
        word: words[i],
        speedY: 1.0 + Math.random() * 0.5,
        radius: 34
      });
    }
  }

  updateProgress(playerRatio, aiRatio) {
    this.playerTargetProgress = playerRatio;
    this.aiTargetProgress = aiRatio;

    if (this.renderMode === "ztype" && this.asteroids.length > 0) {
      const target = this.asteroids[0];
      this.lasers.push({
        x1: this.canvas.width * 0.5,
        y1: this.canvas.height - 80,
        x2: target.x,
        y2: target.y,
        alpha: 1.0
      });
    }
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
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1.5,
        radius: Math.random() * 4 + 2,
        alpha: 0.9
      });
    }
  }

  initWeatherParticles() {
    this.particles = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * (this.canvas.width || 800),
        y: Math.random() * (this.canvas.height || 400),
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

    this.lasers.forEach((l, idx) => {
      l.alpha -= 0.1;
      if (l.alpha <= 0) this.lasers.splice(idx, 1);
    });

    if (this.renderMode === "ztype") {
      this.asteroids.forEach(a => {
        a.y += a.speedY;
        if (a.y > this.canvas.height) a.y = -80;
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

      // Render 2D Animated Climber Figures (Player & AI)
      this.drawClimberCharacter(true);
      this.drawClimberCharacter(false);

      this.drawParticles(w, h);
    }

    this.ctx.restore();
  }

  drawSkyLayer(w, h) {
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#065f46');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
  }

  drawDistantMountains(w, h) {
    const scrollOffset = (this.playerVisualProgress * h * 0.35);

    this.ctx.fillStyle = "rgba(30, 41, 59, 0.75)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(0, h * 0.4 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.3, h * 0.22 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.6, h * 0.45 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.85, h * 0.25 + scrollOffset * 0.1);
    this.ctx.lineTo(w, h * 0.38 + scrollOffset * 0.1);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawRockWallLayer(w, h) {
    const wallMargin = w * 0.25;

    // Player Track Wall
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(wallMargin - 60, 0, 120, h);

    // AI Track Wall
    this.ctx.fillRect((w - wallMargin) - 60, 0, 120, h);

    // Wall Texture Grain Fissures
    this.ctx.strokeStyle = "rgba(248, 250, 252, 0.08)";
    this.ctx.lineWidth = 1.5;
    for (let y = 0; y < h; y += 25) {
      this.ctx.beginPath();
      this.ctx.moveTo(wallMargin - 55, y);
      this.ctx.lineTo(wallMargin + 55, y + 8);
      this.ctx.moveTo((w - wallMargin) - 55, y + 12);
      this.ctx.lineTo((w - wallMargin) + 55, y + 20);
      this.ctx.stroke();
    }
  }

  drawClimbingHolds() {
    const drawHoldList = (list, color) => {
      list.forEach(hold => {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        if (hold.type === 'slate') {
          // Standard cross-browser rect for holds (no roundRect!)
          this.ctx.rect(hold.x - hold.size / 2, hold.y - 5, hold.size, 10);
        } else if (hold.type === 'granite') {
          this.ctx.arc(hold.x, hold.y, hold.size / 2, 0, Math.PI * 2);
        } else {
          this.ctx.moveTo(hold.x - hold.size / 2, hold.y + 5);
          this.ctx.lineTo(hold.x, hold.y - 8);
          this.ctx.lineTo(hold.x + hold.size / 2, hold.y + 5);
          this.ctx.closePath();
        }

        this.ctx.fill();

        // Chalk Mark on Top of Hold
        this.ctx.fillStyle = "rgba(248, 250, 252, 0.6)";
        this.ctx.fillRect(hold.x - 6, hold.y - 4, 12, 3);
      });
    };

    drawHoldList(this.playerHolds, "#38bdf8"); // Ice Blue Holds
    drawHoldList(this.aiHolds, "#ef4444");     // Rust Red Holds
  }

  drawRopesAndSummit(w, h) {
    const wallMargin = w * 0.25;
    const playerX = wallMargin;
    const aiX = w - wallMargin;

    const startY = h - 50;
    const summitY = 60;

    // Summit Line
    this.ctx.strokeStyle = "rgba(248, 250, 252, 0.4)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.1, summitY);
    this.ctx.lineTo(w * 0.9, summitY);
    this.ctx.stroke();

    // Summit Flag
    this.ctx.font = "28px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.playerCosmetics.flagIcon || "🚩", w * 0.5, summitY - 12);

    // Player Rope
    this.ctx.strokeStyle = this.playerCosmetics.ropeColor || "#38bdf8";
    this.ctx.lineWidth = 3;
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

  // Render 2D Animated Climber Snapped onto Hold (100% Safe cross-browser drawing)
  drawClimberCharacter(isPlayer) {
    const activeHold = this.getActiveHold(isPlayer);
    if (!activeHold) return;

    let x = activeHold.x;
    let y = activeHold.y;

    if (isPlayer) {
      x += this.playerSlipJitter;
    }

    this.ctx.save();

    // Idle breathing bob
    const breatheY = Math.sin(this.idleBreathe) * 3;
    this.ctx.translate(x, y + breatheY);

    const mainColor = isPlayer ? "#10b981" : "#ef4444"; // Moss Green or Rust Red
    const armColor = isPlayer ? "#38bdf8" : "#f8fafc";
    const skinColor = "#fbcfe8";

    const reachOffset = Math.sin(this.climbCycle * 2) * (isPlayer && this.playerTargetProgress > 0 ? 8 : 3);

    // 1. Hands Gripping Hold
    this.ctx.fillStyle = skinColor;
    this.ctx.beginPath();
    this.ctx.arc(-8, -activeHold.size / 2, 4, 0, Math.PI * 2);
    this.ctx.arc(8, -activeHold.size / 2, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Muscular Reaching Arms
    this.ctx.strokeStyle = armColor;
    this.ctx.lineWidth = 5;
    this.ctx.lineCap = "round";

    // Left Arm
    this.ctx.beginPath();
    this.ctx.moveTo(-6, 10);
    this.ctx.lineTo(-14, -6 + reachOffset);
    this.ctx.lineTo(-8, -activeHold.size / 2);
    this.ctx.stroke();

    // Right Arm
    this.ctx.beginPath();
    this.ctx.moveTo(6, 10);
    this.ctx.lineTo(14, -6 - reachOffset);
    this.ctx.lineTo(8, -activeHold.size / 2);
    this.ctx.stroke();

    // 3. Torso Body
    this.ctx.fillStyle = mainColor;
    this.ctx.fillRect(-10, 8, 20, 24);

    // 4. Head & Climbing Helmet
    this.ctx.fillStyle = isPlayer ? "#38bdf8" : "#334155";
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
    this.ctx.fill();

    // Eyes
    this.ctx.fillStyle = "#0b1120";
    this.ctx.beginPath();
    this.ctx.arc(-3, -1, 1.5, 0, Math.PI * 2);
    this.ctx.arc(3, -1, 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // 5. Legs Pushing Off Lower Wall
    this.ctx.strokeStyle = mainColor;
    this.ctx.lineWidth = 5;

    // Left Leg
    this.ctx.beginPath();
    this.ctx.moveTo(-6, 32);
    this.ctx.lineTo(-12, 46);
    this.ctx.stroke();

    // Right Leg
    this.ctx.beginPath();
    this.ctx.moveTo(6, 32);
    this.ctx.lineTo(12, 44);
    this.ctx.stroke();

    // 6. Label Tag
    this.ctx.font = "800 11px Inter, sans-serif";
    this.ctx.fillStyle = isPlayer ? "#10b981" : "#ef4444";
    this.ctx.textAlign = "center";
    this.ctx.fillText(isPlayer ? "YOU 🧗" : "BOT 🤖", 0, -22);

    this.ctx.restore();
  }

  // 🏎️ Nitro Car Highway Race Canvas Renderer
  drawNitroCarRace(w, h) {
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#0284c7');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);

    // Road Track
    const roadTop = h * 0.35;
    this.ctx.fillStyle = "#1e293b";
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.3, roadTop);
    this.ctx.lineTo(w * 0.7, roadTop);
    this.ctx.lineTo(w, h);
    this.ctx.lineTo(0, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Dash Lane Divider Lines
    this.ctx.strokeStyle = "#f59e0b";
    this.ctx.lineWidth = 4;
    const laneOffset = (this.climbCycle * 25) % 40;
    for (let y = roadTop; y < h; y += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(w * 0.5, y + laneOffset);
      this.ctx.lineTo(w * 0.5, y + laneOffset + 20);
      this.ctx.stroke();
    }

    // Render Cyber Sports Car
    const carX = w * 0.5;
    const carY = h - 110;

    this.ctx.save();
    this.ctx.translate(carX, carY);

    // Car Body
    this.ctx.fillStyle = "#38bdf8";
    this.ctx.fillRect(-35, -50, 70, 100);

    // Windshield
    this.ctx.fillStyle = "#0f172a";
    this.ctx.fillRect(-25, -25, 50, 30);

    // Nitro Exhaust Thruster Flame
    if (this.playerTargetProgress > 0) {
      this.ctx.fillStyle = "#f59e0b";
      this.ctx.beginPath();
      this.ctx.arc(0, 55, Math.random() * 10 + 8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  // 🚀 Z-Type Space Shooter Canvas Renderer
  drawZTypeSpaceShooter(w, h) {
    this.ctx.fillStyle = "#090d16";
    this.ctx.fillRect(0, 0, w, h);

    // Starfield Stars
    this.ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 40; i++) {
      const sx = (i * 37) % w;
      const sy = (i * 53 + this.climbCycle * 12) % h;
      this.ctx.fillRect(sx, sy, 2, 2);
    }

    // Render Starship Fighter at Bottom
    const shipX = w * 0.5;
    const shipY = h - 80;

    this.ctx.save();
    this.ctx.translate(shipX, shipY);

    this.ctx.fillStyle = "#38bdf8";
    this.ctx.beginPath();
    this.ctx.moveTo(0, -30);
    this.ctx.lineTo(-30, 30);
    this.ctx.lineTo(0, 15);
    this.ctx.lineTo(30, 30);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();

    // Render Laser Beams
    this.lasers.forEach(l => {
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${l.alpha})`;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.moveTo(l.x1, l.y1);
      this.ctx.lineTo(l.x2, l.y2);
      this.ctx.stroke();
    });

    // Render Asteroid Words
    this.asteroids.forEach(a => {
      this.ctx.fillStyle = "#ef4444";
      this.ctx.beginPath();
      this.ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.font = "800 15px Fira Code, monospace";
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
