/**
 * DeviceTrainingView.jsx — Device Training: a bedside patient-monitor / defibrillator / pacer
 * simulator for clinical training, inspired by Infirmary Integrated
 * (https://github.com/tanjera/infirmary-integrated). That project is a compiled C#/.NET desktop
 * application (Avalonia) with no npm package, web component, or browser-runnable build — unlike
 * DeckDeckGo/Excalidraw there is no real code from it that can run inside this React app. Every
 * piece here — the ECG/SpO2/respiration waveform synthesis engine, the 16 clinical rhythm models,
 * the defibrillator/pacer physiology, and the alarm system — is original code, built to match
 * Infirmary Integrated's training feature set and the visual language of a real bedside monitor.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfileMenu, authHeaders } from './feedShared';
import { LogoDeviceTraining } from './icons';

const DT_CSS = `
:root {
  --dt-bg: #FFFFFF;
  --dt-surface: #F7F5FA;
  --dt-ink: #1A1B2E;
  --dt-muted: #757892;
  --dt-border: #E7E5F0;
  --dt-accent: #E1306C;
  --dt-accent-deep: #B91C56;
  --dt-accent-soft: #FCE7EF;
}
.dt-scroll { flex: 1; overflow-y: auto; background: var(--dt-bg); }
.dt-btn-primary { background: var(--dt-accent); color: #fff; border: none; border-radius: 10px; padding: 10px 18px; font-size: 0.86rem; font-weight: 700; cursor: pointer; transition: background 0.15s ease; display: inline-flex; align-items: center; gap: 8px; font-family: 'Inter', sans-serif; }
.dt-btn-primary:hover { background: var(--dt-accent-deep); }
.dt-btn-primary:disabled { background: #EFC9D8; color: #fff; cursor: not-allowed; }
.dt-btn-outline { background: #fff; color: var(--dt-ink); border: 1px solid var(--dt-border); border-radius: 10px; padding: 10px 18px; font-size: 0.86rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; font-family: 'Inter', sans-serif; }
.dt-btn-outline:hover { background: var(--dt-surface); border-color: #D8D4E8; }
.dt-card { background: #fff; border-radius: 14px; padding: 18px; border: 1px solid var(--dt-border); transition: box-shadow 0.15s ease, border-color 0.15s ease; }
.dt-card:hover { box-shadow: 0 6px 20px -10px rgba(26,27,46,0.18); border-color: #D8D4E8; }
.dt-tab { background: none; border: none; padding: 10px 16px; font-size: 0.82rem; font-weight: 700; color: var(--dt-muted); cursor: pointer; border-bottom: 2px solid transparent; font-family: 'Inter', sans-serif; }
.dt-tab.active { color: var(--dt-accent); border-bottom-color: var(--dt-accent); }
.dt-field-label { display: block; font-weight: 600; font-size: 0.72rem; color: var(--dt-muted); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.03em; }
.dt-field-input { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--dt-border); font-size: 0.85rem; font-family: 'Inter', sans-serif; outline: none; }
.dt-field-input:focus { border-color: var(--dt-accent); }
.dt-numeric { font-family: 'Space Mono', 'Courier New', monospace; font-weight: 700; }
@keyframes dt-flash { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.dt-alarm-flash { animation: dt-flash 0.9s ease-in-out infinite; }
`;

// =====================================================================
// Waveform synthesis engine — pure functions, no React. Everything is generated from parametric
// math (sums of Gaussians for P/Q/R/S/T deflections, summed slowly-modulated sine waves for
// chaotic VF), not sampled or copied from any real device or dataset.
// =====================================================================
function gaussian(t, center, width, amp) {
  const d = (t - center) / width;
  return amp * Math.exp(-0.5 * d * d);
}

const BEAT_NARROW = { hasQ: true, qOffset: -0.02, qWidth: 0.008, qAmp: -0.08, rWidth: 0.012, rAmp: 1.0, hasS: true, sOffset: 0.025, sWidth: 0.012, sAmp: -0.22, hasT: true, tOffset: 0.20, tWidth: 0.07, tAmp: 0.28 };
const BEAT_WIDE = { hasQ: false, rWidth: 0.045, rAmp: 1.05, hasS: true, sOffset: 0.08, sWidth: 0.045, sAmp: -0.55, hasT: true, tOffset: 0.28, tWidth: 0.10, tAmp: -0.30 };

function qrsTTemplate(t, tpl) {
  let y = 0;
  if (tpl.hasQ) y += gaussian(t, tpl.qOffset, tpl.qWidth, tpl.qAmp);
  y += gaussian(t, 0, tpl.rWidth, tpl.rAmp);
  if (tpl.hasS) y += gaussian(t, tpl.sOffset, tpl.sWidth, tpl.sAmp);
  if (tpl.hasT) y += gaussian(t, tpl.tOffset, tpl.tWidth, tpl.tAmp);
  return y;
}

const RHYTHMS = [
  { id: 'nsr', label: 'Normaler Sinusrhythmus', hrRange: [60, 100] },
  { id: 'sinus_tach', label: 'Sinustachykardie', hrRange: [100, 150] },
  { id: 'sinus_brady', label: 'Sinusbradykardie', hrRange: [40, 59] },
  { id: 'afib', label: 'Vorhofflimmern', hrRange: [60, 150] },
  { id: 'aflutter', label: 'Vorhofflattern', hrRange: [75, 150] },
  { id: 'svt', label: 'Supraventrikuläre Tachykardie (SVT)', hrRange: [150, 220] },
  { id: 'junctional', label: 'Junktionaler Rhythmus', hrRange: [40, 60] },
  { id: 'avblock1', label: 'AV-Block I. Grades', hrRange: [60, 100] },
  { id: 'avblock2t1', label: 'AV-Block II. Grades (Wenckebach)', hrRange: [50, 90] },
  { id: 'avblock3', label: 'AV-Block III. Grades (komplett)', hrRange: [30, 50] },
  { id: 'pvc', label: 'Sinusrhythmus mit ventrikulären Extrasystolen (VES)', hrRange: [60, 100] },
  { id: 'paced', label: 'Schrittmacherrhythmus', hrRange: [60, 100] },
  { id: 'vtach', label: 'Ventrikuläre Tachykardie (mit Puls)', hrRange: [100, 200] },
  { id: 'vtach_pulseless', label: 'Ventrikuläre Tachykardie (pulslos)', hrRange: [150, 250], noPulse: true, shockable: true },
  { id: 'vfib', label: 'Kammerflimmern', hrRange: [0, 0], noPulse: true, continuous: true, shockable: true },
  { id: 'asystole', label: 'Asystolie', hrRange: [0, 0], noPulse: true, continuous: true },
  { id: 'pea', label: 'Pulslose elektrische Aktivität (PEA)', hrRange: [40, 100], noPulse: true },
];
const RHYTHM_MAP = Object.fromEntries(RHYTHMS.map(r => [r.id, r]));
const SHOCKABLE = new Set(['vfib', 'vtach_pulseless']);
const CARDIOVERTIBLE = new Set(['afib', 'aflutter', 'svt', 'vtach']);
const PACING_INDICATED = new Set(['sinus_brady', 'avblock2t1', 'avblock3', 'junctional', 'asystole']);

function fibrillatoryNoise(t) { return 0.05 * Math.sin(t * 2 * Math.PI * 7.3) + 0.03 * Math.sin(t * 2 * Math.PI * 11.7 + 1.2); }
function flutterSawtooth(t) { const phase = (t * 4.5) % 1; return 0.14 * (4 * Math.abs(phase - 0.5) - 1); }
function vfibSample(t) {
  const f1 = 4 + 2 * Math.sin(t * 0.7), f2 = 7 + 3 * Math.sin(t * 0.31 + 1), f3 = 11 + 4 * Math.sin(t * 0.53 + 2.1);
  return 0.5 * Math.sin(t * 2 * Math.PI * f1) + 0.3 * Math.sin(t * 2 * Math.PI * f2 + 0.5) + 0.2 * Math.sin(t * 2 * Math.PI * f3 + 1.3);
}
function asystoleSample(t) { return 0.02 * Math.sin(t * 13.7) * Math.sin(t * 0.3); }

function trimQueues(engine, targetTime) {
  const cutoff = targetTime - 8;
  engine.qrsQueue = engine.qrsQueue.filter(b => b.time > cutoff);
  engine.pQueue = engine.pQueue.filter(b => b.time > cutoff);
}

function fillRegular(engine, targetTime, opts) {
  const rrBase = 60 / Math.max(1, engine.hrBpm);
  while (engine.lastQrsTime < targetTime) {
    const jitter = opts.jitter ? (Math.random() * 2 - 1) * opts.jitter : 0;
    engine.lastQrsTime += Math.max(0.25, rrBase + jitter);
    engine.qrsQueue.push({ time: engine.lastQrsTime, template: opts.wide ? BEAT_WIDE : BEAT_NARROW, paced: !!opts.paced });
    if (!opts.noP) engine.pQueue.push({ time: engine.lastQrsTime - (opts.pr || 0.16) });
  }
  trimQueues(engine, targetTime);
}
function fillIrregular(engine, targetTime) {
  const rrBase = 60 / Math.max(1, engine.hrBpm);
  while (engine.lastQrsTime < targetTime) {
    const jitter = (Math.random() * 2 - 1) * rrBase * 0.35;
    engine.lastQrsTime += Math.max(0.28, rrBase + jitter);
    engine.qrsQueue.push({ time: engine.lastQrsTime, template: BEAT_NARROW });
  }
  engine.fibrillatoryBaseline = true;
  trimQueues(engine, targetTime);
}
function fillWithPVCs(engine, targetTime) {
  const rrBase = 60 / Math.max(1, engine.hrBpm);
  while (engine.lastQrsTime < targetTime) {
    engine.pvcCounter = (engine.pvcCounter || 0) + 1;
    const isPvc = !engine.pvcPause && engine.pvcCounter % (6 + Math.floor(Math.random() * 3)) === 0;
    let rr;
    if (isPvc) { rr = rrBase * 0.65; engine.pvcPause = true; }
    else if (engine.pvcPause) { rr = rrBase * 1.35; engine.pvcPause = false; }
    else rr = rrBase + (Math.random() * 2 - 1) * 0.02;
    engine.lastQrsTime += rr;
    if (isPvc) engine.qrsQueue.push({ time: engine.lastQrsTime, template: BEAT_WIDE });
    else {
      engine.qrsQueue.push({ time: engine.lastQrsTime, template: BEAT_NARROW });
      engine.pQueue.push({ time: engine.lastQrsTime - 0.16 });
    }
  }
  trimQueues(engine, targetTime);
}
function fillWenckebach(engine, targetTime) {
  const rrBase = 60 / Math.max(1, engine.hrBpm);
  const prSteps = [0.16, 0.22, 0.28, 0.34];
  if (engine.lastPTime === undefined) engine.lastPTime = engine.lastQrsTime;
  while (engine.lastPTime < targetTime) {
    engine.wenckStep = engine.wenckStep || 0;
    const step = engine.wenckStep % (prSteps.length + 1);
    engine.lastPTime += rrBase;
    engine.pQueue.push({ time: engine.lastPTime });
    if (step < prSteps.length) {
      const qrsTime = engine.lastPTime + prSteps[step];
      engine.qrsQueue.push({ time: qrsTime, template: BEAT_NARROW });
      engine.lastQrsTime = qrsTime;
    }
    engine.wenckStep++;
  }
  trimQueues(engine, targetTime);
}
function fillCompleteBlock(engine, targetTime) {
  const atrialRR = 60 / 90, escapeRR = 60 / 35;
  if (engine.lastPTime === undefined) engine.lastPTime = 0;
  while (engine.lastPTime < targetTime) { engine.lastPTime += atrialRR; engine.pQueue.push({ time: engine.lastPTime }); }
  while (engine.lastQrsTime < targetTime) { engine.lastQrsTime += escapeRR; engine.qrsQueue.push({ time: engine.lastQrsTime, template: BEAT_WIDE }); }
  trimQueues(engine, targetTime);
}

function refillQueues(engine, targetTime) {
  switch (engine.rhythmId) {
    case 'nsr': case 'sinus_tach': case 'sinus_brady':
      fillRegular(engine, targetTime, { pr: 0.16, jitter: 0.02 }); break;
    case 'avblock1':
      fillRegular(engine, targetTime, { pr: 0.28, jitter: 0.02 }); break;
    case 'afib':
      fillIrregular(engine, targetTime); break;
    case 'aflutter':
      fillRegular(engine, targetTime, { pr: 0, noP: true, jitter: 0.01 }); engine.flutterBaseline = true; break;
    case 'svt':
      fillRegular(engine, targetTime, { pr: 0, noP: true, jitter: 0.005 }); break;
    case 'junctional':
      fillRegular(engine, targetTime, { pr: 0, noP: true, jitter: 0.02 }); break;
    case 'vtach': case 'vtach_pulseless':
      fillRegular(engine, targetTime, { pr: 0, noP: true, wide: true, jitter: 0.01 }); break;
    case 'pea':
      fillRegular(engine, targetTime, { pr: 0.16, jitter: 0.03 }); break;
    case 'paced':
      fillRegular(engine, targetTime, { pr: 0, noP: true, wide: true, jitter: 0.002, paced: true }); break;
    case 'pvc':
      fillWithPVCs(engine, targetTime); break;
    case 'avblock2t1':
      fillWenckebach(engine, targetTime); break;
    case 'avblock3':
      fillCompleteBlock(engine, targetTime); break;
    default: break;
  }
}

function sampleEcg(t, engine) {
  if (engine.rhythmId === 'vfib') return vfibSample(t);
  if (engine.rhythmId === 'asystole') return asystoleSample(t);
  let y = 0;
  if (engine.fibrillatoryBaseline) y += fibrillatoryNoise(t);
  if (engine.flutterBaseline) y += flutterSawtooth(t);
  for (const p of engine.pQueue) { const dt = t - p.time; if (dt > -0.1 && dt < 0.15) y += gaussian(dt, 0, 0.03, 0.14); }
  for (const q of engine.qrsQueue) {
    const dt = t - q.time;
    if (dt > -0.5 && dt < 0.5) {
      if (q.paced && dt > -0.07 && dt < -0.01) y += 0.9 * Math.exp(-Math.abs(dt + 0.04) * 80);
      y += qrsTTemplate(dt, q.template);
    }
  }
  return y;
}
function samplePleth(t, engine) {
  if (engine.noPulse) return 0;
  let y = 0;
  for (const q of engine.qrsQueue) {
    const dt = t - q.time - 0.18;
    if (dt > -0.1 && dt < 0.6) { y += gaussian(dt, 0.03, 0.05, 1.0); y += gaussian(dt, 0.28, 0.09, 0.35); }
  }
  return y;
}
function sampleResp(t, engine) { return Math.sin(t * 2 * Math.PI * (Math.max(1, engine.rrBpm) / 60)) * 0.8; }

function createEngine(rhythmId, hrBpm, rrBpm) {
  return {
    rhythmId, hrBpm, rrBpm, time: 0, lastFillTime: 0,
    qrsQueue: [], pQueue: [], lastQrsTime: 0, lastPTime: undefined,
    fibrillatoryBaseline: false, flutterBaseline: false,
    noPulse: !!RHYTHM_MAP[rhythmId]?.noPulse,
    pvcCounter: 0, pvcPause: false, wenckStep: 0,
    lastAudioTime: 0, soundOn: false, audioCtx: null,
    displayHr: hrBpm,
    postShockPauseUntil: 0,
  };
}

function playBeep(ctx, freq, duration, volume) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.value = volume;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration + 0.02);
}

// =====================================================================
// Canvas trace renderer — a "sweeping" scroll with an erase gap, like a real monitor.
// =====================================================================
function renderTrace(canvas, buffer, headPx, color, midYFrac, scaleFrac) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const gap = Math.max(6, Math.round(w * 0.01));
  ctx.clearRect(0, 0, w, h);
  const midY = h * midYFrac, scale = h * scaleFrac;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.4, w / 700);
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let moved = false;
  for (let i = 0; i < w - gap; i++) {
    const px = (headPx + gap + i) % w;
    const y = midY - (buffer[px] || 0) * scale;
    if (!moved || px === 0) { ctx.moveTo(px, y); moved = true; } else ctx.lineTo(px, y);
  }
  ctx.stroke();
}

function MonitorTraces({ engineRef, containerRef }) {
  const ecgCanvasRef = useRef(null);
  const plethCanvasRef = useRef(null);
  const respCanvasRef = useRef(null);
  const bufRef = useRef({ ecg: null, pleth: null, resp: null, width: 0, headPx: 0 });

  useEffect(() => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const setupCanvases = () => {
      const el = containerRef.current;
      if (!el) return;
      const width = Math.max(200, Math.floor(el.clientWidth));
      [ecgCanvasRef, plethCanvasRef, respCanvasRef].forEach(ref => {
        if (!ref.current) return;
        const cssH = ref.current.clientHeight;
        ref.current.width = Math.floor(width * dpr);
        ref.current.height = Math.floor(cssH * dpr);
      });
      const pxW = Math.floor(width * dpr);
      bufRef.current = { ecg: new Float32Array(pxW), pleth: new Float32Array(pxW), resp: new Float32Array(pxW), width: pxW, headPx: 0 };
      engineRef.current.pxPerSec = pxW / 6; // 6-second sweep window
    };
    setupCanvases();
    const ro = new ResizeObserver(setupCanvases);
    if (containerRef.current) ro.observe(containerRef.current);

    let raf;
    let running = true;
    const loop = () => {
      if (!running) return;
      const engine = engineRef.current;
      const buf = bufRef.current;
      if (engine && buf.width) {
        engine.time = performance.now() / 1000;
        if (!engine.startedAt) engine.startedAt = engine.time;
        const localT = engine.time - engine.startedAt;
        refillQueues(engine, localT + 2);

        const pxPerSec = engine.pxPerSec;
        const stepsAvail = Math.floor((localT - engine.lastFillTime) * pxPerSec);
        const steps = Math.min(stepsAvail, buf.width);
        for (let i = 1; i <= steps; i++) {
          const px = (buf.headPx + i) % buf.width;
          const t = engine.lastFillTime + i / pxPerSec;
          buf.ecg[px] = sampleEcg(t, engine);
          buf.pleth[px] = samplePleth(t, engine);
          buf.resp[px] = sampleResp(t, engine);
        }
        if (steps > 0) {
          engine.lastFillTime += steps / pxPerSec;
          buf.headPx = (buf.headPx + steps) % buf.width;
        }

        if (engine.soundOn && engine.audioCtx) {
          for (const q of engine.qrsQueue) {
            if (q.time > engine.lastAudioTime && q.time <= localT) {
              playBeep(engine.audioCtx, engine.rhythmId === 'vtach' || engine.rhythmId === 'vtach_pulseless' ? 660 : 880, 0.06, 0.12);
            }
          }
          engine.lastAudioTime = localT;
        }

        renderTrace(ecgCanvasRef.current, buf.ecg, buf.headPx, '#39ff6a', 0.5, 0.36);
        renderTrace(plethCanvasRef.current, buf.pleth, buf.headPx, '#22d3ee', 0.75, 0.55);
        renderTrace(respCanvasRef.current, buf.resp, buf.headPx, '#fbbf24', 0.5, 0.35);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <canvas ref={ecgCanvasRef} style={{ width: '100%', height: '46%', display: 'block' }} />
      <canvas ref={plethCanvasRef} style={{ width: '100%', height: '27%', display: 'block' }} />
      <canvas ref={respCanvasRef} style={{ width: '100%', height: '27%', display: 'block' }} />
    </div>
  );
}

// =====================================================================
// Simulator (top-level editor)
// =====================================================================
const DEFAULT_ALARMS = { hrEnabled: true, hrLow: 50, hrHigh: 130, spo2Enabled: true, spo2Low: 90, bpEnabled: true, bpSysLow: 90, bpSysHigh: 160 };

function DeviceTrainingSimulator({ scenario, onBack, onSaved }) {
  const [title, setTitle] = useState(scenario.title);
  const [rhythmId, setRhythmId] = useState(scenario.rhythm || 'nsr');
  const [heartRate, setHeartRate] = useState(scenario.heartRate ?? 78);
  const [bpSys, setBpSys] = useState(scenario.bpSystolic ?? 118);
  const [bpDia, setBpDia] = useState(scenario.bpDiastolic ?? 76);
  const [spo2, setSpo2] = useState(scenario.spo2 ?? 98);
  const [respRate, setRespRate] = useState(scenario.respRate ?? 16);
  const [temp, setTemp] = useState(scenario.temp ?? 37.0);
  const [alarms, setAlarms] = useState({ ...DEFAULT_ALARMS, ...(scenario.alarms || {}) });
  const [tab, setTab] = useState('vitals');
  const [soundOn, setSoundOn] = useState(false);
  const [silenced, setSilenced] = useState(false);
  const [displayHr, setDisplayHr] = useState(heartRate);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Defib/pacer state
  const [energy, setEnergy] = useState(200);
  const [charging, setCharging] = useState(false);
  const [charged, setCharged] = useState(false);
  const [syncMode, setSyncMode] = useState(false);
  const [pacerOn, setPacerOn] = useState(false);
  const [pacerRate, setPacerRate] = useState(70);
  const [pacerOutput, setPacerOutput] = useState(0);
  const [lastAction, setLastAction] = useState('');

  const containerRef = useRef(null);
  const engineRef = useRef(createEngine(rhythmId, heartRate, respRate));
  const saveTimerRef = useRef(null);
  const titleRef = useRef(title);
  titleRef.current = title;

  useEffect(() => { engineRef.current.hrBpm = heartRate; }, [heartRate]);
  useEffect(() => { engineRef.current.rrBpm = respRate; }, [respRate]);
  useEffect(() => { engineRef.current.soundOn = soundOn && !silenced; }, [soundOn, silenced]);

  useEffect(() => {
    // switching rhythms resets the beat schedule so the new morphology starts clean
    const rhythm = RHYTHM_MAP[rhythmId];
    const eng = engineRef.current;
    eng.rhythmId = rhythmId;
    eng.noPulse = !!rhythm?.noPulse;
    eng.fibrillatoryBaseline = false;
    eng.flutterBaseline = false;
    eng.qrsQueue = []; eng.pQueue = [];
    eng.lastQrsTime = eng.lastFillTime || 0;
    eng.lastPTime = undefined;
    eng.pvcCounter = 0; eng.pvcPause = false; eng.wenckStep = 0;
  }, [rhythmId]);

  // Poll the engine's live-computed HR at ~2Hz for the numeric readout (cheap; avoids re-rendering on every animation frame)
  useEffect(() => {
    const iv = setInterval(() => {
      const eng = engineRef.current;
      const recent = eng.qrsQueue.filter(q => q.time <= eng.lastFillTime).slice(-2);
      if (recent.length === 2) {
        const rr = recent[1].time - recent[0].time;
        if (rr > 0.15 && rr < 3) eng.displayHr = Math.round(60 / rr);
      } else if (RHYTHM_MAP[eng.rhythmId]?.continuous) {
        eng.displayHr = 0;
      }
      setDisplayHr(eng.displayHr);
    }, 500);
    return () => clearInterval(iv);
  }, []);

  const currentRhythm = RHYTHM_MAP[rhythmId];
  const shownHr = currentRhythm?.continuous ? 0 : displayHr;
  const shownSpo2 = currentRhythm?.noPulse ? null : spo2;

  const alarmHr = alarms.hrEnabled && !currentRhythm?.continuous && (shownHr < alarms.hrLow || shownHr > alarms.hrHigh);
  const alarmSpo2 = alarms.spo2Enabled && (shownSpo2 === null || shownSpo2 < alarms.spo2Low);
  const alarmBp = alarms.bpEnabled && (bpSys < alarms.bpSysLow || bpSys > alarms.bpSysHigh);
  const anyAlarm = alarmHr || alarmSpo2 || alarmBp;

  // Alarm tone: periodic double-beep while any enabled alarm is active and not silenced/muted.
  useEffect(() => {
    if (!soundOn || silenced || !anyAlarm) return;
    const eng = engineRef.current;
    const iv = setInterval(() => {
      if (eng.audioCtx) { playBeep(eng.audioCtx, 1100, 0.09, 0.14); setTimeout(() => playBeep(eng.audioCtx, 1100, 0.09, 0.14), 160); }
    }, 1400);
    return () => clearInterval(iv);
  }, [soundOn, silenced, anyAlarm]);

  const ensureAudio = () => {
    const eng = engineRef.current;
    if (!eng.audioCtx) { try { eng.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { /* unsupported */ } }
  };

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/device-scenarios/${scenario.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title: titleRef.current, rhythm: rhythmId, heartRate, bpSystolic: bpSys, bpDiastolic: bpDia, spo2, respRate, temp, alarms })
      });
      const data = await res.json();
      if (res.ok) { setDirty(false); onSaved?.(data); }
    } catch { /* keep local state */ }
    finally { setSaving(false); }
  }, [scenario.id, rhythmId, heartRate, bpSys, bpDia, spo2, respRate, temp, alarms, onSaved]);

  const scheduleSave = useCallback(() => {
    setDirty(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, 1200);
  }, [save]);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const goBack = async () => {
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); await save(); }
    onBack();
  };

  // ---- Defib/pacer physiology ----
  const doCharge = () => {
    ensureAudio();
    setCharging(true); setCharged(false);
    setTimeout(() => { setCharging(false); setCharged(true); }, 1800);
  };
  const doShock = () => {
    if (!charged) return;
    setCharged(false);
    const eng = engineRef.current;
    const rhythm = RHYTHM_MAP[rhythmId];
    if (SHOCKABLE.has(rhythmId)) {
      setRhythmId('asystole');
      setTimeout(() => { setRhythmId('nsr'); setLastAction('Defibrillation erfolgreich — Rhythmus in Normalen Sinusrhythmus konvertiert.'); }, 2200);
      setLastAction('Schock bei defibrillierbarem Rhythmus abgegeben.');
    } else if (syncMode && CARDIOVERTIBLE.has(rhythmId)) {
      setLastAction('Synchronisierte Kardioversion durchgeführt — Rhythmus in Normalen Sinusrhythmus konvertiert.');
      setRhythmId('nsr');
    } else {
      setLastAction(rhythm?.noPulse === false && !SHOCKABLE.has(rhythmId) ? 'Schock abgegeben — dieser Rhythmus ist nicht defibrillierbar, keine Veränderung.' : 'Schock abgegeben.');
    }
  };
  useEffect(() => {
    const eng = engineRef.current;
    if (pacerOn && pacerOutput >= 50 && PACING_INDICATED.has(rhythmId)) {
      eng.pacerCaptured = true;
      setRhythmId('paced');
    } else if (eng.pacerCaptured && (!pacerOn || pacerOutput < 50)) {
      eng.pacerCaptured = false;
      setRhythmId('sinus_brady');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacerOn, pacerOutput]);
  useEffect(() => { if (pacerOn) engineRef.current.hrBpm = pacerRate; }, [pacerOn, pacerRate]);

  const vitalsChanged = (setter) => (v) => { setter(v); scheduleSave(); };

  const numColor = (bad) => bad ? '#ff4d6d' : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--dt-surface)' }}>
      <header style={{ height: '54px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '0 16px', background: '#fff', borderBottom: '1px solid var(--dt-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button onClick={goBack} title="Zurück zu den Szenarien" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.15rem', color: 'var(--dt-muted)', padding: '4px' }}>←</button>
          <div style={{ width: '22px', height: '22px', flexShrink: 0 }}><LogoDeviceTraining /></div>
          <input value={title} onChange={e => { setTitle(e.target.value); scheduleSave(); }} style={{ border: 'none', outline: 'none', fontSize: '0.92rem', fontWeight: 700, color: 'var(--dt-ink)', fontFamily: "'Inter', sans-serif", background: 'transparent', minWidth: 0, width: '200px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button className="dt-btn-outline" style={{ padding: '7px 12px', fontSize: '0.76rem' }} onClick={() => { ensureAudio(); setSoundOn(v => !v); }}>{soundOn ? '🔊 Ton an' : '🔇 Ton aus'}</button>
          {anyAlarm && <button className="dt-btn-outline" style={{ padding: '7px 12px', fontSize: '0.76rem', color: '#B91C56', borderColor: '#F3B8CC' }} onClick={() => setSilenced(true)}>Alarm stummschalten</button>}
          <span style={{ fontSize: '0.72rem', color: 'var(--dt-muted)', fontWeight: 600 }}>{saving ? 'Wird gespeichert…' : dirty ? 'Ungespeicherte Änderungen' : 'Gespeichert'}</span>
          <button className="dt-btn-primary" style={{ padding: '7px 14px', fontSize: '0.78rem' }} onClick={() => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); save(); }} disabled={saving}>Speichern</button>
        </div>
      </header>

      <div style={{ flex: '1 1 60%', minHeight: 0, display: 'flex', background: '#0a0e12' }}>
        <div ref={containerRef} style={{ flex: 1, minWidth: 0 }}>
          <MonitorTraces engineRef={engineRef} containerRef={containerRef} />
        </div>
        <div style={{ width: '220px', flexShrink: 0, borderLeft: '1px solid #1c2228', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          <VitalBox label="HF" unit="/min" value={currentRhythm?.continuous ? '- -' : shownHr} color="#39ff6a" bad={alarmHr} />
          <VitalBox label="SpO2" unit="%" value={shownSpo2 === null ? '- -' : shownSpo2} color="#22d3ee" bad={alarmSpo2} />
          <VitalBox label="RR" unit="mmHg" value={`${bpSys}/${bpDia}`} color="#ff4d6d" bad={alarmBp} />
          <VitalBox label="AF" unit="/min" value={respRate} color="#fbbf24" />
          <VitalBox label="Temp" unit="°C" value={temp.toFixed(1)} color="#e5e7eb" />
        </div>
      </div>

      {anyAlarm && !silenced && (
        <div className="dt-alarm-flash" style={{ background: '#B91C56', color: '#fff', textAlign: 'center', padding: '6px', fontWeight: 700, fontSize: '0.82rem' }}>
          ⚠ ALARM — {alarmHr ? 'Herzfrequenz ' : ''}{alarmSpo2 ? 'SpO2 ' : ''}{alarmBp ? 'Blutdruck ' : ''}außerhalb des Bereichs
        </div>
      )}

      <div style={{ flex: '1 1 40%', minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderTop: '1px solid var(--dt-border)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--dt-border)', flexShrink: 0 }}>
          <button className={`dt-tab${tab === 'vitals' ? ' active' : ''}`} onClick={() => setTab('vitals')}>Rhythmus &amp; Vitalwerte</button>
          <button className={`dt-tab${tab === 'alarms' ? ' active' : ''}`} onClick={() => setTab('alarms')}>Alarme</button>
          <button className={`dt-tab${tab === 'defib' ? ' active' : ''}`} onClick={() => setTab('defib')}>Defibrillator</button>
          <button className={`dt-tab${tab === 'pacer' ? ' active' : ''}`} onClick={() => setTab('pacer')}>Schrittmacher</button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
          {tab === 'vitals' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label className="dt-field-label">Rhythmus</label>
                <select className="dt-field-input" value={rhythmId} onChange={e => { setRhythmId(e.target.value); scheduleSave(); }}>
                  {RHYTHMS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              {!currentRhythm?.continuous && (
                <SliderField label={`Herzfrequenz — ${heartRate}/min`} min={20} max={260} value={heartRate} onChange={vitalsChanged(setHeartRate)} disabled={pacerOn} />
              )}
              <SliderField label={`Systolischer Blutdruck — ${bpSys} mmHg`} min={40} max={240} value={bpSys} onChange={vitalsChanged(setBpSys)} />
              <SliderField label={`Diastolischer Blutdruck — ${bpDia} mmHg`} min={20} max={160} value={bpDia} onChange={vitalsChanged(setBpDia)} />
              <SliderField label={`SpO2 — ${spo2}%`} min={50} max={100} value={spo2} onChange={vitalsChanged(setSpo2)} />
              <SliderField label={`Atemfrequenz — ${respRate}/min`} min={4} max={40} value={respRate} onChange={vitalsChanged(setRespRate)} />
              <SliderField label={`Temperatur — ${temp.toFixed(1)}°C`} min={32} max={41} step={0.1} value={temp} onChange={vitalsChanged(setTemp)} />
            </div>
          )}
          {tab === 'alarms' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <AlarmGroup label="Herzfrequenz" enabled={alarms.hrEnabled} onToggle={v => { setAlarms(a => ({ ...a, hrEnabled: v })); scheduleSave(); }}
                lowLabel={`Untere Grenze: ${alarms.hrLow}/min`} low={alarms.hrLow} onLow={v => { setAlarms(a => ({ ...a, hrLow: v })); scheduleSave(); }} lowMin={20} lowMax={100}
                highLabel={`Obere Grenze: ${alarms.hrHigh}/min`} high={alarms.hrHigh} onHigh={v => { setAlarms(a => ({ ...a, hrHigh: v })); scheduleSave(); }} highMin={80} highMax={260} />
              <AlarmGroup label="SpO2" enabled={alarms.spo2Enabled} onToggle={v => { setAlarms(a => ({ ...a, spo2Enabled: v })); scheduleSave(); }}
                lowLabel={`Untere Grenze: ${alarms.spo2Low}%`} low={alarms.spo2Low} onLow={v => { setAlarms(a => ({ ...a, spo2Low: v })); scheduleSave(); }} lowMin={70} lowMax={100} />
              <AlarmGroup label="Systolischer Blutdruck" enabled={alarms.bpEnabled} onToggle={v => { setAlarms(a => ({ ...a, bpEnabled: v })); scheduleSave(); }}
                lowLabel={`Untere Grenze: ${alarms.bpSysLow} mmHg`} low={alarms.bpSysLow} onLow={v => { setAlarms(a => ({ ...a, bpSysLow: v })); scheduleSave(); }} lowMin={50} lowMax={120}
                highLabel={`Obere Grenze: ${alarms.bpSysHigh} mmHg`} high={alarms.bpSysHigh} onHigh={v => { setAlarms(a => ({ ...a, bpSysHigh: v })); scheduleSave(); }} highMin={120} highMax={240} />
              {silenced && <button className="dt-btn-outline" style={{ alignSelf: 'start' }} onClick={() => setSilenced(false)}>Alarm wieder aktivieren</button>}
            </div>
          )}
          {tab === 'defib' && (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div>
                <label className="dt-field-label">Energie (Joule)</label>
                <select className="dt-field-input" style={{ width: '140px' }} value={energy} onChange={e => setEnergy(Number(e.target.value))}>
                  {[120, 150, 200, 300, 360].map(j => <option key={j} value={j}>{j} J</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dt-ink)', marginTop: '18px' }}>
                <input type="checkbox" checked={syncMode} onChange={e => setSyncMode(e.target.checked)} /> Synchronisierte Kardioversion
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button className="dt-btn-outline" onClick={doCharge} disabled={charging || charged}>{charging ? 'Lädt…' : charged ? 'Geladen ✓' : `${energy}J laden`}</button>
                <button className="dt-btn-primary" style={{ background: charged ? '#B91C56' : undefined }} onClick={doShock} disabled={!charged}>⚡ Schock</button>
              </div>
              {lastAction && <p style={{ width: '100%', color: 'var(--dt-muted)', fontSize: '0.82rem', marginTop: '8px' }}>{lastAction}</p>}
            </div>
          )}
          {tab === 'pacer' && (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--dt-ink)' }}>
                <input type="checkbox" checked={pacerOn} onChange={e => setPacerOn(e.target.checked)} /> Schrittmacher EIN
              </label>
              <SliderField label={`Frequenz — ${pacerRate}/min`} min={40} max={180} value={pacerRate} onChange={setPacerRate} />
              <SliderField label={`Ausgangsleistung — ${pacerOutput} mA`} min={0} max={200} value={pacerOutput} onChange={setPacerOutput} />
              <p style={{ width: '100%', color: 'var(--dt-muted)', fontSize: '0.82rem' }}>
                {PACING_INDICATED.has(rhythmId) || rhythmId === 'paced'
                  ? 'Eine Schrittmachertherapie ist bei diesem Rhythmus indiziert. Das Capture erfolgt ab ≥50mA Ausgangsleistung.'
                  : 'Eine Schrittmachertherapie ist bei diesem Rhythmus nicht indiziert — eine Erhöhung der Ausgangsleistung führt zu keinem Capture.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VitalBox({ label, unit, value, color, bad }) {
  return (
    <div style={{ background: '#12181e', borderRadius: '8px', padding: '8px 10px', border: bad ? '1px solid #ff4d6d' : '1px solid #1c2228' }}>
      <div style={{ color: '#8a93a0', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label} <span style={{ opacity: 0.7 }}>{unit}</span></div>
      <div className={`dt-numeric${bad ? ' dt-alarm-flash' : ''}`} style={{ color: bad ? '#ff4d6d' : color, fontSize: '1.7rem', lineHeight: 1.15 }}>{value}</div>
    </div>
  );
}

function SliderField({ label, min, max, step = 1, value, onChange, disabled }) {
  return (
    <div>
      <label className="dt-field-label">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%' }} />
    </div>
  );
}

function AlarmGroup({ label, enabled, onToggle, lowLabel, low, onLow, lowMin, lowMax, highLabel, high, onHigh, highMin, highMax }) {
  return (
    <div style={{ opacity: enabled ? 1 : 0.5 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--dt-ink)', marginBottom: '10px' }}>
        <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} /> {label}
      </label>
      {low !== undefined && <SliderField label={lowLabel} min={lowMin} max={lowMax} value={low} onChange={onLow} disabled={!enabled} />}
      {high !== undefined && <div style={{ marginTop: '10px' }}><SliderField label={highLabel} min={highMin} max={highMax} value={high} onChange={onHigh} disabled={!enabled} /></div>}
    </div>
  );
}

// =====================================================================
// Dashboard
// =====================================================================
function DeviceTrainingDashboard({ currentUser, onOpen, onHome, userRole, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchScenarios = useCallback(() => {
    fetch('/api/device-scenarios', { headers: { ...authHeaders() } })
      .then(async res => { const data = await res.json().catch(() => []); if (!res.ok) throw new Error(data.error); return data; })
      .then(data => { setScenarios(Array.isArray(data) ? data : []); setLoadError(''); })
      .catch(err => setLoadError(err.message || 'Deine Szenarien konnten nicht geladen werden.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchScenarios(); }, [fetchScenarios]);

  const createScenario = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/device-scenarios', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ title: 'Unbenanntes Szenario', rhythm: 'nsr', heartRate: 78, bpSystolic: 118, bpDiastolic: 76, spo2: 98, respRate: 16, temp: 37.0, alarms: DEFAULT_ALARMS })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onOpen(data);
    } catch (err) { alert(err.message || 'Das Szenario konnte nicht erstellt werden.'); }
    finally { setCreating(false); }
  };

  const deleteScenario = async (s) => {
    if (!window.confirm(`„${s.title}" wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    try { await fetch(`/api/device-scenarios/${s.id}`, { method: 'DELETE', headers: { ...authHeaders() } }); setScenarios(prev => prev.filter(x => x.id !== s.id)); }
    catch { /* ignore */ }
  };

  const openScenario = async (s) => {
    try {
      const res = await fetch(`/api/device-scenarios/${s.id}`, { headers: { ...authHeaders() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onOpen(data);
    } catch (err) { alert(err.message || 'Dieses Szenario konnte nicht geöffnet werden.'); }
  };

  return (
    <div className="module-view-container" style={{ background: 'var(--dt-bg)' }}>
      <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--dt-border)' }}>
        <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Zurück zur Startseite">
          <div style={{ width: '28px', height: '28px' }}><LogoDeviceTraining /></div>
          <span style={{ color: 'var(--dt-ink)', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>Gerätetraining</span>
        </div>
        <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
      </header>

      <div className="dt-scroll">
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 700, color: 'var(--dt-ink)', fontFamily: "'Inter', sans-serif" }}>Deine Szenarien</h1>
              <p style={{ margin: 0, color: 'var(--dt-muted)', fontSize: '0.85rem' }}>Übe das Erkennen von Rhythmen und den Umgang mit Defibrillator/Schrittmacher an einem Live-Monitor.</p>
            </div>
            <button className="dt-btn-primary" onClick={createScenario} disabled={creating}>+ Neues Szenario</button>
          </div>

          {loading ? (
            <div className="dt-card" style={{ textAlign: 'center', color: 'var(--dt-muted)', padding: '40px' }}>Wird geladen…</div>
          ) : loadError ? (
            <div className="dt-card" style={{ textAlign: 'center', color: '#D93025', padding: '40px' }}>{loadError}</div>
          ) : scenarios.length === 0 ? (
            <div className="dt-card" style={{ textAlign: 'center', padding: '56px 24px' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoDeviceTraining /></div>
              <h2 style={{ margin: '0 0 8px 0', color: 'var(--dt-ink)', fontSize: '1.15rem' }}>Noch keine Szenarien</h2>
              <p style={{ color: 'var(--dt-muted)', fontSize: '0.88rem', margin: '0 0 20px 0' }}>Erstelle dein erstes Monitor-Szenario — wähle einen Rhythmus, stelle Vitalwerte und Alarme ein und übe.</p>
              <button className="dt-btn-primary" onClick={createScenario} disabled={creating}>+ Neues Szenario</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {scenarios.map(s => (
                <div key={s.id} className="dt-card" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={() => openScenario(s)}>
                  <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#0a0e12', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '32px', height: '32px' }}><LogoDeviceTraining /></div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--dt-ink)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--dt-muted)', marginTop: '2px' }}>{RHYTHM_MAP[s.rhythm]?.label || s.rhythm}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteScenario(s); }} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#D93025', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, padding: 0 }}>Löschen</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Top level
// =====================================================================
export default function DeviceTrainingView({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker }) {
  const [openScenario, setOpenScenario] = useState(null);
  const isLoggedIn = !!currentUser;

  if (!isLoggedIn) {
    return (
      <div className="module-view-container" style={{ background: 'var(--dt-bg)' }}>
        <style>{DT_CSS}</style>
        <header style={{ height: '64px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', borderBottom: '1px solid var(--dt-border)' }}>
          <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} title="Zurück zur Startseite">
            <div style={{ width: '28px', height: '28px' }}><LogoDeviceTraining /></div>
            <span style={{ color: 'var(--dt-ink)', fontWeight: 700, fontSize: '1.2rem', fontFamily: "'Inter', sans-serif" }}>Gerätetraining</span>
          </div>
          <UserProfileMenu variant="light" userRole={userRole} currentUser={currentUser} setCurrentUser={setCurrentUser} onOpenAuthModal={onOpenAuthModal} onOpenAvatarPicker={onOpenAvatarPicker} />
        </header>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dt-card" style={{ textAlign: 'center', padding: '48px 32px', maxWidth: '440px' }}>
            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px' }}><LogoDeviceTraining /></div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--dt-ink)', fontSize: '1.25rem' }}>Willkommen beim Gerätetraining</h2>
            <p style={{ color: 'var(--dt-muted)', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 20px 0' }}>
              Ein Patientenmonitor- und Defibrillator/Schrittmacher-Simulator zum Üben von Rhythmuserkennung und Gerätebedienung. Melde dich an, um loszulegen.
            </p>
            <button className="dt-btn-primary" onClick={onOpenAuthModal}>Anmelden</button>
          </div>
        </div>
      </div>
    );
  }

  if (openScenario) {
    return (
      <>
        <style>{DT_CSS}</style>
        <DeviceTrainingSimulator scenario={openScenario} onBack={() => setOpenScenario(null)} onSaved={setOpenScenario} />
      </>
    );
  }

  return (
    <>
      <style>{DT_CSS}</style>
      <DeviceTrainingDashboard
        currentUser={currentUser}
        onOpen={setOpenScenario}
        onHome={onHome}
        userRole={userRole}
        setCurrentUser={setCurrentUser}
        onOpenAuthModal={onOpenAuthModal}
        onOpenAvatarPicker={onOpenAvatarPicker}
      />
    </>
  );
}
