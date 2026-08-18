/**
 * PLC Timer Simulation Engine (IEC 61131-3 Standard Compliant)
 */

export class PLCTimer {
  constructor() {
    this.type = 'TON'; // 'TON', 'TOF', 'TP', 'TONR'
    this.IN = false;
    this.PT = 3000; // Preset Time in ms
    this.ET = 0; // Elapsed Time in ms
    this.Q = false;
    this.RESET = false; // For TONR
    
    // Internal state tracking
    this.prevIN = false;
    this.running = false;
  }

  setType(type) {
    this.type = type;
    this.reset();
  }

  setPT(ptMs) {
    this.PT = Math.max(100, Math.min(60000, ptMs));
  }

  reset() {
    this.ET = 0;
    this.Q = false;
    this.prevIN = this.IN;
    this.running = false;
  }

  /**
   * Execute one PLC scan cycle evaluation
   * @param {number} deltaMs Time elapsed since last scan in simulated ms
   */
  update(deltaMs) {
    const risingEdge = this.IN && !this.prevIN;

    switch (this.type) {
      case 'TON': // On-Delay Timer
        if (this.IN) {
          if (this.ET < this.PT) {
            this.ET = Math.min(this.PT, this.ET + deltaMs);
          }
          this.Q = (this.ET >= this.PT);
        } else {
          this.ET = 0;
          this.Q = false;
        }
        break;

      case 'TOF': // Off-Delay Timer
        if (this.IN) {
          this.ET = 0;
          this.Q = true;
        } else {
          if (this.Q) {
            if (this.ET < this.PT) {
              this.ET = Math.min(this.PT, this.ET + deltaMs);
            }
            if (this.ET >= this.PT) {
              this.Q = false;
            }
          } else {
            this.ET = 0;
          }
        }
        break;

      case 'TP': // Pulse Timer
        if (risingEdge && !this.running) {
          this.running = true;
          this.ET = 0;
          this.Q = true;
        }

        if (this.running) {
          this.ET = Math.min(this.PT, this.ET + deltaMs);
          this.Q = (this.ET < this.PT);
          if (this.ET >= this.PT) {
            if (!this.IN) {
              this.running = false;
              this.ET = 0;
              this.Q = false;
            } else {
              this.Q = false;
            }
          }
        } else {
          if (!this.IN) {
            this.ET = 0;
          }
          this.Q = false;
        }
        break;

      case 'TONR': // Retentive On-Delay Timer
        if (this.RESET) {
          this.ET = 0;
          this.Q = false;
        } else {
          if (this.IN) {
            if (this.ET < this.PT) {
              this.ET = Math.min(this.PT, this.ET + deltaMs);
            }
          }
          this.Q = (this.ET >= this.PT);
        }
        break;
    }

    this.prevIN = this.IN;
  }
}
