/**
 * 2D Platformer Game Engine & Canvas Renderer
 * Implements rigorous AABB continuous/discrete physics, camera tracking, and procedural pixel art.
 */

import { sound } from './audio';
import { LevelData, STAGE_COLS, STAGE_ROWS, Tile, TILE_SIZE } from './types';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface BouncingCoin {
  x: number;
  y: number;
  vy: number;
  alpha: number;
}

export interface BlockBounce {
  row: number;
  col: number;
  offsetY: number;
  vy: number;
}

export interface EnemyEntity {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  direction: number; // -1 or 1
  isSquashed: boolean;
  squashTimer: number;
  grounded: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 'left' | 'right';
  state: 'idle' | 'run' | 'jump' | 'dead' | 'victory';
  animTimer: number;
  animFrame: number;
  slideDownY: number;
}

export interface GameStats {
  score: number;
  coins: number;
  timeRemaining: number;
  enemiesStomped: number;
  cleared: boolean;
  gameOver: boolean;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public level: LevelData;
  public grid: number[][]; // Dynamic copy during play

  // Camera
  public cameraX: number = 0;
  public cameraY: number = 0;
  public viewportWidth: number = 800;
  public viewportHeight: number = 480;

  // Player
  public player: PlayerState;
  public initialSpawnX: number = 64;
  public initialSpawnY: number = 300;

