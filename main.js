/**
 * Shadow Sprint: Retro Pulse
 * A 16-bit style parkour runner.
 * IMPROVED VERSION: Better visuals and robust drawing.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const GRAVITY = 0.8;
const JUMP_FORCE = -14;
const GROUND_Y = CANVAS_HEIGHT - 60;
const INITIAL_SPEED = 6;
const SPEED_INCREMENT = 0.0005;

// Game State
let gameState = 'START';
let score = 0;
let lastTime = 0;
let speed = INITIAL_SPEED;
let scoreTimer = 0;

// Assets (Keep them for background if they load, but use code-based fallback for objects)
const assets = {
    background: new Image()
};
assets.background.src = 'assets/images/background.png';

// UI Elements
const ui = {
    score: document.getElementById('score'),
    startScreen: document.getElementById('start-screen'),
    countdown: document.getElementById('countdown'),
    victoryScreen: document.getElementById('victory-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    startBtn: document.getElementById('start-btn')
};

// Player Class
class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 100;
        this.y = GROUND_Y - 50;
        this.width = 30;
        this.height = 50;
        this.vy = 0;
        this.isGrounded = false;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.animFrame = 0;
        this.animTimer = 0;
    }

    update(deltaTime) {
        if (!this.isGrounded) {
            this.vy += GRAVITY;
        }
        this.y += this.vy;

        if (this.y + this.height > GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
        } else {
            this.isGrounded = false;
        }

        // Animation logic
        this.animTimer += deltaTime;
        if (this.isGrounded) {
            if (this.animTimer > 100) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animTimer = 0;
            }
        } else {
            this.animFrame = 4; // Jump frame
        }
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.vy = JUMP_FORCE;
            this.jumpCount++;
            this.isGrounded = false;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Stylized Shadow Ninja
        ctx.fillStyle = '#111'; // Dark black
        
        // Head
        ctx.fillRect(8, 0, 14, 14);
        // Eyes (Glow)
        ctx.fillStyle = '#fff';
        ctx.fillRect(16, 4, 4, 2);
        
        ctx.fillStyle = '#111';
        // Torso
        ctx.fillRect(6, 14, 18, 20);
        
        // Legs (Leaning based on frame)
        if (this.isGrounded) {
            if (this.animFrame % 2 === 0) {
                ctx.fillRect(6, 34, 8, 16); // Left leg
                ctx.fillRect(16, 34, 8, 12); // Right leg
            } else {
                ctx.fillRect(6, 34, 8, 12);
                ctx.fillRect(16, 34, 8, 16);
            }
        } else {
            // Jump pose
            ctx.fillRect(2, 34, 10, 10);
            ctx.fillRect(18, 30, 10, 10);
        }
        
        // Scarf (Red accent for "Hero" feel)
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(0, 16, 12, 4);
        
        ctx.restore();
    }
}

// Obstacle Class
class Obstacle {
    constructor() {
        this.x = CANVAS_WIDTH + 100;
        this.type = Math.random() > 0.4 ? 'box' : 'spike';
        if (this.type === 'box') {
            this.width = 40;
            this.height = 40;
        } else {
            this.width = 50;
            this.height = 30;
        }
        this.y = GROUND_Y - this.height;
    }

    update() {
        this.x -= speed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'box') {
            // Stylized Wood Crate
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, this.width - 4, this.height - 4);
            // X on the box
            ctx.beginPath();
            ctx.moveTo(8, 8); ctx.lineTo(this.width - 8, this.height - 8);
            ctx.moveTo(this.width - 8, 8); ctx.lineTo(8, this.height - 8);
            ctx.stroke();
        } else {
            // Stylized Spikes
            ctx.fillStyle = '#757575';
            ctx.beginPath();
            ctx.moveTo(0, this.height);
            ctx.lineTo(this.width / 4, 0);
            ctx.lineTo(this.width / 2, this.height);
            ctx.lineTo(3 * this.width / 4, 0);
            ctx.lineTo(this.width, this.height);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#212121';
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Background & Ground
class Scene {
    constructor() {
        this.bgX = 0;
        this.stars = Array.from({length: 20}, () => ({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * 200,
            size: Math.random() * 2 + 1
        }));
    }

    update() {
        this.bgX -= speed * 0.5;
        if (this.bgX <= -CANVAS_WIDTH) this.bgX = 0;
    }

    draw() {
        // Sky Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        gradient.addColorStop(0, '#0d47a1');
        gradient.addColorStop(1, '#42a5f5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

        // Draw Image Background if loaded
        if (assets.background.complete && assets.background.naturalWidth !== 0) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(assets.background, this.bgX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(assets.background, this.bgX + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.globalAlpha = 1.0;
        }

        // Tiled Ground
        ctx.fillStyle = '#388e3c'; // Grass top
        ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 10);
        ctx.fillStyle = '#5d4037'; // Dirt bottom
        ctx.fillRect(0, GROUND_Y + 10, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 10);
        
        // Ground Detail (stitching/dots)
        ctx.fillStyle = '#4e342e';
        for (let i = 0; i < CANVAS_WIDTH; i += 40) {
            ctx.fillRect(i + (Math.abs(this.bgX * 2) % 40), GROUND_Y + 20, 4, 4);
            ctx.fillRect(i + 20 + (Math.abs(this.bgX * 2) % 40), GROUND_Y + 40, 4, 4);
        }
    }
}

// Game Instances
const player = new Player();
const scene = new Scene();
let obstacles = [];

function checkCollision(p, o) {
    const hitboxPadding = 5;
    return p.x + hitboxPadding < o.x + o.width - hitboxPadding &&
           p.x + p.width - hitboxPadding > o.x + hitboxPadding &&
           p.y + hitboxPadding < o.y + o.height - hitboxPadding &&
           p.y + p.height - hitboxPadding > o.y + hitboxPadding;
}

function spawnObstacle() {
    obstacles.push(new Obstacle());
}

function startGame() {
    ui.startScreen.classList.add('hidden');
    ui.gameOverScreen.classList.add('hidden');
    ui.victoryScreen.classList.add('hidden');
    gameState = 'COUNTDOWN';
    let count = 3;
    ui.countdown.classList.remove('hidden');
    ui.countdown.innerText = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            ui.countdown.innerText = count;
        } else {
            clearInterval(interval);
            ui.countdown.classList.add('hidden');
            gameState = 'PLAYING';
            resetGame();
        }
    }, 1000);
}

function resetGame() {
    player.reset();
    obstacles = [];
    score = 0;
    speed = INITIAL_SPEED;
    scoreTimer = 0;
    lastTime = performance.now();
    ui.score.innerText = `Score: 0`;
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameState = 'GAMEOVER';
    ui.gameOverScreen.classList.remove('hidden');
}

function victory() {
    gameState = 'VICTORY';
    ui.victoryScreen.classList.remove('hidden');
}

function gameLoop(time) {
    if (gameState !== 'PLAYING') return;

    const deltaTime = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update
    speed += SPEED_INCREMENT;
    scene.update();
    player.update(deltaTime);
    
    // Score logic
    scoreTimer += deltaTime;
    if (scoreTimer >= 10000) {
        score += 50;
        scoreTimer = 0;
        ui.score.innerText = `Score: ${score}`;
        if (score >= 50000) victory();
    }

    // Obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length-1].x < CANVAS_WIDTH - (300 + Math.random() * 200)) {
        spawnObstacle();
    }

    obstacles.forEach((obs, index) => {
        obs.update();
        if (checkCollision(player, obs)) {
            gameOver();
        }
        if (obs.x + obs.width < -100) {
            obstacles.splice(index, 1);
        }
    });

    // Draw
    scene.draw();
    player.draw();
    obstacles.forEach(obs => obs.draw());

    // CRT Scanline Effect (subtle)
    ctx.fillStyle = 'rgba(18, 16, 16, 0.1)';
    for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
        ctx.fillRect(0, i, CANVAS_WIDTH, 1);
    }

    requestAnimationFrame(gameLoop);
}

// Listeners
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (gameState === 'PLAYING') {
            player.jump();
        } else if (gameState === 'START' || gameState === 'GAMEOVER') {
            startGame();
        }
    }
});

ui.startBtn.addEventListener('click', startGame);

// Initialization
window.onload = () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // Draw initial scene
    scene.draw();
};
