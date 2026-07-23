const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particlesArray;
let isLoggedIn = true;
let isProjectMode = false;
let mouse = {
    x: null,
    y: null,
    radius: 150
}

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', function() {
    mouse.x = null;
    mouse.y = null;
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', function() {
    resizeCanvas();
    init();
});

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        if (mouse.x != null && mouse.y != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < mouse.radius + this.size) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;
                let directionX = forceDirectionX * force * this.density;
                let directionY = forceDirectionY * force * this.density;
                
                this.x -= directionX;
                this.y -= directionY;
            }
        }

        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    let numberOfParticles = ((canvas.height * canvas.width) / 3000) * 0.56;
    const colors = ['#ff0055', '#ff9900', '#00ffcc', '#33ccff', '#cc33ff', '#ffff00', '#ff6600', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];

    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 0.5;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 3) - 1.5;
        let directionY = (Math.random() * 3) - 1.5;
        let color = colors[Math.floor(Math.random() * colors.length)];
        
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

// Time Particle Implementation
let timeParticlesArray = [];
let lastTimeStr = "";
let lastTimeUpdate = 0;
const offCanvas = document.createElement('canvas');
const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
offCanvas.width = 600;
offCanvas.height = 250;

class TimeParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = '#ffffff';
        this.vx = 0;
        this.vy = 0;
    }
    update() {
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        
        if (mouse.x != null && mouse.y != null) {
            let mdx = mouse.x - this.x;
            let mdy = mouse.y - this.y;
            let distance = Math.sqrt(mdx * mdx + mdy * mdy);
            if (distance < mouse.radius) {
                let force = (mouse.radius - distance) / mouse.radius;
                this.vx -= (mdx / distance) * force * 5;
                this.vy -= (mdy / distance) * force * 5;
            }
        }

        // Spring physics
        this.vx += dx * 0.02;
        this.vy += dy * 0.02;
        this.vx *= 0.9; // friction
        this.vy *= 0.9;

        this.x += this.vx;
        this.y += this.vy;
        
        this.draw();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function handleTimeParticles() {
    const currentTime = Date.now();
    if (currentTime - lastTimeUpdate >= 2000) {
        lastTimeUpdate = currentTime;
        const now = new Date();
        const timeStr = now.toLocaleTimeString();
        const dateStr = now.toLocaleDateString();
        const fullStr = timeStr + dateStr;

        if (fullStr !== lastTimeStr) {
            lastTimeStr = fullStr;
        offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
        offCtx.fillStyle = 'white';
        offCtx.textBaseline = 'top';
        offCtx.textAlign = 'right';
        offCtx.font = 'bold 80px Outfit';
        offCtx.fillText(timeStr, offCanvas.width - 10, 10);
        offCtx.font = '300 60px Outfit';
        offCtx.fillText(dateStr, offCanvas.width - 10, 110);

        const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
        const data32 = new Uint32Array(imgData.data.buffer);

        let newTargets = [];
        const offsetX = innerWidth - offCanvas.width - 20;
        const offsetY = 20;

        for (let y = 0; y < offCanvas.height; y += 4) {
            for (let x = 0; x < offCanvas.width; x += 4) {
                if (data32[y * offCanvas.width + x] & 0xff000000) {
                    newTargets.push({
                        x: x + offsetX,
                        y: y + offsetY
                    });
                }
            }
        }

        if (timeParticlesArray.length < newTargets.length) {
            let diff = newTargets.length - timeParticlesArray.length;
            for (let i = 0; i < diff; i++) {
                timeParticlesArray.push(new TimeParticle(innerWidth/2, innerHeight/2));
            }
        } else if (timeParticlesArray.length > newTargets.length) {
            timeParticlesArray.splice(newTargets.length);
        }

        const colors = ['#ff0055', '#ff9900', '#00ffcc', '#33ccff', '#cc33ff', '#ffff00', '#ff6600', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];
        for (let i = 0; i < newTargets.length; i++) {
            timeParticlesArray[i].targetX = newTargets[i].x;
            timeParticlesArray[i].targetY = newTargets[i].y;
            timeParticlesArray[i].color = colors[i % colors.length];
        }
    }
}

    for (let p of timeParticlesArray) {
        p.update();
    }
}

// Motto Implementation
let mottoParticlesArray = [];
let currentMottoIndex = 0;
let lastMottoSwitchTime = 0;
const mottoOffCanvas = document.createElement('canvas');
const mottoOffCtx = mottoOffCanvas.getContext('2d', { willReadFrequently: true });
mottoOffCanvas.width = 1600;
mottoOffCanvas.height = 400;

function handleMottoParticles() {
    const currentTime = Date.now();
    
    // Switch motto every 10 seconds
    if (currentTime - lastMottoSwitchTime > 10000 || lastMottoSwitchTime === 0) {
        let isInitialLoad = (lastMottoSwitchTime === 0);
        lastMottoSwitchTime = currentTime;
        const currentMotto = mottos[currentMottoIndex];
        currentMottoIndex = (currentMottoIndex + 1) % mottos.length;

        mottoOffCtx.clearRect(0, 0, mottoOffCanvas.width, mottoOffCanvas.height);
        mottoOffCtx.fillStyle = 'white';
        mottoOffCtx.textBaseline = 'middle';
        mottoOffCtx.textAlign = 'center';
        mottoOffCtx.font = 'bold 100px Outfit';
        mottoOffCtx.fillText(currentMotto, mottoOffCanvas.width / 2, mottoOffCanvas.height / 2);

        const imgData = mottoOffCtx.getImageData(0, 0, mottoOffCanvas.width, mottoOffCanvas.height);
        const data32 = new Uint32Array(imgData.data.buffer);

        let newTargets = [];
        const offsetX = innerWidth / 2 - mottoOffCanvas.width / 2;
        const offsetY = innerHeight / 2 - mottoOffCanvas.height / 2;

        for (let y = 0; y < mottoOffCanvas.height; y += 4) {
            for (let x = 0; x < mottoOffCanvas.width; x += 4) {
                if (data32[y * mottoOffCanvas.width + x] & 0xff000000) {
                    newTargets.push({
                        x: x + offsetX,
                        y: y + offsetY
                    });
                }
            }
        }

        if (mottoParticlesArray.length < newTargets.length) {
            let diff = newTargets.length - mottoParticlesArray.length;
            for (let i = 0; i < diff; i++) {
                mottoParticlesArray.push(new TimeParticle(innerWidth / 2, innerHeight / 2));
            }
        } else if (mottoParticlesArray.length > newTargets.length) {
            mottoParticlesArray.splice(newTargets.length);
        }

        const colors = ['#ff0055', '#ff9900', '#00ffcc', '#33ccff', '#cc33ff', '#ffff00', '#ff6600', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'];
        for (let i = 0; i < newTargets.length; i++) {
            mottoParticlesArray[i].targetX = newTargets[i].x;
            mottoParticlesArray[i].targetY = newTargets[i].y;
            mottoParticlesArray[i].color = colors[Math.floor(Math.random() * colors.length)];
            
            if (!isInitialLoad) {
                let angle = Math.random() * Math.PI * 2;
                let speed = Math.random() * 20 + 10; // Burst of speed for explosion
                mottoParticlesArray[i].vx = Math.cos(angle) * speed;
                mottoParticlesArray[i].vy = Math.sin(angle) * speed;
            }
        }
    }

    for (let p of mottoParticlesArray) {
        p.update();
    }
}

// Firework Implementation
let fireworksArray = [];
let explosionParticles = [];

class Firework {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetY = Math.random() * (canvas.height * 0.25) + (canvas.height * 0.1); // Between 10% and 35% from the top
        this.speed = 12; // Initial speed, regulated in update()
        
        // Diversify colors
        const hue = Math.random() * 360;
        const sat = isProjectMode ? 100 : 80;
        const light = Math.random() * 20 + 50;
        this.color = `hsl(${hue}, ${sat}%, ${light}%)`;
        
        this.exploded = false;
    }
    update() {
        let distance = this.y - this.targetY;
        
        // Ease out - slow down gracefully near the peak
        this.speed = Math.max(1.0, distance * 0.025);
        if (this.speed > 14) this.speed = 14; // Max rocket speed limit

        this.y -= this.speed;
        
        if (distance <= 5) {
            this.exploded = true;
            this.explode();
        }
        this.draw();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        // Add trail
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + 15);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1; // Reset
    }
    explode() {
        const baseCount = isProjectMode ? 120 : 60;
        const particleCount = baseCount + Math.random() * 50;
        for (let i = 0; i < particleCount; i++) {
            explosionParticles.push(new ExplosionParticle(this.x, this.y, this.color));
        }
    }
}

class ExplosionParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1; // Reduced explosion speed
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.gravity = 0.12;
        this.friction = 0.96;
        this.alpha = 1;
        this.decay = Math.random() * 0.01 + 0.01;
        this.size = Math.random() * 2 + 1;
    }
    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

function handleFireworks() {

    // Launch new firework randomly
    const launchChance = isProjectMode ? 0.05 : 0.015;
    if (Math.random() < launchChance) {
        fireworksArray.push(new Firework());
    }

    for (let i = fireworksArray.length - 1; i >= 0; i--) {
        fireworksArray[i].update();
        if (fireworksArray[i].exploded) {
            fireworksArray.splice(i, 1);
        }
    }

    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        explosionParticles[i].update();
        if (explosionParticles[i].alpha <= 0) {
            explosionParticles.splice(i, 1);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    
    if (!isProjectMode) {
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        handleMottoParticles();
    }
    
    handleTimeParticles();
    handleFireworks();
}

function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                           ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                if (opacityValue > 0) {
                    ctx.globalAlpha = opacityValue;
                    ctx.strokeStyle = particlesArray[a].color;
                    ctx.lineWidth = 0.3;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }
}

resizeCanvas();
init();
animate();

// Menu Toggle Logic
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');

menuBtn.addEventListener('click', () => {
    sideMenu.classList.toggle('active');
    
    // Animate hamburger to X
    const spans = menuBtn.querySelectorAll('span');
    spans[0].style.transform = sideMenu.classList.contains('active') ? 'rotate(45deg) translate(5px, 6px)' : 'none';
    spans[1].style.opacity = sideMenu.classList.contains('active') ? '0' : '1';
    spans[2].style.transform = sideMenu.classList.contains('active') ? 'rotate(-45deg) translate(5px, -6px)' : 'none';
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !sideMenu.contains(e.target)) {
        sideMenu.classList.remove('active');
        const spans = menuBtn.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Mode Switching Logic
const homeLink = document.getElementById('homeLink');
const projectLink = document.getElementById('projectLink');

homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    isProjectMode = false;
    sideMenu.classList.remove('active');
});

projectLink.addEventListener('click', (e) => {
    e.preventDefault();
    isProjectMode = true;
    sideMenu.classList.remove('active');
});