  // Entities & Effects
  public enemies: EnemyEntity[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public bouncingCoins: BouncingCoin[] = [];
  public bouncingBlocks: BlockBounce[] = [];

  // Physics tuning
  public readonly GRAVITY = 0.55;
  public readonly MAX_FALL_SPEED = 12.0;
  public readonly ACCEL = 0.42;
  public readonly MAX_RUN_SPEED = 4.8;
  public readonly FRICTION = 0.84;
  public readonly AIR_FRICTION = 0.94;
  public readonly JUMP_FORCE = -11.6;

  // Controls input state
  public keys: {
    left: boolean;
    right: boolean;
    jump: boolean;
    jumpPressed: boolean;
    down: boolean;
  } = {
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
    down: false,
  };

  // Game Stats
  public stats: GameStats = {
    score: 0,
    coins: 0,
    timeRemaining: 300,
    enemiesStomped: 0,
    cleared: false,
    gameOver: false,
  };

  private lastTime: number = 0;
  private animId: number = 0;
  private isRunning: boolean = false;
  private victoryCallback?: (stats: GameStats) => void;
  private deathTimer: number = 0;
  private globalTick: number = 0;

  constructor(canvas: HTMLCanvasElement, level: LevelData, onVictory?: (stats: GameStats) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.level = level;
    this.victoryCallback = onVictory;

    // Deep copy grid
    this.grid = level.grid.map((row) => [...row]);

    this.player = {
      x: 64,
      y: 300,
      width: 20,
      height: 28,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: 'right',
      state: 'idle',
      animTimer: 0,
      animFrame: 0,
      slideDownY: 0,
    };

    this.initEntities();
  }

  public initEntities() {
    this.enemies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bouncingCoins = [];
    this.bouncingBlocks = [];
    this.deathTimer = 0;

    let enemyCounter = 0;
    let foundSpawn = false;

    for (let r = 0; r < STAGE_ROWS; r++) {
      for (let c = 0; c < STAGE_COLS; c++) {
        const t = this.grid[r][c];
        if (t === Tile.PLAYER_START && !foundSpawn) {
          this.initialSpawnX = c * TILE_SIZE + 6;
          this.initialSpawnY = (r + 1) * TILE_SIZE - this.player.height;
          foundSpawn = true;
        } else if (t === Tile.ENEMY) {
          this.enemies.push({
            id: ++enemyCounter,
            x: c * TILE_SIZE + 4,
            y: (r + 1) * TILE_SIZE - 24,
            width: 24,
            height: 24,
            vx: -1.2,
            vy: 0,
            direction: -1,
            isSquashed: false,
            squashTimer: 0,
            grounded: true,
          });
          // Remove from tile map so enemy is a dynamic entity
          this.grid[r][c] = Tile.AIR;
        }
      }
    }

    this.respawnPlayer();
  }

  public respawnPlayer() {
    this.player.x = this.initialSpawnX;
    this.player.y = this.initialSpawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = true;
    this.player.state = 'idle';
    this.deathTimer = 0;
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    const loop = (timestamp: number) => {
      if (!this.isRunning) return;
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;
      this.update(dt);
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
  }

  public resetLevel(newLevel?: LevelData) {
    if (newLevel) {
      this.level = newLevel;
    }
    this.grid = this.level.grid.map((row) => [...row]);
    this.stats = {
      score: 0,
      coins: 0,
      timeRemaining: this.level.timeLimit || 300,
      enemiesStomped: 0,
      cleared: false,
      gameOver: false,
    };
    this.initEntities();
  }

  // --- UPDATE LOOP ---
  public update(dt: number) {
    this.globalTick++;

    // Timer countdown
    if (!this.stats.cleared && this.player.state !== 'dead') {
      this.stats.timeRemaining = Math.max(0, this.stats.timeRemaining - dt);
      if (this.stats.timeRemaining <= 0) {
        this.killPlayer();
      }
    }

    // Update bouncing blocks
    for (let i = this.bouncingBlocks.length - 1; i >= 0; i--) {
      const b = this.bouncingBlocks[i];
      b.offsetY += b.vy;
      b.vy += 0.8;
      if (b.offsetY >= 0) {
        b.offsetY = 0;
        this.bouncingBlocks.splice(i, 1);
      }
    }

    // Update bouncing coins from question blocks
    for (let i = this.bouncingCoins.length - 1; i >= 0; i--) {
      const c = this.bouncingCoins[i];
      c.y += c.vy;
      c.vy += 0.45;
      c.alpha -= 0.02;
      if (c.alpha <= 0) {
        this.bouncingCoins.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.life++;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Handle Player State
    if (this.player.state === 'dead') {
      this.player.y += this.player.vy;
      this.player.vy += this.GRAVITY * 0.9;
      this.deathTimer += dt;
      if (this.deathTimer > 1.4) {
        this.respawnPlayer();
      }
      return;
    }

    if (this.player.state === 'victory') {
      // Slide down flagpole
      if (this.player.slideDownY < (STAGE_ROWS - 3) * TILE_SIZE) {
        this.player.y += 3;
        this.player.slideDownY = this.player.y;
      }
      return;
    }

    // Normal gameplay player update
    this.updatePlayerPhysics();
    this.updateEnemies();
    this.checkEntityCollisions();
    this.updateCamera();
  }

  // --- RIGOROUS AABB COLLISION RESOLUTION ---
  private updatePlayerPhysics() {
    const p = this.player;

    // Horizontal Acceleration
    if (this.keys.left) {
      p.vx -= this.ACCEL;
      p.facing = 'left';
    } else if (this.keys.right) {
      p.vx += this.ACCEL;
      p.facing = 'right';
    } else {
      // Friction
      p.vx *= p.grounded ? this.FRICTION : this.AIR_FRICTION;
      if (Math.abs(p.vx) < 0.05) p.vx = 0;
    }

    // Speed clamp
    if (p.vx > this.MAX_RUN_SPEED) p.vx = this.MAX_RUN_SPEED;
    if (p.vx < -this.MAX_RUN_SPEED) p.vx = -this.MAX_RUN_SPEED;

    // Jump logic with variable height jump cut
    if (this.keys.jump && this.keys.jumpPressed && p.grounded) {
      p.vy = this.JUMP_FORCE;
      p.grounded = false;
      this.keys.jumpPressed = false;
      sound.playJump();
      this.spawnDust(p.x + p.width / 2, p.y + p.height);
    }
    // Variable jump: if key released early while moving up, reduce upward velocity
    if (!this.keys.jump && p.vy < -4) {
      p.vy *= 0.55;
    }

    // 1. HORIZONTAL COLLISION PASS
    p.x += p.vx;
    this.resolvePlayerCollisionX();

    // 2. VERTICAL COLLISION PASS
    p.vy += this.GRAVITY;
    if (p.vy > this.MAX_FALL_SPEED) p.vy = this.MAX_FALL_SPEED;
    p.y += p.vy;
    p.grounded = false;
    this.resolvePlayerCollisionY();

    // Check bottom death pit
    if (p.y > STAGE_ROWS * TILE_SIZE + 60) {
      this.killPlayer();
      return;
    }

    // Update animation state
    if (!p.grounded) {
      p.state = 'jump';
    } else if (Math.abs(p.vx) > 0.3) {
      p.state = 'run';
      p.animTimer += Math.abs(p.vx) * 0.2;
      p.animFrame = Math.floor(p.animTimer) % 4;
      if (this.globalTick % 12 === 0) {
        this.spawnDust(p.x + (p.facing === 'right' ? 2 : p.width - 2), p.y + p.height);
      }
    } else {
      p.state = 'idle';
      p.animFrame = 0;
    }

    // Check Coin & Goal overlap
    this.checkTileOverlaps();
  }

  private resolvePlayerCollisionX() {
    const p = this.player;
    const minCol = Math.max(0, Math.floor(p.x / TILE_SIZE));
    const maxCol = Math.min(STAGE_COLS - 1, Math.floor((p.x + p.width) / TILE_SIZE));
    const minRow = Math.max(0, Math.floor(p.y / TILE_SIZE));
    const maxRow = Math.min(STAGE_ROWS - 1, Math.floor((p.y + p.height - 1) / TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.grid[r][c];
        if (this.isSolidTile(tile)) {
          const tileLeft = c * TILE_SIZE;
          const tileRight = tileLeft + TILE_SIZE;

          if (p.vx > 0) {
            // Moving Right -> hit left of tile
            p.x = tileLeft - p.width;
            p.vx = 0;
          } else if (p.vx < 0) {
            // Moving Left -> hit right of tile
            p.x = tileRight;
            p.vx = 0;
          }
        }
      }
    }

    // Stage left edge clamp
    if (p.x < 0) {
      p.x = 0;
      p.vx = 0;
    }
  }

  private resolvePlayerCollisionY() {
    const p = this.player;
    const minCol = Math.max(0, Math.floor(p.x / TILE_SIZE));
    const maxCol = Math.min(STAGE_COLS - 1, Math.floor((p.x + p.width - 0.5) / TILE_SIZE));
    const minRow = Math.max(0, Math.floor(p.y / TILE_SIZE));
    const maxRow = Math.min(STAGE_ROWS - 1, Math.floor((p.y + p.height) / TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tile = this.grid[r][c];
        if (this.isSolidTile(tile)) {
          const tileTop = r * TILE_SIZE;
          const tileBottom = tileTop + TILE_SIZE;

          if (p.vy > 0) {
            // Falling -> Land on top
            p.y = tileTop - p.height;
            p.vy = 0;
            p.grounded = true;
          } else if (p.vy < 0) {
            // Rising -> Hit ceiling
            p.y = tileBottom;
            p.vy = 0;

            // Question block hit from below!
            if (tile === Tile.QUESTION) {
              this.hitQuestionBlock(r, c);
            } else {
              sound.playBlockHit();
            }
          }
        }
      }
    }
  }

  private hitQuestionBlock(row: number, col: number) {
    this.grid[row][col] = Tile.INERT_BLOCK;
    sound.playBlockHit();
    sound.playCoin();

    // Trigger visual block bounce
    this.bouncingBlocks.push({
      row,
      col,
      offsetY: 0,
      vy: -5,
    });

    // Spawn rising coin
    this.bouncingCoins.push({
      x: col * TILE_SIZE + 8,
      y: (row - 1) * TILE_SIZE,
      vy: -7.5,
      alpha: 1.0,
    });

    // Score & Coin stats
    this.stats.coins += 1;
    this.stats.score += 100;
    this.addFloatingText(col * TILE_SIZE + 16, row * TILE_SIZE - 12, '+100', '#fbbf24');
  }

  private isSolidTile(tile: Tile): boolean {
    return tile === Tile.SOLID || tile === Tile.QUESTION || tile === Tile.INERT_BLOCK;
  }

  private checkTileOverlaps() {
    const p = this.player;
    const centerCol = Math.floor((p.x + p.width / 2) / TILE_SIZE);
    const centerRow = Math.floor((p.y + p.height / 2) / TILE_SIZE);

    if (centerCol < 0 || centerCol >= STAGE_COLS || centerRow < 0 || centerRow >= STAGE_ROWS) {
      return;
    }

    // Check tiles near player
    for (let r = Math.max(0, centerRow - 1); r <= Math.min(STAGE_ROWS - 1, centerRow + 1); r++) {
      for (let c = Math.max(0, centerCol - 1); c <= Math.min(STAGE_COLS - 1, centerCol + 1); c++) {
        const tile = this.grid[r][c];
        const tileX = c * TILE_SIZE;
        const tileY = r * TILE_SIZE;

        // Collectible Coin
        if (tile === Tile.COIN) {
          if (
            p.x < tileX + 26 &&
            p.x + p.width > tileX + 6 &&
            p.y < tileY + 26 &&
            p.y + p.height > tileY + 6
          ) {
            this.grid[r][c] = Tile.AIR;
            this.stats.coins += 1;
            this.stats.score += 100;
            sound.playCoin();
            this.spawnSparkles(tileX + 16, tileY + 16, '#fde047');
            this.addFloatingText(tileX + 16, tileY - 8, '+100', '#fde047');
          }
        }

        // Hazard Spikes
        if (tile === Tile.SPIKE) {
          if (
            p.x < tileX + 28 &&
            p.x + p.width > tileX + 4 &&
            p.y + p.height > tileY + 10 &&
            p.y < tileY + 32
          ) {
            this.killPlayer();
            return;
          }
        }

        // Goal Flagpole
        if (tile === Tile.GOAL) {
          if (
            p.x < tileX + 24 &&
            p.x + p.width > tileX + 8 &&
            p.y < tileY + 32 &&
            p.y + p.height > tileY
          ) {
            this.triggerVictory(tileX, tileY);
            return;
          }
        }
      }
    }
  }

  // --- ENEMIES UPDATE ---
  private updateEnemies() {
    for (const enemy of this.enemies) {
      if (enemy.isSquashed) {
        enemy.squashTimer += 1;
        continue;
      }

      // Horizontal move
      enemy.vx = enemy.direction * 1.1;
      enemy.x += enemy.vx;

      // Enemy X collision with walls
      const eMinCol = Math.floor(enemy.x / TILE_SIZE);
      const eMaxCol = Math.floor((enemy.x + enemy.width) / TILE_SIZE);
      const eRow = Math.floor((enemy.y + enemy.height / 2) / TILE_SIZE);

      if (eMinCol >= 0 && eMaxCol < STAGE_COLS && eRow >= 0 && eRow < STAGE_ROWS) {
        if (enemy.direction < 0 && this.isSolidTile(this.grid[eRow][eMinCol])) {
          enemy.x = (eMinCol + 1) * TILE_SIZE;
          enemy.direction = 1;
        } else if (enemy.direction > 0 && this.isSolidTile(this.grid[eRow][eMaxCol])) {
          enemy.x = eMaxCol * TILE_SIZE - enemy.width;
          enemy.direction = -1;
        }
      }

      // Edge detection (optional turn around before falling off ledge)
      const feetRow = Math.floor((enemy.y + enemy.height + 2) / TILE_SIZE);
      const frontCol = Math.floor((enemy.x + (enemy.direction > 0 ? enemy.width + 4 : -4)) / TILE_SIZE);
      if (feetRow < STAGE_ROWS && frontCol >= 0 && frontCol < STAGE_COLS) {
        if (!this.isSolidTile(this.grid[feetRow][frontCol])) {
          // No ground ahead! Turn around
          enemy.direction *= -1;
        }
      }

      // Enemy Y gravity
      enemy.vy += this.GRAVITY;
      if (enemy.vy > this.MAX_FALL_SPEED) enemy.vy = this.MAX_FALL_SPEED;
      enemy.y += enemy.vy;

      // Enemy Y collision
      const bottomRow = Math.floor((enemy.y + enemy.height) / TILE_SIZE);
      const colCheck = Math.floor((enemy.x + enemy.width / 2) / TILE_SIZE);
      if (bottomRow < STAGE_ROWS && colCheck >= 0 && colCheck < STAGE_COLS) {
        if (this.isSolidTile(this.grid[bottomRow][colCheck])) {
          enemy.y = bottomRow * TILE_SIZE - enemy.height;
          enemy.vy = 0;
          enemy.grounded = true;
        }
      }
    }

    // Clean up squashed enemies after 24 frames
    this.enemies = this.enemies.filter((e) => !e.isSquashed || e.squashTimer < 24);
  }

  // --- ENTITY INTERACTIONS: STOMP VS DAMAGE ---
  private checkEntityCollisions() {
    const p = this.player;
    if (p.state === 'dead' || p.state === 'victory') return;

    for (const enemy of this.enemies) {
      if (enemy.isSquashed) continue;

      const overlapX = p.x + p.width > enemy.x && p.x < enemy.x + enemy.width;
      const overlapY = p.y + p.height > enemy.y && p.y < enemy.y + enemy.height;

      if (overlapX && overlapY) {
        // Stomp condition: Player falling downward and player's feet near top half of enemy
        const stompDepth = (p.y + p.height) - enemy.y;
        if (p.vy > 0 && stompDepth <= 16) {
          // STOMP SUCCESS!
          enemy.isSquashed = true;
          enemy.squashTimer = 0;
          p.vy = this.JUMP_FORCE * 0.72; // Crisp bounce!
          p.y = enemy.y - p.height;
          sound.playStomp();

          this.stats.score += 200;
          this.stats.enemiesStomped += 1;
          this.addFloatingText(enemy.x + 12, enemy.y - 10, '+200', '#f59e0b');
          this.spawnSparkles(enemy.x + 12, enemy.y + 12, '#fbbf24');
        } else {
          // Player hit by enemy!
          this.killPlayer();
          return;
        }
      }
    }
  }

  private killPlayer() {
    if (this.player.state === 'dead') return;
    this.player.state = 'dead';
    this.player.vy = -9.0;
    this.player.vx = 0;
    sound.playHurt();
    this.spawnDust(this.player.x + 10, this.player.y + 14, '#ef4444');
  }

  private triggerVictory(flagX: number, flagY: number) {
    if (this.stats.cleared) return;
    this.stats.cleared = true;
    this.player.state = 'victory';
    this.player.x = flagX - 6;
    this.player.slideDownY = this.player.y;
    this.player.vx = 0;
    this.player.vy = 0;

    // Time bonus
    const timeBonus = Math.floor(this.stats.timeRemaining) * 10;
    this.stats.score += 1000 + timeBonus;

    sound.playFanfare();

    // Confetti fireworks particles!
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: flagX + 16,
        y: flagY + 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#f43f5e'][Math.floor(Math.random() * 5)],
        size: 4 + Math.random() * 3,
        life: 0,
        maxLife: 60,
        gravity: 0.15,
      });
    }

    if (this.victoryCallback) {
      setTimeout(() => {
        this.victoryCallback!(this.stats);
      }, 1500);
    }
  }

  private updateCamera() {
    const targetX = this.player.x - this.viewportWidth / 2 + this.player.width / 2;
    const maxCameraX = Math.max(0, STAGE_COLS * TILE_SIZE - this.viewportWidth);
    // Smooth camera lerp
    this.cameraX += (targetX - this.cameraX) * 0.12;
    if (this.cameraX < 0) this.cameraX = 0;
    if (this.cameraX > maxCameraX) this.cameraX = maxCameraX;
  }

  // --- PARTICLE HELPERS ---
  private spawnDust(x: number, y: number, color = '#94a3b8') {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: -Math.random() * 1.5,
        color,
        size: 3,
        life: 0,
        maxLife: 16,
      });
    }
  }

  private spawnSparkles(x: number, y: number, color = '#fbbf24') {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: 3,
        life: 0,
        maxLife: 25,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color = '#fff') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.2,
    });
  }

  // --- PROCEDURAL PIXEL ART RENDERING ---
  public render() {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.viewportWidth = cw;
    this.viewportHeight = ch;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);

    // 1. Draw Background Theme
    this.drawBackground(ctx, cw, ch);

    // Translate for Camera
    ctx.translate(-Math.floor(this.cameraX), 0);

    // Visible tile ranges
    const startCol = Math.max(0, Math.floor(this.cameraX / TILE_SIZE));
    const endCol = Math.min(STAGE_COLS - 1, Math.ceil((this.cameraX + cw) / TILE_SIZE));

    // 2. Draw Tiles
    for (let r = 0; r < STAGE_ROWS; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.grid[r][c];
        if (tile === Tile.AIR) continue;

        // Check if bouncing
        const bounce = this.bouncingBlocks.find((b) => b.row === r && b.col === c);
        const offsetY = bounce ? bounce.offsetY : 0;

        const tx = c * TILE_SIZE;
        const ty = r * TILE_SIZE + offsetY;

        this.drawTile(ctx, tile, tx, ty, c, r);
      }
    }

    // 3. Draw Bouncing Coins
    for (const bc of this.bouncingCoins) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, bc.alpha);
      this.drawCoin(ctx, bc.x, bc.y);
      ctx.restore();
    }

    // 4. Draw Enemies
    for (const enemy of this.enemies) {
      if (enemy.x + enemy.width >= this.cameraX - 40 && enemy.x <= this.cameraX + cw + 40) {
        this.drawEnemy(ctx, enemy);
      }
    }

    // 5. Draw Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    // 6. Draw Player
    this.drawPlayer(ctx);

    // 7. Draw Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText(ft.text, ft.x - 14, ft.y);
      ctx.fillText(ft.text, ft.x - 14, ft.y);
      ctx.restore();
    }

    ctx.restore();

    // 8. Render Retro Arcade HUD Overlay
    this.drawHUD(ctx, cw);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    const theme = this.level.theme;

    if (theme === 'grassland') {
      // Sky blue gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, ch);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Distant rolling green hills (parallax 0.3)
      ctx.fillStyle = '#16a34a';
      const hillShift = -(this.cameraX * 0.25) % 300;
      for (let x = hillShift - 300; x < cw + 300; x += 180) {
        ctx.beginPath();
        ctx.arc(x + 90, ch - 40, 110, Math.PI, 0);
        ctx.fill();
      }

      // Pixel Clouds (parallax 0.15)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const cloudShift = -(this.cameraX * 0.15 + this.globalTick * 0.2) % 600;
      for (let cx = cloudShift - 600; cx < cw + 600; cx += 260) {
        this.drawCloud(ctx, cx, 50 + (cx % 3) * 25);
      }
    } else if (theme === 'underground') {
      // Dark cavern
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, cw, ch);

      // Cavern stalactites texture
      ctx.fillStyle = '#1e293b';
      const shift = -(this.cameraX * 0.2) % 80;
      for (let x = shift; x < cw; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 20, 0);
        ctx.lineTo(x + 10, 35 + ((x * 13) % 25));
        ctx.fill();
      }
    } else if (theme === 'sky') {
      // High atmosphere sunset/sky
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(0.5, '#6366f1');
      grad.addColorStop(1, '#f472b6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // Fluffy clouds floating below
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const cloudShift = -(this.cameraX * 0.2) % 400;
      for (let cx = cloudShift - 400; cx < cw + 400; cx += 150) {
        this.drawCloud(ctx, cx, ch - 90 + (cx % 4) * 10);
      }
    } else {
      // Castle / Fortress
      const grad = ctx.createLinearGradient(0, 0, 0, ch);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.7, '#292524');
      grad.addColorStop(1, '#44403c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      // Castle brick outlines in distance
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for (let y = 0; y < ch; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }
    }
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x + 20, y + 20, 16, 0, Math.PI * 2);
    ctx.arc(x + 36, y + 14, 20, 0, Math.PI * 2);
    ctx.arc(x + 54, y + 20, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawTile(
    ctx: CanvasRenderingContext2D,
    tile: Tile,
    x: number,
    y: number,
    col: number,
    row: number
  ) {
    const s = TILE_SIZE;

    switch (tile) {
      case Tile.SOLID: {
        const theme = this.level.theme;
        if (theme === 'grassland') {
          // Earth block with lush grass top
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(x, y, s, s);

          // Brick / stone texture
          ctx.fillStyle = '#713f12';
          ctx.fillRect(x + 2, y + 8, s - 4, s - 10);
          ctx.fillStyle = '#a16207';
          ctx.fillRect(x + 4, y + 10, 10, 8);
          ctx.fillRect(x + 18, y + 20, 10, 8);

          // Top grass fringe
          const isTopRow = row === 0 || this.grid[row - 1][col] !== Tile.SOLID;
          if (isTopRow) {
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(x, y, s, 6);
            ctx.fillStyle = '#16a34a';
            // Grass spikes
            for (let i = 0; i < s; i += 6) {
              ctx.fillRect(x + i, y + 5, 3, 3);
            }
          }
        } else if (theme === 'underground') {
          // Stone cavern bricks
          ctx.fillStyle = '#334155';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
          ctx.fillStyle = '#475569';
          ctx.fillRect(x + 4, y + 4, 10, 10);
          ctx.fillRect(x + 16, y + 16, 12, 10);
        } else if (theme === 'castle') {
          // Fiery dark basalt bricks
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(x + 4, y + 4, 11, 10);
          ctx.fillRect(x + 17, y + 16, 11, 10);
        } else {
          // Sky mushroom/cloud block
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#fdf2f8';
          ctx.fillRect(x + 4, y + 4, 8, 8);
          ctx.fillRect(x + 18, y + 16, 8, 8);
        }
        break;
      }

      case Tile.QUESTION: {
        // Gold pulsating Question Block
        ctx.fillStyle = '#b45309';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);

        // Corner rivets
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 3, y + 3, 2, 2);
        ctx.fillRect(x + s - 5, y + 3, 2, 2);
        ctx.fillRect(x + 3, y + s - 5, 2, 2);
        ctx.fillRect(x + s - 5, y + s - 5, 2, 2);

        // Pulsating '?'
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Press Start 2P", monospace';
        ctx.fillText('?', x + 9, y + 23);
        break;
      }

      case Tile.INERT_BLOCK: {
        // Brown/slate depleted block
        ctx.fillStyle = '#475569';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#334155';
        ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 6, y + 6, s - 12, s - 12);
        break;
      }

      case Tile.SPIKE: {
        // Danger Spikes
        ctx.fillStyle = '#94a3b8';
        // 3 sharp spikes
        for (let i = 0; i < 3; i++) {
          const sx = x + i * 10 + 2;
          ctx.beginPath();
          ctx.moveTo(sx, y + s);
          ctx.lineTo(sx + 5, y + 8);
          ctx.lineTo(sx + 10, y + s);
          ctx.fill();
        }
        // Red hazard base
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, y + s - 4, s, 4);
        break;
      }

      case Tile.COIN: {
        this.drawCoin(ctx, x + 8, y + 8);
        break;
      }

      case Tile.GOAL: {
        // Golden Flagpole
        const isPoleTop = row === 0 || this.grid[row - 1][col] !== Tile.GOAL;
        const isPoleBottom = row === STAGE_ROWS - 1 || this.grid[row + 1][col] === Tile.SOLID;

        // Pole
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + 13, y, 6, s);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(x + 15, y, 2, s);

        // Top orb
        if (isPoleTop) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(x + 16, y + 6, 7, 0, Math.PI * 2);
          ctx.fill();

          // Checkered Flag
          const wave = Math.sin(this.globalTick * 0.1) * 3;
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(x + 19, y + 6);
          ctx.lineTo(x + 36 + wave, y + 14);
          ctx.lineTo(x + 19, y + 22);
          ctx.fill();
        }

        // Base brick
        if (isPoleBottom) {
          ctx.fillStyle = '#15803d';
          ctx.fillRect(x + 4, y + s - 10, s - 8, 10);
        }
        break;
      }

      case Tile.PLAYER_START: {
        // Marker in editor
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fillRect(x, y, s, s);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('START', x + 3, y + 20);
        break;
      }

      case Tile.ENEMY: {
        // Editor view enemy marker
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x + 4, y + 8, 24, 20);
        break;
      }
    }
  }

  private drawCoin(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
    const shimmer = Math.abs(Math.sin(this.globalTick * 0.12));
    const width = Math.max(3, 14 * shimmer);

    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy + 8, width / 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(cx + 8, cy + 8, (width * 0.6) / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyEntity) {
    const { x, y, width, height, isSquashed } = enemy;

    if (isSquashed) {
      // Squashed Goomba
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, y + height - 8, width, 8);
      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('> <', x + 4, y + height - 2);
      return;
    }

    // Walking animation
    const step = Math.floor(this.globalTick / 8) % 2;

    // Body / Head (Mushroom dome)
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 10, 11, Math.PI, 0);
    ctx.lineTo(x + width, y + 17);
    ctx.lineTo(x, y + 17);
    ctx.fill();

    // Stem / Belly
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x + 4, y + 14, width - 8, 6);

    // Angry Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 6, y + 8, 3, 5);
    ctx.fillRect(x + width - 9, y + 8, 3, 5);

    // Eyebrows
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 6);
    ctx.lineTo(x + 9, y + 8);
    ctx.moveTo(x + width - 5, y + 6);
    ctx.lineTo(x + width - 9, y + 8);
    ctx.stroke();

    // Feet (alternating)
    ctx.fillStyle = '#451a03';
    if (step === 0) {
      ctx.fillRect(x + 2, y + height - 4, 7, 4);
      ctx.fillRect(x + width - 8, y + height - 3, 6, 3);
    } else {
      ctx.fillRect(x + 3, y + height - 3, 6, 3);
      ctx.fillRect(x + width - 9, y + height - 4, 7, 4);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);

    if (p.facing === 'left') {
      ctx.scale(-1, 1);
    }

    const hw = p.width / 2;
    const hh = p.height / 2;

    if (p.state === 'dead') {
      ctx.rotate(Math.PI);
    }

    // 1. Red Cap
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-hw, -hh, p.width, 8);
    ctx.fillRect(-hw + 2, -hh + 8, p.width + 2, 3); // visor brim

    // 2. Face / Head
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(-hw + 2, -hh + 8, p.width - 4, 9);

    // Eye & Mustache
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -hh + 9, 2, 3);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, -hh + 13, 8, 3);

    // 3. Shirt (Red)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-hw + 1, -hh + 17, p.width - 2, 6);

    // 4. Blue Overalls
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-hw + 2, -hh + 19, p.width - 4, 6);

    // Gold Button
    ctx.fillStyle = '#facc15';
    ctx.fillRect(1, -hh + 20, 2, 2);

    // 5. Shoes (Walking cycle or Jump)
    ctx.fillStyle = '#78350f';
    if (p.state === 'jump') {
      // Legs bent
      ctx.fillRect(-hw + 1, -hh + 24, 7, 4);
      ctx.fillRect(1, -hh + 22, 7, 4);
    } else if (p.state === 'run') {
      if (p.animFrame % 2 === 0) {
        ctx.fillRect(-hw, -hh + 24, 8, 4);
        ctx.fillRect(2, -hh + 23, 6, 4);
      } else {
        ctx.fillRect(-hw + 2, -hh + 23, 6, 4);
        ctx.fillRect(0, -hh + 24, 8, 4);
      }
    } else {
      // Idle standing
      ctx.fillRect(-hw + 1, -hh + 24, 7, 4);
      ctx.fillRect(1, -hh + 24, 7, 4);
    }

    ctx.restore();
  }

  private drawHUD(ctx: CanvasRenderingContext2D, cw: number) {
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';

    // HUD Bar Background with subtle border
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(12, 12, cw - 24, 38);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, cw - 24, 38);

    // Stage Name
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(this.level.name.toUpperCase(), 24, 35);

    // Coins Counter
    ctx.fillStyle = '#facc15';
    ctx.fillText(`★ ${this.stats.coins.toString().padStart(2, '0')}`, cw / 2 - 80, 35);

    // Score
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`PTS: ${this.stats.score.toString().padStart(6, '0')}`, cw / 2 + 10, 35);

    // Time
    const timeSec = Math.ceil(this.stats.timeRemaining);
    ctx.fillStyle = timeSec < 50 ? '#ef4444' : '#f8fafc';
    ctx.fillText(`TIME: ${timeSec.toString().padStart(3, '0')}`, cw - 120, 35);

    ctx.restore();
  }
}
