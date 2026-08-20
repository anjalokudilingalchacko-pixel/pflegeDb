import React, { useState, useEffect, useMemo } from 'react';
import './Pflegeplanung.css';
import { getInitialPatients } from './patientData';
import { UserProfileMenu } from './feedShared';
import { LogoPlanning } from './icons';

export default function Pflegeplanung({ onHome, userRole, currentUser, setCurrentUser, onOpenAuthModal, onOpenAvatarPicker, onLaunchApp }) {
  // Database state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL'); // 'ALL', 'Station 1', 'Station 2'

  // Active view/edit state
  const [mode, setMode] = useState('view'); // 'view', 'wizard'
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(null); // Which care plan index is expanded/viewed
  const [wizardStep, setWizardStep] = useState(1); // 1: PESR, 2: SMART, 3: 7W

  // Wizard form state
  const [pesrForm, setPesrForm] = useState({
    problem: '',
    etiology: '',
    symptoms: '',
    resources: ''
  });

  const [smartGoalForm, setSmartGoalForm] = useState({
    action: '',       // e.g., "Patient mobilisiert sich selbstständig im Flur"
    measurable: '',   // e.g., "20 Meter ohne Pause, Schmerzscore < 3"
    attainable: '',   // e.g., "unter Nutzung des Rollators"
    realistic: '',    // e.g., "unter Erhaltung stabiler Kreislaufverhältnisse"
    timebound: '',    // e.g., "innerhalb von 14 Tagen"
    customGoal: ''    // Compiled or customized final statement
  });

  // Current interventions being edited in wizard
  const [interventions, setInterventions] = useState([]);
  
  // Single intervention form state (7 W's)
  const [newIntervention, setNewIntervention] = useState({
    time: '08:00',
    measure: '',
    wer: 'PK (Pflegefachkraft)',
    was: '',
    wann: 'Morgens',
    wie: '',
    womit: '',
    wieOft: 'Täglich',
    woraufAchten: '',
    hilfsmittel: '',
    responsibility: 'RN'
  });

  // Toast notification
  const [toast, setToast] = useState({ show: false, text: '' });

  // Load patients on mount
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          setSelectedPatientId(data[0].id);
        } else {
          const fallback = getInitialPatients();
          setPatients(fallback);
          setSelectedPatientId(fallback[0].id);
        }
      })
      .catch(err => {
        console.error("Error loading patients in Pflegeplanung:", err);
        const fallback = getInitialPatients();
        setPatients(fallback);
        setSelectedPatientId(fallback[0].id);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const triggerToast = (text) => {
    setToast({ show: true, text });
    setTimeout(() => {
      setToast({ show: false, text: '' });
    }, 3000);
  };

  // Find active patient object
  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Reset selected plan whenever patient changes
  useEffect(() => {
    setSelectedPlanIndex(null);
  }, [selectedPatientId]);

  // Filter patients list based on station filter
  const filteredPatients = useMemo(() => {
    if (selectedStationFilter === 'ALL') {
      return patients;
    }
    return patients.filter(p => p.station === selectedStationFilter);
  }, [patients, selectedStationFilter]);

  // Auto-select first patient when filtered list changes (and current selection isn't in it)
  useEffect(() => {
    if (filteredPatients.length > 0 && !filteredPatients.some(p => p.id === selectedPatientId)) {
      setSelectedPatientId(filteredPatients[0].id);
    }
  }, [filteredPatients, selectedPatientId]);

  // Compile SMART goal statement dynamically as student typing
  useEffect(() => {
    const { action, measurable, attainable, realistic, timebound } = smartGoalForm;
    if (action || measurable || attainable || realistic || timebound) {
      const parts = [];
      if (action) parts.push(action);
      if (measurable) parts.push(measurable);
      
      if (attainable) {
        const trimmed = attainable.trim();
        if (/^(mit|ohne|unter|über)\b/i.test(trimmed)) {
          parts.push(trimmed);
        } else {
          parts.push(`mit ${trimmed}`);
        }
      }
      
      if (realistic) {
        const trimmed = realistic.trim();
        if (/^(unter|bei|ohne|mit|unter Beachtung von)\b/i.test(trimmed)) {
          parts.push(trimmed);
        } else {
          parts.push(`unter Beachtung von ${trimmed}`);
        }
      }
      
      if (timebound) parts.push(timebound);
      
      setSmartGoalForm(prev => ({
        ...prev,
        customGoal: parts.join(' ')
      }));
    }
  }, [smartGoalForm.action, smartGoalForm.measurable, smartGoalForm.attainable, smartGoalForm.realistic, smartGoalForm.timebound]);

  // Expand selected plan or view adapt legacy plan
  const selectedCarePlan = useMemo(() => {
    if (!currentPatient || !currentPatient.pflegeplanung || selectedPlanIndex === null) {
      return null;
    }

    const plan = currentPatient.pflegeplanung[selectedPlanIndex];
    if (!plan) return null;

    if (plan.isAdvanced) {
      return plan;
    }

    // Adapt legacy plan formats to new layout
    return {
      isAdvanced: false,
      problem: plan.problem || 'Keine Angaben',
      goal: plan.goal || 'Keine Angaben',
      intervention: plan.intervention || 'Keine Angaben',
      pesr: {
        problem: plan.problem || 'Keine Angaben',
        etiology: 'Nicht explizit im PESR-Format hinterlegt',
        symptoms: 'Nicht explizit im PESR-Format hinterlegt',
        resources: 'Keine Angabe vorhanden.'
      },
      smartGoal: {
        targetText: plan.goal || 'Keine Angaben',
        specific: '', measurable: '', achievable: '', realistic: '', timebound: ''
      },
      interventionsList: [
        {
          time: '08:00',
          measure: 'Pflegemaßnahme',
          details: plan.intervention || 'Keine Angaben',
          hilfsmittel: 'Pflegehilfsmittel',
          responsibility: 'RN'
        }
      ]
    };
  }, [currentPatient, selectedPlanIndex]);

  // Initialize wizard when starting
  const handleStartWizard = () => {
    if (!currentPatient) return;
    
    // Clear wizard inputs to start fresh
    setPesrForm({ problem: '', etiology: '', symptoms: '', resources: '' });
    setSmartGoalForm({ action: '', measurable: '', attainable: '', realistic: '', timebound: '', customGoal: '' });
    setInterventions([]);
    setWizardStep(1);
    setMode('wizard');
  };

  // Add intervention to wizard state
  const handleAddIntervention = (e) => {
    e.preventDefault();
    if (!newIntervention.measure.trim()) {
      alert("Bitte geben Sie einen Namen für die Pflegemaßnahme an.");
      return;
    }

    // Compile 7W text
    const { wer, was, wann, wie, womit, wieOft, woraufAchten } = newIntervention;
    const detailsCompiled = [];
    if (wer) detailsCompiled.push(`Wer: ${wer}`);
    if (was) detailsCompiled.push(`Was: ${was}`);
    if (wann) detailsCompiled.push(`Wann: ${wann}`);
    if (wie) detailsCompiled.push(`Wie: ${wie}`);
    if (womit) detailsCompiled.push(`Womit: ${womit}`);
    if (wieOft) detailsCompiled.push(`Wie oft: ${wieOft}`);
    if (woraufAchten) detailsCompiled.push(`Achtung/Ziel: ${woraufAchten}`);

    const compiledText = detailsCompiled.join(' | ');

    const item = {
      id: Date.now(),
      time: newIntervention.time,
      measure: newIntervention.measure,
      details: compiledText,
      hilfsmittel: newIntervention.hilfsmittel,
      responsibility: newIntervention.responsibility
    };

    setInterventions(prev => [...prev, item].sort((a, b) => a.time.localeCompare(b.time)));
    
    // Reset form
    setNewIntervention({
      time: '08:00',
      measure: '',
      wer: 'PK (Pflegefachkraft)',
      was: '',
      wann: 'Morgens',
      wie: '',
      womit: '',
      wieOft: 'Täglich',
      woraufAchten: '',
      hilfsmittel: '',
      responsibility: 'RN'
    });
  };

  // Remove intervention from wizard state
  const handleDeleteIntervention = (id) => {
    setInterventions(prev => prev.filter(item => item.id !== id));
  };

  // Submit/Save Pflegeplanung to database
  const handleSavePlan = () => {
    if (!currentPatient) return;

    // Advanced Plan payload
    const advancedPlan = {
      isAdvanced: true,
      date: new Date().toLocaleDateString('de-DE'),
      problem: pesrForm.problem.trim(),
      goal: smartGoalForm.customGoal.trim(),
      intervention: interventions.map(i => `${i.time} - ${i.measure}: ${i.details}`).join('\n'),
      pesr: {
        problem: pesrForm.problem.trim(),
        etiology: pesrForm.etiology.trim(),
        symptoms: pesrForm.symptoms.trim(),
        resources: pesrForm.resources.trim()
      },
      smartGoal: {
        targetText: smartGoalForm.customGoal.trim(),
        specific: smartGoalForm.action.trim(),
        measurable: smartGoalForm.measurable.trim(),
        achievable: smartGoalForm.attainable.trim(),
        realistic: smartGoalForm.realistic.trim(),
        timebound: smartGoalForm.timebound.trim()
      },
      interventionsList: interventions
    };

    // Prepend new care plan to history
    const updatedPlanList = [advancedPlan, ...(currentPatient.pflegeplanung || [])];

    // Call PUT /api/patients/:id/pflegeplanung
    fetch(`/api/patients/${currentPatient.id}/pflegeplanung`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pflegeplanung: updatedPlanList })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          // Update local state
          setPatients(prev => prev.map(p => {
            if (p.id === currentPatient.id) {
              return { ...p, pflegeplanung: updatedPlanList };
            }
            return p;
          }));
          triggerToast("Pflegeplanung erfolgreich gespeichert!");
          setMode('view');
          setSelectedPlanIndex(0); // Automatically select the newly created care plan
        } else {
          alert("Fehler beim Speichern auf dem Server.");
        }
      })
      .catch(err => {
        console.error("Error saving plan:", err);
        // Local-only save fallback
        setPatients(prev => prev.map(p => {
          if (p.id === currentPatient.id) {
            return { ...p, pflegeplanung: updatedPlanList };
          }
          return p;
        }));
        triggerToast("Pflegeplanung lokal gespeichert! (Verbindung zum Server fehlgeschlagen)");
        setMode('view');
        setSelectedPlanIndex(0); // Select the newly created care plan
      });
  };

  const handlePrint = () => {
    window.print();
  };

  // Extract patient assessment values for quick reference display
  const assessmentSummary = useMemo(() => {
    if (!currentPatient || !currentPatient.assessmentsHistory) return [];
    const map = new Map();
    currentPatient.assessmentsHistory.forEach(a => {
      if (!map.has(a.type)) {
        map.set(a.type, a);
      }
    });
    return Array.from(map.values());
  }, [currentPatient]);

  return (
    <div className="pp-container">
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          zIndex: 1000,
          fontWeight: 600,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          ✅ {toast.text}
        </div>
      )}

      {/* WORKSPACE (Full width now, no left sidebar) */}
      <main className="pp-workspace">
        {/* App Control Bar */}
        <div className="pp-control-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              className="pp-breadcrumb"
              onClick={onHome}
              style={{ cursor: onHome ? 'pointer' : 'default' }}
              title={onHome ? "Zurück zur Startseite" : ""}
            >
              <span className="pp-breadcrumb-icon"><LogoPlanning /></span>
              <span>Pflegeplanung</span>
            </div>
          </div>
          
          {/* Top-Down Dropdown Selectors */}
          <div className="pp-top-selectors">
            {/* Station Dropdown */}
            <div className="pp-selector-group">
              <span className="pp-selector-label">Bereich:</span>
              <select 
                className="pp-dropdown-select"
                value={selectedStationFilter}
                onChange={e => setSelectedStationFilter(e.target.value)}
              >
                <option value="ALL">Alle Stationen</option>
                <option value="Station 1">Station 1</option>
                <option value="Station 2">Station 2</option>
              </select>
            </div>

            {/* Patient Dropdown */}
            <div className="pp-selector-group">
              <span className="pp-selector-label">Patient:</span>
              {isLoading ? (
                <select className="pp-dropdown-select" disabled><option>Lade...</option></select>
              ) : (
                <select 
                  className="pp-dropdown-select"
                  style={{ minWidth: '220px' }}
                  value={selectedPatientId || ''}
                  onChange={e => setSelectedPatientId(parseInt(e.target.value))}
                >
                  {filteredPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Zi. {p.room || 'N/A'})
                    </option>
                  ))}
                  {filteredPatients.length === 0 && (
                    <option value="">Keine Patienten</option>
                  )}
                </select>
              )}
            </div>
          </div>

          <div className="pp-actions">
            {currentPatient && mode === 'view' && selectedPlanIndex !== null && (
              <button className="pp-btn pp-btn-outline" onClick={handlePrint}>
                <span>🖨️</span> Plan drucken
              </button>
            )}
            {mode === 'wizard' && (
              <button className="pp-btn pp-btn-outline" onClick={() => setMode('view')}>
                <span>❌</span> Abbrechen
              </button>
            )}
            <UserProfileMenu
              variant="light"
              userRole={userRole}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
              onOpenAuthModal={onOpenAuthModal}
              onOpenAvatarPicker={onOpenAvatarPicker}
            />
          </div>
        </div>

        {/* View Mode: Stammdaten + History List + Mockup Details */}
        {mode === 'view' && currentPatient && (
          <div className="pp-main-layout">
            
            {/* 1. Patient Stammdaten Details Card */}
            <div className="pp-patient-details-card">
              <div className="pp-details-header">
                <span className="pp-details-title">👤 Stammdaten & Patientendetails</span>
                <span className="pp-tag" style={{ backgroundColor: 'var(--odoo-purple)', color: 'white', fontWeight: 600 }}>
                  Pflegegrad {currentPatient.pflegegrad || '2'}
                </span>
              </div>
              <div className="pp-details-grid">
                <div className="pp-detail-item">
                  <span className="pp-detail-label">Name</span>
                  <span className="pp-detail-value">{currentPatient.name}</span>
                </div>
                <div className="pp-detail-item">
                  <span className="pp-detail-label">Geburtsdatum</span>
                  <span className="pp-detail-value">{currentPatient.dob}</span>
                </div>
                <div className="pp-detail-item">
                  <span className="pp-detail-label">Geschlecht</span>
                  <span className="pp-detail-value">{currentPatient.stammdaten?.gender || 'Männlich'}</span>
                </div>
                <div className="pp-detail-item">
                  <span className="pp-detail-label">Versicherungsnr.</span>
                  <span className="pp-detail-value">{currentPatient.versicherungsnummer || 'N/A'}</span>
                </div>
                <div className="pp-detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="pp-detail-label">Hausarzt</span>
                  <span className="pp-detail-value">{currentPatient.stammdaten?.doctor || 'Unbekannt'}</span>
                </div>
                <div className="pp-detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="pp-detail-label">Angehöriger (Notfallkontakt)</span>
                  <span className="pp-detail-value">{currentPatient.stammdaten?.emergencyContact || 'Keine Angaben'}</span>
                </div>
              </div>
              
              {/* Diagnoses inline pills */}
              {currentPatient.diagnosen && currentPatient.diagnosen.length > 0 && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                  <span className="pp-detail-label" style={{ display: 'block', marginBottom: '6px' }}>Medizinische Diagnosen</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {currentPatient.diagnosen.map((d, idx) => (
                      <span key={idx} className="pp-tag" style={{ backgroundColor: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                        <strong>{d.icd}</strong>: {d.title} ({d.status})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Care Plan History (Pflegeplanungs-Historie) */}
            <div className="pp-history-card">
              <div className="pp-history-title-row">
                <h4 style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>🕒 Pflegeplanungs-Historie (Lernübungen)</h4>
                <button className="pp-btn pp-btn-primary" onClick={handleStartWizard}>
                  ➕ Neue Pflegeplanung erstellen
                </button>
              </div>

              {!currentPatient.pflegeplanung || currentPatient.pflegeplanung.length === 0 ? (
                <div style={{ padding: '24px', textAlignment: 'center', border: '1px dashed #d1d5db', borderRadius: '6px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                    Noch keine Pflegeplanung für diesen Patienten hinterlegt.
                  </p>
                  <button className="pp-btn pp-btn-primary" style={{ margin: '0 auto' }} onClick={handleStartWizard}>
                    Erste Pflegeplanung erstellen
                  </button>
                </div>
              ) : (
                <div className="pp-history-list">
                  {currentPatient.pflegeplanung.map((plan, idx) => {
                    const planDate = plan.date || '12.03.2026';
                    return (
                      <div 
                        key={idx}
                        className={`pp-history-item ${selectedPlanIndex === idx ? 'active' : ''}`}
                        onClick={() => setSelectedPlanIndex(idx)}
                      >
                        <div className="pp-history-info">
                          <span className="pp-history-icon">📋</span>
                          <div>
                            <span className="pp-history-name">Pflegeplanung {currentPatient.pflegeplanung.length - idx}</span>
                            <span style={{ margin: '0 8px', color: '#d1d5db' }}>•</span>
                            <span className="pp-history-date">Erstellt am {planDate}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {plan.isAdvanced && <span className="pp-tag" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.7rem' }}>PESR + 7W</span>}
                          <span style={{ fontSize: '0.85rem', color: selectedPlanIndex === idx ? 'var(--odoo-purple)' : '#9ca3af' }}>
                            {selectedPlanIndex === idx ? 'Ausgeklappt ▾' : 'Details anzeigen ▸'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Render Expanded care plan details mockup */}
            {selectedPlanIndex !== null && selectedCarePlan && (
              <div className="pp-mockup-wrapper">
                
                {/* Visual Header indicating which history entry is viewed */}
                <div style={{ padding: '10px 16px', backgroundColor: '#eae6ea', borderRadius: '6px', border: '1px solid #714b67', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--odoo-purple)' }}>
                    🔍 Ansicht: Pflegeplanung vom {selectedCarePlan.date || '12.03.2026'}
                  </span>
                  <button className="pp-btn pp-btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setSelectedPlanIndex(null)}>
                    Schließen ✕
                  </button>
                </div>

                {/* Patient Header Card */}
                <div className="pp-patient-header-card">
                  <div className="pp-header-left">
                    <div className="pp-header-name">{currentPatient.name}</div>
                    <div className="pp-header-meta">
                      <span>📅 {currentPatient.dob}</span>
                      <span>🏥 Station {currentPatient.station || 'Station 1'}</span>
                      <span>🚪 Zimmer {currentPatient.room || 'N/A'}</span>
                      <span>🛡️ {currentPatient.krankenkasse || 'GKV'}</span>
                    </div>
                  </div>
                  <div className="pp-header-right">
                    <div>PLAN AUTOR</div>
                    <div className="pp-author-label">{userRole === 'teacher' ? 'Sr. Elena (RN)' : 'Pflegeschüler (Student)'}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>Erstellt: {selectedCarePlan.date || '12.03.2026'}</div>
                  </div>
                </div>

                {/* PESR and Resources cards */}
                <div className="pp-pesr-row">
                  {/* PESR Diagnostics */}
                  <div className="pp-card">
                    <h4 className="pp-card-title">🩺 Pflegediagnose nach PESR-Schema</h4>
                    <div className="pp-pesr-grid">
                      <div>
                        <span className="pp-badge pp-badge-problem">Problem (P)</span>
                        <div className="pp-pesr-item-text">{selectedCarePlan.pesr.problem}</div>
                      </div>
                      <div>
                        <span className="pp-badge pp-badge-etiology">Etiologie / Einflussfaktoren (E)</span>
                        <div className="pp-pesr-item-text">{selectedCarePlan.pesr.etiology}</div>
                      </div>
                      <div>
                        <span className="pp-badge pp-badge-symptoms">Symptome / Kennzeichen (S)</span>
                        {selectedCarePlan.isAdvanced ? (
                          <div className="pp-pesr-item-text">{selectedCarePlan.pesr.symptoms}</div>
                        ) : (
                          <ul className="pp-bullet-list">
                            <li>Pain score 7/10 at rest</li>
                            <li>Gangunsicherheit beim freien Gehen</li>
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resources */}
                  <div className="pp-card">
                    <h4 className="pp-card-title">💡 Ressourcen des Patienten</h4>
                    <span className="pp-badge pp-badge-resources">Ressourcen (R)</span>
                    <ul className="pp-bullet-list">
                      {selectedCarePlan.pesr.resources ? (
                        selectedCarePlan.pesr.resources.split('\n').map((res, i) => (
                          <li key={i}>{res}</li>
                        ))
                      ) : (
                        <>
                          <li>Ist hochgradig motiviert, selbstständig zu leben.</li>
                          <li>Tochter besucht täglich und unterstützt bei der Mobilisation.</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* SMART Goal Banner */}
                <div className="pp-smart-goal-banner">
                  <div className="pp-smart-badge">🎯 SMART Pflegeziel</div>
                  <div className="pp-smart-text">
                    {selectedCarePlan.isAdvanced ? (
                      <span>{selectedCarePlan.goal}</span>
                    ) : (
                      <span>
                        Patient wird selbstständig <span className="pp-smart-highlight">20 Meter</span> mit dem Rollator bei minimaler Hilfestellung und Schmerzen <span className="pp-smart-highlight">&lt; 3/10</span> innerhalb von <span className="pp-smart-highlight">14 Tagen</span> zurücklegen.
                      </span>
                    )}
                  </div>
                </div>

                {/* Interventions Table */}
                <div className="pp-table-card">
                  <div className="pp-table-header">
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>📋 Interventions & Maßnahmen-Tabelle (7W's)</h4>
                  </div>
                  <table className="pp-table">
                    <thead>
                      <tr>
                        <th style={{ width: '10%' }}>Uhrzeit</th>
                        <th style={{ width: '50%' }}>Pflegemaßnahme (7 W's)</th>
                        <th style={{ width: '15%' }}>Hilfsmittel</th>
                        <th style={{ width: '10%' }}>Zuständigkeit</th>
                        <th style={{ width: '15%' }}>Handzeichen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCarePlan.interventionsList && selectedCarePlan.interventionsList.length > 0 ? (
                        selectedCarePlan.interventionsList.map((item, idx) => (
                          <tr key={idx}>
                            <td className="pp-time-cell">{item.time} Uhr</td>
                            <td>
                              <div className="pp-measure-title">{item.measure}</div>
                              <div className="pp-measure-desc">{item.details}</div>
                            </td>
                            <td>
                              {item.hilfsmittel ? (
                                item.hilfsmittel.split(',').map((h, i) => (
                                  <span key={i} className="pp-tag">{h.trim()}</span>
                                ))
                              ) : (
                                <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Keine</span>
                              )}
                            </td>
                            <td>
                              <span className="pp-resp-badge">{item.responsibility}</span>
                            </td>
                            <td>
                              <span className="pp-sig-line"></span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ textAlignment: 'center', padding: '20px', color: '#9ca3af' }}>
                            Keine Maßnahmen definiert.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Daily Care Timeline */}
                <div className="pp-timeline-card">
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>📈 Tagesablauf & Pflege-Timeline</h4>
                  <div className="pp-timeline-wrapper">
                    <div className="pp-timeline-line"></div>
                    {selectedCarePlan.interventionsList && selectedCarePlan.interventionsList.length > 0 ? (
                      selectedCarePlan.interventionsList.map((item, idx) => {
                        const isCompleted = idx < 2;
                        return (
                          <div key={idx} className={`pp-timeline-step ${isCompleted ? 'completed' : 'upcoming'}`}>
                            <div className="pp-timeline-dot">
                              {isCompleted ? '✓' : '○'}
                            </div>
                            <span className="pp-timeline-time">{item.time}</span>
                            <span className="pp-timeline-label">{item.measure.substring(0, 10)}...</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ zIndex: 2, background: 'white', padding: '0 20px', color: '#9ca3af', fontSize: '0.85rem' }}>
                        Timeline wird nach Eintragen von Uhrzeiten gerendert.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {selectedPlanIndex === null && currentPatient.pflegeplanung && currentPatient.pflegeplanung.length > 0 && (
              <div style={{ textAlignment: 'center', padding: '40px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed #d1d5db', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💡 Bitte wählen Sie eine Pflegeplanung aus der Historienliste aus, um den detaillierten Behandlungsplan anzuzeigen.
              </div>
            )}
          </div>
        )}

        {/* Wizard Mode: Multi-step practice form with side SIS Clinical Reference (No Feedback System) */}
        {mode === 'wizard' && currentPatient && (
          <div className="pp-wizard-split-container">
            
            {/* Left Column: Form Stepper Card (Only 3 steps now) */}
            <div className="pp-wizard-form-col">
              <div className="pp-wizard-card">
                <div className="pp-wizard-header">
                  <h3 className="pp-wizard-title">Pflegeplanungs-Assistent (Schüler-Übung)</h3>
                  <p className="pp-wizard-subtitle">
                    Patient: <strong style={{ color: '#111827' }}>{currentPatient.name}</strong> • Formulieren Sie Schritt für Schritt die Pflegeplanung.
                  </p>
                </div>

                {/* Stepper progress indicator */}
                <div className="pp-stepper">
                  <div className={`pp-step-indicator ${wizardStep === 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`}>
                    <span className="pp-step-num">{wizardStep > 1 ? '✓' : '1'}</span>
                    <span>PESR Diagnose</span>
                  </div>
                  <div className={`pp-step-indicator ${wizardStep === 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`}>
                    <span className="pp-step-num">{wizardStep > 2 ? '✓' : '2'}</span>
                    <span>SMART Ziel</span>
                  </div>
                  <div className={`pp-step-indicator ${wizardStep === 3 ? 'active' : ''} ${wizardStep > 3 ? 'completed' : ''}`}>
                    <span className="pp-step-num">{wizardStep > 3 ? '✓' : '3'}</span>
                    <span>7W Maßnahmen</span>
                  </div>
                </div>

                <div className="pp-wizard-body">
                  {/* STEP 1: PESR Diagnostics */}
                  {wizardStep === 1 && (
                    <div>
                      <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>1. Formulierung der Pflegediagnose (PESR-Schema)</h4>
                      
                      <div className="pp-form-group">
                        <label className="pp-form-label">Problem (P)</label>
                        <span className="pp-form-help">Was ist das eigentliche Pflegeproblem des Patients? (z.B. "Erhöhte Sturzgefahr durch Gangunsicherheit")</span>
                        <textarea 
                          className="pp-form-textarea"
                          placeholder="Pflegeproblem eintragen..."
                          value={pesrForm.problem}
                          onChange={e => setPesrForm(prev => ({ ...prev, problem: e.target.value }))}
                        />
                      </div>

                      <div className="pp-form-group">
                        <label className="pp-form-label">Einflussfaktoren / Etiologie (E)</label>
                        <span className="pp-form-help">Was ist die Ursache oder der auslösende Faktor? (z.B. "Zustand nach Oberschenkelhalsfraktur re.")</span>
                        <textarea 
                          className="pp-form-textarea"
                          placeholder="Ursache/Einflussfaktoren eintragen..."
                          value={pesrForm.etiology}
                          onChange={e => setPesrForm(prev => ({ ...prev, etiology: e.target.value }))}
                        />
                      </div>

                      <div className="pp-form-group">
                        <label className="pp-form-label">Symptome / Kennzeichen (S)</label>
                        <span className="pp-form-help">Welche Beobachtungen stützen diese Diagnose? (z.B. "Hüftschmerz NRS 3, Verunsicherung beim Gehen")</span>
                        <textarea 
                          className="pp-form-textarea"
                          placeholder="Beobachtbare Symptome eintragen..."
                          value={pesrForm.symptoms}
                          onChange={e => setPesrForm(prev => ({ ...prev, symptoms: e.target.value }))}
                        />
                      </div>

                      <div className="pp-form-group">
                        <label className="pp-form-label">Ressourcen (R)</label>
                        <span className="pp-form-help">Welche Fähigkeiten, Antriebe oder Unterstützung hat der Patient selbst? (Ein Element pro Zeile eintragen)</span>
                        <textarea 
                          className="pp-form-textarea"
                          placeholder="Ressourcen des Patienten eintragen..."
                          value={pesrForm.resources}
                          onChange={e => setPesrForm(prev => ({ ...prev, resources: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: SMART Goal formulation */}
                  {wizardStep === 2 && (
                    <div>
                      <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>2. Formulierung des Pflegeziels (SMART-Kriterien)</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Füllen Sie die Bausteine aus, um ein SMARTes Ziel zu generieren, oder formulieren Sie den Zielsatz manuell.
                      </p>

                      <div className="pp-form-group">
                        <label className="pp-form-label">Spezifisches Vorhaben / Aktion (S)</label>
                        <span className="pp-form-help">Wer soll was tun? (z.B. "Patient wird selbstständig auf dem Flur gehen")</span>
                        <input 
                          type="text" 
                          className="pp-form-input" 
                          placeholder="z.B. Patient wird selbstständig gehen"
                          value={smartGoalForm.action}
                          onChange={e => setSmartGoalForm(prev => ({ ...prev, action: e.target.value }))}
                        />
                      </div>

                      <div className="pp-form-grid-2">
                        <div className="pp-form-group">
                          <label className="pp-form-label">Messbarkeit (M)</label>
                          <span className="pp-form-help">Woran messen wir das? (z.B. "eine Strecke von 20 Metern")</span>
                          <input 
                            type="text" 
                            className="pp-form-input" 
                            placeholder="z.B. 20 Meter zurücklegen"
                            value={smartGoalForm.measurable}
                            onChange={e => setSmartGoalForm(prev => ({ ...prev, measurable: e.target.value }))}
                          />
                        </div>
                        <div className="pp-form-group">
                          <label className="pp-form-label">Attraktiv / Hilfsmittel (A)</label>
                          <span className="pp-form-help">Womit wird das Ziel erreicht? (z.B. "unter Nutzung des Rollators")</span>
                          <input 
                            type="text" 
                            className="pp-form-input" 
                            placeholder="z.B. mit Rollator"
                            value={smartGoalForm.attainable}
                            onChange={e => setSmartGoalForm(prev => ({ ...prev, attainable: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pp-form-grid-2">
                        <div className="pp-form-group">
                          <label className="pp-form-label">Realistisch / Limit (R)</label>
                          <span className="pp-form-help">Welche Restriktion gilt? (z.B. "unter Erhaltung eines Schmerzscores &lt; 3/10")</span>
                          <input 
                            type="text" 
                            className="pp-form-input" 
                            placeholder="z.B. bei Schmerzscore < 3"
                            value={smartGoalForm.realistic}
                            onChange={e => setSmartGoalForm(prev => ({ ...prev, realistic: e.target.value }))}
                          />
                        </div>
                        <div className="pp-form-group">
                          <label className="pp-form-label">Terminiert (T)</label>
                          <span className="pp-form-help">Bis wann soll das Ziel erreicht sein? (z.B. "innerhalb von 14 Tagen")</span>
                          <input 
                            type="text" 
                            className="pp-form-input" 
                            placeholder="z.B. innerhalb von 14 Tagen"
                            value={smartGoalForm.timebound}
                            onChange={e => setSmartGoalForm(prev => ({ ...prev, timebound: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="pp-form-group" style={{ marginTop: '20px' }}>
                        <label className="pp-form-label" style={{ color: 'var(--odoo-purple)' }}>Konsolidierter Pflegeziel-Satz (Vorschau/Editor)</label>
                        <textarea 
                          className="pp-form-textarea" 
                          style={{ fontSize: '1rem', fontWeight: 500, backgroundColor: '#fdfbf7', borderColor: '#f59e0b' }}
                          value={smartGoalForm.customGoal}
                          onChange={e => setSmartGoalForm(prev => ({ ...prev, customGoal: e.target.value }))}
                          placeholder="Pflegezielsatz..."
                        />
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Interventions (7 W's) */}
                  {wizardStep === 3 && (
                    <div>
                      <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>3. Festlegung der Pflegemaßnahmen (7W-Schema)</h4>
                      
                      {/* Current Interventions list */}
                      <div style={{ marginBottom: '24px' }}>
                        <h5 style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '10px', color: '#374151' }}>Aktuell hinzugefügte Maßnahmen ({interventions.length})</h5>
                        {interventions.length === 0 ? (
                          <div style={{ padding: '16px', border: '1px dashed #d1d5db', borderRadius: '6px', fontSize: '0.85rem', color: '#9ca3af', textAlignment: 'center' }}>
                            Noch keine Maßnahmen hinzugefügt. Nutzen Sie das Formular unten, um Maßnahmen hinzuzufügen.
                          </div>
                        ) : (
                          <div className="pp-builder-list">
                            {interventions.map(item => (
                              <div key={item.id} className="pp-builder-item">
                                <div className="pp-builder-item-info">
                                  <span className="pp-builder-item-time">⏰ {item.time} Uhr ({item.responsibility})</span>
                                  <span className="pp-builder-item-title">{item.measure}</span>
                                  <span className="pp-builder-item-desc">{item.details}</span>
                                  {item.hilfsmittel && (
                                    <span style={{ marginTop: '4px' }}>
                                      {item.hilfsmittel.split(',').map((h, i) => <span key={i} className="pp-tag">{h.trim()}</span>)}
                                    </span>
                                  )}
                                </div>
                                <button 
                                  type="button" 
                                  className="pp-delete-btn" 
                                  onClick={() => handleDeleteIntervention(item.id)}
                                  title="Maßnahme löschen"
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add Intervention Subform */}
                      <form onSubmit={handleAddIntervention} className="pp-7w-box">
                        <div className="pp-7w-title">➕ Neue Pflegemaßnahme hinzufügen (Strukturierte 7-Ws)</div>
                        
                        <div className="pp-form-grid-3">
                          <div className="pp-form-group">
                            <label className="pp-form-label">Uhrzeit (Wann?)</label>
                            <input 
                              type="time" 
                              className="pp-form-input"
                              value={newIntervention.time}
                              onChange={e => setNewIntervention(prev => ({ ...prev, time: e.target.value }))}
                            />
                          </div>
                          <div className="pp-form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="pp-form-label">Bezeichnung / Was wird getan?</label>
                            <input 
                              type="text" 
                              className="pp-form-input"
                              placeholder="z.B. Mobilisation am Vormittag"
                              value={newIntervention.measure}
                              onChange={e => setNewIntervention(prev => ({ ...prev, measure: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="pp-form-grid-2" style={{ marginTop: '10px' }}>
                          <div className="pp-form-group">
                            <label className="pp-form-label">Wer führt es durch? (Wer?)</label>
                            <input 
                              type="text" 
                              className="pp-form-input"
                              placeholder="z.B. Pflegefachkraft (PK)"
                              value={newIntervention.wer}
                              onChange={e => setNewIntervention(prev => ({ ...prev, wer: e.target.value }))}
                            />
                          </div>
                          <div className="pp-form-group">
                            <label className="pp-form-label">Wie wird es durchgeführt? (Wie?)</label>
                            <input 
                              type="text" 
                              className="pp-form-input"
                              placeholder="z.B. Transfer über Bettkante unter Hilfestellung"
                              value={newIntervention.wie}
                              onChange={e => setNewIntervention(prev => ({ ...prev, wie: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="pp-form-grid-3" style={{ marginTop: '10px' }}>
                          <div className="pp-form-group">
                            <label className="pp-form-label">Hilfsmittel (Womit?)</label>
                            <input 
                              type="text" 
                              className="pp-form-input"
                              placeholder="z.B. Rollator, Gleitbrett"
                              value={newIntervention.hilfsmittel}
                              onChange={e => setNewIntervention(prev => ({ ...prev, hilfsmittel: e.target.value }))}
                            />
                          </div>
                          <div className="pp-form-group">
                            <label className="pp-form-label">Zuständigkeit (Kürzel)</label>
                            <select 
                              className="pp-form-select"
                              value={newIntervention.responsibility}
                              onChange={e => setNewIntervention(prev => ({ ...prev, responsibility: e.target.value }))}
                            >
                              <option value="RN">RN (Fachkraft)</option>
                              <option value="CNA">CNA (Hilfskraft)</option>
                              <option value="PT">PT (Physio)</option>
                              <option value="Student">Schüler</option>
                            </select>
                          </div>
                          <div className="pp-form-group">
                            <label className="pp-form-label">Worauf achten / Ziel?</label>
                            <input 
                              type="text" 
                              className="pp-form-input"
                              placeholder="z.B. Kreislauf beobachten"
                              value={newIntervention.woraufAchten}
                              onChange={e => setNewIntervention(prev => ({ ...prev, woraufAchten: e.target.value }))}
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="pp-btn pp-btn-secondary" 
                          style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
                        >
                          Maßnahme in Tabelle eintragen
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Stepper Footer Controls */}
                <div className="pp-wizard-footer">
                  <button 
                    className="pp-btn"
                    disabled={wizardStep === 1}
                    onClick={() => setWizardStep(prev => prev - 1)}
                    style={{ opacity: wizardStep === 1 ? 0.5 : 1 }}
                  >
                    ← Zurück
                  </button>
                  
                  {wizardStep < 3 ? (
                    <button 
                      className="pp-btn pp-btn-primary"
                      onClick={() => {
                        if (wizardStep === 1) {
                          if (!pesrForm.problem.trim()) {
                            alert("Bitte geben Sie zumindest ein Pflegeproblem an, bevor Sie fortfahren.");
                            return;
                          }
                          setWizardStep(2);
                        } else if (wizardStep === 2) {
                          if (!smartGoalForm.customGoal.trim()) {
                            alert("Bitte geben Sie ein Pflegeziel an, bevor Sie fortfahren.");
                            return;
                          }
                          setWizardStep(3);
                        }
                      }}
                    >
                      Weiter →
                    </button>
                  ) : (
                    <button 
                      className="pp-btn pp-btn-secondary"
                      onClick={handleSavePlan}
                    >
                      💾 Pflegeplanung speichern & abschließen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky scrollable Clinical Reference (SIS Narrative & 6 Lernfelder) */}
            <div className="pp-wizard-ref-col">
              <div className="pp-ref-card">
                <div className="pp-ref-header">
                  <span>📂</span> Patientenmappe & Pflegeplanungsinformationen
                </div>
                <div className="pp-ref-body">
                  
                  {/* Assessments and risk index */}
                  <div>
                    <h5 className="pp-ref-section-title">📊 Pflege-Assessments (Scores)</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {assessmentSummary.map((a, idx) => (
                        <div key={idx} className="pp-ref-field-val" style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--odoo-purple)' }}>{a.type.toUpperCase()}</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#111827' }}>
                            {a.score !== undefined ? `${a.score} Pkt.` : a.interpretation}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{a.interpretation}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medical Diagnoses summary */}
                  {currentPatient.diagnosen && currentPatient.diagnosen.length > 0 && (
                    <div>
                      <h5 className="pp-ref-section-title">🩺 Ärztliche Diagnosen</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {currentPatient.diagnosen.map((d, idx) => (
                          <div key={idx} className="pp-ref-field-val">
                            <strong style={{ color: '#1e40af' }}>{d.icd}</strong>: {d.title} ({d.status})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SIS 6 Themenfelder */}
                  {currentPatient.sisHistory && currentPatient.sisHistory[0] && (
                    <div>
                      <h5 className="pp-ref-section-title">📝 SIS Themenfelder (6 Lernfelder)</h5>
                      <div className="pp-ref-grid-6">
                        
                        <div className="pp-detail-item">
                          <span className="pp-ref-field-label">1. Kognitive & kommunikative Fähigkeiten</span>
                          <div className="pp-ref-field-val">{currentPatient.sisHistory[0].values.themenfeld1 || 'N/A'}</div>
                        </div>

                        <div className="pp-detail-item" style={{ marginTop: '4px' }}>
                          <span className="pp-ref-field-label">2. Mobilität & Bewegung</span>
                          <div className="pp-ref-field-val">{currentPatient.sisHistory[0].values.themenfeld2 || 'N/A'}</div>
                        </div>

                        <div className="pp-detail-item" style={{ marginTop: '4px' }}>
                          <span className="pp-ref-field-label">3. Krankheitsbezogene Anforderungen & Belastungen</span>
                          <div className="pp-ref-field-val">{currentPatient.sisHistory[0].values.themenfeld3 || 'N/A'}</div>
                        </div>

                        <div className="pp-detail-item" style={{ marginTop: '4px' }}>
                          <span className="pp-ref-field-label">4. Selbstversorgung</span>
                          <div className="pp-ref-field-val">{currentPatient.sisHistory[0].values.themenfeld4 || 'N/A'}</div>
                        </div>

                        <div className="pp-detail-item" style={{ marginTop: '4px' }}>
                          <span className="pp-ref-field-label">5. Leben in sozialen Beziehungen</span>
                          <div className="pp-ref-field-val">{currentPatient.sisHistory[0].values.themenfeld5 || 'N/A'}</div>
                        </div>

                        <div className="pp-detail-item" style={{ marginTop: '4px' }}>
                          <span className="pp-ref-field-label">6. Wohnen & Häuslichkeit</span>
                          <div className="pp-ref-field-val">{currentPatient.sisHistory[0].values.themenfeld6 || 'N/A'}</div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
