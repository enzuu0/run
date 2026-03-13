/**
 * Shadow Sprint: Retro Pulse
 * A 16-bit style parkour runner.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GROUND_Y = CANVAS_HEIGHT - 60;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.001;

// Game State
let gameState = 'START'; // START, COUNTDOWN, PLAYING, GAMEOVER, VICTORY
let score = 0;
let distance = 0;
let lastTime = 0;
let speed = INITIAL_SPEED;
let scoreTimer = 0;

// Assets
const assets = {
    hero: new Image(),
    background: new Image(),
    tileset: new Image()
};

assets.hero.src = 'assets/images/hero.png';
assets.background.src = 'assets/images/background.png';
assets.tileset.src = 'assets/images/tileset.png';

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
        this.y = GROUND_Y - 40;
        this.width = 40;
        this.height = 40;
        this.vy = 0;
        this.isGrounded = false;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 100; // ms
    }

    update(deltaTime) {
        // Gravity
        if (!this.isGrounded) {
            this.vy += GRAVITY;
        }
        this.y += this.vy;

        // Ground collision
        if (this.y + this.height > GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.vy = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
        } else {
            this.isGrounded = false;
        }

        // Animation
        this.frameTimer += deltaTime;
        if (this.frameTimer > this.frameInterval) {
            this.frame = (this.frame + 1) % 4; // Assuming 4 frames
            this.frameTimer = 0;
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
        ctx.fillStyle = '#000'; // Fallback
        
        // Draw Shadow Figure
        // If image is loaded, draw it. Otherwise draw a rect.
        if (assets.hero.complete) {
            // Draw a section of the sprite sheet
            // Assuming the sprite sheet has frames horizontally
            const frameWidth = assets.hero.width / 4; 
            const frameHeight = assets.hero.height;
            
            ctx.drawImage(
                assets.hero,
                this.frame * frameWidth, 0, frameWidth, frameHeight,
                this.x, this.y, this.width, this.height
            );
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Background Layer Class
class Background {
    constructor(image, speedModifier) {
        this.image = image;
        this.speedModifier = speedModifier;
        this.x = 0;
    }

    update() {
        this.x -= speed * this.speedModifier;
        if (this.x <= -CANVAS_WIDTH) {
            this.x = 0;
        }
    }

    draw() {
        if (this.image.complete) {
            ctx.drawImage(this.image, this.x, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.drawImage(this.image, this.x + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
    }
}

// Obstacle Class
class Obstacle {
    constructor() {
        this.x = CANVAS_WIDTH + Math.random() * 500;
        this.width = 40 + Math.random() * 20;
        this.height = 40 + Math.random() * 40;
        this.y = GROUND_Y - this.height;
        this.type = Math.random() > 0.5 ? 'box' : 'spike';
    }

    update() {
        this.x -= speed;
    }

    draw() {
        if (assets.tileset.complete) {
            // Use tileset if available
            ctx.drawImage(assets.tileset, 0, 0, 32, 32, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.type === 'spike' ? '#f00' : '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Game Instances
const player = new Player();
const bgLayer = new Background(assets.background, 0.5);
let obstacles = [];

// Functions
function spawnObstacle() {
    obstacles.push(new Obstacle());
}

function checkCollision(p, o) {
    return p.x < o.x + o.width &&
           p.x + p.width > o.x &&
           p.y < o.y + o.height &&
           p.y + p.height > o.y;
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
    distance = 0;
    speed = INITIAL_SPEED;
    scoreTimer = 0;
    lastTime = performance.now();
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

function updateScore(deltaTime) {
    scoreTimer += deltaTime;
    if (scoreTimer >= 10000) { // 10 seconds
        score += 50;
        scoreTimer = 0;
        ui.score.innerText = `Score: ${score}`;
    }

    if (score >= 50000) {
        victory();
    }
}

// Main Game Loop
function gameLoop(time) {
    if (gameState !== 'PLAYING') return;

    const deltaTime = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Update
    speed += SPEED_INCREMENT;
    bgLayer.update();
    player.update(deltaTime);
    updateScore(deltaTime);

    // Obstacle management
    if (Math.random() < 0.02 && (obstacles.length === 0 || obstacles[obstacles.length-1].x < CANVAS_WIDTH - 300)) {
        spawnObstacle();
    }

    obstacles.forEach((obs, index) => {
        obs.update();
        if (checkCollision(player, obs)) {
            gameOver();
        }
        if (obs.x + obs.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    // Draw
    bgLayer.draw();
    
    // Draw Ground
    ctx.fillStyle = '#333';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    
    player.draw();
    obstacles.forEach(obs => obs.draw());

    requestAnimationFrame(gameLoop);
}

// Event Listeners
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

// Initial Load
window.onload = () => {
    // Canvas initial state
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};
