class ParticleSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
    }

    createExplosion(x, y, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x,
                y,
                velocity: {
                    x: (Math.random() - 0.5) * 10,
                    y: (Math.random() - 0.5) * 10
                },
                radius: Math.random() * 3 + 1,
                color,
                life: 1
            });
        }
    }

    update() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.life -= 0.02;
            return particle.life > 0;
        });
    }

    draw() {
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
            this.ctx.fill();
        });
    }
}
