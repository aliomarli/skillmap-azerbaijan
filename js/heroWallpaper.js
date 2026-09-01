/**
 * SkillMap Azerbaijan - Live Animated Wallpaper Engine (js/heroWallpaper.js)
 * Concept: Crystal Glass & Daytime City / Baku Skyline Luxury
 * High-performance 60fps Canvas engine: Ambient Sun Glints, Floating Crystal Particles & Parallax.
 */

class HeroWallpaperEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animationFrameId = null;
        this.isRunning = false;
        this.particles = [];
        this.particleCount = 45;
        this.mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 140 };
        this.time = 0;
    }

    init() {
        this.canvas = document.getElementById("hero-live-wallpaper");
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d", { alpha: true });
        if (!this.ctx) return;

        this.handleResize();
        window.addEventListener("resize", () => this.handleResize());

        const heroContainer = document.getElementById("hero-main-container") || this.canvas.parentElement;
        if (heroContainer) {
            heroContainer.addEventListener("mousemove", (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouse.targetX = e.clientX - rect.left;
                this.mouse.targetY = e.clientY - rect.top;
            });
            heroContainer.addEventListener("mouseleave", () => {
                this.mouse.targetX = -1000;
                this.mouse.targetY = -1000;
            });
        }

        this.createParticles();
        this.start();
    }

    handleResize() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        const rect = parent ? parent.getBoundingClientRect() : { width: window.innerWidth, height: 600 };
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || 620;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        if (this.ctx) {
            this.ctx.scale(dpr, dpr);
        }
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * (this.width || 1200),
                y: Math.random() * (this.height || 600),
                size: Math.random() * 2.8 + 1.2,
                baseAlpha: Math.random() * 0.45 + 0.25,
                alpha: 0.3,
                speedX: (Math.random() - 0.5) * 0.45,
                speedY: -(Math.random() * 0.55 + 0.2),
                pulseOffset: Math.random() * Math.PI * 2,
                color: Math.random() > 0.4 ? 'rgba(255, 255, 255, ' : 'rgba(56, 189, 248, '
            });
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        const loop = () => {
            if (!this.isRunning) return;
            this.update();
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    update() {
        this.time += 0.018;
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.1;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.1;

        for (let p of this.particles) {
            p.x += p.speedX;
            p.y += p.speedY;

            p.alpha = p.baseAlpha + Math.sin(this.time * 2 + p.pulseOffset) * 0.2;
            if (p.alpha < 0.1) p.alpha = 0.1;

            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.mouse.radius && dist > 0) {
                const force = (1 - dist / this.mouse.radius) * 2.5;
                p.x += (dx / dist) * force;
                p.y += (dy / dist) * force;
                p.alpha = Math.min(1, p.alpha + 0.35);
            }

            if (p.y < -10) {
                p.y = this.height + 10;
                p.x = Math.random() * this.width;
            }
            if (p.x < -10) p.x = this.width + 10;
            if (p.x > this.width + 10) p.x = -10;
        }
    }

    render() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Ambient Sun Glint & Volumetric Daylight Flare
        const sunCenterX = this.width * 0.82 + Math.sin(this.time * 0.5) * 15;
        const sunCenterY = this.height * 0.18 + Math.cos(this.time * 0.4) * 10;
        
        const sunGrad = this.ctx.createRadialGradient(
            sunCenterX, sunCenterY, 10,
            sunCenterX, sunCenterY, 320
        );
        sunGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
        sunGrad.addColorStop(0.2, "rgba(224, 242, 254, 0.28)");
        sunGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.12)");
        sunGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

        this.ctx.fillStyle = sunGrad;
        this.ctx.beginPath();
        this.ctx.arc(sunCenterX, sunCenterY, 320, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. Render Floating Crystal Sparks
        for (let p of this.particles) {
            this.ctx.fillStyle = `${p.color}${p.alpha})`;
            this.ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            this.ctx.shadowBlur = 8;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            if (p.alpha > 0.45) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
                this.ctx.lineWidth = 0.8;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x - p.size * 2, p.y);
                this.ctx.lineTo(p.x + p.size * 2, p.y);
                this.ctx.moveTo(p.x, p.y - p.size * 2);
                this.ctx.lineTo(p.x, p.y + p.size * 2);
                this.ctx.stroke();
            }
        }
        this.ctx.shadowBlur = 0;
    }
}

window.HeroWallpaper = new HeroWallpaperEngine();

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (window.HeroWallpaper) {
            window.HeroWallpaper.init();
        }
    }, 150);
});
