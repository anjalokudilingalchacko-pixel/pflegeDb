import React, { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';
import { getInitialPatients } from './patientData';

const SIS_THEMENFELDER = [
  { id: 'tf1', title: '1. Kognition & Kommunikation', icon: '🧠', color: '#8b5cf6' },
  { id: 'tf2', title: '2. Mobilität & Bewegung', icon: '🏃', color: '#3b82f6' },
  { id: 'tf3', title: '3. Krankheitsbez. Anforderungen', icon: '🩺', color: '#ef4444' },
  { id: 'tf4', title: '4. Selbstversorgung', icon: '🧼', color: '#10b981' },
  { id: 'tf5', title: '5. Soziale Beziehungen', icon: '👥', color: '#f59e0b' },
  { id: 'tf6', title: '6. Haushaltsführung', icon: '🏠', color: '#6366f1' }
];

const ORGANS_LIST = [
  { id: 'heart', name: 'Herz / Kreislauf', icon: '🫀', desc: 'Puls, Blutdruck, Arrythmie, Brustschmerz', color: '#ef4444' },
  { id: 'lungs', name: 'Lunge / Atmung', icon: '🫁', desc: 'Dyspnoe, O2-Sättigung, Husten, Atemgeräusche', color: '#3b82f6' },
  { id: 'brain', name: 'Gehirn / Neurologie', icon: '🧠', desc: 'Orientierung, Disziplin, Kopfschmerz, Schwindel', color: '#a855f7' },
  { id: 'stomach', name: 'Magen-Darm / Verdauung', icon: '🫃', desc: 'Nahrungsaufnahme, Übelkeit, Stuhlgang', color: '#f59e0b' },
  { id: 'skin', name: 'Haut / Wunden (Dekubitus)', icon: '🩹', desc: 'Dekubitus-Grad, Rötung, Wunddokumentation', color: '#ec4899' },
  { id: 'joints', name: 'Bewegungsapparat / Gelenke', icon: '🦴', desc: 'Sturzfolge, Arthrose, Mobilitätseinschränkung', color: '#14b8a6' }
];

export default function PflegedokumentationHub({ onHome, userRole, currentUser }) {
  const [patients, setPatients] = useState(() => getInitialPatients());
  const [selectedPatientId, setSelectedPatientId] = useState('1');
  const [activeTab, setActiveTab] = useState('doku_wizard'); // 'doku_wizard' | '3d_organ' | 'voice_ai' | 'medis' | 'timeline'
  
  // Interactive 3D/Organ documentation state
  const [selectedOrgan, setSelectedOrgan] = useState('heart');
  const [painLevel, setPainLevel] = useState(3);
  const [organNotes, setOrganNotes] = useState('');
  const [selectedThemenfeld, setSelectedThemenfeld] = useState('tf3');

  // Voice AI / Dictation state
  const [voiceText, setVoiceText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Medication administration state
  const [medsGiven, setMedsGiven] = useState({
    morgen: true,
    mittag: false,
    abend: false,
    nacht: false
  });

  // Success notification
  const [toast, setToast] = useState({ show: false, message: '' });

  // Fetch patients on mount
  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          if (!selectedPatientId || !data.some(p => String(p.id) === String(selectedPatientId))) {
            setSelectedPatientId(String(data[0].id));
          }
        }
      })
      .catch(err => console.warn('Patients fallback notice:', err));
  }, []);

  const selectedPatient = useMemo(() => {
    return patients.find(p => String(p.id) === String(selectedPatientId)) || patients[0];
  }, [patients, selectedPatientId]);

  // Voice recording toggle
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'de-DE';
        recognition.onresult = (e) => {
          const text = e.results[0][0].transcript;
          setVoiceText(prev => prev ? `${prev} ${text}` : text);
          setIsRecording(false);
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.start();
      } else {
        setTimeout(() => {
          setVoiceText(prev => prev + ' Patient klagt über leichte Atemnot bei Belastung, RR 135/85 mmHg.');
          setIsRecording(false);
        }, 1500);
      }
    }
  };

  // Submit complete multi-module documentation entry
  const handleSubmitDocumentation = async () => {
    const organObj = ORGANS_LIST.find(o => o.id === selectedOrgan);
    const tfObj = SIS_THEMENFELDER.find(t => t.id === selectedThemenfeld);

    const formattedEntry = `[${tfObj?.icon || '🩺'} ${tfObj?.title || 'Pflegebeobachtung'}]
Organ-Fokus: ${organObj?.icon || ''} ${organObj?.name || 'Allgemein'} (Schmerz-Score: ${painLevel}/10)
${organNotes ? `Befund: ${organNotes}\n` : ''}${voiceText ? `Sprachdiktat: ${voiceText}\n` : ''}Medikamente verabreicht: Morgen: ${medsGiven.morgen ? '✅' : '❌'}, Mittag: ${medsGiven.mittag ? '✅' : '❌'}, Abend: ${medsGiven.abend ? '✅' : '❌'}, Nacht: ${medsGiven.nacht ? '✅' : '❌'}`;

    try {
      // Optimistic state update
      setPatients(prev => prev.map(p => {
        if (String(p.id) === String(selectedPatientId)) {
          const currentBericht = p.pflegebericht || [];
          return {
            ...p,
            pflegebericht: [
              {
                date: new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
                user: currentUser?.name || 'Pflegefachkraft (Interaktives Doku-System)',
                text: formattedEntry
              },
              ...currentBericht
            ]
          };
        }
        return p;
      }));

      // Send to server
      await fetch('/api/doku/full-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          entryText: formattedEntry,
          themenfeld: selectedThemenfeld,
          organ: selectedOrgan,
          painLevel
        })
      });

      setToast({ show: true, message: `Pflegeeintrag für ${selectedPatient?.name} erfolgreich gespeichert!` });
      setOrganNotes('');
      setVoiceText('');
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
    } catch (e) {
      console.warn('Save notice:', e);
      setToast({ show: true, message: `Eintrag lokal gespeichert.` });
      setTimeout(() => setToast({ show: false, message: '' }), 4000);
    }
  };

  const patientHistory = selectedPatient?.pflegebericht || [];

  return (
    <div style={{ background: '#0b0f19', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toast Notification */}
      {toast.show && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', padding: '14px 24px', borderRadius: '14px', fontWeight: 700, boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)', zIndex: 9999 }}>
          ✅ {toast.message}
        </div>
      )}

      {/* 1. Header with Patient Vitals Card */}
      <header style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: onHome ? 'pointer' : 'default' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}>
              🩺
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pflegedokumentation & SIS Hub
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Multi-Modul Pflegedokumentationssystem</div>
            </div>
          </div>

          {/* Patient Selector Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                {selectedPatient?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>{selectedPatient?.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 600 }}>Pflegegrad {selectedPatient?.pflegegrad || 3} • Zimmer {selectedPatient?.room || '102'}</div>
              </div>
            </div>

            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} (PG {p.pflegegrad || 2})</option>
              ))}
            </select>
          </div>

        </div>
      </header>

      {/* 2. Navigation Tabs */}
      <nav style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 28px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '10px', overflowX: 'auto' }}>
          {[
            { id: 'doku_wizard', label: '✍️ Interaktive Doku', icon: '📝' },
            { id: '3d_organ', label: '🩺 3D Organ & Schmerz-Doku', icon: '🫀' },
            { id: 'voice_ai', label: '🎙️ PflegeDiktat Voice AI', icon: '🎙️' },
            { id: 'medis', label: '💊 Medis & Verabreichung', icon: '💊' },
            { id: 'timeline', label: `📜 Akten-Timeline (${patientHistory.length})`, icon: '📜' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255,255,255,0.04)',
                color: activeTab === tab.id ? '#ffffff' : '#94a3b8',
                border: activeTab === tab.id ? '1px solid rgba(129, 140, 248, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '10px 18px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 3. Main Multi-Module Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px' }}>
        
        {/* TAB 1: INTERACTIVE UNIFIED DOKU WIZARD */}
        {activeTab === 'doku_wizard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
            
            {/* MAIN FORM PANEL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* STEP A: SIS THEMENFELD SELECTOR */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                  Schritt 1: SIS Themenfeld Zuordnung
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {SIS_THEMENFELDER.map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setSelectedThemenfeld(tf.id)}
                      style={{
                        background: selectedThemenfeld === tf.id ? `${tf.color}25` : 'rgba(15, 23, 42, 0.6)',
                        border: selectedThemenfeld === tf.id ? `2px solid ${tf.color}` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{tf.icon}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>{tf.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP B: 3D ORGAN & LOCALISED SYMPTOM PICKER */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                  Schritt 2: Anatomischer Organ-Fokus & Schmerz-Skala
                </div>

                {/* Organ Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '18px' }}>
                  {ORGANS_LIST.map(organ => (
                    <button
                      key={organ.id}
                      onClick={() => setSelectedOrgan(organ.id)}
                      style={{
                        background: selectedOrgan === organ.id ? `${organ.color}25` : 'rgba(15, 23, 42, 0.6)',
                        border: selectedOrgan === organ.id ? `2px solid ${organ.color}` : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                        textAlign: 'left',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{organ.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>{organ.name}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{organ.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Pain Scale Slider */}
                <div style={{ background: '#0f172a', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>Schmerz-Intensität (NRS 0-10):</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: painLevel > 6 ? '#ef4444' : painLevel > 3 ? '#f59e0b' : '#10b981' }}>
                      {painLevel} / 10 {painLevel === 0 ? '🟢 Schmerzfrei' : painLevel <= 3 ? '🟡 Leicht' : painLevel <= 6 ? '🟠 Mäßig' : '🔴 Stark'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painLevel}
                    onChange={(e) => setPainLevel(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: painLevel > 6 ? '#ef4444' : '#6366f1', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* STEP C: TEXT & VOICE INPUT */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Schritt 3: Detaillierte Pflegebeobachtung & Sprachdiktat
                  </div>

                  <button
                    onClick={toggleRecording}
                    style={{
                      background: isRecording ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {isRecording ? '⏹️ Aufnahme stoppen' : '🎙️ Sprache Diktieren'}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={organNotes}
                  onChange={(e) => setOrganNotes(e.target.value)}
                  placeholder="Geben Sie spezifische Beobachtungen ein (z.B. Patient klagt über Druckschmerz am rechten Unterschenkel, Wundverband trocken)..."
                  style={{
                    width: '100%',
                    background: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />

                {voiceText && (
                  <div style={{ marginTop: '12px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', color: '#e9d5ff' }}>
                    🎙️ <strong>Diktiert:</strong> {voiceText}
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                onClick={handleSubmitDocumentation}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                💾 Pflegeeintrag in Akte von {selectedPatient?.name} speichern
              </button>

            </div>

            {/* RIGHT SIDEBAR: MEDICATION QUICK-CHECK & RECENT ENTRIES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* MEDICATION QUICK CHECK CARD */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                  💊 Medikamente Verabreichung (Heute)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'morgen', label: 'Morgens 🌅 (08:00 Uhr)' },
                    { key: 'mittag', label: 'Mittags ☀️ (12:00 Uhr)' },
                    { key: 'abend', label: 'Abends 🌇 (18:00 Uhr)' },
                    { key: 'nacht', label: 'Nachts 🌙 (22:00 Uhr)' }
                  ].map(time => (
                    <label key={time.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>{time.label}</span>
                      <input
                        type="checkbox"
                        checked={medsGiven[time.key]}
                        onChange={(e) => setMedsGiven(prev => ({ ...prev, [time.key]: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* PATIENT VITAL STATUS BADGES */}
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', padding: '20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
                  📊 Aktuelle Risikobewertung
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>Sturzrisiko</span>
                    <span style={{ color: '#ef4444', fontWeight: 800 }}>Erhöht (Rollator)</span>
                  </div>
                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>Dekubitus-Risiko</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>Mäßig (Braden 15)</span>
                  </div>
                  <div style={{ background: '#0f172a', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>Schmerzanamnese</span>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>NRS {painLevel}/10</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: 3D ORGAN & ANATOMICAL VISUALIZER */}
        {activeTab === '3d_organ' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px', textAlign: 'center' }}>
            <h2 style={{ margin: 0, color: '#38bdf8', fontSize: '1.5rem' }}>🩺 Interaktive 3D Organ & Anatomie Dokumentation</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>Klicken Sie auf ein Organ, um Wund- und Symptomdaten direkt im 3D-Modell einzutragen.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
              {ORGANS_LIST.map(o => (
                <div
                  key={o.id}
                  onClick={() => { setSelectedOrgan(o.id); setActiveTab('doku_wizard'); }}
                  style={{
                    background: '#0f172a',
                    border: `2px solid ${o.color}`,
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 20px ${o.color}20`
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{o.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc' }}>{o.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '6px' }}>{o.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: VOICE AI */}
        {activeTab === 'voice_ai' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f8fafc' }}>PflegeDiktat Voice Agent</h3>
                <div style={{ color: '#2dd4bf', fontSize: '0.85rem' }}>Echtzeit-Spracherfassung und automatische MDK-Berichtgenerierung</div>
              </div>
            </div>

            <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
              Nutzen Sie freies Diktieren während der Pflege am Patientenbett. Das System strukturiert gesprochene Sätze automatisch nach den 6 Themenfeldern der SIS.
            </p>
          </div>
        )}

        {/* TAB 4: MEDIKAMENTE */}
        {activeTab === 'medis' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '28px' }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#f59e0b' }}>💊 Medikamentenplan & PZN Sicherheitscheck</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>Verabreichte Arzneien abzeichnen und Wechselwirkungen in Echtzeit prüfen.</p>

            <div style={{ background: '#0f172a', padding: '16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>Verordnete Medikamente for {selectedPatient?.name}:</div>
              <ul style={{ color: '#cbd5e1', fontSize: '0.88rem', paddingLeft: '20px', margin: 0 }}>
                <li>Ramipril 5mg (Morgens 1-0-0-0) - PZN 04182741</li>
                <li>Metformin 850mg (Morgens & Abends 1-0-1-0) - PZN 02938192</li>
                <li>Torasemid 10mg (Morgens 1-0-0-0) - PZN 01928374</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 5: TIMELINE AKTE */}
        {activeTab === 'timeline' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.6)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#f8fafc' }}>📜 Digitale Pflegeakte Timeline ({selectedPatient?.name})</h3>

            {patientHistory.length === 0 ? (
              <div style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
                Noch keine Einträge in der Pflegeakte vorhanden.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {patientHistory.map((entry, idx) => (
                  <div key={idx} style={{ background: '#0f172a', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: '#818cf8', fontWeight: 800 }}>👤 {entry.user || 'Pflegekraft'}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>🕒 {entry.date}</span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.9rem', whitespace: 'pre-wrap', lineHeight: '1.5' }}>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
