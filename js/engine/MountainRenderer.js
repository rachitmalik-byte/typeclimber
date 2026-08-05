// Human-Crafted 2D Vertical Climbing Wall & Parallax Physics Engine

export class MountainRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Smooth Spring Physics Positions
    this.playerVisualProgress = 0; // 0.0 to 1.0
    this.aiVisualProgress = 0;     // 0.0 to 1.0

    this.playerTargetProgress = 0;
    this.aiTargetProgress = 0;

    this.mountainMeta = null;
    this.particles = [];
    this.chalkDustParticles = [];

    this.playerHolds = [];
    this.aiHolds = [];

    this.screenShakeTime = 0;
    this.playerSlipJitter = 0;

    this.animFrameId = null;
    this.climbCycle = 0;

    this.playerCosmetics = {
      skin: "🧗‍♂️",
      ropeColor: "#38bdf8",
      auraColor: "transparent",
      flagIcon: "🚩"
    };

    this.resize = this.resize.bind(this);
    window.addEventListener('resize', this.resize);
  }

  init(mountainMeta, cosmetics = {}) {
    this.mountainMeta = mountainMeta;
    this.playerCosmetics = { ...this.playerCosmetics, ...cosmetics };

    this.playerVisualProgress = 0;
    this.aiVisualProgress = 0;
    this.playerTargetProgress = 0;
    this.aiTargetProgress = 0;

    this.resize();
    this.generateClimbingHolds();
    this.initWeatherParticles();
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  // Generate procedural climbing holds up the wall
  generateClimbingHolds() {
    this.playerHolds = [];
    this.aiHolds = [];

    const holdCount = 30; // 30 holds from base to summit
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

      // Slight horizontal jitter for natural hold layout
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

  updateProgress(playerRatio, aiRatio) {
    this.playerTargetProgress = playerRatio;
    this.aiTargetProgress = aiRatio;
  }

  triggerTypoShake() {
    this.screenShakeTime = 12; // 12 frames camera shake
    this.playerSlipJitter = 15; // horizontal slip offset
  }

  emitChalkDust(x, y) {
    for (let i = 0; i < 12; i++) {
      this.chalkDustParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1,
        radius: Math.random() * 4 + 2,
        alpha: 0.8,
        color: 'rgba(248, 250, 252, ' // chalk white
      });
    }
  }

  initWeatherParticles() {
    this.particles = [];
    const count = 50;
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

    // Smooth Spring Easing for Climber Movement
    const oldPlayerVisual = this.playerVisualProgress;
    this.playerVisualProgress += (this.playerTargetProgress - this.playerVisualProgress) * 0.15;
    this.aiVisualProgress += (this.aiTargetProgress - this.aiVisualProgress) * 0.15;

    // Emit chalk dust on hold landing
    if (Math.abs(this.playerVisualProgress - oldPlayerVisual) > 0.02) {
      const activeHold = this.getActiveHold(true);
      if (activeHold) this.emitChalkDust(activeHold.x, activeHold.y);
    }

    // Decay shake and slip jitter
    if (this.screenShakeTime > 0) this.screenShakeTime--;
    if (this.playerSlipJitter > 0) this.playerSlipJitter *= 0.85;

    // Update chalk particles
    this.chalkDustParticles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) this.chalkDustParticles.splice(idx, 1);
    });
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

    // Camera Screen Shake on Typo
    if (this.screenShakeTime > 0) {
      const dx = (Math.random() - 0.5) * 8;
      const dy = (Math.random() - 0.5) * 8;
      this.ctx.translate(dx, dy);
    }

    this.ctx.clearRect(0, 0, w, h);

    // 1. LAYER 1: Distant Sky & Clouds (10% Speed)
    this.drawSkyLayer(w, h);

    // 2. LAYER 2: Distant Alpine Mountain Ridges (35% Speed)
    this.drawDistantMountainLayer(w, h);

    // 3. LAYER 3: Immediate Rock Wall Face & Climbing Holds (100% Speed)
    this.drawRockWallLayer(w, h);
    this.drawClimbingHolds();

    // 4. Ropes & Summit Flag
    this.drawRopesAndSummit(w, h);

    // 5. 2D Vector Climber Figures (Snapped to Holds!)
    this.drawVectorClimber(true);  // Player Climber
    this.drawVectorClimber(false); // AI Opponent Climber

    // 6. Chalk Dust & Weather Particles
    this.drawParticles(w, h);

    this.ctx.restore();
  }

  drawSkyLayer(w, h) {
    const grad = this.ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#090d16');

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, w, h);
  }

  drawDistantMountainLayer(w, h) {
    const scrollOffset = (this.playerVisualProgress * h * 0.35);

    this.ctx.fillStyle = "rgba(30, 41, 59, 0.6)";
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(0, h * 0.4 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.25, h * 0.2 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.55, h * 0.45 + scrollOffset * 0.1);
    this.ctx.lineTo(w * 0.8, h * 0.25 + scrollOffset * 0.1);
    this.ctx.lineTo(w, h * 0.4 + scrollOffset * 0.1);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawRockWallLayer(w, h) {
    const wallMargin = w * 0.25;

    // Player Climbing Track Wall
    this.ctx.fillStyle = "#1e293b";
    this.ctx.fillRect(wallMargin - 55, 0, 110, h);

    // AI Climbing Track Wall
    this.ctx.fillRect((w - wallMargin) - 55, 0, 110, h);

    // Wall Texture Grain Lines
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

        // Chalk mark on hold
        this.ctx.fillStyle = "rgba(248, 250, 252, 0.4)";
        this.ctx.fillRect(hold.x - 4, hold.y - 2, 8, 3);
      });
    };

    drawHoldList(this.playerHolds, "#38bdf8"); // Sky Blue holds
    drawHoldList(this.aiHolds, "#ef4444");     // Rust Red holds
  }

  drawRopesAndSummit(w, h) {
    const wallMargin = w * 0.25;
    const playerX = wallMargin;
    const aiX = w - wallMargin;

    const startY = h - 60;
    const summitY = 70;

    // Summit Ledge Line
    this.ctx.strokeStyle = "rgba(248, 250, 252, 0.3)";
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.1, summitY);
    this.ctx.lineTo(w * 0.9, summitY);
    this.ctx.stroke();

    // Summit Flag
    this.ctx.font = "26px sans-serif";
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

  // Render Vector Articulated 2D Climber Snapped to Hold
  drawVectorClimber(isPlayer) {
    const activeHold = this.getActiveHold(isPlayer);
    if (!activeHold) return;

    let x = activeHold.x;
    let y = activeHold.y;

    if (isPlayer) {
      x += this.playerSlipJitter; // Apply typo slip jitter if mistake made
    }

    this.ctx.save();
    this.ctx.translate(x, y);

    const bodyColor = isPlayer ? "#10b981" : "#ef4444"; // Moss Green or Rust Red
    const limbColor = isPlayer ? "#38bdf8" : "#f8fafc";

    // Dynamic arm reach cycle
    const reachOffset = Math.sin(this.climbCycle * 2) * (isPlayer && this.playerTargetProgress > 0 ? 6 : 2);

    // 1. Arms reaching up to hold
    this.ctx.strokeStyle = limbColor;
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = "round";

    // Left Arm
    this.ctx.beginPath();
    this.ctx.moveTo(-6, 8);
    this.ctx.lineTo(-12, -8 + reachOffset);
    this.ctx.lineTo(0, -activeHold.size / 2);
    this.ctx.stroke();

    // Right Arm
    this.ctx.beginPath();
    this.ctx.moveTo(6, 8);
    this.ctx.lineTo(12, -8 - reachOffset);
    this.ctx.lineTo(0, -activeHold.size / 2);
    this.ctx.stroke();

    // 2. Torso / Body
    this.ctx.fillStyle = bodyColor;
    this.ctx.beginPath();
    this.ctx.roundRect(-8, 6, 16, 22, 4);
    this.ctx.fill();

    // 3. Head & Helmet
    this.ctx.fillStyle = isPlayer ? "#f8fafc" : "#334155";
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 7, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Legs pushing off lower wall
    this.ctx.strokeStyle = bodyColor;
    this.ctx.lineWidth = 4;
    
    // Left Leg
    this.ctx.beginPath();
    this.ctx.moveTo(-5, 28);
    this.ctx.lineTo(-10, 42);
    this.ctx.stroke();

    // Right Leg
    this.ctx.beginPath();
    this.ctx.moveTo(5, 28);
    this.ctx.lineTo(10, 40);
    this.ctx.stroke();

    // 5. Label Tag
    this.ctx.font = "700 10px Inter, sans-serif";
    this.ctx.fillStyle = isPlayer ? "#10b981" : "#ef4444";
    this.ctx.textAlign = "center";
    this.ctx.fillText(isPlayer ? "YOU" : "AI BOT", 0, -22);

    this.ctx.restore();
  }

  drawParticles(w, h) {
    // Render Weather Particles
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

    // Render Chalk Dust Particles
    this.chalkDustParticles.forEach(p => {
      this.ctx.fillStyle = `${p.color}${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }
}
