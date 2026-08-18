/**
 * Real-time Multi-channel Waveform Oscilloscope
 */

export class WaveformVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.history = []; // Array of { time, IN, Q, ET, PT, RESET }
    this.timeWindowMs = 12000; // Total window time in ms (12 seconds)
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

  clear() {
    this.history = [];
  }

  addSample(sample) {
    this.history.push(sample);
    const cutoffTime = sample.time - this.timeWindowMs - 1000;
    while (this.history.length > 0 && this.history[0].time < cutoffTime) {
      this.history.shift();
    }
  }

  draw(currentTime, showReset = false) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (!w || !h) return;

    // Background
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // Channels configuration
    const channels = [
      { id: 'IN', label: 'IN (Input)', color: '#38bdf8', type: 'digital' },
      { id: 'Q', label: 'Q (Output)', color: '#4ade80', type: 'digital' },
      { id: 'ET', label: 'ET / PT (Time)', color: '#fbbf24', type: 'analog' }
    ];

    if (showReset) {
      channels.splice(2, 0, { id: 'RESET', label: 'RESET (Clear)', color: '#f87171', type: 'digital' });
    }

    const numChannels = channels.length;
    const rowHeight = (h - 30) / numChannels;

    // Grid lines (Time subdivisions)
    const timeStart = currentTime - this.timeWindowMs;
    const gridInterval = 1000; // 1 second intervals
    const firstGridTime = Math.ceil(timeStart / gridInterval) * gridInterval;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    for (let t = firstGridTime; t <= currentTime; t += gridInterval) {
      const x = ((t - timeStart) / this.timeWindowMs) * (w - 110) + 100;
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 20);
      ctx.stroke();

      // Time stamp at bottom
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const sec = (t / 1000).toFixed(0);
      ctx.fillText(`${sec}s`, x, h - 6);
    }

    ctx.setLineDash([]);

    // Channel separator lines & Labels
    channels.forEach((ch, idx) => {
      const topY = 10 + idx * rowHeight;
      const bottomY = topY + rowHeight;

      // Channel background divider
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(100, bottomY);
      ctx.lineTo(w - 10, bottomY);
      ctx.stroke();

      // Channel Badge
      ctx.fillStyle = ch.color;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ch.label, 12, topY + 22);

      // Status indicator subtext
      let latestVal = '-';
      if (this.history.length > 0) {
        const last = this.history[this.history.length - 1];
        if (ch.type === 'digital') {
          latestVal = last[ch.id] ? 'HIGH' : 'LOW';
        } else {
          latestVal = `${(last.ET / 1000).toFixed(2)}s / ${(last.PT / 1000).toFixed(1)}s`;
        }
      }
      ctx.fillStyle = ch.type === 'digital' && latestVal === 'HIGH' ? ch.color : '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(latestVal, 12, topY + 38);
    });

    if (this.history.length < 2) return;

    // Draw signals
    channels.forEach((ch, idx) => {
      const topY = 10 + idx * rowHeight;
      const bottomY = topY + rowHeight - 12;
      const channelH = bottomY - (topY + 12);
      const highY = topY + 14;
      const lowY = bottomY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(100, topY, w - 110, rowHeight);
      ctx.clip();

      ctx.strokeStyle = ch.color;
      ctx.fillStyle = ch.color + '22';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'miter';

      if (ch.type === 'digital') {
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < this.history.length; i++) {
          const sample = this.history[i];
          const x = ((sample.time - timeStart) / this.timeWindowMs) * (w - 110) + 100;
          const val = sample[ch.id];
          const y = val ? highY : lowY;

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            const prevSample = this.history[i - 1];
            const prevX = ((prevSample.time - timeStart) / this.timeWindowMs) * (w - 110) + 100;
            const prevY = prevSample[ch.id] ? highY : lowY;

            if (prevY !== y) {
              ctx.lineTo(x, prevY); // Vertical step
            }
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Area under digital HIGH
        ctx.lineTo(w - 10, lowY);
        ctx.lineTo(100, lowY);
        ctx.closePath();
        ctx.fill();

      } else if (ch.type === 'analog') {
        // PT Threshold reference line
        const ptY = highY + 2;
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(100, ptY);
        ctx.lineTo(w - 10, ptY);
        ctx.stroke();
        
        ctx.fillStyle = '#ef4444';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText('PT Threshold', w - 75, ptY - 3);
        ctx.restore();

        // ET Curve
        ctx.beginPath();
        let started = false;

        for (let i = 0; i < this.history.length; i++) {
          const sample = this.history[i];
          const x = ((sample.time - timeStart) / this.timeWindowMs) * (w - 110) + 100;
          const ratio = Math.min(1.0, sample.PT > 0 ? sample.ET / sample.PT : 0);
          const y = lowY - ratio * (lowY - ptY);

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Fill area under ET curve
        if (this.history.length > 0) {
          const lastSample = this.history[this.history.length - 1];
          const lastX = ((lastSample.time - timeStart) / this.timeWindowMs) * (w - 110) + 100;
          ctx.lineTo(lastX, lowY);
          ctx.lineTo(100, lowY);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    });

    // Current Time cursor line
    const curX = w - 10;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX, 8);
    ctx.lineTo(curX, h - 18);
    ctx.stroke();
  }
}
