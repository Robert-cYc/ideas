/**
 * Dynamic PLC Ladder Logic & Function Block Visualizer
 */

export class LadderVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(timer) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (!w || !h) return;

    ctx.clearRect(0, 0, w, h);

    // Power Rail left & right
    const railX1 = 30;
    const railX2 = w - 30;
    const midY = h / 2;

    // Left rail is always HOT (24VDC/Live)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(railX1, 20);
    ctx.lineTo(railX1, h - 20);
    ctx.stroke();

    // Right rail (Neutral/0V)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(railX2, 20);
    ctx.lineTo(railX2, h - 20);
    ctx.stroke();

    // Labels for rails
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('+24V', railX1, 14);

    ctx.fillStyle = '#64748b';
    ctx.fillText('0V', railX2, 14);

    // Input Contact position
    const contactX = 110;
    const contactW = 24;

    // Line from left rail to contact
    ctx.strokeStyle = '#38bdf8'; // Hot wire
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(railX1, midY);
    ctx.lineTo(contactX - contactW / 2, midY);
    ctx.stroke();

    // Contact Symbols (Normally Open contact: | | )
    const contactActive = timer.IN;
    ctx.strokeStyle = contactActive ? '#4ade80' : '#94a3b8';
    ctx.lineWidth = 3;

    // Left plate
    ctx.beginPath();
    ctx.moveTo(contactX - contactW / 2, midY - 14);
    ctx.lineTo(contactX - contactW / 2, midY + 14);
    ctx.stroke();

    // Right plate
    ctx.beginPath();
    ctx.moveTo(contactX + contactW / 2, midY - 14);
    ctx.lineTo(contactX + contactW / 2, midY + 14);
    ctx.stroke();

    if (contactActive) {
      // Connect line through contact when closed
      ctx.strokeStyle = '#4ade80';
      ctx.beginPath();
      ctx.moveTo(contactX - contactW / 2, midY);
      ctx.lineTo(contactX + contactW / 2, midY);
      ctx.stroke();
    }

    // Contact Tag
    ctx.fillStyle = contactActive ? '#4ade80' : '#e2e8f0';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('IN', contactX, midY - 20);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(timer.IN ? '(TRUE)' : '(FALSE)', contactX, midY + 28);

    // Function Block Box
    const boxW = 160;
    const boxH = 140;
    const boxX = w / 2 - boxW / 2;
    const boxY = midY - boxH / 2;

    // Line from Contact to Block IN port
    const inWireHot = timer.IN;
    ctx.strokeStyle = inWireHot ? '#4ade80' : '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(contactX + contactW / 2, midY);
    ctx.lineTo(boxX, midY);
    ctx.stroke();

    // Render IEC Function Block Box
    const blockGradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
    blockGradient.addColorStop(0, '#1e293b');
    blockGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = blockGradient;
    ctx.strokeStyle = timer.Q ? '#4ade80' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();

    // Block Title Header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timer.type, boxX + boxW / 2, boxY + 24);

    // Inner details / timer instance name
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('IEC 61131-3 TIMER', boxX + boxW / 2, boxY + 38);

    // Block Ports Labels
    ctx.textAlign = 'left';
    ctx.fillStyle = inWireHot ? '#4ade80' : '#94a3b8';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('IN', boxX + 10, midY + 4);

    // PT parameter inside block
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`PT: ${(timer.PT / 1000).toFixed(1)}s`, boxX + 10, boxY + 80);

    // ET parameter inside block
    ctx.fillStyle = timer.ET > 0 ? '#fbbf24' : '#94a3b8';
    ctx.fillText(`ET: ${(timer.ET / 1000).toFixed(2)}s`, boxX + 10, boxY + 98);

    // Output Port Q
    ctx.textAlign = 'right';
    ctx.fillStyle = timer.Q ? '#4ade80' : '#94a3b8';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillText('Q', boxX + boxW - 10, midY + 4);

    // Output Wire from Block Q to Coil
    const coilX = railX2 - 70;
    const qActive = timer.Q;
    ctx.strokeStyle = qActive ? '#4ade80' : '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(boxX + boxW, midY);
    ctx.lineTo(coilX - 16, midY);
    ctx.stroke();

    // Output Coil (-( )- style)
    const coilR = 14;
    ctx.strokeStyle = qActive ? '#4ade80' : '#94a3b8';
    ctx.lineWidth = 2.5;

    // Left arc (
    ctx.beginPath();
    ctx.arc(coilX - 6, midY, coilR, Math.PI * 1.5, Math.PI * 0.5, true);
    ctx.stroke();

    // Right arc )
    ctx.beginPath();
    ctx.arc(coilX + 6, midY, coilR, Math.PI * 1.5, Math.PI * 0.5, false);
    ctx.stroke();

    if (qActive) {
      // Glow coil fill
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.beginPath();
      ctx.arc(coilX, midY, coilR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coil Tag
    ctx.fillStyle = qActive ? '#4ade80' : '#e2e8f0';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('OUT_Q', coilX, midY - 20);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(qActive ? '(ENERGIZED)' : '(OFF)', coilX, midY + 28);

    // Line from Coil to Right Rail
    ctx.strokeStyle = qActive ? '#4ade80' : '#475569';
    ctx.beginPath();
    ctx.moveTo(coilX + 16, midY);
    ctx.lineTo(railX2, midY);
    ctx.stroke();

    // Progress bar inside block bottom
    const progressW = boxW - 20;
    const progressH = 6;
    const progressX = boxX + 10;
    const progressY = boxY + boxH - 16;
    const ratio = Math.min(1.0, timer.PT > 0 ? timer.ET / timer.PT : 0);

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(progressX, progressY, progressW, progressH, 3);
    ctx.fill();

    if (ratio > 0) {
      ctx.fillStyle = ratio >= 1.0 ? '#4ade80' : '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(progressX, progressY, progressW * ratio, progressH, 3);
      ctx.fill();
    }
  }
}
