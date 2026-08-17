// Enhanced Graycode Converter Logic with Bidirectional Conversion & Bit Flippers
const primaryInput = document.getElementById('primaryInput');
const inputLabel = document.getElementById('inputLabel');
const binaryOutput = document.getElementById('binaryOutput');
const grayOutput = document.getElementById('grayOutput');
const grayDecimalOutput = document.getElementById('grayDecimalOutput');
const bitToggle = document.getElementById('bitToggle');
const bitFlippersContainer = document.getElementById('bitFlippers');
const sequenceTableBody = document.getElementById('sequenceTableBody');

const bitWidths = [4, 8, 16, 32];
let currentBits = 8;
let currentMode = 'dec'; // 'dec' | 'bin' | 'gray'
let currentDecimalValue = 0;

// Set Conversion Mode
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    
    // Set active tab
    const tabs = document.querySelectorAll('.mode-tab');
    if (mode === 'dec' && tabs[0]) tabs[0].classList.add('active');
    if (mode === 'bin' && tabs[1]) tabs[1].classList.add('active');
    if (mode === 'gray' && tabs[2]) tabs[2].classList.add('active');

    if (mode === 'dec') {
        inputLabel.textContent = 'Decimal Number';
        primaryInput.placeholder = 'Enter a decimal number (e.g. 42)...';
        primaryInput.value = currentDecimalValue !== null ? currentDecimalValue : '';
    } else if (mode === 'bin') {
        inputLabel.textContent = 'Binary String';
        primaryInput.placeholder = 'Enter binary (e.g. 00101010)...';
        primaryInput.value = decimalToBinary(currentDecimalValue, currentBits);
    } else if (mode === 'gray') {
        inputLabel.textContent = 'Gray Code String';
        primaryInput.placeholder = 'Enter gray code (e.g. 00111111)...';
        primaryInput.value = binaryToGray(decimalToBinary(currentDecimalValue, currentBits));
    }
    updateAll();
}

// Convert Decimal to Binary String
function decimalToBinary(decimal, bits) {
    if (decimal === 0 || isNaN(decimal)) return '0'.repeat(bits);
    let binary = (decimal >>> 0).toString(2);
    if (binary.length > bits) {
        binary = binary.slice(-bits);
    }
    return binary.padStart(bits, '0');
}

// Binary -> Gray
function binaryToGray(binary) {
    if (!binary) return '';
    let gray = binary[0];
    for (let i = 1; i < binary.length; i++) {
        gray += (parseInt(binary[i]) ^ parseInt(binary[i - 1])).toString();
    }
    return gray;
}

// Gray -> Binary
function grayToBinary(gray) {
    if (!gray) return '';
    let binary = gray[0];
    for (let i = 1; i < gray.length; i++) {
        binary += (parseInt(binary[i - 1]) ^ parseInt(gray[i])).toString();
    }
    return binary;
}

// Binary -> Decimal
function binaryToDecimal(binary) {
    if (!binary) return 0;
    return parseInt(binary, 2) || 0;
}

// Core Update
function updateAll() {
    const raw = primaryInput.value.trim();

    if (!raw && raw !== '0') {
        binaryOutput.value = '';
        grayOutput.value = '';
        grayDecimalOutput.value = '';
        currentDecimalValue = 0;
        renderBitFlippers('0'.repeat(currentBits));
        highlightTable(null);
        return;
    }

    let bin = '';
    let dec = 0;

    if (currentMode === 'dec') {
        dec = parseInt(raw, 10);
        if (isNaN(dec) || dec < 0) return;
        bin = decimalToBinary(dec, currentBits);
    } else if (currentMode === 'bin') {
        if (!/^[01]+$/.test(raw)) return;
        dec = parseInt(raw, 2);
        bin = decimalToBinary(dec, currentBits);
    } else if (currentMode === 'gray') {
        if (!/^[01]+$/.test(raw)) return;
        bin = grayToBinary(raw.padStart(currentBits, '0'));
        dec = binaryToDecimal(bin);
    }

    currentDecimalValue = dec;
    const gray = binaryToGray(bin);
    const grayDec = binaryToDecimal(gray);

    binaryOutput.value = bin;
    grayOutput.value = gray;
    grayDecimalOutput.value = grayDec;

    renderBitFlippers(bin);
    highlightTable(dec);
}

