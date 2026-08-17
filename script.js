const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];
let isLoggedIn = true;
let isProjectMode = false;

// Global settings controllable via HUD
let particleSettings = {
    theme: 'neon',
    speedMultiplier: 1.0,
    connectionDistance: 140,
    targetCount: 180,
    interactionMode: 'repel' // 'repel' | 'attract'
};

// Shockwave / Supernova animation state
let shockwaves = [];

// Color Theme Palettes
const THEMES = {
    neon: ['#ff0055', '#ff9900', '#00ffcc', '#33ccff', '#cc33ff', '#ffff00', '#ff6600', '#00ff00', '#00ffff', '#ff00ff', '#ffffff'],
    galaxy: ['#38bdf8', '#818cf8', '#c084fc', '#e879f9', '#67e8f9', '#ffffff', '#cbd5e1'],
    solar: ['#ff1e00', '#ff5900', '#ff9900', '#ffea00', '#ff6f00', '#ffffff', '#ff3d00'],
    matrix: ['#00ff66', '#33ff99', '#00cc44', '#66ffb2', '#009933', '#ffffff', '#00ffaa']
};

let mouse = {
    x: null,
    y: null,
    radius: 160,
    isDown: false
};

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', function() {
    mouse.x = null;
    mouse.y = null;
    mouse.isDown = false;
});

// Click Shockwave (Supernova)
window.addEventListener('click', function(e) {
    // Avoid triggering shockwave when interacting with HUD controls or menu
    if (e.target.closest('#hudPanel') || e.target.closest('#hudToggleBtn') || e.target.closest('.menu-container')) {
        return;
    }
    createShockwave(e.clientX, e.clientY);
});

// Mouse down / up for holding black hole
window.addEventListener('mousedown', function(e) {
    if (e.button === 0 && !e.target.closest('#hudPanel') && !e.target.closest('#hudToggleBtn') && !e.target.closest('.menu-container')) {
        mouse.isDown = true;
    }
});

window.addEventListener('mouseup', function() {
    mouse.isDown = false;
});

// Touch support for mobile devices
window.addEventListener('touchmove', function(e) {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
    }
});
window.addEventListener('touchend', function() {
    mouse.x = null;
    mouse.y = null;
    mouse.isDown = false;
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', function() {
    resizeCanvas();
    init();
    initMatrixRain();
});

function getThemeColors() {
    return THEMES[particleSettings.theme] || THEMES.neon;
}

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.baseDirectionX = directionX;
        this.baseDirectionY = directionY;
        this.vx = directionX;
        this.vy = directionY;
        this.size = size;
        this.color = color;
        this.density = (Math.random() * 25) + 5;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    update() {
        // Wall Bounce
        if (this.x > canvas.width || this.x < 0) {
            this.vx = -this.vx;
            this.baseDirectionX = -this.baseDirectionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.vy = -this.vy;
            this.baseDirectionY = -this.baseDirectionY;
        }

        // Mouse Physics (Repel vs Black Hole Vortex)
        if (mouse.x != null && mouse.y != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            const effectiveMode = mouse.isDown ? 'attract' : particleSettings.interactionMode;

            if (distance < mouse.radius + this.size && distance > 2) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let maxDistance = mouse.radius;
                let force = (maxDistance - distance) / maxDistance;

                if (effectiveMode === 'repel') {
                    // Push away
                    let directionX = forceDirectionX * force * this.density * 0.8;
                    let directionY = forceDirectionY * force * this.density * 0.8;
                    this.x -= directionX;
                    this.y -= directionY;
                } else {
                    // Vortex Gravity attraction with spiral rotation
                    let pull = force * 4.5;
                    this.vx += forceDirectionX * pull;
                    this.vy += forceDirectionY * pull;
                    // Angular vortex spin force
                    this.vx += -forceDirectionY * pull * 1.5;
                    this.vy += forceDirectionX * pull * 1.5;
                }
            }
        }

        // Apply velocities with smooth friction
        this.x += this.vx * particleSettings.speedMultiplier;
        this.y += this.vy * particleSettings.speedMultiplier;

        // Velocity damping back to base wandering speed
        this.vx = this.vx * 0.96 + this.baseDirectionX * 0.04;
        this.vy = this.vy * 0.96 + this.baseDirectionY * 0.04;

        this.draw();
    }
}

