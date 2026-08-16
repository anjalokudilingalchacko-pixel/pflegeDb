import React, { useState, useMemo, useEffect } from 'react';
import './PflegeHeute.css';
import { getInitialPatients } from './patientData';


// ----------------------------------------------------
// 1. INLINE SVG PATHS FOR MODULES
// ----------------------------------------------------
const SVG_ICONS = {
  stammdaten: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  sis: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  anamnese: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  diagnosen: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  medikamente: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>,
  tagesstruktur: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  assessments: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  pflegeplanung: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  pflegebericht: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  entlassungsmanagement: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  ausscheidung: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z"/></svg>,
  wunde: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  sturzprophylaxe: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 2-8 8-4-4-5 5"/><path d="M12 2h7v7"/></svg>,
  trinkprotokoll: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/></svg>,
  dekubitus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>,
  mobilitaet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  ernaehrung: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v8c0 1.1.9 2 2 2h3Z"/><path d="M18 22V15"/></svg>,
  schmerz: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="m12 13-1-3h3l-1-3"/></svg>,
  vitalwerte: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  print: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  cross: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
};

// ----------------------------------------------------
// 2. MODULE METADATA
// ----------------------------------------------------
const MODULES = [
  { id: 'sis', title: 'SIS Narrative', group: 'A', theme: 'purple' },
  { id: 'stammdaten', title: 'Stammdaten', group: 'A', theme: 'purple' },
  { id: 'anamnese', title: 'Anamnese', group: 'A', theme: 'purple' },
  { id: 'diagnosen', title: 'Diagnosen', group: 'A', theme: 'purple' },
  { id: 'medikamente', title: 'Medikamentenplan', group: 'A', theme: 'purple' },
  { id: 'tagesstruktur', title: 'Tagesstruktur', group: 'A', theme: 'purple' },
  { id: 'assessments', title: 'Assessments', group: 'A', theme: 'purple' },
  { id: 'pflegeplanung', title: 'Pflegeplanung', group: 'A', theme: 'purple' },
  { id: 'pflegebericht', title: 'Pflegebericht', group: 'A', theme: 'purple' },
  { id: 'entlassungsmanagement', title: 'Entlassung', group: 'A', theme: 'purple' },
  
  { id: 'ausscheidung', title: 'Ausscheidung', group: 'B', theme: 'amber' },
  { id: 'wunde', title: 'Wundprotokoll', group: 'B', theme: 'amber' },
  { id: 'sturzprophylaxe', title: 'Sturzprophylaxe', group: 'B', theme: 'amber' },
  { id: 'trinkprotokoll', title: 'Trinkprotokoll', group: 'B', theme: 'amber' },
  { id: 'dekubitus', title: 'Dekubitusprophylaxe', group: 'B', theme: 'amber' },
  { id: 'mobilitaet', title: 'Mobilität', group: 'B', theme: 'amber' },
  { id: 'ernaehrung', title: 'Ernährung', group: 'B', theme: 'amber' },
  { id: 'schmerz', title: 'Schmerzprotokoll', group: 'B', theme: 'amber' },
  { id: 'vitalwerte', title: 'Vitalwerte', group: 'B', theme: 'amber' }
];

// ----------------------------------------------------
// 3. ANATOMICAL BODY HOTSPOTS
// ----------------------------------------------------
const HOTSPOTS = [
  // Vorderseite (Center X = 65)
  { id: 'Stirn', label: 'Stirn', x: 65, y: 19, side: 'front' },
  { id: 'Brust', label: 'Brust', x: 65, y: 48, side: 'front' },
  { id: 'Ellbogen links (v)', label: 'Ellbogen links', x: 36, y: 60, side: 'front' },
  { id: 'Ellbogen rechts (v)', label: 'Ellbogen rechts', x: 94, y: 60, side: 'front' },
  { id: 'Hüfte links (v)', label: 'Hüfte links', x: 50, y: 82, side: 'front' },
  { id: 'Hüfte rechts (v)', label: 'Hüfte rechts', x: 80, y: 82, side: 'front' },
  { id: 'Knie links', label: 'Knie links', x: 56.5, y: 124, side: 'front' },
  { id: 'Knie rechts', label: 'Knie rechts', x: 73.5, y: 124, side: 'front' },
  { id: 'Zehen links', label: 'Zehen links', x: 51, y: 156, side: 'front' },
  { id: 'Zehen rechts', label: 'Zehen rechts', x: 79, y: 156, side: 'front' },

  // Rückseite (Center X = 175)
  { id: 'Hinterkopf', label: 'Hinterkopf', x: 175, y: 19, side: 'back' },
  { id: 'Schulterblatt links', label: 'Schulterblatt links', x: 167, y: 46, side: 'back' },
  { id: 'Schulterblatt rechts', label: 'Schulterblatt rechts', x: 183, y: 46, side: 'back' },
  { id: 'Ellbogen links', label: 'Ellbogen links', x: 146, y: 60, side: 'back' },
  { id: 'Ellbogen rechts', label: 'Ellbogen rechts', x: 204, y: 60, side: 'back' },
  { id: 'Kreuzbein (Sakrum)', label: 'Kreuzbein (Sakrum)', x: 175, y: 82, side: 'back' },
  { id: 'Gesäß links', label: 'Gesäß links', x: 166.5, y: 94, side: 'back' },
  { id: 'Gesäß rechts', label: 'Gesäß rechts', x: 183.5, y: 94, side: 'back' },
  { id: 'Hüfte links', label: 'Hüfte links', x: 160, y: 74, side: 'back' },
  { id: 'Hüfte rechts', label: 'Hüfte rechts', x: 190, y: 74, side: 'back' },
  { id: 'Ferse links', label: 'Ferse links', x: 166.5, y: 150, side: 'back' },
  { id: 'Ferse rechts', label: 'Ferse rechts', x: 183.5, y: 150, side: 'back' }
];