// Render Interactive LED Bit Buttons
function renderBitFlippers(binaryStr) {
    if (!bitFlippersContainer) return;
    const padded = binaryStr.padStart(currentBits, '0');

    bitFlippersContainer.innerHTML = padded.split('').map((bit, idx) => {
        const bitPos = currentBits - 1 - idx;
        const isActive = bit === '1';
        return `
            <div class="bit-btn ${isActive ? 'active' : ''}" onclick="toggleBit(${bitPos})" title="Toggle Bit 2^${bitPos}">
                <span class="bit-val">${bit}</span>
                <span class="bit-pos">b${bitPos}</span>
            </div>
        `;
    }).join('');
}

// Toggle individual bit
function toggleBit(pos) {
    const mask = 1 << pos;
    currentDecimalValue = (currentDecimalValue ^ mask) >>> 0;

    if (currentMode === 'dec') {
        primaryInput.value = currentDecimalValue;
    } else if (currentMode === 'bin') {
        primaryInput.value = decimalToBinary(currentDecimalValue, currentBits);
    } else if (currentMode === 'gray') {
        primaryInput.value = binaryToGray(decimalToBinary(currentDecimalValue, currentBits));
    }
    updateAll();
}

// Render Truth Table
function buildTruthTable() {
    if (!sequenceTableBody) return;
    let html = '';
    for (let i = 0; i <= 15; i++) {
        const bin = decimalToBinary(i, 4);
        const gray = binaryToGray(bin);
        let diff = '-';
        if (i > 0) {
            const prevGray = binaryToGray(decimalToBinary(i - 1, 4));
            for (let b = 0; b < 4; b++) {
                if (gray[b] !== prevGray[b]) {
                    diff = `Bit ${3 - b}`;
                    break;
                }
            }
        }
        html += `
            <tr id="row-${i}">
                <td style="color: #38bdf8; font-weight: 600;">${i}</td>
                <td>${bin}</td>
                <td style="color: #4ade80;">${gray}</td>
                <td style="color: #94a3b8;">${diff}</td>
            </tr>
        `;
    }
    sequenceTableBody.innerHTML = html;
}

function highlightTable(dec) {
    document.querySelectorAll('#sequenceTableBody tr').forEach(r => r.classList.remove('highlight'));
    if (dec !== null && dec >= 0 && dec <= 15) {
        const target = document.getElementById(`row-${dec}`);
        if (target) {
            target.classList.add('highlight');
            target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}

// Copy Helper
function copyValue(elementId) {
    const el = document.getElementById(elementId);
    if (!el || !el.value) return;
    navigator.clipboard.writeText(el.value).then(() => {
        showToast(`Copied ${el.value}`);
    });
}

function copyTable() {
    let text = "Decimal\tBinary\tGrayCode\n";
    for (let i = 0; i <= 15; i++) {
        text += `${i}\t${decimalToBinary(i, 4)}\t${binaryToGray(decimalToBinary(i, 4))}\n`;
    }
    navigator.clipboard.writeText(text).then(() => {
        showToast("Truth table copied!");
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Bit width cycling
bitToggle.addEventListener('click', () => {
    const idx = bitWidths.indexOf(currentBits);
    currentBits = bitWidths[(idx + 1) % bitWidths.length];
    bitToggle.textContent = `${currentBits} bits`;
    updateAll();
});

// Primary Input listener
primaryInput.addEventListener('input', updateAll);

// Init
buildTruthTable();
primaryInput.value = "42";
updateAll();