// Shockwave / Supernova Class
class Shockwave {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 240;
        this.speed = 12;
        this.opacity = 1.0;
        this.color = getThemeColors()[0] || '#00f2fe';
    }

    update() {
        this.radius += this.speed;
        this.opacity = 1 - (this.radius / this.maxRadius);

        // Apply explosive blast to surrounding particles
        for (let p of particlesArray) {
            let dx = p.x - this.x;
            let dy = p.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            // If wave front hits particle
            if (Math.abs(dist - this.radius) < 25 && dist > 5) {
                let angle = Math.atan2(dy, dx);
                let blastPower = (1 - this.radius / this.maxRadius) * 22;
                p.vx += Math.cos(angle) * blastPower;
                p.vy += Math.sin(angle) * blastPower;
            }
        }

        // Also affect time and motto particles
        for (let p of timeParticlesArray) {
            let dx = p.x - this.x;
            let dy = p.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - this.radius) < 25 && dist > 5) {
                let angle = Math.atan2(dy, dx);
                let blastPower = (1 - this.radius / this.maxRadius) * 18;
                p.vx += Math.cos(angle) * blastPower;
                p.vy += Math.sin(angle) * blastPower;
            }
        }
        for (let p of mottoParticlesArray) {
            let dx = p.x - this.x;
            let dy = p.y - this.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(dist - this.radius) < 25 && dist > 5) {
                let angle = Math.atan2(dy, dx);
                let blastPower = (1 - this.radius / this.maxRadius) * 18;
                p.vx += Math.cos(angle) * blastPower;
                p.vy += Math.sin(angle) * blastPower;
            }
        }
    }

    draw() {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 * this.opacity;
        ctx.globalAlpha = Math.max(0, this.opacity);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.restore();
    }
}

function createShockwave(x, y) {
    shockwaves.push(new Shockwave(x, y));
}

function init() {
    particlesArray = [];
    let numberOfParticles = particleSettings.targetCount;
    const colors = getThemeColors();

    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 0.8;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 2.5) - 1.25;
        let directionY = (Math.random() * 2.5) - 1.25;
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
        this.size = Math.random() * 1.5 + 0.6;
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
            if (distance < mouse.radius && distance > 2) {
                let force = (mouse.radius - distance) / mouse.radius;
                const effectiveMode = mouse.isDown ? 'attract' : particleSettings.interactionMode;
                if (effectiveMode === 'repel') {
                    this.vx -= (mdx / distance) * force * 6;
                    this.vy -= (mdy / distance) * force * 6;
                } else {
                    this.vx += (mdx / distance) * force * 4;
                    this.vy += (mdy / distance) * force * 4;
                }
            }
        }

        // Spring physics
        this.vx += dx * 0.025;
        this.vy += dy * 0.025;
        this.vx *= 0.88; // friction
        this.vy *= 0.88;

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

            const colors = getThemeColors();
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

// Motto & Custom Text Assembly Implementation
let mottoParticlesArray = [];
let currentMottoIndex = 0;
let lastMottoSwitchTime = 0;
let customAssembledText = null;
const mottoOffCanvas = document.createElement('canvas');
const mottoOffCtx = mottoOffCanvas.getContext('2d', { willReadFrequently: true });
mottoOffCanvas.width = 2400;
mottoOffCanvas.height = 600;

function assembleTextParticles(text, isBurst = true) {
    mottoOffCtx.clearRect(0, 0, mottoOffCanvas.width, mottoOffCanvas.height);
    mottoOffCtx.fillStyle = 'white';
    mottoOffCtx.textBaseline = 'middle';
    mottoOffCtx.textAlign = 'center';
    
    // Significantly larger font size with responsive scaling based on text length and screen width
    const targetWidth = Math.min(innerWidth * 0.88, 1800);
    let fontSize = Math.floor(targetWidth / (text.length * 0.55));
    // Clamp between 110px and 175px (short text gets huge prominent font)
    if (text.length <= 10) {
        fontSize = Math.max(fontSize, 160);
    } else if (text.length <= 18) {
        fontSize = Math.max(fontSize, 135);
    } else {
        fontSize = Math.max(fontSize, 110);
    }
    fontSize = Math.min(fontSize, 185);

    mottoOffCtx.font = `bold ${fontSize}px Outfit, sans-serif`;
    mottoOffCtx.fillText(text, mottoOffCanvas.width / 2, mottoOffCanvas.height / 2);

    const imgData = mottoOffCtx.getImageData(0, 0, mottoOffCanvas.width, mottoOffCanvas.height);
    const data32 = new Uint32Array(imgData.data.buffer);

    let newTargets = [];
    const offsetX = innerWidth / 2 - mottoOffCanvas.width / 2;
    const offsetY = innerHeight / 2 - mottoOffCanvas.height / 2;

    // Use step of 4 for dense crisp particle resolution
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

    const colors = getThemeColors();
    for (let i = 0; i < newTargets.length; i++) {
        mottoParticlesArray[i].targetX = newTargets[i].x;
        mottoParticlesArray[i].targetY = newTargets[i].y;
        mottoParticlesArray[i].color = colors[Math.floor(Math.random() * colors.length)];

        if (isBurst) {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 20 + 10;
            mottoParticlesArray[i].vx = Math.cos(angle) * speed;
            mottoParticlesArray[i].vy = Math.sin(angle) * speed;
        }
    }
}