export default function PflegeHeute({ onHome, userRole, user }) {
  const [patients, setPatients] = useState(() => getInitialPatients());
  const isTeacher = userRole === 'teacher' || user?.role === 'teacher';

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      })
      .catch(err => console.error("Error loading patients in PflegeHeute:", err));
  }, []);

  const savePatientToBackend = async (updatedPatient) => {
    try {
      const res = await fetch(`/api/patients/${updatedPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPatient)
      });
      if (res.ok) {
        triggerToast("Änderungen als Lehrer erfolgreich im System gespeichert!");
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      }
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  // Global State
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState('stammdaten');
  const [toastText, setToastText] = useState('');
  const [toastShow, setToastShow] = useState(false);
  const [activeCalculator, setActiveCalculator] = useState(null);

  // Signatures
  const [signer, setSigner] = useState('PM Müller');

  // SIS Selected History Index
  const [selectedSisHistIdx, setSelectedSisHistIdx] = useState(0);
  const [sisEditKey, setSisEditKey] = useState(null);
  const [sisTextVal, setSisTextVal] = useState('');
  
  // Tagesstruktur Selected History Index
  const [selectedTagesHistIdx, setSelectedTagesHistIdx] = useState(0);
  const [tagesEditKey, setTagesEditKey] = useState(null);
  const [tagesTextVal, setTagesTextVal] = useState('');

  // Expand assessment logs
  const [expandedAssessmentIdx, setExpandedAssessmentIdx] = useState(null);

  // Forms state
  const [diagIcd, setDiagIcd] = useState('');
  const [diagTitle, setDiagTitle] = useState('');
  const [diagDate, setDiagDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [diagStatus, setDiagStatus] = useState('Chronisch');

  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medIndication, setMedIndication] = useState('');
  const [medDoc, setMedDoc] = useState('');
  const [medNotes, setMedNotes] = useState('');

  const [planProb, setPlanProb] = useState('');
  const [planGoal, setPlanGoal] = useState('');
  const [planInterv, setPlanInterv] = useState('');

  const [reportText, setReportText] = useState('');
  const [reportAuthor, setReportAuthor] = useState('Müller (PM)');

  const [drinkManualAmt, setDrinkManualAmt] = useState('');
  const [drinkManualBev, setDrinkManualBev] = useState('');

  const [vitBp, setVitBp] = useState('');
  const [vitHr, setVitHr] = useState('');
  const [vitTemp, setVitTemp] = useState('');
  const [vitSugar, setVitSugar] = useState('');
  const [vitSpo2, setVitSpo2] = useState('');

  // Custom risk forms input
  const [riskAusscheidungBladder, setRiskAusscheidungBladder] = useState('');
  const [riskAusscheidungBowel, setRiskAusscheidungBowel] = useState('');
  const [riskAusscheidungRisk, setRiskAusscheidungRisk] = useState('');
  const [riskAusscheidungInterv, setRiskAusscheidungInterv] = useState('');

  const [riskWoundHas, setRiskWoundHas] = useState('Nein');
  const [riskWoundLoc, setRiskWoundLoc] = useState('');
  const [riskWoundDesc, setRiskWoundDesc] = useState('');
  const [riskWoundDressing, setRiskWoundDressing] = useState('');
  const [riskWoundSchedule, setRiskWoundSchedule] = useState('');

  const [riskSturzLevel, setRiskSturzLevel] = useState('Niedrig');
  const [riskSturzMeasures, setRiskSturzMeasures] = useState('');

  const [riskDekuLevel, setRiskDekuLevel] = useState('Niedrig');
  const [riskDekuLoc, setRiskDekuLoc] = useState('');
  const [riskDekuMeasures, setRiskDekuMeasures] = useState('');

  const [riskMobStatus, setRiskMobStatus] = useState('');
  const [riskMobAids, setRiskMobAids] = useState('');
  const [riskMobTransfers, setRiskMobTransfers] = useState('');

  const [riskDietKostform, setRiskDietKostform] = useState('');
  const [riskDietSoll, setRiskDietSoll] = useState('');
  const [riskDietWeight, setRiskDietWeight] = useState('');
  const [riskDietProblems, setRiskDietProblems] = useState('');

  const [riskSchmerzStatus, setRiskSchmerzStatus] = useState('');
  const [riskSchmerzTherapy, setRiskSchmerzTherapy] = useState('');
  const [riskSchmerzLast, setRiskSchmerzLast] = useState('');

  // Show dynamic toast helper
  const triggerToast = (message) => {
    setToastText(message);
    setToastShow(true);
    setTimeout(() => setToastShow(false), 3000);
  };

  // Helper date function
  const getNowFormatted = () => {
    const now = new Date();
    return `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth()+1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  // Filter patients based on station select
  const filteredPatients = useMemo(() => {
    if (selectedStation === 'ALL') return patients;
    return patients.filter(p => p.station === selectedStation);
  }, [patients, selectedStation]);

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Statistics calculation for launcher toolbar
  const stats = useMemo(() => {
    const total = patients.length;
    const complete = patients.filter(p => p.status === 'vollstaendig').length;
    const progress = patients.filter(p => p.status === 'bearbeitung').length;
    const incomplete = patients.filter(p => p.status === 'unvollstaendig').length;
    return { total, complete, progress, incomplete };
  }, [patients]);

  const handleStationChange = (e) => {
    setSelectedStation(e.target.value);
    setSelectedPatientId(null);
  };

  const handlePatientChange = (e) => {
    const val = e.target.value;
    if (val === 'NONE') {
      setSelectedPatientId(null);
    } else {
      setSelectedPatientId(parseInt(val));
      setSelectedSisHistIdx(0);
      setSelectedTagesHistIdx(0);
      setExpandedAssessmentIdx(null);
      setActiveCalculator(null);
    }
  };

  const handleSaveSIS = (key) => {
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      
      const currentValues = p.sisHistory[0]?.values || {};
      const updatedValues = { ...currentValues, [key]: sisTextVal };
      
      const newHistoryItem = {
        date: dateStr,
        user: signer,
        values: updatedValues
      };

      let status = p.status;
      if (status === 'unvollstaendig') status = 'bearbeitung';

      return {
        ...p,
        sisHistory: [newHistoryItem, ...p.sisHistory],
        status
      };
    }));

    setSisEditKey(null);
    setSelectedSisHistIdx(0);
    triggerToast("SIS Narrative als neuen Verlaufseintrag gespeichert!");
  };

  const handleSaveTagesstruktur = (key) => {
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      
      const currentValues = p.tagesstrukturHistory[0]?.values || {};
      const updatedValues = { ...currentValues, [key]: tagesTextVal };

      const newHistoryItem = {
        date: dateStr,
        user: signer,
        values: updatedValues
      };

      return {
        ...p,
        tagesstrukturHistory: [newHistoryItem, ...p.tagesstrukturHistory]
      };
    }));

    setTagesEditKey(null);
    setSelectedTagesHistIdx(0);
    triggerToast("Tagesstruktur als neuen Verlaufseintrag aktualisiert!");
  };

  const handleAddDiagnosis = (e) => {
    e.preventDefault();
    if (!diagIcd.trim() || !diagTitle.trim() || !diagDate) {
      alert("Bitte füllen Sie ICD-10 Code, Bezeichnung und Datum aus.");
      return;
    }

    const dateParts = diagDate.split('-');
    const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      return {
        ...p,
        diagnosen: [{ icd: diagIcd.trim(), title: diagTitle.trim(), date: formattedDate, status: diagStatus }, ...p.diagnosen]
      };
    }));

    setDiagIcd('');
    setDiagTitle('');
    setDiagStatus('Chronisch');
    triggerToast("Diagnose erfolgreich dokumentiert!");
  };

  const handleAddMedication = (e) => {
    e.preventDefault();
    if (!medName.trim() || !medDose.trim() || !medIndication.trim() || !medDoc.trim()) {
      alert("Bitte füllen Sie Präparat, Dosis, Indikation und Verordner aus.");
      return;
    }

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      return {
        ...p,
        medikamente: [{
          name: medName.trim(),
          dose: medDose.trim(),
          indication: medIndication.trim(),
          prescribedBy: medDoc.trim(),
          notes: medNotes.trim() || 'Keine Einschränkungen'
        }, ...p.medikamente]
      };
    }));

    setMedName('');
    setMedDose('');
    setMedIndication('');
    setMedDoc('');
    setMedNotes('');
    triggerToast("Medikament erfolgreich in Historie eingetragen!");
  };

  const handleAddPlanning = (e) => {
    e.preventDefault();
    if (!planProb.trim() || !planGoal.trim() || !planInterv.trim()) {
      alert("Bitte füllen Sie Problem, Ziel und Maßnahmen aus.");
      return;
    }

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      return {
        ...p,
        pflegeplanung: [{ problem: planProb.trim(), goal: planGoal.trim(), intervention: planInterv.trim() }, ...p.pflegeplanung]
      };
    }));

    setPlanProb('');
    setPlanGoal('');
    setPlanInterv('');
    triggerToast("Pflegeplanung hinzugefügt!");
  };

  const handleAddReport = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    const dateStr = getNowFormatted();

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      return {
        ...p,
        pflegebericht: [{ date: dateStr, user: reportAuthor, text: reportText.trim() }, ...p.pflegebericht]
      };
    }));

    setReportText('');
    triggerToast("Pflegeberichts-Eintrag verfasst!");
  };

  const handleToggleDischarge = (idx) => {
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const items = p.entlassungsmanagement.items.map((item, curIdx) => {
        if (curIdx !== idx) return item;
        return { ...item, checked: !item.checked };
      });
      return { ...p, entlassungsmanagement: { items } };
    }));
  };

  const handleAddDrink = (amount, beverage) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      return {
        ...p,
        trinkprotokoll: {
          ...p.trinkprotokoll,
          logs: [...p.trinkprotokoll.logs, { time: timeStr, amount, beverage }]
        }
      };
    }));
    triggerToast(`${amount}ml ${beverage} hinzugefügt!`);
  };

  const handleAddDrinkManual = (e) => {
    e.preventDefault();
    if (!drinkManualAmt || !drinkManualBev.trim()) return;
    handleAddDrink(parseInt(drinkManualAmt), drinkManualBev.trim());
    setDrinkManualAmt('');
    setDrinkManualBev('');
  };

  const handleAddVital = (e) => {
    e.preventDefault();
    if (!vitBp.trim() || !vitHr || !vitTemp.trim()) {
      alert("Bitte füllen Sie mindestens Blutdruck, Puls und Temperatur aus.");
      return;
    }

    const dateStr = getNowFormatted();

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      return {
        ...p,
        vitalwerte: [{
          date: dateStr,
          bp: vitBp.trim(),
          hr: parseInt(vitHr),
          temp: vitTemp.trim(),
          sugar: vitSugar ? parseInt(vitSugar) : null,
          spo2: vitSpo2 ? parseInt(vitSpo2) : null
        }, ...p.vitalwerte]
      };
    }));

    setVitBp('');
    setVitHr('');
    setVitTemp('');
    setVitSugar('');
    setVitSpo2('');
    triggerToast("Vitalwerte erfolgreich erfasst!");
  };

  // Assessment Calculators Save
  const handleSaveBarthelCalc = (score, values, interp) => {
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newAssessmentItem = {
        date: dateStr,
        user: signer,
        type: "barthel",
        score,
        values,
        interpretation: interp
      };
      return {
        ...p,
        assessmentsHistory: [newAssessmentItem, ...p.assessmentsHistory]
      };
    }));
    setActiveCalculator(null);
    triggerToast("Barthel-Index erfolgreich als Verlaufseintrag aktualisiert!");
  };

  const handleSaveBradenCalc = (score, values, interp) => {
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newAssessmentItem = {
        date: dateStr,
        user: signer,
        type: "braden",
        score,
        values,
        interpretation: interp
      };
      return {
        ...p,
        assessmentsHistory: [newAssessmentItem, ...p.assessmentsHistory],
        dekubitusHistory: [{
          date: dateStr,
          user: signer,
          riskLevel: `${interp} (Score: ${score})`,
          location: "Kreuzbein (Sakrum)", // default to sacrum for Braden triggers
          measures: p.dekubitusHistory[0]?.measures || []
        }, ...p.dekubitusHistory]
      };
    }));
    setActiveCalculator(null);
    triggerToast("Braden-Skala erfolgreich als Verlaufseintrag aktualisiert!");
  };

  const handleSaveNRSCalc = (score, interp) => {
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newAssessmentItem = {
        date: dateStr,
        user: signer,
        type: "nrs",
        score,
        values: {},
        interpretation: interp
      };
      return {
        ...p,
        assessmentsHistory: [newAssessmentItem, ...p.assessmentsHistory],
        schmerzHistory: [{
          date: dateStr,
          user: signer,
          status: score === 0 ? "Schmerzfrei" : `${interp} (NRS Score: ${score})`,
          therapy: p.schmerzHistory[0]?.therapy || "Keine Dauermedikation vorhanden.",
          lastAssessment: `${dateStr.substring(0, 10)} - NRS ${score}`
        }, ...p.schmerzHistory]
      };
    }));
    setActiveCalculator(null);
    triggerToast("NRS-Schmerzwert als Verlaufseintrag aktualisiert!");
  };

  // RISK LOGS SAVE HANDLERS
  const handleSaveAusscheidung = (e) => {
    e.preventDefault();
    if (!riskAusscheidungBladder.trim() || !riskAusscheidungBowel.trim() || !riskAusscheidungRisk.trim()) {
      alert("Bitte füllen Sie Harninkontinenz, Stuhlausscheidung und Obstipationsrisiko aus.");
      return;
    }
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        continenceBladder: riskAusscheidungBladder.trim(),
        continenceBowel: riskAusscheidungBowel.trim(),
        obstipationRisk: riskAusscheidungRisk.trim(),
        interventions: riskAusscheidungInterv.trim() || "Keine besonderen Interventionen."
      };
      return { ...p, ausscheidungHistory: [newItem, ...p.ausscheidungHistory] };
    }));
    setRiskAusscheidungBladder('');
    setRiskAusscheidungBowel('');
    setRiskAusscheidungRisk('');
    setRiskAusscheidungInterv('');
    triggerToast("Ausscheidungsbericht hinzugefügt!");
  };

  const handleSaveWundbericht = (e) => {
    e.preventDefault();
    if (!riskWoundLoc.trim() && riskWoundHas === 'Ja') {
      alert("Bitte wählen Sie eine Lokalisation auf dem Körperschema aus.");
      return;
    }
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        hasWound: riskWoundHas === 'Ja',
        location: riskWoundHas === 'Ja' ? riskWoundLoc.trim() : '-',
        status: riskWoundDesc.trim() || (riskWoundHas === 'Ja' ? 'Narbe / Wunde behandlungsbedürftig.' : 'Haut intakt.'),
        dressing: riskWoundDressing.trim() || '-',
        schedule: riskWoundSchedule.trim() || '-'
      };
      return { ...p, wundeHistory: [newItem, ...p.wundeHistory] };
    }));
    setRiskWoundLoc('');
    setRiskWoundDesc('');
    setRiskWoundDressing('');
    setRiskWoundSchedule('');
    triggerToast("Wundprotokolleintrag erstellt!");
  };

  const handleSaveSturzprophylaxe = (e) => {
    e.preventDefault();
    const dateStr = getNowFormatted();
    const measuresArray = riskSturzMeasures.trim() 
      ? riskSturzMeasures.split('\n').filter(l => l.trim() !== '') 
      : ["Allgemeine Sturzberatung erfolgt."];

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        riskLevel: riskSturzLevel,
        measures: measuresArray
      };
      return { ...p, sturzprophylaxeHistory: [newItem, ...p.sturzprophylaxeHistory] };
    }));
    setRiskSturzMeasures('');
    triggerToast("Sturzprophylaxeeintrag erfasst!");
  };

  const handleSaveDekubitus = (e) => {
    e.preventDefault();
    if (!riskDekuLoc.trim() && riskDekuLevel !== 'Niedrig') {
      alert("Bitte wählen Sie das gefährdete Areal auf dem Körperschema aus.");
      return;
    }
    const dateStr = getNowFormatted();
    const measuresArray = riskDekuMeasures.trim() 
      ? riskDekuMeasures.split('\n').filter(l => l.trim() !== '') 
      : ["Regelmäßige Hautpflege."];

    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        riskLevel: riskDekuLevel,
        location: riskDekuLevel !== 'Niedrig' ? riskDekuLoc.trim() : '-',
        measures: measuresArray
      };
      return { ...p, dekubitusHistory: [newItem, ...p.dekubitusHistory] };
    }));
    setRiskDekuLoc('');
    setRiskDekuMeasures('');
    triggerToast("Dekubitusprophylaxeeintrag erfasst!");
  };

  const handleSaveMobilaet = (e) => {
    e.preventDefault();
    if (!riskMobStatus.trim()) {
      alert("Bitte füllen Sie den Mobilitätsstatus aus.");
      return;
    }
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        status: riskMobStatus.trim(),
        aids: riskMobAids.trim() || 'Keine Hilfsmittel',
        transfers: riskMobTransfers.trim() || 'Selbstständig'
      };
      return { ...p, mobilitaetHistory: [newItem, ...p.mobilitaetHistory] };
    }));
    setRiskMobStatus('');
    setRiskMobAids('');
    setRiskMobTransfers('');
    triggerToast("Mobilitätseintrag dokumentiert!");
  };

  const handleSaveErnaehrung = (e) => {
    e.preventDefault();
    if (!riskDietKostform.trim() || !riskDietWeight.trim()) {
      alert("Bitte füllen Sie Kostform und Gewicht aus.");
      return;
    }
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        diet: riskDietKostform.trim(),
        fluidTarget: riskDietSoll.trim() || '1500 ml',
        weight: riskDietWeight.trim(),
        problems: riskDietProblems.trim() || 'Keine Einschränkungen'
      };
      return { ...p, ernaehrungHistory: [newItem, ...p.ernaehrungHistory] };
    }));
    setRiskDietKostform('');
    setRiskDietSoll('');
    setRiskDietWeight('');
    setRiskDietProblems('');
    triggerToast("Ernährungsbericht eingetragen!");
  };

  const handleSaveSchmerz = (e) => {
    e.preventDefault();
    if (!riskSchmerzStatus.trim()) {
      alert("Bitte füllen Sie den Schmerzbefund aus.");
      return;
    }
    const dateStr = getNowFormatted();
    setPatients(prev => prev.map(p => {
      if (p.id !== selectedPatientId) return p;
      const newItem = {
        date: dateStr,
        user: signer,
        status: riskSchmerzStatus.trim(),
        therapy: riskSchmerzTherapy.trim() || 'Keine Dauermedikation',
        lastAssessment: riskSchmerzLast.trim() || `${dateStr.substring(0,10)}`
      };
      return { ...p, schmerzHistory: [newItem, ...p.schmerzHistory] };
    }));
    setRiskSchmerzStatus('');
    setRiskSchmerzTherapy('');
    setRiskSchmerzLast('');
    triggerToast("Schmerzberichteintrag erstellt!");
  };

  return (
    <div className="pflege-heute-workspace">
      {/* Toast popup */}
      <div className={`ph-toast ${toastShow ? 'show' : ''}`}>
        <span>{toastText}</span>
      </div>

      {/* Internal Ribbon Stats */}
      <div className="ph-stats-toolbar">
        <div className="stats-indicator">
          <span className="dot" style={{ backgroundColor: 'var(--odoo-purple)' }}></span>
          <span>Patienten gesamt: <strong>{stats.total}</strong></span>
        </div>
        <div className="stats-indicator">
          <span className="dot green"></span>
          <span>Vollständig: <strong>{stats.complete}</strong></span>
        </div>
        <div className="stats-indicator">
          <span className="dot yellow"></span>
          <span>In Bearbeitung: <strong>{stats.progress}</strong></span>
        </div>
        <div className="stats-indicator">
          <span className="dot red"></span>
          <span>Unvollständig: <strong>{stats.incomplete}</strong></span>
        </div>

        {/* Global Staff Signature Selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label className="ph-form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Digitale Unterschrift:</label>
          <select 
            className="ph-form-select" 
            style={{ width: '180px', padding: '4px 8px' }}
            value={signer} 
            onChange={e => setSigner(e.target.value)}
          >
            <option value="PM Müller">Müller (Pflegefachkraft)</option>
            <option value="PW Wagner">Wagner (Pflegeassistent)</option>
            <option value="FS Schmidt">Schmidt (Pflegeschüler/in)</option>
          </select>
        </div>
      </div>

      <div className="ph-split-layout">
        
        {/* LEFT COLUMN: Patient Selection & Folder Tabs */}
        <aside className="ph-left-column">
          
          {/* Patient Selection Card */}
          <div className="ph-panel-card">
            <h4 className="ph-panel-title">
              🔍 Patienten-Filter
            </h4>
            <div className="ph-form-group">
              <label className="ph-form-label">Station / Bereich</label>
              <select className="ph-form-select" value={selectedStation} onChange={handleStationChange}>
                <option value="ALL">Alle Stationen / Bereiche</option>
                <option value="Station 1">Station 1</option>
                <option value="Station 2">Station 2</option>
                <option value="Station 3">Station 3</option>
                <option value="Krankenhaus">Krankenhaus</option>
                <option value="Allgemeinchirurgie">Allgemeinchirurgie</option>
              </select>
            </div>
            
            <div className="ph-form-group">
              <label className="ph-form-label">Patienten-Akte</label>
              <select 
                className="ph-form-select" 
                value={selectedPatientId || 'NONE'} 
                onChange={handlePatientChange}
              >
                <option value="NONE">-- Bitte Patient auswählen --</option>
                {filteredPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Pg {p.pflegegrad} - Rm {p.room})
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div className="ph-patient-mini-card">
                <div className="name-row">
                  <span className="name">{selectedPatient.name}</span>
                  <span className={`badge status-${selectedPatient.status}`}>
                    {selectedPatient.status === 'vollstaendig' ? 'Vollständig' : selectedPatient.status === 'bearbeitung' ? 'In Arbeit' : 'Unvollständig'}
                  </span>
                </div>
                {selectedPatient.allergies && selectedPatient.allergies !== 'Keine' && (
                  <div className="allergies-banner">⚠️ Allergie: {selectedPatient.allergies}</div>
                )}
                <div className="details-grid">
                  <div><strong>Geb.:</strong> {selectedPatient.dob}</div>
                  <div><strong>Raum:</strong> {selectedPatient.room}</div>
                  <div><strong>Pflegegrad:</strong> {selectedPatient.pflegegrad}</div>
                  <div><strong>Aufnahme:</strong> {selectedPatient.admissionDate}</div>
                </div>
                
                <div className="checklist-title">Unterlagen:</div>
                <div className="doc-checklist">
                  {['pflegevertrag', 'patientenverfuegung', 'betreuungsverfuegung', 'medikamentenplan', 'vorsorgevollmacht'].map(docKey => {
                    const available = selectedPatient.checklist ? selectedPatient.checklist[docKey] : false;
                    const label = docKey.replace('verfuegung', 'verfügung').replace('pflegevertrag', 'Pflegevertrag').replace('patienten', 'Patienten').replace('betreuungs', 'Betreuungs').replace('medikamentenplan', 'Medikamentenplan').replace('vorsorgevollmacht', 'Vorsorgevollmacht');
                    return (
                      <div key={docKey} className="checklist-row">
                        <span className={`icon ${available ? 'check' : 'cross'}`}>
                          {available ? SVG_ICONS.check : SVG_ICONS.cross}
                        </span>
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="ph-print-btn" onClick={() => window.print()}>
                  {SVG_ICONS.print} Akte drucken
                </button>
              </div>
            )}
          </div>

          {/* Box A Tabs */}
          <div className="ph-panel-card">
            <h4 className="ph-panel-title" style={{ color: 'var(--odoo-purple)' }}>
              Box A — Basisdokumentation
            </h4>
            <div className="ph-tabs-grid">
              {MODULES.filter(m => m.group === 'A').map(m => (
                <button
                  key={m.id}
                  className={`ph-module-tab ${selectedModuleId === m.id ? 'active' : ''}`}
                  disabled={!selectedPatientId}
                  onClick={() => setSelectedModuleId(m.id)}
                >
                  {SVG_ICONS[m.id]}
                  <span>{m.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Box B Tabs */}
          <div className="ph-panel-card">
            <h4 className="ph-panel-title" style={{ color: 'var(--amber-primary)' }}>
              Box B — Risiko- & Zusatzmodule
            </h4>
            <div className="ph-tabs-grid">
              {MODULES.filter(m => m.group === 'B').map(m => (
                <button
                  key={m.id}
                  className={`ph-module-tab amber ${selectedModuleId === m.id ? 'active' : ''}`}
                  disabled={!selectedPatientId}
                  onClick={() => setSelectedModuleId(m.id)}
                >
                  {SVG_ICONS[m.id]}
                  <span>{m.title}</span>
                </button>
              ))}
            </div>
          </div>

        </aside>

        {/* RIGHT COLUMN: Content Panel Viewport */}
        <main className="ph-right-column">
          {selectedPatient ? (
            <div className="ph-viewport-content">
              <header className="ph-viewport-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 
                  className="ph-viewport-title" 
                  onClick={onHome} 
                  style={{ cursor: onHome ? 'pointer' : 'default' }}
                  title={onHome ? "Zurück zur Startseite" : ""}
                >
                  {SVG_ICONS[selectedModuleId]}
                  {MODULES.find(m => m.id === selectedModuleId)?.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="ph-patient-tag">Patient: {selectedPatient.name}</span>
                  {isTeacher && (
                    <button 
                      onClick={() => savePatientToBackend(selectedPatient)}
                      style={{ background: '#d97706', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                      title="Alle vorgenommenen Lehrer-Änderungen in der Datenbank speichern"
                    >
                      💾 Als Lehrer Speichern (Sync DB)
                    </button>
                  )}
                </div>
              </header>
              <div className="ph-viewport-body">
                {renderModuleContent(selectedPatient)}
              </div>
            </div>
          ) : (
            <div className="ph-empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              <h3 
                onClick={onHome} 
                style={{ cursor: onHome ? 'pointer' : 'default' }}
                title={onHome ? "Zurück zur Startseite" : ""}
              >
                PflegeHeute Dokumentation
              </h3>
              <p>Bitte wählen Sie im linken Panel einen Patienten aus, um dessen elektronische Dokumentenakte zu öffnen und zu bearbeiten.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // 4. VIEWPORTS RENDERING SWITCHER
  // ----------------------------------------------------
  function renderModuleContent(patient) {
    switch (selectedModuleId) {
      case 'stammdaten':
        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Allgemeine Stammdaten</div>
              <table className="ph-table">
                <tbody>
                  <tr><td><strong>Geschlecht</strong></td><td>{patient.stammdaten.gender}</td></tr>
                  <tr><td><strong>Adresse</strong></td><td>{patient.stammdaten.address}</td></tr>
                  <tr><td><strong>Telefonnummer</strong></td><td>{patient.stammdaten.phone}</td></tr>
                  <tr><td><strong>Familienstand</strong></td><td>{patient.stammdaten.maritalStatus}</td></tr>
                  <tr><td><strong>Konfession</strong></td><td>{patient.stammdaten.religion}</td></tr>
                  <tr><td><strong>Station / Zimmer</strong></td><td>{patient.station} / Raum {patient.room}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="ph-card">
              <div className="ph-card-title">Notfallkontakt & Arztinformation</div>
              <table className="ph-table">
                <tbody>
                  <tr><td><strong>Angehöriger / Betreuer</strong></td><td>{patient.stammdaten.emergencyContact}</td></tr>
                  <tr><td><strong>Behandelnder Hausarzt</strong></td><td>{patient.stammdaten.doctor}</td></tr>
                </tbody>
              </table>
            </div>
          </>
        );

      case 'sis':
        const activeSIS = patient.sisHistory[selectedSisHistIdx] || patient.sisHistory[0];
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                💡 Wählen Sie rechts einen historischen Dokumentationsstand aus:
              </div>
              <div>
                <select 
                  className="ph-form-select"
                  style={{ width: '220px' }}
                  value={selectedSisHistIdx}
                  onChange={e => {
                    setSelectedSisHistIdx(parseInt(e.target.value));
                    setSisEditKey(null);
                  }}
                >
                  {patient.sisHistory.map((sh, idx) => (
                    <option key={idx} value={idx}>
                      {sh.date} ({sh.user}) {idx === 0 ? '[LATEST]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ph-sis-grid">
              {[
                { key: 'themenfeld1', label: '1. Kognition und Kommunikation', desc: 'Verstehen, Mitteilen, Orientierung, Erinnern, Strukturierung.' },
                { key: 'themenfeld2', label: '2. Mobilität und Beweglichkeit', desc: 'Lageveränderung, Körperposition, Fortbewegung.' },
                { key: 'themenfeld3', label: '3. Krankheitsbezogene Anforderungen', desc: 'Therapien, Medikation, Arztbesuche, Schmerzbelastung.' },
                { key: 'themenfeld4', label: '4. Selbstversorgung', desc: 'Körperpflege, An-/Auskleiden, Ernährung, Ausscheidung.' },
                { key: 'themenfeld5', label: '5. Leben in Beziehungen', desc: 'Familie, Hobbys, Tag-Nacht-Rhythmus, emotionale Aspekte.' },
                { key: 'themenfeld6', label: '6. Haushaltsführung', desc: 'Reinigung, Einkaufen, Finanzen (bei ambulantem Bedarf).' }
              ].map(field => (
                <div key={field.key} className="ph-card ph-sis-card" onClick={() => {
                  if (selectedSisHistIdx !== 0) {
                    alert("Achtung: Nur der neueste Eintrag kann bearbeitet werden! Wählen Sie den neuesten aus.");
                    return;
                  }
                  if (sisEditKey !== field.key) {
                    setSisEditKey(field.key);
                    setSisTextVal(activeSIS.values[field.key] || '');
                  }
                }}>
                  <span className="num">{field.key.replace('themenfeld','')}</span>
                  <div className="title">{field.label}</div>
                  
                  {sisEditKey === field.key ? (
                    <div className="editor" onClick={e => e.stopPropagation()}>
                      <textarea 
                        className="ph-textarea" 
                        value={sisTextVal} 
                        onChange={e => setSisTextVal(e.target.value)}
                      />
                      <div className="actions">
                        <button className="ph-btn primary" onClick={() => handleSaveSIS(field.key)}>Als neuen Stand speichern</button>
                        <button className="ph-btn" onClick={() => setSisEditKey(null)}>Abbrechen</button>
                      </div>
                    </div>
                  ) : (
                    <p className="desc">{activeSIS.values[field.key] || 'Kein Eintrag dokumentiert. Zum Bearbeiten anklicken.'}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        );

      case 'anamnese':
        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Soziale Anamnese</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{patient.anamnese.socialHistory}</p>
            </div>
            <div className="ph-card">
              <div className="ph-card-title">Medizinische Anamnese (Diagnostik & Verlauf)</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{patient.anamnese.medicalHistory}</p>
            </div>
            <div className="ph-card">
              <div className="ph-card-title">Einschränkungen der Sinnesorgane</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{patient.anamnese.sensoryLimits}</p>
            </div>
          </>
        );

      case 'diagnosen':
        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Aktuelle ICD-10 Diagnosen (Historie)</div>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>ICD Code</th>
                    <th>Diagnosebezeichnung</th>
                    <th>Diagnosedatum</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.diagnosen.map((d, i) => (
                    <tr key={i}>
                      <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{d.icd}</strong></td>
                      <td>{d.title}</td>
                      <td>{d.date}</td>
                      <td><span className="ph-badge gray">{d.status}</span></td>
                    </tr>
                  ))}
                  {patient.diagnosen.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Diagnosen dokumentiert.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Neue Diagnose eintragen</div>
              <form onSubmit={handleAddDiagnosis}>
                <div className="ph-form-row">
                  <div className="col" style={{ flex: '0 0 100px' }}>
                    <label className="ph-form-label">ICD-10</label>
                    <input type="text" className="ph-input" value={diagIcd} onChange={e => setDiagIcd(e.target.value)} placeholder="z.B. I10" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Bezeichnung</label>
                    <input type="text" className="ph-input" value={diagTitle} onChange={e => setDiagTitle(e.target.value)} placeholder="z.B. Essentielle Hypertonie" />
                  </div>
                  <div className="col" style={{ flex: '0 0 150px' }}>
                    <label className="ph-form-label">Diagnose-Datum</label>
                    <input type="date" className="ph-input" value={diagDate} onChange={e => setDiagDate(e.target.value)} />
                  </div>
                  <div className="col" style={{ flex: '0 0 150px' }}>
                    <label className="ph-form-label">Status</label>
                    <select className="ph-form-select" value={diagStatus} onChange={e => setDiagStatus(e.target.value)}>
                      <option value="Chronisch">Chronisch</option>
                      <option value="Akut">Akut</option>
                      <option value="In Behandlung">In Behandlung</option>
                      <option value="Postoperativ">Postoperativ</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="ph-btn primary">Eintrag speichern</button>
              </form>
            </div>
          </>
        );

      case 'medikamente':
        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Medikationsplan (Dauermedikation Historie)</div>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Präparat & Stärke</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Dosierung (M-M-A-N)</th>
                    <th>Indikation</th>
                    <th>Verordnet von</th>
                    <th>Hinweise</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.medikamente.map((m, i) => (
                    <tr key={i}>
                      <td><strong>{m.name}</strong></td>
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--odoo-purple)', fontWeight: 'bold' }}>{m.dose}</td>
                      <td>{m.indication}</td>
                      <td>{m.prescribedBy}</td>
                      <td><small>{m.notes}</small></td>
                    </tr>
                  ))}
                  {patient.medikamente.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine verordneten Medikamente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Medikament hinzufügen</div>
              <form onSubmit={handleAddMedication}>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Name & Stärke</label>
                    <input type="text" className="ph-input" value={medName} onChange={e => setMedName(e.target.value)} placeholder="z.B. Ramipril 5mg" />
                  </div>
                  <div className="col" style={{ flex: '0 0 160px' }}>
                    <label className="ph-form-label">Dosis (M-M-A-N)</label>
                    <input type="text" className="ph-input" value={medDose} onChange={e => setMedDose(e.target.value)} placeholder="1-0-1-0" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Indikation</label>
                    <input type="text" className="ph-input" value={medIndication} onChange={e => setMedIndication(e.target.value)} placeholder="Bluthochdruck" />
                  </div>
                </div>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Verordner</label>
                    <input type="text" className="ph-input" value={medDoc} onChange={e => setMedDoc(e.target.value)} placeholder="Dr. Meyer" />
                  </div>
                  <div className="col" style={{ flex: 2 }}>
                    <label className="ph-form-label">Hinweise</label>
                    <input type="text" className="ph-input" value={medNotes} onChange={e => setMedNotes(e.target.value)} placeholder="z.B. vor dem Frühstück einnehmen" />
                  </div>
                </div>
                <button type="submit" className="ph-btn primary">Medikament eintragen</button>
              </form>
            </div>
          </>
        );

      case 'tagesstruktur':
        const activeTages = patient.tagesstrukturHistory[selectedTagesHistIdx] || patient.tagesstrukturHistory[0];
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                💡 Wählen Sie rechts einen historischen Tagesstrukturstand aus:
              </div>
              <div>
                <select 
                  className="ph-form-select"
                  style={{ width: '220px' }}
                  value={selectedTagesHistIdx}
                  onChange={e => {
                    setSelectedTagesHistIdx(parseInt(e.target.value));
                    setTagesEditKey(null);
                  }}
                >
                  {patient.tagesstrukturHistory.map((th, idx) => (
                    <option key={idx} value={idx}>
                      {th.date} ({th.user}) {idx === 0 ? '[LATEST]' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {[
              { key: 'morning', label: 'Vormittagszeit (Morgen)' },
              { key: 'noon', label: 'Mittagszeit (Ruhe & Speise)' },
              { key: 'afternoon', label: 'Nachmittagszeit (Kaffee & Beschäftigung)' },
              { key: 'evening', label: 'Abendzeit (Abendbrot)' },
              { key: 'night', label: 'Nachtzeit (Kontrollen & Schlaf)' }
            ].map(t => (
              <div key={t.key} className="ph-card" style={{ borderLeft: '4px solid var(--odoo-purple)' }}>
                <div className="ph-card-title">{t.label}</div>
                {tagesEditKey === t.key ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea 
                      className="ph-textarea"
                      value={tagesTextVal}
                      onChange={e => setTagesTextVal(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="ph-btn primary" onClick={() => handleSaveTagesstruktur(t.key)}>Als neuen Stand speichern</button>
                      <button className="ph-btn" onClick={() => setTagesEditKey(null)}>Abbrechen</button>
                    </div>
                  </div>
                ) : (
                  <p 
                    style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => {
                      if (selectedTagesHistIdx !== 0) {
                        alert("Nur die neueste Tagesstruktur kann abgeändert werden.");
                        return;
                      }
                      setTagesEditKey(t.key);
                      setTagesTextVal(activeTages.values[t.key] || '');
                    }}
                  >
                    {activeTages.values[t.key] || 'Kein Eintrag vorhanden. Zum Eintragen klicken.'}
                  </p>
                )}
              </div>
            ))}
          </>
        );

      case 'assessments':
        const latestBarthel = patient.assessmentsHistory.find(a => a.type === 'barthel');
        const latestBraden = patient.assessmentsHistory.find(a => a.type === 'braden');
        const latestTinetti = patient.assessmentsHistory.find(a => a.type === 'tinetti');
        const latestMmse = patient.assessmentsHistory.find(a => a.type === 'mmse');
        const latestNrs = patient.assessmentsHistory.find(a => a.type === 'nrs');

        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Aktuellste Assessment-Ergebnisse</div>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Typ</th>
                    <th>Ergebnis / Score</th>
                    <th>Risikobewertung</th>
                    <th>Letzte Erfassung</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Barthel-Index</strong> (Selbstständigkeit)</td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{latestBarthel ? `${latestBarthel.score} / 100` : '-'}</strong> Pkt.</td>
                    <td><span className="ph-badge">{latestBarthel ? latestBarthel.interpretation : '-'}</span></td>
                    <td>{latestBarthel ? latestBarthel.date : '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Braden-Skala</strong> (Dekubitusrisiko)</td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{latestBraden ? `${latestBraden.score} / 23` : '-'}</strong> Pkt.</td>
                    <td>
                      <span className={`ph-badge ${latestBraden && latestBraden.score <= 16 ? 'orange' : 'green'}`}>
                        {latestBraden ? latestBraden.interpretation : '-'}
                      </span>
                    </td>
                    <td>{latestBraden ? latestBraden.date : '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>Tinetti-Test</strong> (Sturzgefahr)</td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{latestTinetti ? `${latestTinetti.score} / 28` : '-'}</strong> Pkt.</td>
                    <td>
                      <span className={`ph-badge ${latestTinetti && latestTinetti.score <= 18 ? 'red' : 'green'}`}>
                        {latestTinetti ? latestTinetti.interpretation : '-'}
                      </span>
                    </td>
                    <td>{latestTinetti ? latestTinetti.date : '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>MMSE</strong> (Kognition)</td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{latestMmse ? `${latestMmse.score} / 30` : '-'}</strong> Pkt.</td>
                    <td>
                      <span className={`ph-badge ${latestMmse && latestMmse.score <= 24 ? 'orange' : 'green'}`}>
                        {latestMmse ? latestMmse.interpretation : '-'}
                      </span>
                    </td>
                    <td>{latestMmse ? latestMmse.date : '-'}</td>
                  </tr>
                  <tr>
                    <td><strong>NRS Schmerzskala</strong> (Schmerzerfassung)</td>
                    <td><strong style={{ fontFamily: 'var(--font-mono)' }}>{latestNrs ? `${latestNrs.score} / 10` : '-'}</strong></td>
                    <td>
                      <span className={`ph-badge ${latestNrs && latestNrs.score >= 4 ? 'red' : 'green'}`}>
                        {latestNrs ? latestNrs.interpretation : '-'}
                      </span>
                    </td>
                    <td>{latestNrs ? latestNrs.date : '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Interaktive Rechner (Neues Assessment erfassen)</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="ph-btn" onClick={() => setActiveCalculator(activeCalculator === 'barthel' ? null : 'barthel')}>
                  Barthel-Index berechnen
                </button>
                <button className="ph-btn" onClick={() => setActiveCalculator(activeCalculator === 'braden' ? null : 'braden')}>
                  Braden-Skala berechnen
                </button>
                <button className="ph-btn" onClick={() => setActiveCalculator(activeCalculator === 'nrs' ? null : 'nrs')}>
                  NRS Schmerz festlegen
                </button>
              </div>

              {activeCalculator === 'barthel' && (
                <BarthelIndexRechner 
                  initialValues={latestBarthel?.values || { essen: 10, baden: 5, koerperpflege: 5, anziehen: 10, stuhl: 10, urin: 10, toilette: 10, transfer: 15, mobilaet: 15, treppe: 10 }} 
                  onSave={handleSaveBarthelCalc} 
                />
              )}

              {activeCalculator === 'braden' && (
                <BradenSkalaRechner 
                  initialValues={latestBraden?.values || { sensorik: 4, feuchtigkeit: 4, aktivitaet: 4, mobilitaet: 4, ernaehrung: 4, reibung: 3 }} 
                  onSave={handleSaveBradenCalc} 
                />
              )}

              {activeCalculator === 'nrs' && (
                <NRSRechner 
                  initialScore={latestNrs?.score || 0} 
                  onSave={handleSaveNRSCalc} 
                />
              )}
            </div>

            {/* Complete historical records logs */}
            <div className="ph-card">
              <div className="ph-card-title">Historie aller Assessment-Einträge</div>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Messzeitpunkt</th>
                    <th>Assessment-Typ</th>
                    <th>Ergebnis / Score</th>
                    <th>Bewertung</th>
                    <th>Dokumentiert von</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.assessmentsHistory.map((ah, idx) => (
                    <React.Fragment key={idx}>
                      <tr>
                        <td><strong>{ah.date}</strong></td>
                        <td style={{ textTransform: 'capitalize' }}>{ah.type === 'barthel' ? 'Barthel-Index' : ah.type === 'braden' ? 'Braden-Skala' : ah.type.toUpperCase()}</td>
                        <td><strong style={{ color: 'var(--odoo-purple)', fontFamily: 'var(--font-mono)' }}>{ah.score}</strong></td>
                        <td><span className="ph-badge gray">{ah.interpretation}</span></td>
                        <td>{ah.user}</td>
                        <td>
                          <button 
                            className="ph-btn-pill" 
                            style={{ margin: 0 }}
                            onClick={() => setExpandedAssessmentIdx(expandedAssessmentIdx === idx ? null : idx)}
                          >
                            {expandedAssessmentIdx === idx ? 'Verbergen ▲' : 'Details ▼'}
                          </button>
                        </td>
                      </tr>
                      {expandedAssessmentIdx === idx && ah.values && Object.keys(ah.values).length > 0 && (
                        <tr>
                          <td colSpan="6" style={{ background: '#f8fafc', padding: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px', fontSize: '0.75rem' }}>
                              {Object.entries(ah.values).map(([k, v]) => (
                                <div key={k} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '3px' }}>
                                  <strong>{k.replace('koerperpflege','Körperpflege').replace('mobilaet','Mobilität').replace('treppe','Treppe')}:</strong> {v}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );

      case 'pflegeplanung':
        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Formulierte Pflegeplanung (Historie)</div>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th style={{ width: '30%' }}>Problembeschreibung</th>
                    <th style={{ width: '30%' }}>Pflegeziele</th>
                    <th style={{ width: '40%' }}>Maßnahmen</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.pflegeplanung.map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.problem}</strong></td>
                      <td>{p.goal}</td>
                      <td>{p.intervention}</td>
                    </tr>
                  ))}
                  {patient.pflegeplanung.length === 0 && (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Keine Einträge vorhanden.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Planungseintrag hinzufügen</div>
              <form onSubmit={handleAddPlanning}>
                <div className="ph-form-group">
                  <label className="ph-form-label">Problem (AEDL / SIS)</label>
                  <input type="text" className="ph-input" value={planProb} onChange={e => setPlanProb(e.target.value)} placeholder="z.B. Sturzgefahr bei nächtlichen Toilettengängen" />
                </div>
                <div className="ph-form-group">
                  <label className="ph-form-label">Ziel</label>
                  <input type="text" className="ph-input" value={planGoal} onChange={e => setPlanGoal(e.target.value)} placeholder="z.B. Sturzfreies Aufstehen unter Hilfsmittelbenutzung" />
                </div>
                <div className="ph-form-group">
                  <label className="ph-form-label">Maßnahme</label>
                  <textarea className="ph-textarea" value={planInterv} onChange={e => setPlanInterv(e.target.value)} placeholder="z.B. Gehbock bereitstellen, Nachtlicht einschalten, Begleitung anbieten." />
                </div>
                <button type="submit" className="ph-btn primary">Speichern</button>
              </form>
            </div>
          </>
        );

      case 'pflegebericht':
        return (
          <>
            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Neuer Pflegeberichtseintrag</div>
              <form onSubmit={handleAddReport}>
                <div className="ph-form-group">
                  <label className="ph-form-label">Berichtstext</label>
                  <textarea 
                    className="ph-textarea" 
                    value={reportText} 
                    onChange={e => setReportText(e.target.value)}
                    placeholder="Abweichungen, Vorfälle oder Befinden dokumentieren..."
                  />
                </div>
                <div className="ph-form-row">
                  <div className="col" style={{ flex: '0 0 240px' }}>
                    <label className="ph-form-label">Fachkraft (Kürzel)</label>
                    <select className="ph-form-select" value={reportAuthor} onChange={e => setReportAuthor(e.target.value)}>
                      <option value="Müller (PM)">Müller (Pflegefachkraft)</option>
                      <option value="Wagner (PW)">Wagner (Pflegeassistent)</option>
                      <option value="Schmidt (FS)">Schmidt (Pflegeschüler/in)</option>
                    </select>
                  </div>
                  <div className="col" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="ph-btn primary" disabled={!reportText.trim()}>Eintrag schreiben</button>
                  </div>
                </div>
              </form>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Chronologischer Verlauf</div>
              <div className="ph-timeline">
                {patient.pflegebericht.map((r, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="meta">
                      <span className="date">{r.date}</span>
                      <span className="user">{r.user}</span>
                    </div>
                    <p className="text">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'entlassungsmanagement':
        const total = patient.entlassungsmanagement.items.length;
        const checked = patient.entlassungsmanagement.items.filter(i => i.checked).length;
        const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
        return (
          <div className="ph-card">
            <div className="ph-card-title">Entlassungsbereitschaft & Checkliste</div>
            <div className="ph-progress-card">
              <div className="status-label">Status: {checked} / {total} Aufgaben erledigt</div>
              <div className="progress-outer">
                <div className="progress-inner" style={{ width: `${pct}%`, backgroundColor: 'var(--odoo-purple)' }}></div>
                <span className="progress-pct" style={{ color: pct > 50 ? 'white' : 'var(--text-primary)' }}>{pct}%</span>
              </div>
            </div>
            
            <div className="ph-checkbox-list">
              {patient.entlassungsmanagement.items.map((item, idx) => (
                <label key={idx} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={() => handleToggleDischarge(idx)} 
                  />
                  <span>{item.text}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'trinkprotokoll':
        const sum = patient.trinkprotokoll.logs.reduce((acc, curr) => acc + curr.amount, 0);
        const trg = patient.trinkprotokoll.target;
        const trkPct = Math.min(100, Math.round((sum / trg) * 100));
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Flüssigkeitsbilanz</div>
              <div className="ph-progress-card">
                <div className="status-label">Aufnahme heute: <strong>{sum} ml</strong> (Soll: {trg} ml)</div>
                <div className="progress-outer">
                  <div className="progress-inner" style={{ width: `${trkPct}%`, backgroundColor: 'var(--amber-primary)' }}></div>
                  <span className="progress-pct" style={{ color: trkPct > 50 ? 'white' : 'var(--text-primary)' }}>{trkPct}%</span>
                </div>
              </div>
              <div className="quick-buttons">
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Schnelleingabe:</span>
                <button className="ph-btn-pill" onClick={() => handleAddDrink(100, 'Wasser')}>Wasser (100ml)</button>
                <button className="ph-btn-pill" onClick={() => handleAddDrink(150, 'Kaffee')}>Kaffee (150ml)</button>
                <button className="ph-btn-pill" onClick={() => handleAddDrink(200, 'Tee')}>Tee (200ml)</button>
                <button className="ph-btn-pill" onClick={() => handleAddDrink(250, 'Saft')}>Saft (250ml)</button>
              </div>
            </div>

            <div className="ph-split-grid">
              <div className="ph-card">
                <div className="ph-card-title">Trinkmengen-Protokoll</div>
                <table className="ph-table">
                  <thead>
                    <tr>
                      <th>Uhrzeit</th>
                      <th>Menge (ml)</th>
                      <th>Getränk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.trinkprotokoll.logs.slice().reverse().map((l, i) => (
                      <tr key={i}>
                        <td>{l.time} Uhr</td>
                        <td><strong style={{ color: 'var(--amber-primary)' }}>{l.amount} ml</strong></td>
                        <td>{l.beverage}</td>
                      </tr>
                    ))}
                    {patient.trinkprotokoll.logs.length === 0 && (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Noch keine Einträge erfasst.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="ph-card ph-form-panel">
                <div className="ph-card-title">Menge manuell erfassen</div>
                <form onSubmit={handleAddDrinkManual}>
                  <div className="ph-form-group">
                    <label className="ph-form-label">Volumen (ml)</label>
                    <input type="number" className="ph-input" value={drinkManualAmt} onChange={e => setDrinkManualAmt(e.target.value)} placeholder="z.B. 150" />
                  </div>
                  <div className="ph-form-group">
                    <label className="ph-form-label">Getränk</label>
                    <input type="text" className="ph-input" value={drinkManualBev} onChange={e => setDrinkManualBev(e.target.value)} placeholder="Fencheltee" />
                  </div>
                  <button type="submit" className="ph-btn primary amber" disabled={!drinkManualAmt || !drinkManualBev.trim()}>Hinzufügen</button>
                </form>
              </div>
            </div>
          </>
        );

      case 'vitalwerte':
        return (
          <>
            <div className="ph-card">
              <div className="ph-card-title">Vitalwert-Tabelle (Historie)</div>
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Messzeitpunkt</th>
                    <th>Blutdruck (mmHg)</th>
                    <th>Puls (bpm)</th>
                    <th>Temp (°C)</th>
                    <th>Blutzucker (mg/dl)</th>
                    <th>SpO2 (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.vitalwerte.map((v, i) => (
                    <tr key={i}>
                      <td><strong>{v.date}</strong></td>
                      <td>{v.bp}</td>
                      <td>{v.hr}</td>
                      <td>{v.temp}</td>
                      <td>{v.sugar || '-'}</td>
                      <td>{v.spo2 ? `${v.spo2}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Neuen Vitalwert erfassen</div>
              <form onSubmit={handleAddVital}>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Blutdruck (syst./diast.)</label>
                    <input type="text" className="ph-input" value={vitBp} onChange={e => setVitBp(e.target.value)} placeholder="z.B. 120/80" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Puls (HF)</label>
                    <input type="number" className="ph-input" value={vitHr} onChange={e => setVitHr(e.target.value)} placeholder="72" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Temperatur (°C)</label>
                    <input type="text" className="ph-input" value={vitTemp} onChange={e => setVitTemp(e.target.value)} placeholder="36.5" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Blutzucker</label>
                    <input type="number" className="ph-input" value={vitSugar} onChange={e => setVitSugar(e.target.value)} placeholder="100" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">SpO2 (%)</label>
                    <input type="number" className="ph-input" value={vitSpo2} onChange={e => setVitSpo2(e.target.value)} placeholder="98" />
                  </div>
                </div>
                <button type="submit" className="ph-btn primary amber">Werte speichern</button>
              </form>
            </div>
          </>
        );

      case 'ausscheidung':
        const latestAusscheidung = patient.ausscheidungHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Aktueller Ausscheidungsstatus</div>
              <table className="ph-table">
                <tbody>
                  <tr><td style={{ width: '200px' }}><strong>Urin-Ausscheidung</strong></td><td>{latestAusscheidung.continenceBladder || '-'}</td></tr>
                  <tr><td><strong>Stuhl-Ausscheidung</strong></td><td>{latestAusscheidung.continenceBowel || '-'}</td></tr>
                  <tr><td><strong>Obstipationsrisiko</strong></td><td>{latestAusscheidung.obstipationRisk || '-'}</td></tr>
                  <tr><td><strong>Maßnahmen</strong></td><td>{latestAusscheidung.interventions || '-'}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Neuen Ausscheidungsbericht erfassen</div>
              <form onSubmit={handleSaveAusscheidung}>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Harnkontinenz / Ausscheidung</label>
                    <input type="text" className="ph-input" value={riskAusscheidungBladder} onChange={e => setRiskAusscheidungBladder(e.target.value)} placeholder="z.B. Kontinent / Harninkontinenz Grad 1" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Stuhlausscheidung</label>
                    <input type="text" className="ph-input" value={riskAusscheidungBowel} onChange={e => setRiskAusscheidungBowel(e.target.value)} placeholder="z.B. Kontinent / Neigung zu Obstipation" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Obstipationsrisiko</label>
                    <select className="ph-form-select" value={riskAusscheidungRisk} onChange={e => setRiskAusscheidungRisk(e.target.value)}>
                      <option value="">-- Bitte wählen --</option>
                      <option value="Gering">Gering</option>
                      <option value="Mittel">Mittel</option>
                      <option value="Hoch">Hoch</option>
                    </select>
                  </div>
                </div>
                <div className="ph-form-group">
                  <label className="ph-form-label">Pflegerische Maßnahmen / Hilfsmittel</label>
                  <input type="text" className="ph-input" value={riskAusscheidungInterv} onChange={e => setRiskAusscheidungInterv(e.target.value)} placeholder="z.B. Trinkmenge überwachen, Einlagenversorgung Gr. 2" />
                </div>
                <button type="submit" className="ph-btn primary amber" disabled={!riskAusscheidungBladder || !riskAusscheidungBowel || !riskAusscheidungRisk}>Speichern</button>
              </form>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Historischer Verlauf Ausscheidung</div>
              <div className="ph-timeline">
                {patient.ausscheidungHistory.map((ah, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="meta">
                      <span>{ah.date}</span>
                      <span className="user">{ah.user}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <div>• <strong>Urin:</strong> {ah.continenceBladder}</div>
                      <div>• <strong>Stuhl:</strong> {ah.continenceBowel} (Risiko: {ah.obstipationRisk})</div>
                      <div>• <strong>Interventionen:</strong> {ah.interventions}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'wunde':
        const latestWunde = patient.wundeHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Aktueller Wundstatus</div>
              
              <div className="ph-grid-with-bodymap">
                <table className="ph-table">
                  <tbody>
                    <tr><td style={{ width: '180px' }}><strong>Wunde vorhanden?</strong></td><td>{latestWunde.hasWound ? '⚠️ Ja' : 'Nein'}</td></tr>
                    <tr><td><strong>Lokalisation</strong></td><td><strong>{latestWunde.location || '-'}</strong></td></tr>
                    <tr><td><strong>Wundbeschreibung</strong></td><td>{latestWunde.status || '-'}</td></tr>
                    <tr><td><strong>Verbandmittel</strong></td><td>{latestWunde.dressing || '-'}</td></tr>
                    <tr><td><strong>Wechselintervall</strong></td><td>{latestWunde.schedule || '-'}</td></tr>
                  </tbody>
                </table>
                
                {latestWunde.hasWound && (
                  <div className="ph-card-bodymap-side">
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Wundlokalisation</div>
                    <BodyMap value={latestWunde.location} readOnly={true} />
                  </div>
                )}
              </div>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Wundprotokoll-Eintrag hinzufügen</div>
              
              <div className="ph-grid-with-bodymap">
                <form onSubmit={handleSaveWundbericht} style={{ flexGrow: 1 }}>
                  <div className="ph-form-row">
                    <div className="col" style={{ flex: '0 0 150px' }}>
                      <label className="ph-form-label">Wunde vorhanden?</label>
                      <select className="ph-form-select" value={riskWoundHas} onChange={e => setRiskWoundHas(e.target.value)}>
                        <option value="Nein">Nein</option>
                        <option value="Ja">Ja</option>
                      </select>
                    </div>
                    {riskWoundHas === 'Ja' && (
                      <div className="col">
                        <label className="ph-form-label">Lokalisation (Auf Karte wählen oder tippen)</label>
                        <input type="text" className="ph-input" value={riskWoundLoc} onChange={e => setRiskWoundLoc(e.target.value)} placeholder="z.B. Kreuzbein (Sakrum)" />
                      </div>
                    )}
                  </div>
                  {riskWoundHas === 'Ja' && (
                    <div className="ph-form-row">
                      <div className="col">
                        <label className="ph-form-label">Wundbeschreibung / Stadium</label>
                        <input type="text" className="ph-input" value={riskWoundDesc} onChange={e => setRiskWoundDesc(e.target.value)} placeholder="z.B. Dekubitus Grad II, 2x3 cm, reizloser Wundrand" />
                      </div>
                      <div className="col">
                        <label className="ph-form-label">Verbandmittel</label>
                        <input type="text" className="ph-input" value={riskWoundDressing} onChange={e => setRiskWoundDressing(e.target.value)} placeholder="Hydrokolloidverband, fixiert" />
                      </div>
                      <div className="col" style={{ flex: '0 0 150px' }}>
                        <label className="ph-form-label">Wechselintervall</label>
                        <input type="text" className="ph-input" value={riskWoundSchedule} onChange={e => setRiskWoundSchedule(e.target.value)} placeholder="Alle 3 Tage / b. Bedarf" />
                      </div>
                    </div>
                  )}
                  {riskWoundHas === 'Nein' && (
                    <div className="ph-form-group">
                      <label className="ph-form-label">Hautzustand / Beschreibung</label>
                      <input type="text" className="ph-input" value={riskWoundDesc} onChange={e => setRiskWoundDesc(e.target.value)} placeholder="z.B. Haut gerötet / intakt" />
                    </div>
                  )}
                  <button type="submit" className="ph-btn primary amber">Wundbericht speichern</button>
                </form>

                {riskWoundHas === 'Ja' && (
                  <div className="ph-form-bodymap-side">
                    <label className="ph-form-label" style={{ textAlign: 'center', marginBottom: '8px' }}>Wundstelle auf Karte wählen:</label>
                    <BodyMap value={riskWoundLoc} onChange={setRiskWoundLoc} />
                  </div>
                )}
              </div>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Historischer Verlauf Wundprotokoll</div>
              <div className="ph-timeline">
                {patient.wundeHistory.map((wh, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="ph-grid-with-bodymap">
                      <div style={{ flexGrow: 1 }}>
                        <div className="meta">
                          <span>{wh.date}</span>
                          <span className="user">{wh.user}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                          <div>• <strong>Befund:</strong> {wh.hasWound ? `⚠️ Wunde an ${wh.location}` : 'Keine Wunde vorhanden.'}</div>
                          <div>• <strong>Zustand:</strong> {wh.status}</div>
                          {wh.hasWound && (
                            <>
                              <div>• <strong>Therapie:</strong> {wh.dressing}</div>
                              <div>• <strong>Intervall:</strong> {wh.schedule}</div>
                            </>
                          )}
                        </div>
                      </div>
                      {wh.hasWound && (
                        <div style={{ width: '80px', height: '60px', opacity: 0.8 }}>
                          <BodyMap value={wh.location} readOnly={true} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'sturzprophylaxe':
        const latestSturz = patient.sturzprophylaxeHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Sturzprophylaxe Risikoprofil</div>
              <table className="ph-table">
                <tbody>
                  <tr>
                    <td style={{ width: '200px' }}><strong>Sturzrisiko</strong></td>
                    <td><span className="ph-badge orange">{latestSturz.riskLevel || '-'}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Aktuelle Prophylaxemaßnahmen</div>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
                {(latestSturz.measures || []).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Sturzrisikobewertung aktualisieren</div>
              <form onSubmit={handleSaveSturzprophylaxe}>
                <div className="ph-form-row">
                  <div className="col" style={{ flex: '0 0 150px' }}>
                    <label className="ph-form-label">Risikostufe</label>
                    <select className="ph-form-select" value={riskSturzLevel} onChange={e => setRiskSturzLevel(e.target.value)}>
                      <option value="Niedrig">Niedrig</option>
                      <option value="Mittel">Mittel</option>
                      <option value="Hoch">Hoch</option>
                    </select>
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Maßnahmen (eine pro Zeile)</label>
                    <textarea 
                      className="ph-textarea" 
                      value={riskSturzMeasures} 
                      onChange={e => setRiskSturzMeasures(e.target.value)}
                      placeholder="z.B. Rollator Griffbereitschaft&#10;Anti-Rutsch-Socken&#10;Nachtlicht ein"
                    />
                  </div>
                </div>
                <button type="submit" className="ph-btn primary amber">Sturzeintrag speichern</button>
              </form>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Verlauf Sturzprophylaxe</div>
              <div className="ph-timeline">
                {patient.sturzprophylaxeHistory.map((sh, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="meta">
                      <span>{sh.date}</span>
                      <span className="user">{sh.user}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <div>• <strong>Sturzrisiko:</strong> <span className="ph-badge gray">{sh.riskLevel}</span></div>
                      <div>• <strong>Maßnahmen:</strong> {sh.measures.join(', ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'dekubitus':
        const latestDeku = patient.dekubitusHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Dekubitus-Risikostatus</div>
              
              <div className="ph-grid-with-bodymap">
                <table className="ph-table">
                  <tbody>
                    <tr><td style={{ width: '180px' }}><strong>Dekubitusrisiko</strong></td><td><span className="ph-badge orange">{latestDeku.riskLevel || '-'}</span></td></tr>
                    <tr><td><strong>Gefährdetes Areal</strong></td><td><strong>{latestDeku.location || '-'}</strong></td></tr>
                  </tbody>
                </table>
                
                {latestDeku.location && latestDeku.location !== '-' && (
                  <div className="ph-card-bodymap-side">
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Risikolokalisation</div>
                    <BodyMap value={latestDeku.location} readOnly={true} />
                  </div>
                )}
              </div>
            </div>

            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Aktuelle Dekubitus-Prophylaxemaßnahmen</div>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
                {(latestDeku.measures || []).map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Dekubitusprophylaxe-Eintrag erfassen</div>
              
              <div className="ph-grid-with-bodymap">
                <form onSubmit={handleSaveDekubitus} style={{ flexGrow: 1 }}>
                  <div className="ph-form-row">
                    <div className="col" style={{ flex: '0 0 150px' }}>
                      <label className="ph-form-label">Gefährdungsstufe</label>
                      <select className="ph-form-select" value={riskDekuLevel} onChange={e => setRiskDekuLevel(e.target.value)}>
                        <option value="Niedrig">Keine / Niedrig</option>
                        <option value="Mittel">Mäßig</option>
                        <option value="Hoch">Hoch</option>
                      </select>
                    </div>
                    {riskDekuLevel !== 'Niedrig' && (
                      <div className="col">
                        <label className="ph-form-label">Gefährdetes Areal (Auf Karte wählen oder tippen)</label>
                        <input type="text" className="ph-input" value={riskDekuLoc} onChange={e => setRiskDekuLoc(e.target.value)} placeholder="z.B. Kreuzbein (Sakrum)" />
                      </div>
                    )}
                  </div>
                  <div className="ph-form-group">
                    <label className="ph-form-label">Prophylaxemaßnahmen (eine pro Zeile)</label>
                    <textarea 
                      className="ph-textarea" 
                      value={riskDekuMeasures} 
                      onChange={e => setRiskDekuMeasures(e.target.value)}
                      placeholder="z.B. Lagerung alle 4 Std.&#10;Hautinspektion bei Körperpflege&#10;Superweichlagerungsmatratze"
                    />
                  </div>
                  <button type="submit" className="ph-btn primary amber">Dekubituseintrag speichern</button>
                </form>

                {riskDekuLevel !== 'Niedrig' && (
                  <div className="ph-form-bodymap-side">
                    <label className="ph-form-label" style={{ textAlign: 'center', marginBottom: '8px' }}>Druckstelle auf Karte wählen:</label>
                    <BodyMap value={riskDekuLoc} onChange={setRiskDekuLoc} />
                  </div>
                )}
              </div>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Verlauf Dekubitusprophylaxe</div>
              <div className="ph-timeline">
                {patient.dekubitusHistory.map((dh, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="ph-grid-with-bodymap">
                      <div style={{ flexGrow: 1 }}>
                        <div className="meta">
                          <span>{dh.date}</span>
                          <span className="user">{dh.user}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                          <div>• <strong>Gefährdung:</strong> {dh.riskLevel} (Ort: {dh.location})</div>
                          <div>• <strong>Maßnahmen:</strong> {dh.measures.join(', ')}</div>
                        </div>
                      </div>
                      {dh.location && dh.location !== '-' && (
                        <div style={{ width: '80px', height: '60px', opacity: 0.8 }}>
                          <BodyMap value={dh.location} readOnly={true} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'mobilitaet':
        const latestMob = patient.mobilitaetHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Mobilitätsstatus</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{latestMob.status}</p>
            </div>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Benötigte Gehhilfen & Transfers</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Hilfsmittel:</strong> {latestMob.aids}<br/><strong>Transfers:</strong> {latestMob.transfers}</p>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Mobilität aktualisieren</div>
              <form onSubmit={handleSaveMobilaet}>
                <div className="ph-form-group">
                  <label className="ph-form-label">Gehfähigkeit & Orientierung im Raum</label>
                  <input type="text" className="ph-input" value={riskMobStatus} onChange={e => setRiskMobStatus(e.target.value)} placeholder="z.B. Läuft ca 50m selbstständig am Rollator, verliert schnell Kraft" />
                </div>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Gehhilfen / Hilfsmittel</label>
                    <input type="text" className="ph-input" value={riskMobAids} onChange={e => setRiskMobAids(e.target.value)} placeholder="z.B. Standardrollator, Rollstuhl für Ausflüge" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Transfers (Bett / Rollstuhl)</label>
                    <input type="text" className="ph-input" value={riskMobTransfers} onChange={e => setRiskMobTransfers(e.target.value)} placeholder="z.B. Standtransfer mit 1-Personen-Hilfe" />
                  </div>
                </div>
                <button type="submit" className="ph-btn primary amber" disabled={!riskMobStatus}>Mobilitätsbericht speichern</button>
              </form>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Verlauf Mobilität</div>
              <div className="ph-timeline">
                {patient.mobilitaetHistory.map((mh, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="meta">
                      <span>{mh.date}</span>
                      <span className="user">{mh.user}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <div>• <strong>Status:</strong> {mh.status}</div>
                      <div>• <strong>Aids:</strong> {mh.aids} (Transfer: {mh.transfers})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'ernaehrung':
        const latestDiet = patient.ernaehrungHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Kostform & Gewicht</div>
              <table className="ph-table">
                <tbody>
                  <tr><td style={{ width: '200px' }}><strong>Kostform</strong></td><td>{latestDiet.diet}</td></tr>
                  <tr><td><strong>Flüssigkeitssoll</strong></td><td>{latestDiet.fluidTarget}</td></tr>
                  <tr><td><strong>Körpergewicht</strong></td><td><strong>{latestDiet.weight}</strong></td></tr>
                  <tr><td><strong>Schluckbeschwerden</strong></td><td>{latestDiet.problems}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Neues Ernährungsprofil anlegen</div>
              <form onSubmit={handleSaveErnaehrung}>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Kostform</label>
                    <input type="text" className="ph-input" value={riskDietKostform} onChange={e => setRiskDietKostform(e.target.value)} placeholder="z.B. Normalkost, pürierte Kost" />
                  </div>
                  <div className="col">
                    <label className="ph-form-label">Trinkmengenziel (24h)</label>
                    <input type="text" className="ph-input" value={riskDietSoll} onChange={e => setRiskDietSoll(e.target.value)} placeholder="z.B. 1500 ml" />
                  </div>
                  <div className="col" style={{ flex: '0 0 100px' }}>
                    <label className="ph-form-label">Gewicht (kg)</label>
                    <input type="text" className="ph-input" value={riskDietWeight} onChange={e => setRiskDietWeight(e.target.value)} placeholder="78 kg" />
                  </div>
                </div>
                <div className="ph-form-group">
                  <label className="ph-form-label">Einschränkungen / Allergien</label>
                  <input type="text" className="ph-input" value={riskDietProblems} onChange={e => setRiskDietProblems(e.target.value)} placeholder="z.B. leichte Kauprobleme" />
                </div>
                <button type="submit" className="ph-btn primary amber" disabled={!riskDietKostform || !riskDietWeight}>Ernährungsbericht speichern</button>
              </form>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Verlauf Ernährungsberichte</div>
              <div className="ph-timeline">
                {patient.ernaehrungHistory.map((eh, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="meta">
                      <span>{eh.date}</span>
                      <span className="user">{eh.user}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <div>• <strong>Kostform:</strong> {eh.diet} (Trinkmenge: {eh.fluidTarget})</div>
                      <div>• <strong>Gewicht:</strong> {eh.weight} (Probleme: {eh.problems})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case 'schmerz':
        const latestSchmerz = patient.schmerzHistory[0] || {};
        return (
          <>
            <div className="ph-card" style={{ borderLeft: '4px solid var(--amber-primary)' }}>
              <div className="ph-card-title">Schmerzstatus & Medikation</div>
              <table className="ph-table">
                <tbody>
                  <tr><td style={{ width: '200px' }}><strong>Schmerzbefund</strong></td><td>{latestSchmerz.status}</td></tr>
                  <tr><td><strong>Schmerztherapie</strong></td><td>{latestSchmerz.therapy}</td></tr>
                  <tr><td><strong>Letzte Erfassung</strong></td><td>{latestSchmerz.lastAssessment}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="ph-card ph-form-panel">
              <div className="ph-card-title">Schmerzverlauf eintragen</div>
              <form onSubmit={handleSaveSchmerz}>
                <div className="ph-form-group">
                  <label className="ph-form-label">Schmerzbefund (Lokalisation / NRS)</label>
                  <input type="text" className="ph-input" value={riskSchmerzStatus} onChange={e => setRiskSchmerzStatus(e.target.value)} placeholder="z.B. Belastungsschmerz Knie links (NRS 4)" />
                </div>
                <div className="ph-form-row">
                  <div className="col">
                    <label className="ph-form-label">Medikamentöse Therapie / Maßnahmen</label>
                    <input type="text" className="ph-input" value={riskSchmerzTherapy} onChange={e => setRiskSchmerzTherapy(e.target.value)} placeholder="z.B. Gabe Bedarfsmedikation Novalgin 20 Tr." />
                  </div>
                  <div className="col" style={{ flex: '0 0 180px' }}>
                    <label className="ph-form-label">Uhrzeit der Abfrage</label>
                    <input type="text" className="ph-input" value={riskSchmerzLast} onChange={e => setRiskSchmerzLast(e.target.value)} placeholder="z.B. 14:00 Uhr" />
                  </div>
                </div>
                <button type="submit" className="ph-btn primary amber" disabled={!riskSchmerzStatus}>Schmerzbericht speichern</button>
              </form>
            </div>

            <div className="ph-card">
              <div className="ph-card-title">Verlauf Schmerzprotokoll</div>
              <div className="ph-timeline">
                {patient.schmerzHistory.map((sh, i) => (
                  <div key={i} className="ph-timeline-item">
                    <div className="meta">
                      <span>{sh.date}</span>
                      <span className="user">{sh.user}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      <div>• <strong>Befund:</strong> {sh.status}</div>
                      <div>• <strong>Therapie:</strong> {sh.therapy} ({sh.lastAssessment})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      default:
        return <p>Modul in Bearbeitung.</p>;
    }
  }
}

// ----------------------------------------------------
// 5. INTERACTIVE ANATOMICAL BODY MAP COMPONENT
// ----------------------------------------------------
export function BodyMap({ value, onChange, readOnly = false }) {
  const activeHotspot = useMemo(() => {
    if (!value) return null;
    const lowerVal = value.toLowerCase();
    return HOTSPOTS.find(h => 
      lowerVal.includes(h.label.toLowerCase()) || 
      lowerVal.includes(h.id.toLowerCase())
    ) || null;
  }, [value]);

  const handleHotspotClick = (h) => {
    if (readOnly) return;
    if (onChange) {
      onChange(h.label);
    }
  };

  return (
    <div className={`ph-bodymap-container ${readOnly ? 'readonly' : ''}`}>
      {!readOnly && (
        <div className="bodymap-legend">
          <span>Vorderseite (Front)</span>
          <span>Rückseite (Back)</span>
        </div>
      )}
      <svg viewBox="0 0 240 180" className="ph-bodymap-svg">
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- FIGURE 1: FRONT (Vorderseite) --- */}
        <g className="bodymap-mannequin">
          {/* Head */}
          <circle cx="65" cy="25" r="9" />
          {/* Neck */}
          <rect x="62" y="34" width="6" height="5" />
          {/* Torso */}
          <rect x="50" y="39" width="30" height="52" rx="4" />
          {/* Left Arm */}
          <rect x="37" y="39" width="10" height="45" rx="4" />
          {/* Right Arm */}
          <rect x="83" y="39" width="10" height="45" rx="4" />
          {/* Left Leg */}
          <rect x="51" y="93" width="11" height="60" rx="4" />
          {/* Right Leg */}
          <rect x="68" y="93" width="11" height="60" rx="4" />
        </g>

        {/* --- FIGURE 2: BACK (Rückseite) --- */}
        <g className="bodymap-mannequin">
          {/* Head */}
          <circle cx="175" cy="25" r="9" />
          {/* Neck */}
          <rect x="172" y="34" width="6" height="5" />
          {/* Torso */}
          <rect x="160" y="39" width="30" height="52" rx="4" />
          {/* Left Arm */}
          <rect x="147" y="39" width="10" height="45" rx="4" />
          {/* Right Arm */}
          <rect x="193" y="39" width="10" height="45" rx="4" />
          {/* Left Leg */}
          <rect x="161" y="93" width="11" height="60" rx="4" />
          {/* Right Leg */}
          <rect x="178" y="93" width="11" height="60" rx="4" />
        </g>

        {/* --- RENDER HOTSPOT CLICKS --- */}
        {HOTSPOTS.map(h => {
          const isActive = activeHotspot && activeHotspot.id === h.id;
          return (
            <g 
              key={h.id} 
              className={`bodymap-hotspot-group ${isActive ? 'active' : ''}`}
              onClick={() => handleHotspotClick(h)}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              {/* Click target overlay */}
              <circle 
                cx={h.x} 
                cy={h.y} 
                r={readOnly ? 5 : 9} 
                fill="transparent" 
              />
              
              {/* Pulsing glow ring for active item */}
              {isActive && (
                <circle 
                  cx={h.x} 
                  cy={h.y} 
                  r="7" 
                  className="bodymap-pulse-ring" 
                  filter="url(#glow)"
                />
              )}

              {/* Core dot indicator */}
              <circle 
                cx={h.x} 
                cy={h.y} 
                r={isActive ? 4 : 2} 
                className="bodymap-core-dot"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ----------------------------------------------------
// 6. INNER ASSESSMENT RECHNER COMPONENTS
// ----------------------------------------------------
function BarthelIndexRechner({ initialValues, onSave }) {
  const [vals, setVals] = useState({ ...initialValues });
  
  const totalScore = useMemo(() => {
    return Object.values(vals).reduce((acc, curr) => acc + curr, 0);
  }, [vals]);

  const interpretation = useMemo(() => {
    if (totalScore <= 30) return "Schwerste Pflegebedürftigkeit";
    if (totalScore <= 60) return "Schwere Pflegebedürftigkeit";
    if (totalScore <= 85) return "Mäßige Pflegebedürftigkeit";
    if (totalScore <= 95) return "Geringe Pflegebedürftigkeit";
    return "Selbstständig";
  }, [totalScore]);

  const handleChange = (key, val) => {
    setVals(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave(totalScore, vals, interpretation);
  };

  return (
    <div className="ph-calc-box">
      <h4>Barthel-Index Rechner</h4>
      {[
        { key: 'essen', label: 'Essen', options: [{ label: 'Selbstständig (10)', val: 10 }, { label: 'Hilfe bei Vorbereitung (5)', val: 5 }, { label: 'Unfähig (0)', val: 0 }] },
        { key: 'baden', label: 'Baden / Duschen', options: [{ label: 'Selbstständig (5)', val: 5 }, { label: 'Hilfe erforderlich (0)', val: 0 }] },
        { key: 'koerperpflege', label: 'Körperpflege (Rasieren, Kämmen)', options: [{ label: 'Selbstständig (5)', val: 5 }, { label: 'Hilfe erforderlich (0)', val: 0 }] },
        { key: 'anziehen', label: 'An- und Auskleiden', options: [{ label: 'Selbstständig (10)', val: 10 }, { label: 'Benötigt Teilhilfe (5)', val: 5 }, { label: 'Unfähig (0)', val: 0 }] },
        { key: 'stuhl', label: 'Stuhlkontrolle', options: [{ label: 'Kontinent (10)', val: 10 }, { label: 'Gelegentlich inkontinent (5)', val: 5 }, { label: 'Inkontinent (0)', val: 0 }] },
        { key: 'urin', label: 'Urinkontrolle', options: [{ label: 'Kontinent (10)', val: 10 }, { label: 'Gelegentlich inkontinent (5)', val: 5 }, { label: 'Inkontinent / Katheter (0)', val: 0 }] },
        { key: 'toilette', label: 'Toilettenbenutzung', options: [{ label: 'Selbstständig (10)', val: 10 }, { label: 'Benötigt Hilfe (5)', val: 5 }, { label: 'Unfähig (0)', val: 0 }] },
        { key: 'transfer', label: 'Transfer (Bett / Stuhl)', options: [{ label: 'Selbstständig (15)', val: 15 }, { label: 'Aufsicht / Geringe Hilfe (10)', val: 10 }, { label: 'Erhebliche Hilfe (5)', val: 5 }, { label: 'Unfähig (0)', val: 0 }] },
        { key: 'mobilaet', label: 'Mobilität (Gehen)', options: [{ label: 'Selbstständig > 50m (15)', val: 15 }, { label: 'Hilfe / Gehhilfe erforderlich (10)', val: 10 }, { label: 'Rollstuhl selbstständig (5)', val: 5 }, { label: 'Unfähig (0)', val: 0 }] },
        { key: 'treppe', label: 'Treppensteigen', options: [{ label: 'Selbstständig (10)', val: 10 }, { label: 'Hilfe / Aufsicht (5)', val: 5 }, { label: 'Unfähig (0)', val: 0 }] }
      ].map(q => (
        <div key={q.key} className="calc-question-block">
          <div className="question-title">{q.label}</div>
          <div className="options-list">
            {q.options.map(opt => (
              <label key={opt.val} className="radio-label">
                <input 
                  type="radio" 
                  name={`barthel_${q.key}`} 
                  checked={vals[q.key] === opt.val} 
                  onChange={() => handleChange(q.key, opt.val)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="calc-summary">
        <div>Gesamt-Score: <strong>{totalScore} / 100</strong></div>
        <div>Einstufung: <strong>{interpretation}</strong></div>
      </div>
      <button className="ph-btn primary" onClick={handleSave}>Wert in Akte eintragen</button>
    </div>
  );
}

function BradenSkalaRechner({ initialValues, onSave }) {
  const [vals, setVals] = useState({ ...initialValues });

  const totalScore = useMemo(() => {
    return Object.values(vals).reduce((acc, curr) => acc + curr, 0);
  }, [vals]);

  const interpretation = useMemo(() => {
    if (totalScore <= 9) return "Sehr hohes Dekubitusrisiko";
    if (totalScore <= 12) return "Hohes Dekubitusrisiko";
    if (totalScore <= 14) return "Mittleres Dekubitusrisiko";
    if (totalScore <= 18) return "Leichtes Dekubitusrisiko";
    return "Kein Risiko";
  }, [totalScore]);

  const handleChange = (key, val) => {
    setVals(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave(totalScore, vals, interpretation);
  };

  return (
    <div className="ph-calc-box amber">
      <h4 style={{ color: 'var(--amber-text)' }}>Braden-Skala Rechner</h4>
      {[
        { key: 'sensorik', label: '1. Sensorische Empfindungsfähigkeit', options: [{ label: 'Nicht eingeschränkt (4)', val: 4 }, { label: 'Geringfügig eingeschränkt (3)', val: 3 }, { label: 'Stark eingeschränkt (2)', val: 2 }, { label: 'Völlig unempfindlich (1)', val: 1 }] },
        { key: 'feuchtigkeit', label: '2. Feuchtigkeit der Haut', options: [{ label: 'Selbst trocken (4)', val: 4 }, { label: 'Manchmal feucht (3)', val: 3 }, { label: 'Sehr oft feucht (2)', val: 2 }, { label: 'Ständig feucht (1)', val: 1 }] },
        { key: 'aktivitaet', label: '3. Aktivität', options: [{ label: 'Häufiges Gehen (4)', val: 4 }, { label: 'Gelegentliches Gehen (3)', val: 3 }, { label: 'An Rollstuhl gebunden (2)', val: 2 }, { label: 'Bettlägerig (1)', val: 1 }] },
        { key: 'mobilitaet', label: '4. Mobilität', options: [{ label: 'Keine Einschränkung (4)', val: 4 }, { label: 'Geringe Einschränkung (3)', val: 3 }, { label: 'Starke Einschränkung (2)', val: 2 }, { label: 'Völlig immobil (1)', val: 1 }] },
        { key: 'ernaehrung', label: '5. Ernährungsverhalten', options: [{ label: 'Ausgezeichnet (4)', val: 4 }, { label: 'Adäquat (3)', val: 3 }, { label: 'Mäßig (2)', val: 2 }, { label: 'Sehr schlecht (1)', val: 1 }] },
        { key: 'reibung', label: '6. Reibung & Scherkräfte', options: [{ label: 'Kein Problem (3)', val: 3 }, { label: 'Potenzielles Problem (2)', val: 2 }, { label: 'Vorhandenes Problem (1)', val: 1 }] }
      ].map(q => (
        <div key={q.key} className="calc-question-block">
          <div className="question-title">{q.label}</div>
          <div className="options-list">
            {q.options.map(opt => (
              <label key={opt.val} className="radio-label">
                <input 
                  type="radio" 
                  name={`braden_${q.key}`} 
                  checked={vals[q.key] === opt.val} 
                  onChange={() => handleChange(q.key, opt.val)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="calc-summary" style={{ backgroundColor: 'var(--amber-light)', borderTop: '2px solid var(--amber-border)' }}>
        <div style={{ color: 'var(--amber-text)' }}>Gesamt-Score: <strong>{totalScore} / 23</strong></div>
        <div style={{ color: 'var(--amber-text)' }}>Einstufung: <strong>{interpretation}</strong></div>
      </div>
      <button className="ph-btn primary amber" onClick={handleSave}>Wert in Akte eintragen</button>
    </div>
  );
}

function NRSRechner({ initialScore, onSave }) {
  const [score, setScore] = useState(initialScore);

  const interpretation = useMemo(() => {
    if (score === 0) return "Schmerzfrei";
    if (score <= 3) return "Leichter Schmerz";
    if (score <= 6) return "Mäßiger Schmerz";
    return "Starker bis stärkster Schmerz";
  }, [score]);

  const handleSave = () => {
    onSave(score, interpretation);
  };

  return (
    <div className="ph-calc-box">
      <h4>NRS Schmerzskala</h4>
      <div className="ph-form-group" style={{ margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
          <span>Ruhe- / Belastungsschmerz festlegen:</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--odoo-purple)' }}>{score} / 10</strong>
        </div>
        <input 
          type="range" 
          min="0" 
          max="10" 
          value={score} 
          onChange={e => setScore(parseInt(e.target.value))}
          style={{ width: '100%', height: '8px', cursor: 'pointer' }}
        />
        <div style={{ textAlign: 'center', marginTop: '8px', fontWeight: '600', fontSize: '0.85rem' }}>
          Einstufung: {interpretation}
        </div>
      </div>
      <button className="ph-btn primary" onClick={handleSave}>Speichern</button>
    </div>
  );
}
