class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audioManager = new AudioManager();
        this.particles = new ParticleSystem(this.canvas, this.ctx);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Load ship SVG
        this.shipImage = new Image();
        this.shipImage.src = '/static/assets/ship.svg';

        this.ship = {
            x: this.canvas.width / 4,
            y: this.canvas.height / 2,
            width: 40,
            height: 20,
            velocity: 0,
            rotation: 0,
            thrust: 0
        };

        this.score = 0;
        this.multiplier = 1;
        this.obstacles = [];
        this.powerups = [];
        this.gameSpeed = 5;
        this.lastObstacleTime = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.backgroundStars = this.createBackgroundStars();
        this.achievements = new AchievementSystem();
        this.startTime = 0;
        this.powerupsCollected = 0;

        this.powerupEffects = {
            shield: false,
            timeSlowdown: false,
            scoreBooster: false,
            sizeReducer: false
        };
        this.powerupTimers = {
            shield: 0,
            timeSlowdown: 0,
            scoreBooster: 0,
            sizeReducer: 0
        };

        this.bindControls();
        this.loadHighScores();
    }

    createBackgroundStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1
            });
        }
        return stars;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.backgroundStars = this.createBackgroundStars();
    }

    bindControls() {
        // Keyboard controls with gentler acceleration
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                this.ship.thrust = -0.3;  // Reduced from -0.5
            } else if (e.key === 'ArrowDown') {
                this.ship.thrust = 0.3;   // Reduced from 0.5
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.ship.thrust = 0;
            }
        });

        // Touch controls with improved sensitivity
        let touchStart = null;
        let lastTouch = null;
        let touchVelocity = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStart = e.touches[0].clientY;
            lastTouch = touchStart;
            touchVelocity = 0;
            e.preventDefault();
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (touchStart === null) return;
            const touch = e.touches[0].clientY;

            // Calculate velocity with dampening
            const diff = lastTouch - touch;
            touchVelocity = (touchVelocity * 0.8) + (diff * 0.2);

            // Apply smoothed thrust
            this.ship.thrust = touchVelocity / 300;  // Reduced sensitivity

            // Clamp thrust to reasonable values
            this.ship.thrust = Math.max(-0.3, Math.min(0.3, this.ship.thrust));

            lastTouch = touch;
            e.preventDefault();
        });

        this.canvas.addEventListener('touchend', (e) => {
            touchStart = null;
            lastTouch = null;
            this.ship.thrust = 0;
            touchVelocity = 0;
            e.preventDefault();
        });

        document.getElementById('startButton').addEventListener('click', () => {
            this.start();
        });
    }

    start() {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('hud').classList.remove('d-none');
        this.startTime = Date.now();
        this.audioManager.initialize().then(() => {
            this.audioManager.startBackgroundMusic();
            this.gameLoop();
        });
    }

    generateObstacle() {
        const now = Date.now();
        if (now - this.lastObstacleTime > 1500 - this.gameSpeed * 10) {
            const height = Math.random() * (this.canvas.height / 3) + 50;
            const gap = Math.max(150, 200 - (this.gameSpeed * 5));

            // Create obstacle with visual variety
            const obstacleType = Math.floor(Math.random() * 3);
            const obstacleColor = `hsl(${Math.random() * 360}, 70%, 50%)`;

            this.obstacles.push({
                x: this.canvas.width,
                y: 0,
                width: 40,
                height: height,
                type: obstacleType,
                color: obstacleColor
            });

            this.obstacles.push({
                x: this.canvas.width,
                y: height + gap,
                width: 40,
                height: this.canvas.height - height - gap,
                type: obstacleType,
                color: obstacleColor
            });

            // Add power-up with different types
            if (Math.random() < 0.3) {
                const powerupTypes = ['multiplier', 'shield', 'timeSlowdown', 'scoreBooster', 'sizeReducer'];
                const weights = [0.4, 0.2, 0.15, 0.15, 0.1]; // Probability weights
                const powerupType = this.weightedRandom(powerupTypes, weights);

                this.powerups.push({
                    x: this.canvas.width,
                    y: height + gap / 2,
                    width: 20,
                    height: 20,
                    type: powerupType,
                    rotation: 0
                });
            }

            this.lastObstacleTime = now;
        }
    }

    weightedRandom(items, weights) {
        const total = weights.reduce((a, b) => a + b);
        const threshold = Math.random() * total;
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
            sum += weights[i];
            if (sum > threshold) {
                return items[i];
            }
        }
        return items[0];
    }

    activatePowerup(type) {
        const duration = 5000; // 5 seconds for all power-ups
        this.powerupEffects[type] = true;
        this.powerupTimers[type] = duration;

        switch (type) {
            case 'shield':
                // Shield effect handled in collision detection
                break;
            case 'timeSlowdown':
                this.gameSpeed *= 0.5;
                break;
            case 'scoreBooster':
                this.multiplier *= 2;
                break;
            case 'sizeReducer':
                this.ship.width *= 0.7;
                this.ship.height *= 0.7;
                break;
        }

        setTimeout(() => {
            this.deactivatePowerup(type);
        }, duration);
    }

    deactivatePowerup(type) {
        this.powerupEffects[type] = false;
        this.powerupTimers[type] = 0;

        switch (type) {
            case 'timeSlowdown':
                this.gameSpeed *= 2;
                break;
            case 'scoreBooster':
                this.multiplier /= 2;
                break;
            case 'sizeReducer':
                this.ship.width = 40;
                this.ship.height = 20;
                break;
        }
    }

    update() {
        if (this.isGameOver) return;

        // Update ship physics with gentler acceleration
        this.ship.velocity += this.ship.thrust;
        this.ship.velocity *= 0.92; // Increased dampening for smoother deceleration
        this.ship.y += this.ship.velocity * 3; // Reduced movement speed
        this.ship.rotation = this.ship.velocity * 0.2; // Reduced rotation for less dramatic tilt

        // Add smooth boundary approach
        if (this.ship.y < 50) {
            this.ship.velocity += 0.1; // Gentle push away from top boundary
        } else if (this.ship.y > this.canvas.height - 50) {
            this.ship.velocity -= 0.1; // Gentle push away from bottom boundary
        }

        // Clamp position with padding
        this.ship.y = Math.max(10, Math.min(this.ship.y, this.canvas.height - this.ship.height - 10));

        this.updateBackgroundStars();
        this.generateObstacle();

        // Update obstacles with time slowdown effect
        const effectiveSpeed = this.powerupEffects.timeSlowdown ? this.gameSpeed * 0.5 : this.gameSpeed;

        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.x -= effectiveSpeed;

            // Collision detection with shield check
            if (this.checkCollision(this.ship, obstacle) && !this.powerupEffects.shield) {
                this.gameOver();
                return false;
            }

            return obstacle.x + obstacle.width > 0;
        });

        // Update powerups
        this.powerups = this.powerups.filter(powerup => {
            powerup.x -= effectiveSpeed;
            powerup.rotation += 0.05;

            if (this.checkCollision(this.ship, powerup)) {
                if (powerup.type === 'multiplier') {
                    this.multiplier += 0.5;
                    this.powerupsCollected++;
                } else {
                    this.activatePowerup(powerup.type);
                    this.powerupsCollected++;
                }
                this.audioManager.playPowerup();
                this.particles.createExplosion(powerup.x, powerup.y, this.getPowerupColor(powerup.type), 30);
                return false;
            }

            return powerup.x + powerup.width > 0;
        });

        // Update score with progressive difficulty
        const baseScore = 1 * this.multiplier;
        const difficultyMultiplier = Math.floor(this.score / 1000) + 1;
        this.score += baseScore * difficultyMultiplier;

        // Progressive difficulty
        this.gameSpeed = 5 + Math.floor(this.score / 1000);

        // Update particles
        this.particles.update();

        // Update achievement stats
        const gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.achievements.update({
            score: Math.floor(this.score),
            powerups: this.powerupsCollected,
            multiplier: this.multiplier,
            time: gameTime
        });

        // Update UI
        document.getElementById('scoreValue').textContent = Math.floor(this.score);
        document.getElementById('multiplierValue').textContent = `${this.multiplier.toFixed(1)}x`;
    }

    getPowerupColor(type) {
        const colors = {
            multiplier: '255, 255, 0',
            shield: '0, 255, 255',
            timeSlowdown: '128, 0, 255',
            scoreBooster: '255, 128, 0',
            sizeReducer: '0, 255, 128'
        };
        return colors[type] || '255, 255, 255';
    }

    drawPowerup(powerup) {
        this.ctx.save();
        this.ctx.translate(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2);
        this.ctx.rotate(powerup.rotation);

        // Add glow effect
        this.ctx.shadowColor = `rgb(${this.getPowerupColor(powerup.type)})`;
        this.ctx.shadowBlur = 10;

        // Draw powerup symbol
        this.ctx.fillStyle = `rgb(${this.getPowerupColor(powerup.type)})`;
        this.ctx.beginPath();

        switch (powerup.type) {
            case 'multiplier':
                this.drawStar(0, 0, 5, powerup.width / 2, powerup.width / 4);
                break;
            case 'shield':
                this.drawShield(0, 0, powerup.width / 2);
                break;
            case 'timeSlowdown':
                this.drawClock(0, 0, powerup.width / 2);
                break;
            case 'scoreBooster':
                this.drawLightning(0, 0, powerup.width / 2);
                break;
            case 'sizeReducer':
                this.drawArrows(0, 0, powerup.width / 2);
                break;
        }

        this.ctx.fill();
        this.ctx.restore();
    }

    // New power-up symbol drawing methods
    drawClock(x, y, radius) {
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + radius * 0.5, y);
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x, y - radius * 0.7);
    }

    drawLightning(x, y, size) {
        this.ctx.moveTo(x - size/2, y - size/2);
        this.ctx.lineTo(x + size/4, y);
        this.ctx.lineTo(x - size/4, y);
        this.ctx.lineTo(x + size/2, y + size/2);
    }

    drawArrows(x, y, size) {
        // Draw converging arrows
        this.ctx.moveTo(x - size, y - size/2);
        this.ctx.lineTo(x, y);
        this.ctx.moveTo(x + size, y - size/2);
        this.ctx.lineTo(x, y);
        this.ctx.moveTo(x - size, y + size/2);
        this.ctx.lineTo(x, y);
        this.ctx.moveTo(x + size, y + size/2);
        this.ctx.lineTo(x, y);
    }


    updateBackgroundStars() {
        this.backgroundStars.forEach(star => {
            star.x -= star.speed * (this.gameSpeed / 5);
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        });
    }

    drawBackgroundStars() {
        this.ctx.fillStyle = '#ffffff';
        this.backgroundStars.forEach(star => {
            this.ctx.globalAlpha = star.speed / 3;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.drawBackgroundStars();

        // Draw ship with rotation
        this.ctx.save();
        this.ctx.translate(this.ship.x + this.ship.width / 2, this.ship.y + this.ship.height / 2);
        this.ctx.rotate(this.ship.rotation);
        this.ctx.drawImage(
            this.shipImage,
            -this.ship.width / 2,
            -this.ship.height / 2,
            this.ship.width,
            this.ship.height
        );
        this.ctx.restore();

        // Draw obstacles with visual variety
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = obstacle.color;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;

            switch (obstacle.type) {
                case 0: // Standard rectangle
                    this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                    break;
                case 1: // Spiked obstacle
                    this.drawSpikedObstacle(obstacle);
                    break;
                case 2: // Glowing obstacle
                    this.drawGlowingObstacle(obstacle);
                    break;
            }
        });

        // Draw powerups with glow effect
        this.powerups.forEach(powerup => {
            this.drawPowerup(powerup);
        });

        // Draw particles
        this.particles.draw();
    }

    drawSpikedObstacle(obstacle) {
        const spikeHeight = 10;
        const spikeCount = Math.floor(obstacle.height / 20);

        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, obstacle.y);

        for (let i = 0; i < spikeCount; i++) {
            const y = obstacle.y + (i * 20);
            this.ctx.lineTo(obstacle.x + spikeHeight, y + 10);
            this.ctx.lineTo(obstacle.x, y + 20);
        }

        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.closePath();

        this.ctx.fill();
        this.ctx.stroke();
    }

    drawGlowingObstacle(obstacle) {
        this.ctx.shadowColor = obstacle.color;
        this.ctx.shadowBlur = 20;
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        this.ctx.shadowBlur = 0;
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
    }

    drawShield(cx, cy, radius) {
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        this.ctx.closePath();
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    gameLoop() {
        if (!this.isGameOver) {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    gameOver() {
        this.isGameOver = true;
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playCollision();
        this.particles.createExplosion(this.ship.x, this.ship.y, '255, 0, 0', 50);
        this.saveHighScore(Math.floor(this.score));

        setTimeout(() => {
            document.getElementById('menu').style.display = 'block';
            document.getElementById('hud').classList.add('d-none');
            this.reset();
        }, 2000);
    }

    reset() {
        this.ship.y = this.canvas.height / 2;
        this.ship.velocity = 0;
        this.ship.thrust = 0;
        this.ship.rotation = 0;
        this.score = 0;
        this.multiplier = 1;
        this.obstacles = [];
        this.powerups = [];
        this.gameSpeed = 5;
        this.isGameOver = false;
        this.backgroundStars = this.createBackgroundStars();
        this.powerupsCollected = 0;
        this.startTime = 0;
        this.powerupEffects = {
            shield: false,
            timeSlowdown: false,
            scoreBooster: false,
            sizeReducer: false
        };
        this.powerupTimers = {
            shield: 0,
            timeSlowdown: 0,
            scoreBooster: 0,
            sizeReducer: 0
        };
        this.loadHighScores();
    }

    saveHighScore(score) {
        let highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5);
        localStorage.setItem('highScores', JSON.stringify(highScores));
    }

    loadHighScores() {
        const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
        const scoresList = document.getElementById('scoresList');
        scoresList.innerHTML = highScores
            .map((score, index) => `
                <li class="h5 d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">#${index + 1}</span>
                    <span>${score.toLocaleString()}</span>
                </li>`)
            .join('');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});