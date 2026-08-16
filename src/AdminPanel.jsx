import React, { useState, useEffect } from 'react';
import './Medikamente.css';

export default function AdminPanel({ onHome }) {
  const [activeTab, setActiveTab] = useState('patient'); // 'patient' or 'medication'
  const [medsList, setMedsList] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states for Patient
  const [patientForm, setPatientForm] = useState({
    name: '',
    room: '',
    pflegegrad: '3',
    dob: '',
    allergies: 'Keine bekannten Allergien',
    krankenkasse: 'AOK Nordost',
    station: 'Station A',
    biografie: '',
    diagnosisIcd: '',
    diagnosisTitle: '',
    medName: '',
    medDose: '1-0-0-0',
    medNotes: ''
  });

  const [addedDiagnosen, setAddedDiagnosen] = useState([]);
  const [addedMedikamente, setAddedMedikamente] = useState([]);

  // Form states for Medication
  const [medForm, setMedForm] = useState({
    name: '',
    brandName: '',
    generic: '',
    category: 'Herz-Kreislauf',
    categoryLabel: 'Beta-Blocker / Antihypertonikum',
    color: '#3b82f6',
    mechanism: '',
    dosage: '',
    criticalWarning: '',
    sideEffectInput: '',
    nursingInput: '',
    shape: 'Rund',
    pillColor: 'Weiß',
    imprint: '',
    pzn: ''
  });

  const [addedSideEffects, setAddedSideEffects] = useState([]);
  const [addedNursingFocus, setAddedNursingFocus] = useState([]);

  useEffect(() => {
    // Load medications list from backend to link with patient plan
    fetch('/api/medications')
      .then(res => res.json())
      .then(data => setMedsList(data))
      .catch(err => console.error("Error loading medications in Admin:", err));
  }, []);

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!patientForm.name.trim()) {
      setErrorMsg('Bitte geben Sie den Namen des Patienten ein.');
      return;
    }

    const payload = {
      name: patientForm.name,
      room: patientForm.room,
      pflegegrad: parseInt(patientForm.pflegegrad),
      dob: patientForm.dob || '01.01.1940',
      allergies: patientForm.allergies,
      krankenkasse: patientForm.krankenkasse,
      station: patientForm.station,
      diagnosen: addedDiagnosen,
      medikamente: addedMedikamente,
      biografie: patientForm.biografie
    };

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Fehler beim Speichern des Patienten.");

      const newPatient = await res.json();
      setSuccessMsg(`Patient "${newPatient.name}" wurde erfolgreich mit ID ${newPatient.id} angelegt!`);
      
      // Reset Patient Form
      setPatientForm({
        name: '',
        room: '',
        pflegegrad: '3',
        dob: '',
        allergies: 'Keine bekannten Allergien',
        krankenkasse: 'AOK Nordost',
        station: 'Station A',
        biografie: '',
        diagnosisIcd: '',
        diagnosisTitle: '',
        medName: '',
        medDose: '1-0-0-0',
        medNotes: ''
      });
      setAddedDiagnosen([]);
      setAddedMedikamente([]);
    } catch (err) {
      setErrorMsg(err.message || "Netzwerkfehler beim Anlegen des Patienten.");
    }
  };

  const handleMedicationSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!medForm.name.trim()) {
      setErrorMsg('Bitte geben Sie den Wirkstoffnamen ein.');
      return;
    }

    const payload = {
      name: medForm.name,
      brandName: medForm.brandName || medForm.name,
      generic: medForm.generic || medForm.name,
      category: medForm.category,
      categoryLabel: medForm.categoryLabel,
      color: medForm.color,
      mechanism: medForm.mechanism,
      dosage: medForm.dosage,
      criticalWarning: medForm.criticalWarning,
      sideEffects: addedSideEffects,
      nursingFocus: addedNursingFocus,
      pillDetails: {
        shape: medForm.shape,
        color: medForm.pillColor,
        imprint: medForm.imprint
      },
      pzn: medForm.pzn
    };

    try {
      const res = await fetch('/api/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Fehler beim Speichern des Medikaments.");

      const newMed = await res.json();
      setSuccessMsg(`Wirkstoff "${newMed.name}" wurde erfolgreich in der Datenbank gespeichert!`);

      // Reset Medication Form
      setMedForm({
        name: '',
        brandName: '',
        generic: '',
        category: 'Herz-Kreislauf',
        categoryLabel: 'Beta-Blocker / Antihypertonikum',
        color: '#3b82f6',
        mechanism: '',
        dosage: '',
        criticalWarning: '',
        sideEffectInput: '',
        nursingInput: '',
        shape: 'Rund',
        pillColor: 'Weiß',
        imprint: '',
        pzn: ''
      });
      setAddedSideEffects([]);
      setAddedNursingFocus([]);
    } catch (err) {
      setErrorMsg(err.message || "Netzwerkfehler beim Anlegen des Medikaments.");
    }
  };

  const addDiagnose = () => {
    if (patientForm.diagnosisTitle.trim()) {
      setAddedDiagnosen([
        ...addedDiagnosen,
        { icd: patientForm.diagnosisIcd.trim() || 'ICD-10', title: patientForm.diagnosisTitle.trim() }
      ]);
      setPatientForm({ ...patientForm, diagnosisIcd: '', diagnosisTitle: '' });
    }
  };

  const addMedikamentToPatient = () => {
    if (patientForm.medName.trim()) {
      setAddedMedikamente([
        ...addedMedikamente,
        { name: patientForm.medName.trim(), dose: patientForm.medDose, notes: patientForm.medNotes.trim() }
      ]);
      setPatientForm({ ...patientForm, medName: '', medDose: '1-0-0-0', medNotes: '' });
    }
  };

  const addSideEffect = () => {
    if (medForm.sideEffectInput.trim()) {
      setAddedSideEffects([...addedSideEffects, medForm.sideEffectInput.trim()]);
      setMedForm({ ...medForm, sideEffectInput: '' });
    }
  };

  const addNursingFocus = () => {
    if (medForm.nursingInput.trim()) {
      setAddedNursingFocus([...addedNursingFocus, medForm.nursingInput.trim()]);
      setMedForm({ ...medForm, nursingInput: '' });
    }
  };

  return (
    <div className="meds-app" style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="meds-header" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onHome} className="meds-back-btn" style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined">arrow_back</span>
            Hauptmenü
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f2942', margin: 0 }}>
              ⚙️ Admin-Zentrale & Stammdatenverwaltung
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Neue Patientenakte oder Arzneimittel-Wirkstoffe direkt im System erfassen
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setActiveTab('patient'); setSuccessMsg(''); setErrorMsg(''); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'patient' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'patient' ? '#0052cc' : '#ffffff',
              color: activeTab === 'patient' ? '#ffffff' : '#475569',
              fontWeight: activeTab === 'patient' ? 800 : 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            👤 Patient anlegen
          </button>
          <button
            onClick={() => { setActiveTab('medication'); setSuccessMsg(''); setErrorMsg(''); }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: activeTab === 'medication' ? 'none' : '1px solid #cbd5e1',
              background: activeTab === 'medication' ? '#0052cc' : '#ffffff',
              color: activeTab === 'medication' ? '#ffffff' : '#475569',
              fontWeight: activeTab === 'medication' ? 800 : 600,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            💊 Medikament anlegen
          </button>
        </div>
      </header>

      {/* Main Form Container */}
      <div style={{ padding: '32px 40px', maxWidth: '1000px', margin: '0 auto' }}>
        {successMsg && (
          <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, fontSize: '0.9rem' }}>
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '14px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 700, fontSize: '0.9rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {activeTab === 'patient' ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f2942' }}>
              👤 Neuer Patient für Pflegedokumentation & Fallstudien
            </h2>

            <form onSubmit={handlePatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Patientenname *</label>
                  <input
                    type="text"
                    placeholder="z.B. Friedrich Müller"
                    value={patientForm.name}
                    onChange={e => setPatientForm({ ...patientForm, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Zimmer / Bett</label>
                  <input
                    type="text"
                    placeholder="z.B. Zimmer 104 / Bett 2"
                    value={patientForm.room}
                    onChange={e => setPatientForm({ ...patientForm, room: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Pflegegrad</label>
                  <select
                    value={patientForm.pflegegrad}
                    onChange={e => setPatientForm({ ...patientForm, pflegegrad: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="1">Pflegegrad 1</option>
                    <option value="2">Pflegegrad 2</option>
                    <option value="3">Pflegegrad 3</option>
                    <option value="4">Pflegegrad 4</option>
                    <option value="5">Pflegegrad 5</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Geburtsdatum</label>
                  <input
                    type="text"
                    placeholder="TT.MM.YYYY"
                    value={patientForm.dob}
                    onChange={e => setPatientForm({ ...patientForm, dob: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Station</label>
                  <input
                    type="text"
                    placeholder="Station A"
                    value={patientForm.station}
                    onChange={e => setPatientForm({ ...patientForm, station: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Biografie & Pflegeerfordernisse</label>
                <textarea
                  rows={3}
                  placeholder="Patientenbiografie, Vorlieben und Ressourcen..."
                  value={patientForm.biografie}
                  onChange={e => setPatientForm({ ...patientForm, biografie: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              {/* Diagnosen Builder */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f2942', marginBottom: '8px' }}>
                  📋 Medizinische Diagnosen hinzufügen
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="ICD (z.B. I10.9)"
                    style={{ width: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={patientForm.diagnosisIcd}
                    onChange={e => setPatientForm({ ...patientForm, diagnosisIcd: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Diagnosebezeichnung (z.B. Essentielle Hypertonie)"
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={patientForm.diagnosisTitle}
                    onChange={e => setPatientForm({ ...patientForm, diagnosisTitle: e.target.value })}
                  />
                  <button type="button" onClick={addDiagnose} style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                    + Hinzufügen
                  </button>
                </div>
                {addedDiagnosen.map((d, i) => (
                  <span key={i} style={{ display: 'inline-block', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', marginRight: '6px', marginBottom: '6px' }}>
                    <strong>{d.icd}:</strong> {d.title}
                  </span>
                ))}
              </div>

              {/* Medikamente Planer */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f2942', marginBottom: '8px' }}>
                  💊 Medikationsplan zuweisen
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <select
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={patientForm.medName}
                    onChange={e => setPatientForm({ ...patientForm, medName: e.target.value })}
                  >
                    <option value="">Medikament auswählen...</option>
                    {medsList.map(m => (
                      <option key={m.id} value={m.name}>{m.name} ({m.brandName || m.generic})</option>
                    ))}
                    <option value="Metoprolol 50mg">Metoprolol 50mg</option>
                    <option value="Ramipril 5mg">Ramipril 5mg</option>
                    <option value="Torasemid 10mg">Torasemid 10mg</option>
                    <option value="Pantoprazol 20mg">Pantoprazol 20mg</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Dosierung (1-0-0-0)"
                    style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={patientForm.medDose}
                    onChange={e => setPatientForm({ ...patientForm, medDose: e.target.value })}
                  />
                  <button type="button" onClick={addMedikamentToPatient} style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                    + Hinzufügen
                  </button>
                </div>
                {addedMedikamente.map((m, i) => (
                  <span key={i} style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', marginRight: '6px', marginBottom: '6px', fontWeight: 600 }}>
                    💊 {m.name} ({m.dose})
                  </span>
                ))}
              </div>

              <button type="submit" style={{ background: '#0052cc', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>
                ✓ Patient persistent anlegen
              </button>
            </form>
          </div>
        ) : (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0f2942' }}>
              💊 Neues Medikament / Wirkstoff anlegen
            </h2>

            <form onSubmit={handleMedicationSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Wirkstoffname *</label>
                  <input
                    type="text"
                    placeholder="z.B. Metoprolol"
                    value={medForm.name}
                    onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Handelsname</label>
                  <input
                    type="text"
                    placeholder="z.B. Beloc-Zok"
                    value={medForm.brandName}
                    onChange={e => setMedForm({ ...medForm, brandName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Kategorie</label>
                  <select
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    value={medForm.category}
                    onChange={e => setMedForm({ ...medForm, category: e.target.value })}
                  >
                    {["Herz-Kreislauf", "Analgetika", "Antidiabetika", "Magen-Darm", "Hormone", "Atemwege", "Psychopharmaka", "Neurologie", "Antibiotika", "Sonstige"].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>PZN (Pharmazentralnummer)</label>
                  <input
                    type="text"
                    placeholder="z.B. 01234567"
                    value={medForm.pzn}
                    onChange={e => setMedForm({ ...medForm, pzn: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Wirkstoffbeschreibung / Indikation</label>
                <textarea
                  rows={2}
                  placeholder="Indikation und Wirkungsweise..."
                  value={medForm.mechanism}
                  onChange={e => setMedForm({ ...medForm, mechanism: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>Kritischer Warnhinweis / Blackbox</label>
                <input
                  type="text"
                  placeholder="z.B. Puls und Blutdruck vor Verabreichung kontrollieren!"
                  value={medForm.criticalWarning}
                  onChange={e => setMedForm({ ...medForm, criticalWarning: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ef4444', color: '#991b1b' }}
                />
              </div>

              {/* Side Effects */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f2942', marginBottom: '8px' }}>
                  ⚠️ Nebenwirkungen hinzufügen
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="z.B. Bradykardie, Schwindel"
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={medForm.sideEffectInput}
                    onChange={e => setMedForm({ ...medForm, sideEffectInput: e.target.value })}
                  />
                  <button type="button" onClick={addSideEffect} style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                    + Hinzufügen
                  </button>
                </div>
                {addedSideEffects.map((se, i) => (
                  <span key={i} style={{ display: 'inline-block', background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', marginRight: '6px', marginBottom: '6px' }}>
                    {se}
                  </span>
                ))}
              </div>

              {/* Nursing Focus */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f2942', marginBottom: '8px' }}>
                  🩺 Pflegerische Schwerpunkte
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="z.B. Regelmäßige Pulskontrolle"
                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value={medForm.nursingInput}
                    onChange={e => setMedForm({ ...medForm, nursingInput: e.target.value })}
                  />
                  <button type="button" onClick={addNursingFocus} style={{ background: '#e2e8f0', border: 'none', borderRadius: '6px', padding: '0 16px', fontWeight: 700, cursor: 'pointer' }}>
                    + Hinzufügen
                  </button>
                </div>
                {addedNursingFocus.map((nf, i) => (
                  <span key={i} style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', marginRight: '6px', marginBottom: '6px' }}>
                    {nf}
                  </span>
                ))}
              </div>

              <button type="submit" style={{ background: '#0052cc', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>
                ✓ Wirkstoff persistent speichern
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
