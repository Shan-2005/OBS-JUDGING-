/* ==========================================================================
   ROBOFEST 2.0 - PRECISION MILLISECOND STOPWATCH ENGINE
   ========================================================================== */

class PrecisionTimer {
  constructor(displayId) {
    this.displayEl = document.getElementById(displayId);
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timerInterval = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = performance.now() - this.elapsedTime;
    
    const update = () => {
      if (!this.isRunning) return;
      this.elapsedTime = performance.now() - this.startTime;
      this.render();
      this.timerInterval = requestAnimationFrame(update);
    };
    
    this.timerInterval = requestAnimationFrame(update);
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    cancelAnimationFrame(this.timerInterval);
  }

  reset() {
    this.pause();
    this.elapsedTime = 0;
    this.render();
  }

  setTimeMs(ms) {
    this.elapsedTime = ms;
    this.render();
  }

  getTimeMs() {
    return Math.floor(this.elapsedTime);
  }

  render() {
    if (!this.displayEl) return;
    this.displayEl.textContent = formatMsToDisplay(this.elapsedTime);
  }
}

function formatMsToDisplay(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const milli = Math.floor(ms % 1000);

  const mm = String(min).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  const mmm = String(milli).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}

function formatSecondsToDisplay(totalSecs) {
  const min = Math.floor(totalSecs / 60);
  const sec = (totalSecs % 60).toFixed(2);
  const mm = String(min).padStart(2, '0');
  const ss = String(sec).padStart(5, '0');
  return `${mm}:${ss}`;
}