function handleMottoParticles() {
    const currentTime = Date.now();

    // If user entered custom text, keep it assembled
    if (customAssembledText) {
        for (let p of mottoParticlesArray) {
            p.update();
        }
        return;
    }

    // Switch motto every 10 seconds
    if (currentTime - lastMottoSwitchTime > 10000 || lastMottoSwitchTime === 0) {
        let isInitialLoad = (lastMottoSwitchTime === 0);
        lastMottoSwitchTime = currentTime;
        currentMottoIndex = Math.floor(Math.random() * mottos.length);
        const currentMotto = mottos[currentMottoIndex];
        assembleTextParticles(currentMotto, !isInitialLoad);
    }

    for (let p of mottoParticlesArray) {
        p.update();
    }
}

// Matrix Rain Implementation
const matrixChars = '0123456789@^#*<>ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const matrixFontSize = 28;
let matrixColumns = [];

function initMatrixRain() {
    const columnCount = Math.floor(canvas.width / matrixFontSize);
    matrixColumns = [];
    for (let i = 0; i < columnCount; i++) {
        matrixColumns.push({
            x: i * matrixFontSize,
            y: Math.random() * canvas.height,
            z: Math.random() * 0.7 + 0.3,
            speed: Math.random() * 2 + 0.5,
            charIndex: Math.floor(Math.random() * matrixChars.length),
            trailLength: Math.floor(Math.random() * 3) + 2
        });
    }
}

function handleMatrixRain() {
    ctx.fillStyle = 'rgba(0, 10, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    for (let i = 0; i < matrixColumns.length; i++) {
        const col = matrixColumns[i];
        const z = col.z;
        const fontSize = Math.max(12, Math.floor(matrixFontSize * z));
        ctx.font = `${fontSize}px monospace`;

        const brightness = 0.4 + z * 0.6;
        ctx.globalAlpha = brightness;
        ctx.fillStyle = '#00ff88';
        ctx.fillText(matrixChars[col.charIndex], col.x, col.y);

        for (let t = 1; t <= col.trailLength; t++) {
            const opacity = Math.max(0, (0.5 - (t * 0.15)) * z);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#00ff88';
            ctx.fillText(matrixChars[(col.charIndex + t) % matrixChars.length], col.x, col.y - t * fontSize);
        }

        ctx.globalAlpha = 1;
        col.charIndex = (col.charIndex + 1) % matrixChars.length;
        col.y += col.speed * z;

        if (col.y > canvas.height + fontSize * col.trailLength) {
            col.y = -fontSize * col.trailLength;
            col.z = Math.random() * 0.7 + 0.3;
            col.speed = Math.random() * 2 + 0.5;
            col.trailLength = Math.floor(Math.random() * 3) + 2;
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (isProjectMode) {
        handleMatrixRain();
    } else {
        ctx.clearRect(0, 0, innerWidth, innerHeight);

        // Update background roaming particles
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        handleMottoParticles();

        // Update & Render Shockwaves
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            shockwaves[i].update();
            shockwaves[i].draw();
            if (shockwaves[i].radius >= shockwaves[i].maxRadius) {
                shockwaves.splice(i, 1);
            }
        }
    }

    handleTimeParticles();
}

function connect() {
    const maxDist = particleSettings.connectionDistance;
    const maxDistSq = maxDist * maxDist;

    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distanceSq = dx * dx + dy * dy;

            if (distanceSq < maxDistSq) {
                let opacityValue = 1 - (distanceSq / maxDistSq);
                ctx.globalAlpha = opacityValue * 0.8;
                ctx.strokeStyle = particlesArray[a].color;
                ctx.lineWidth = 0.4;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        }
    }
}

