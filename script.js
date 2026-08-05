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
    initMatrixRain();
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
        // Use random index for true randomness
        currentMottoIndex = Math.floor(Math.random() * mottos.length);
        const currentMotto = mottos[currentMottoIndex];

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
            z: Math.random() * 0.7 + 0.3, // Depth: 0.3 (far) to 1.0 (near)
            speed: Math.random() * 2 + 0.5,
            charIndex: Math.floor(Math.random() * matrixChars.length),
            trailLength: Math.floor(Math.random() * 3) + 2
        });
    }
}

function handleMatrixRain() {
    // Semi-transparent dark green fill creates fade trail effect
    ctx.fillStyle = 'rgba(0, 10, 0, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    for (let i = 0; i < matrixColumns.length; i++) {
        const col = matrixColumns[i];
        const z = col.z;
        const fontSize = Math.max(12, Math.floor(matrixFontSize * z));
        ctx.font = `${fontSize}px monospace`;

        // Head of the drop — bright green, brighter/faster when closer
        const brightness = 0.4 + z * 0.6;
        ctx.globalAlpha = brightness;
        ctx.fillStyle = '#00ff88';
        ctx.fillText(matrixChars[col.charIndex], col.x, col.y);

        // Trail — dimmer with decreasing opacity
        for (let t = 1; t <= col.trailLength; t++) {
            const opacity = Math.max(0, (0.5 - (t * 0.15)) * z);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#00ff88';
            ctx.fillText(matrixChars[(col.charIndex + t) % matrixChars.length], col.x, col.y - t * fontSize);
        }

        ctx.globalAlpha = 1;

        // Cycle character each frame for animation
        col.charIndex = (col.charIndex + 1) % matrixChars.length;

        col.y += col.speed * z;

        // Reset to top when off-screen
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
        // Matrix mode: green fade-trail background
        handleMatrixRain();
    } else {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connect();
        handleMottoParticles();
    }

    handleTimeParticles();
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
initMatrixRain();
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
const matrixLink = document.getElementById('matrixLink');

homeLink.addEventListener('click', (e) => {
    // Only prevent default if href is # (stay on same page)
    // If href points to another page, allow navigation
    if (homeLink.getAttribute('href') === '#') {
        e.preventDefault();
    }
    isProjectMode = false;
    document.body.classList.remove('matrix-mode');
    document.documentElement.classList.remove('matrix-mode');
    sideMenu.classList.remove('active');
});

matrixLink.addEventListener('click', (e) => {
    e.preventDefault();
    isProjectMode = true;
    document.body.classList.add('matrix-mode');
    document.documentElement.classList.add('matrix-mode');
    sideMenu.classList.remove('active');
    initMatrixRain();
});

const aiNewsLink = document.getElementById('aiNewsLink');
if (aiNewsLink) {
    aiNewsLink.addEventListener('click', () => {
        isProjectMode = false;
        document.body.classList.remove('matrix-mode');
        document.documentElement.classList.remove('matrix-mode');
        sideMenu.classList.remove('active');
    });
}

const graycodeLink = document.getElementById('graycodeLink');
if (graycodeLink) {
    graycodeLink.addEventListener('click', () => {
        isProjectMode = false;
        document.body.classList.remove('matrix-mode');
        document.documentElement.classList.remove('matrix-mode');
        sideMenu.classList.remove('active');
    });
}



const openrouterLink = document.getElementById("openrouterLink");
if (openrouterLink) {
    openrouterLink.addEventListener("click", () => {
        isProjectMode = false;
        document.body.classList.remove("matrix-mode");
        document.documentElement.classList.remove("matrix-mode");
        sideMenu.classList.remove("active");
    });
}
