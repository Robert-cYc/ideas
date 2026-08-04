// Graycode Converter Page Script
const decimalInput = document.getElementById('decimalInput');
const binaryOutput = document.getElementById('binaryOutput');
const grayOutput = document.getElementById('grayOutput');
const grayDecimalOutput = document.getElementById('grayDecimalOutput');
const bitToggle = document.getElementById('bitToggle');

// Available bit widths
const bitWidths = [4, 8, 16, 32];
let currentBits = 8;

// Convert decimal to binary string with fixed width
function decimalToBinary(decimal, bits) {
    if (decimal === 0) return '0'.repeat(bits);
    let binary = decimal.toString(2);
    if (binary.length > bits) {
        binary = binary.slice(-bits);
    }
    return binary.padStart(bits, '0');
}

// Convert binary string to Gray code
function binaryToGray(binary) {
    let gray = binary[0];
    for (let i = 1; i < binary.length; i++) {
        gray += (parseInt(binary[i]) ^ parseInt(binary[i - 1])).toString();
    }
    return gray;
}

// Convert binary string to decimal
function binaryToDecimal(binary) {
    return parseInt(binary, 2);
}

// Convert decimal to Gray code
function decimalToGray(decimal) {
    const binary = decimalToBinary(decimal, currentBits);
    const gray = binaryToGray(binary);
    const grayDecimal = binaryToDecimal(gray);
    return { binary, gray, grayDecimal };
}

// Update the outputs
function updateOutputs() {
    const value = parseInt(decimalInput.value);

    if (isNaN(value) || value < 0) {
        binaryOutput.value = '';
        grayOutput.value = '';
        grayDecimalOutput.value = '';
        return;
    }

    const result = decimalToGray(value);
    binaryOutput.value = result.binary;
    grayOutput.value = result.gray;
    grayDecimalOutput.value = result.grayDecimal;
}

// Cycle bit width on toggle click
bitToggle.addEventListener('click', () => {
    const currentIndex = bitWidths.indexOf(currentBits);
    currentBits = bitWidths[(currentIndex + 1) % bitWidths.length];
    bitToggle.textContent = currentBits + ' bits';
    updateOutputs();
});

// Listen for input changes
decimalInput.addEventListener('input', updateOutputs);
