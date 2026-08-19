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

function toggleManualTimeEdit(round) {
  const toggle = document.getElementById(`${round}-manual-toggle`);
  const inputsDiv = document.getElementById(`${round}-manual-inputs`);
  const btnStart = document.getElementById(`${round}-btn-start`);
  const btnPause = document.getElementById(`${round}-btn-pause`);

  if (!toggle || !inputsDiv) return;

  const isEnabled = toggle.checked;
  if (isEnabled) {
    inputsDiv.classList.remove('hidden');
    inputsDiv.style.display = 'flex';

    const timerObj = round === 'r1' ? r1Timer : r2Timer;
    if (timerObj && timerObj.isRunning) {
      timerObj.pause();
    }

    if (btnStart) btnStart.disabled = true;
    if (btnPause) btnPause.disabled = true;

    const currentMs = timerObj ? timerObj.getTimeMs() : 0;
    const totalSec = Math.floor(currentMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const ms = Math.floor(currentMs % 1000);

    const minInp = document.getElementById(`${round}-manual-min`);
    const secInp = document.getElementById(`${round}-manual-sec`);
    const msInp = document.getElementById(`${round}-manual-ms`);

    if (minInp && !minInp.value) minInp.value = min;
    if (secInp && !secInp.value) secInp.value = sec;
    if (msInp && !msInp.value) msInp.value = ms;

    handleManualTimeInput(round);
  } else {
    inputsDiv.classList.add('hidden');
    inputsDiv.style.display = 'none';

    if (btnStart) btnStart.disabled = false;
    if (btnPause) btnPause.disabled = true;

    if (typeof updateScoreSummary === 'function') {
      updateScoreSummary(round);
    }
  }
}

function handleManualTimeInput(round) {
  const min = parseInt(document.getElementById(`${round}-manual-min`)?.value || 0, 10);
  const sec = parseInt(document.getElementById(`${round}-manual-sec`)?.value || 0, 10);
  const ms = parseInt(document.getElementById(`${round}-manual-ms`)?.value || 0, 10);

  const rawMs = (min * 60 * 1000) + (sec * 1000) + ms;
  const timerObj = round === 'r1' ? r1Timer : r2Timer;

  if (timerObj) {
    timerObj.setTimeMs(rawMs);
  }

  if (typeof updateScoreSummary === 'function') {
    updateScoreSummary(round);
  }
}