// ----------------------------------------------------
// HUD & INTERACTIVE CONTROLS API
// ----------------------------------------------------

window.setTheme = function(themeName, btn) {
    particleSettings.theme = themeName;
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    // Update color on active particles
    const colors = getThemeColors();
    particlesArray.forEach(p => {
        p.color = colors[Math.floor(Math.random() * colors.length)];
    });
    timeParticlesArray.forEach((p, idx) => {
        p.color = colors[idx % colors.length];
    });
    mottoParticlesArray.forEach(p => {
        p.color = colors[Math.floor(Math.random() * colors.length)];
    });
};

window.setInteractionMode = function(mode) {
    particleSettings.interactionMode = mode;
    const repelBtn = document.getElementById('mouseRepelBtn');
    const attractBtn = document.getElementById('mouseAttractBtn');
    if (repelBtn && attractBtn) {
        repelBtn.classList.toggle('active', mode === 'repel');
        attractBtn.classList.toggle('active', mode === 'attract');
    }
};

function setupHUD() {
    const hudToggleBtn = document.getElementById('hudToggleBtn');
    const hudPanel = document.getElementById('hudPanel');
    const hudCloseBtn = document.getElementById('hudCloseBtn');

    if (hudToggleBtn && hudPanel) {
        hudToggleBtn.addEventListener('click', () => {
            hudPanel.classList.toggle('open');
        });
    }
    if (hudCloseBtn && hudPanel) {
        hudCloseBtn.addEventListener('click', () => {
            hudPanel.classList.remove('open');
        });
    }

    // Sliders
    const densitySlider = document.getElementById('densitySlider');
    const densityVal = document.getElementById('densityVal');
    if (densitySlider) {
        densitySlider.addEventListener('input', (e) => {
            particleSettings.targetCount = parseInt(e.target.value);
            if (densityVal) densityVal.textContent = e.target.value;
            init();
        });
    }

    const speedSlider = document.getElementById('speedSlider');
    const speedVal = document.getElementById('speedVal');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            particleSettings.speedMultiplier = parseFloat(e.target.value);
            if (speedVal) speedVal.textContent = `${e.target.value}x`;
        });
    }

    const distSlider = document.getElementById('distSlider');
    const distVal = document.getElementById('distVal');
    if (distSlider) {
        distSlider.addEventListener('input', (e) => {
            particleSettings.connectionDistance = parseInt(e.target.value);
            if (distVal) distVal.textContent = `${e.target.value}px`;
        });
    }

    // Custom Text Assembly
    const customTextInput = document.getElementById('customTextInput');
    if (customTextInput) {
        customTextInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = customTextInput.value.trim();
                if (text) {
                    customAssembledText = text;
                    assembleTextParticles(text, true);
                    createShockwave(innerWidth / 2, innerHeight / 2);
                } else {
                    customAssembledText = null;
                    lastMottoSwitchTime = 0; // Trigger motto resume
                }
            }
        });
    }
}

// Menu Toggle Logic
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');

if (menuBtn && sideMenu) {
    menuBtn.addEventListener('click', () => {
        sideMenu.classList.toggle('active');
        const spans = menuBtn.querySelectorAll('span');
        spans[0].style.transform = sideMenu.classList.contains('active') ? 'rotate(45deg) translate(5px, 6px)' : 'none';
        spans[1].style.opacity = sideMenu.classList.contains('active') ? '0' : '1';
        spans[2].style.transform = sideMenu.classList.contains('active') ? 'rotate(-45deg) translate(5px, -6px)' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!menuBtn.contains(e.target) && !sideMenu.contains(e.target)) {
            sideMenu.classList.remove('active');
            const spans = menuBtn.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Mode Switching Logic
const homeLink = document.getElementById('homeLink');
const matrixLink = document.getElementById('matrixLink');

if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        if (homeLink.getAttribute('href') === '#') {
            e.preventDefault();
        }
        isProjectMode = false;
        document.body.classList.remove('matrix-mode');
        document.documentElement.classList.remove('matrix-mode');
        if (sideMenu) sideMenu.classList.remove('active');
    });
}

if (matrixLink) {
    matrixLink.addEventListener('click', (e) => {
        e.preventDefault();
        isProjectMode = true;
        document.body.classList.add('matrix-mode');
        document.documentElement.classList.add('matrix-mode');
        if (sideMenu) sideMenu.classList.remove('active');
        initMatrixRain();
    });
}

// App Launch
resizeCanvas();
init();
initMatrixRain();
setupHUD();
animate();
