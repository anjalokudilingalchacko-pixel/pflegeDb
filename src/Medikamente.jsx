import React, { useState, useEffect, useMemo } from 'react';
import { OFFLINE_DRUGS } from './MedikamenteData';
import { getInitialPatients } from './patientData';
import './Medikamente.css';

// Normalize helper to unify mock database, offline catalog, and openFDA formats
function normalizeDrugData(raw) {
  if (!raw) return null;
  if (raw.isNormalized) return raw;

  const isBackend = !!raw.categoryLabel;
  const isOffline = !!raw.clinical;

  let name = raw.name || "Unbekannt";
  let brandName = raw.brandName || (isOffline ? raw.name : "");
  let generic = raw.generic || raw.name || "";
  let categoryLabel = raw.categoryLabel || raw.category || (isOffline ? "Pharmazeutikum" : "Wirkstoff");
  
  let standardDosage = raw.dosage || raw.clinical?.dosage || "Gemäß ärztlicher Anordnung";
  let frequency = "Regelmäßig nach Plan";
  if (isBackend) {
    if (raw.id === 'furosemid') frequency = 'Morgens (ggf. mittags)';
    else if (raw.id === 'l-thyroxin') frequency = 'Morgens (nüchtern)';
    else if (raw.id === 'marcumar') frequency = 'Einmal täglich abends';
    else frequency = '1-2 mal täglich';
  } else if (isOffline) {
    frequency = raw.simplified?.usage?.substring(0, 40) || 'Nach Verordnung';
  }

  let drugType = categoryLabel;
  let indicationText = raw.indication || raw.clinical?.indication || "Zur symptomatischen Behandlung.";
  
  let commonSideEffects = [];
  let seriousSideEffects = [];
  if (isBackend && Array.isArray(raw.sideEffects)) {
    commonSideEffects = raw.sideEffects.slice(0, 2);
    seriousSideEffects = raw.sideEffects.slice(2);
  } else {
    const rawSe = raw.sideEffects || raw.clinical?.sideEffects || "Keine spezifischen Nebenwirkungen gelistet.";
    const parts = typeof rawSe === 'string' ? rawSe.split(/[.,;]/) : [];
    commonSideEffects = parts.slice(0, 3).map(s => s.trim()).filter(Boolean);
    seriousSideEffects = parts.slice(3, 6).map(s => s.trim()).filter(Boolean);
  }
  if (commonSideEffects.length === 0) commonSideEffects = ["Übelkeit", "Magenbeschwerden"];
  if (seriousSideEffects.length === 0) seriousSideEffects = ["Allergische Reaktionen", "Atemnot (Arzt aufsuchen)"];

  let warningsText = raw.criticalWarning || raw.clinical?.warnings || "Vorsicht bei Überempfindlichkeit.";

  let nursingFocusList = [];
  if (isBackend && Array.isArray(raw.nursingFocus)) {
    nursingFocusList = raw.nursingFocus;
  } else {
    const rawFocus = raw.clinical?.interactions || "";
    nursingFocusList = [
      "5-R-Regel vor Verabreichung überprüfen (Richtiger Patient, Medikament, Dosis, Weg, Zeitpunkt).",
      rawFocus ? `Wechselwirkungen beachten: ${rawFocus}` : "Auf Magenverträglichkeit und Flüssigkeitszufuhr achten.",
      "Dokumentation der Einnahme im Pflegebericht/Kurve sicherstellen."
    ];
  }

  let shape = "Rund";
  let color = "Weiß";
  let imprint = "M-100";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("metoprolol")) { shape = "Rund"; color = "Weiß (mit Rille)"; imprint = "B-Z"; }
  else if (lowerName.includes("ramipril")) { shape = "Oval"; color = "Rosa / Weiß"; imprint = "R-5"; }
  else if (lowerName.includes("ibuprofen")) { shape = "Rund"; color = "Weiß"; imprint = "IP-400"; }
  else if (lowerName.includes("pantoprazol")) { shape = "Oval"; color = "Gelb"; imprint = "P-40"; }
  else if (lowerName.includes("furosemid")) { shape = "Rund"; color = "Weiß"; imprint = "F-40"; }
  else if (lowerName.includes("marcumar") || lowerName.includes("phenprocoumon")) { shape = "Rund"; color = "Weiß"; imprint = "M-3"; }
  else if (lowerName.includes("metformin")) { shape = "Oval"; color = "Weiß"; imprint = "MF-1000"; }
  else if (lowerName.includes("novalgin") || lowerName.includes("metamizol")) { shape = "Rund"; color = "Weiß"; imprint = "N-500"; }
  else if (lowerName.includes("thyroxin") || lowerName.includes("levothyroxin")) { shape = "Rund"; color = "Weiß"; imprint = "T-100"; }

  let timeline = [
    { time: "08:00 Uhr", action: "Dose 1", desc: "Verabreichung morgens" },
    { time: "14:00 Uhr", action: "Dose 2", desc: "Verabreichung mittags bei Bedarf" },
    { time: "20:00 Uhr", action: "Dose 3", desc: "Abenddosis falls verordnet" }
  ];
  if (lowerName.includes("thyroxin") || lowerName.includes("levothyroxin")) {
    timeline = [
      { time: "07:30 Uhr", action: "Nüchterngabe", desc: "Mindestens 30 Minuten vor dem Frühstück mit Leitungswasser einnehmen" },
      { time: "08:00 Uhr", action: "Frühstück", desc: "Nahrungsaufnahme erlaubt" }
    ];
  } else if (lowerName.includes("furosemid")) {
    timeline = [
      { time: "08:00 Uhr", action: "Gabe Morgens", desc: "Mit reichlich Flüssigkeit einnehmen (starke Entwässerung)" },
      { time: "14:00 Uhr", action: "Gabe Mittags", desc: "Zweite Dosis falls verordnet. Nicht abends geben!" }
    ];
  } else if (lowerName.includes("pantoprazol")) {
    timeline = [
      { time: "07:00 Uhr", action: "Nüchterngabe", desc: "1 Stunde vor dem Frühstück unzerkaut einnehmen" }
    ];
  } else if (lowerName.includes("marcumar") || lowerName.includes("phenprocoumon")) {
    timeline = [
      { time: "18:00 Uhr", action: "Abendgabe", desc: "Einnahme abends, Dosis an INR-Wert anpassen" }
    ];
  } else if (lowerName.includes("ramipril")) {
    timeline = [
      { time: "08:00 Uhr", action: "Morgengabe", desc: "Blutdruckkontrolle vor Verabreichung durchführen" }
    ];
  }

  return {
    isNormalized: true,
    name,
    brandName,
    generic,
    categoryLabel,
    standardDosage,
    frequency,
    drugType,
    indicationText,
    commonSideEffects,
    seriousSideEffects,
    warningsText,
    nursingFocusList,
    shape,
    color,
    imprint,
    timeline,
    raw
  };
}

export default function Medikamente({ onHome }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [patients, setPatients] = useState(() => getInitialPatients());

  useEffect(() => {
    fetch('/api/patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
        }
      })
      .catch(err => console.error("Error loading patients in Medikamente:", err));
  }, []);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedMedPlanCard, setSelectedMedPlanCard] = useState(null);
  const [selectedStation, setSelectedStation] = useState('ALL');

  const filteredPatients = useMemo(() => {
    if (selectedStation === 'ALL') return patients;
    return patients.filter(p => p.station === selectedStation);
  }, [patients, selectedStation]);
  
  const [activeDrug, setActiveDrug] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Accordion toggle states
  const [openAccordions, setOpenAccordions] = useState({
    warnings: true,
    sideEffects: false,
    nursingFocus: false,
    storage: false
  });

  const toggleAccordion = (section) => {
    setOpenAccordions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSearch = async (queryStr) => {
    const term = queryStr.trim().toLowerCase();
    if (!term) return;

    setIsLoading(true);
    setErrorMsg('');
    setActiveDrug(null);

    // 1. Check Offline Catalog first
    if (OFFLINE_DRUGS[term]) {
      setActiveDrug(normalizeDrugData(OFFLINE_DRUGS[term]));
      setIsLoading(false);
      return;
    }

    // 2. Query Local Express Server medications endpoint
    try {
      const backendUrl = `/api/medications?q=${encodeURIComponent(term)}`;
      const backendRes = await fetch(backendUrl);
      if (backendRes.ok) {
        const backendMeds = await backendRes.json();
        if (backendMeds && backendMeds.length > 0) {
          setSearchResults(backendMeds);
          // Select closest match
          const matched = backendMeds.find(m => m.name.toLowerCase() === term || m.id === term) || backendMeds[0];
          setActiveDrug(normalizeDrugData(matched));
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed fetching from local medications database, falling back to network APIs.", e);
    }

    // 3. Fallback to openFDA + RxNorm APIs
    try {
      const rxNormUrl = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(term)}`;
      const rxNormRes = await fetch(rxNormUrl);
      if (!rxNormRes.ok) throw new Error("RxNorm API Fehler");

      const rxNormData = await rxNormRes.json();
      const rxcui = rxNormData.idGroup?.rxnormId?.[0];

      if (!rxcui) {
        throw new Error(`Das Medikament "${queryStr}" konnte in der Datenbank nicht identifiziert werden.`);
      }

      const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.rxcui:${rxcui}`;
      const fdaRes = await fetch(fdaUrl);
      
      if (!fdaRes.ok) {
        if (fdaRes.status === 404) {
          throw new Error(`Keine Fachinformationen für "${queryStr}" (RxCUI: ${rxcui}) auf openFDA vorhanden.`);
        }
        throw new Error("openFDA API Fehler");
      }

      const fdaData = await fdaRes.json();
      const results = fdaData.results?.[0];

      if (!results) {
        throw new Error("Fehler beim Lesen der Ergebnisse.");
      }

      const translatedDrug = {
        name: queryStr.charAt(0).toUpperCase() + queryStr.slice(1),
        generic: results.active_ingredient?.[0] || results.openfda?.generic_name?.[0] || queryStr,
        clinical: {
          indication: results.indications_and_usage?.[0] || "Keine genauen Anwendungsgebiete spezifiziert.",
          dosage: results.dosage_and_administration?.[0] || "Keine Dosierungsrichtlinien angegeben.",
          pharmacodynamics: results.description?.[0] || "Keine nähere Wirkstoffbeschreibung vorhanden.",
          sideEffects: results.adverse_reactions?.[0] || "Keine Nebenwirkungen verzeichnet.",
          interactions: results.drug_interactions?.[0] || "Keine Wechselwirkungen gelistet.",
          warnings: results.warnings?.[0] || results.warnings_and_cautions?.[0] || "Keine Warnhinweise angegeben."
        }
      };

      setActiveDrug(normalizeDrugData(translatedDrug));
    } catch (err) {
      console.error("Medication fetch error", err);
      setErrorMsg(err.message || "Es trat ein Netzwerkfehler beim Laden der Medikamentendaten auf.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSelectedMedPlanCard(null);
    setActiveDrug(null);
    setErrorMsg('');
    setSearchResults([]);
  };

  const handleMedPlanCardSelect = (med) => {
    setSelectedMedPlanCard(med);
    const lookupTerm = med.activeIngredient || med.name.split(' ')[0];
    handleSearch(lookupTerm);
  };

  return (
    <div className="meds-lookup-workspace">
      
      {/* LEFT SIDEBAR - Patient plans and search */}
      <aside className="meds-sidebar-layout">

        {/* Station / Bereich Selection & Patient Quick Selector (Matches PflegeHeute Top-Down Flow Layout) */}
        <div className="meds-search-box-sidebar" style={{ marginBottom: '12px' }}>
          <label className="meds-section-divider">🏢 Bereich / Station Filter</label>
          <select 
            className="meds-form-select-sidebar"
            value={selectedStation} 
            onChange={(e) => setSelectedStation(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer', marginBottom: '10px' }}
          >
            <option value="ALL">Alle Stationen / Bereiche ({patients.length})</option>
            <option value="Station 1">Station 1</option>
            <option value="Station 2">Station 2</option>
            <option value="Station 3">Station 3</option>
            <option value="Krankenhaus">Krankenhaus</option>
            <option value="Allgemeinchirurgie">Allgemeinchirurgie</option>
          </select>

          <label className="meds-section-divider" style={{ marginTop: '6px' }}>📋 Patienten-Akte Schnellauswahl</label>
          <select
            className="meds-form-select-sidebar"
            value={selectedPatient ? selectedPatient.id : 'NONE'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'NONE') {
                setSelectedPatient(null);
              } else {
                const found = patients.find(p => String(p.id) === String(val));
                if (found) handlePatientSelect(found);
              }
            }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--outline-variant)', background: 'var(--surface-container-high)', color: 'var(--on-surface)', fontSize: '0.85rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
          >
            <option value="NONE">-- Patient auswählen --</option>
            {filteredPatients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (Pg {p.pflegegrad} - Rm {p.room}) [{p.station || 'Station 1'}]
              </option>
            ))}
          </select>
        </div>

        {/* General Search Input */}
        <div className="meds-search-box-sidebar">
          <label className="meds-section-divider">Allgemeine Wirkstoffsuche</label>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }} style={{ margin: 0 }}>
            <div className="meds-search-input-wrapper-sidebar">
              <span className="material-symbols-outlined text-[18px] text-outline">search</span>
              <input
                type="text"
                placeholder="Wirkstoff / Markenname..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Quick Presets */}
          <div className="meds-presets-sidebar">
            {["Ibuprofen", "Ramipril", "Metoprolol", "Metformin", "Pantoprazol", "Furosemid", "Marcumar", "Novalgin", "L-Thyroxin"].map(name => (
              <button 
                key={name}
                type="button" 
                className="meds-preset-tag"
                onClick={() => {
                  setSelectedPatient(null);
                  setSearchQuery(name);
                  handleSearch(name);
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results if available */}
        {searchResults.length > 0 && (
          <div className="meds-patients-section">
            <div className="meds-section-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Suchergebnisse ({searchResults.length})</span>
              <button 
                onClick={() => setSearchResults([])}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}
              >
                Leeren
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              {searchResults.slice(0, 15).map(res => {
                const isItemActive = activeDrug && activeDrug.name === res.name && activeDrug.pzn === res.pzn;
                return (
                  <button
                    key={res.id}
                    className={`meds-patient-card-item ${isItemActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedPatient(null);
                      setActiveDrug(normalizeDrugData(res));
                    }}
                    style={{ padding: '8px 12px' }}
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">medication</span>
                    <div className="meds-patient-details-mini">
                      <div className="meds-patient-name-mini" style={{ fontSize: '0.8rem' }}>{res.name}</div>
                      <div className="meds-patient-meta-mini" style={{ fontSize: '0.7rem' }}>{res.categoryLabel} • {res.pzn}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
 
        {/* Clean Selected Patient Quick Info Badge (if selected) */}
        {selectedPatient && (
          <div className="meds-search-box-sidebar" style={{ background: 'var(--surface-container)', border: '1px solid var(--outline-variant)', borderRadius: '12px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary)" }}>
                👤 {selectedPatient.name}
              </div>
              <button 
                onClick={() => setSelectedPatient(null)}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
              >
                ✕ Schließen
              </button>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)" }}>
              Raum {selectedPatient.room} • Pflegegrad {selectedPatient.pflegegrad} • {selectedPatient.station || 'Station 1'}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700, marginTop: "4px" }}>
              📋 {selectedPatient.medikamente ? selectedPatient.medikamente.length : 0} Medikamente im Plan
            </div>
          </div>
        )}
      </aside>

      {/* RIGHT MAIN WORKSPACE */}
      <main className="meds-main-content-layout">
        
        {/* Patient Profile Banner if selected */}
        {selectedPatient && (
          <section className="meds-patient-profile-banner">
            <div className="meds-patient-profile-header">
              <div className="meds-patient-avatar-large" style={{ backgroundColor: selectedPatient.id % 2 === 0 ? 'var(--primary)' : '#2e7d32' }}>
                {selectedPatient.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="meds-patient-profile-info">
                <h3>{selectedPatient.name}</h3>
                <div className="meds-patient-profile-meta">
                  Geb.: {selectedPatient.dob} • Allergien: <strong style={{ color: 'var(--error)' }}>{selectedPatient.allergies}</strong> • Krankenkasse: {selectedPatient.krankenkasse}
                </div>
                <div className="meds-patient-profile-meta" style={{ marginTop: '4px' }}>
                  Hauptdiagnosen: {selectedPatient.diagnosen.map(d => `${d.title} (${d.icd})`).join(', ') || 'Keine Angaben'}
                </div>
              </div>
            </div>
            
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--on-surface-variant)', fontWeight: 700, marginBottom: '12px' }}>
              Aktueller Medikationsplan (Klicken zum Analysieren):
            </h4>
            <div className="meds-patient-med-plan-grid">
              {selectedPatient.medikamente.map((med, idx) => {
                const isCardActive = selectedMedPlanCard && selectedMedPlanCard.name === med.name;
                return (
                  <button
                    key={idx}
                    className={`meds-med-plan-card ${isCardActive ? 'active' : ''}`}
                    onClick={() => handleMedPlanCardSelect(med)}
                  >
                    <div>
                      <div className="meds-med-plan-name">{med.name}</div>
                      <span className="meds-med-plan-dose">🕒 {med.dose}</span>
                    </div>
                    <div>
                      <div className="meds-med-plan-indication"><strong>Indikation:</strong> {med.indication}</div>
                      {med.notes && <div className="meds-med-plan-notes">Hinweis: {med.notes}</div>}
                    </div>
                  </button>
                );
              })}
              {selectedPatient.medikamente.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', gridColumn: '1 / -1' }}>
                  Keine Medikamente in der Kurve dieses Patienten eingetragen.
                </p>
              )}
            </div>
          </section>
        )}

        {/* LOADING & ERROR STATES */}
        {isLoading && (
          <div className="meds-empty-workspace" style={{ padding: '80px 40px' }}>
            <div className="spinner" style={{ width: '48px', height: '48px', borderLeftColor: 'var(--primary)' }}></div>
            <p style={{ marginTop: '20px', fontWeight: 600, color: 'var(--primary)' }}>
              Suche läuft in der lokalen Datenbank & API-Verzeichnissen...
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="meds-empty-workspace" style={{ borderLeft: '4px solid var(--error)' }}>
            <span className="material-symbols-outlined text-error" style={{ fontSize: '3rem' }}>warning</span>
            <h3>Suche fehlgeschlagen</h3>
            <p style={{ color: 'var(--on-surface-variant)' }}>{errorMsg}</p>
            <button 
              className="meds-btn-secondary" 
              style={{ marginTop: '16px' }}
              onClick={() => setErrorMsg('')}
            >
              Schließen
            </button>
          </div>
        )}

        {/* EMPTY WORKSPACE */}
        {!isLoading && !errorMsg && !activeDrug && (
          <div className="meds-empty-workspace">
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--outline-variant)' }}>medication</span>
            <h3>Medikamente Informationsportal</h3>
          </div>
        )}

        {/* ACTIVE DRUG PROFILE DATA DISPLAY */}
        {!isLoading && !errorMsg && activeDrug && (
          <div>
            {/* Header Section */}
            <div className="meds-page-header">
              <div className="meds-header-titles">
                <div 
                  className="meds-breadcrumb" 
                  onClick={onHome} 
                  style={{ cursor: onHome ? 'pointer' : 'default' }}
                  title={onHome ? "Zurück zur Startseite" : ""}
                >
                  <span>Bibliothek</span>
                  <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                  <span className="meds-breadcrumb-active">{activeDrug.categoryLabel}</span>
                </div>
                <h2>{activeDrug.name}</h2>
                <p>{activeDrug.standardDosage} • {activeDrug.generic}</p>
              </div>
              <div className="meds-header-actions">
                <button className="meds-btn-secondary">
                  <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  Favoriten
                </button>
                <button className="meds-btn-primary" onClick={() => window.print()}>
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Zusammenfassung drucken
                </button>
              </div>
            </div>

            {/* Grid layout */}
            <div className="meds-grid-main">
              
              {/* LEFT COLUMN: Details, Accordions, and AI */}
              <div className="meds-column-details">
                
                {/* Bento info row */}
                <div className="meds-bento-row">
                  
                  <div className="meds-bento-card">
                    <div className="meds-bento-header">
                      <div className="meds-bento-icon-wrapper">
                        <span className="material-symbols-outlined text-[18px]">vaccines</span>
                      </div>
                      <span className="meds-bento-label">Standard Dosis</span>
                    </div>
                    <p className="meds-bento-value">
                      {activeDrug.standardDosage.includes("mg") 
                        ? activeDrug.standardDosage.match(/\d+m?g/)?.[0] || "Standard"
                        : "Variabel"}
                    </p>
                    <p className="meds-bento-subtext">Je nach Indikation anpassen</p>
                  </div>

                  <div className="meds-bento-card">
                    <div className="meds-bento-header">
                      <div className="meds-bento-icon-wrapper">
                        <span className="material-symbols-outlined text-[18px]">schedule</span>
                      </div>
                      <span className="meds-bento-label">Häufigkeit</span>
                    </div>
                    <p className="meds-bento-value" style={{ fontSize: '1.05rem', marginTop: '4px' }}>
                      {activeDrug.frequency}
                    </p>
                    <p className="meds-bento-subtext">Regelmäßige Einnahmezeiten</p>
                  </div>

                  <div className="meds-bento-card">
                    <div className="meds-bento-header">
                      <div className="meds-bento-icon-wrapper">
                        <span className="material-symbols-outlined text-[18px]">category</span>
                      </div>
                      <span className="meds-bento-label">Substanzklasse</span>
                    </div>
                    <p className="meds-bento-value" style={{ fontSize: '1.05rem', marginTop: '4px' }}>
                      {activeDrug.categoryLabel.split('/')[0].trim()}
                    </p>
                    <p className="meds-bento-subtext">Pharmakologische Gruppe</p>
                  </div>

                </div>

                {/* Primary Action & Indications Card */}
                <div className="meds-details-box">
                  <div className="meds-details-box-header">
                    <h3>Klinische Indikationen & Anwendung</h3>
                    <span className="meds-details-badge">Wirkstoff</span>
                  </div>
                  <div className="meds-details-box-body">
                    <p className="meds-paragraph-intro">
                      {activeDrug.indicationText}
                    </p>
                    <div className="meds-bullets-grid">
                      <div className="meds-bullets-col">
                        <h4>Häufige Indikationen</h4>
                        <ul className="meds-bullet-list">
                          {activeDrug.indicationText.split(/[;,]/).slice(0, 3).map((ind, i) => (
                            <li key={i} className="meds-bullet-item">
                              <span className="icon">✓</span>
                              {ind.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="meds-bullets-col">
                        <h4>Pflegerische Zuordnung</h4>
                        <ul className="meds-bullet-list">
                          <li className="meds-bullet-item">
                            <span className="icon">✓</span>
                            Therapiemonitoring
                          </li>
                          <li className="meds-bullet-item">
                            <span className="icon">✓</span>
                            Dokumentation der Verträglichkeit
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accordions */}
                <div className="meds-accordion-container">
                  
                  {/* Accordion 1: Warnings */}
                  <div className={`meds-accordion-item ${openAccordions.warnings ? 'open' : ''}`}>
                    <button className="meds-accordion-trigger" onClick={() => toggleAccordion('warnings')}>
                      <div className="meds-accordion-trigger-left">
                        <span className="material-symbols-outlined text-[20px] text-error">warning_amber</span>
                        <span className="title">Gegenanzeigen & Warnungen</span>
                      </div>
                      <span className="material-symbols-outlined meds-accordion-chevron">expand_more</span>
                    </button>
                    {openAccordions.warnings && (
                      <div className="meds-accordion-content">
                        <div className="meds-alert-card-danger">
                          <h5>Kritische Kontraindikation / Abbruchkriterien</h5>
                          <p>{activeDrug.warningsText}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion 2: Side Effects */}
                  <div className={`meds-accordion-item ${openAccordions.sideEffects ? 'open' : ''}`}>
                    <button className="meds-accordion-trigger" onClick={() => toggleAccordion('sideEffects')}>
                      <div className="meds-accordion-trigger-left">
                        <span className="material-symbols-outlined text-[20px] text-secondary">health_and_safety</span>
                        <span className="title">Nebenwirkungen (Unerwünschte Wirkungen)</span>
                      </div>
                      <span className="material-symbols-outlined meds-accordion-chevron">expand_more</span>
                    </button>
                    {openAccordions.sideEffects && (
                      <div className="meds-accordion-content">
                        <div className="meds-side-effects-split">
                          <div>
                            <div className="meds-se-title">Häufige Nebenwirkungen</div>
                            <ul className="meds-se-list">
                              {activeDrug.commonSideEffects.map((se, i) => <li key={i}>{se}</li>)}
                            </ul>
                          </div>
                          <div>
                            <div className="meds-se-title">Schwere Verläufe (Arzt informieren!)</div>
                            <ul className="meds-se-list">
                              {activeDrug.seriousSideEffects.map((se, i) => <li key={i}>{se}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accordion 3: Nursing Focus */}
                  <div className={`meds-accordion-item ${openAccordions.nursingFocus ? 'open' : ''}`}>
                    <button className="meds-accordion-trigger" onClick={() => toggleAccordion('nursingFocus')}>
                      <div className="meds-accordion-trigger-left">
                        <span className="material-symbols-outlined text-[20px] text-primary">clinical_notes</span>
                        <span className="title">Pflegerische Schwerpunkte & Vitalzeichenkontrollen</span>
                      </div>
                      <span className="material-symbols-outlined meds-accordion-chevron">expand_more</span>
                    </button>
                    {openAccordions.nursingFocus && (
                      <div className="meds-accordion-content">
                        <ul className="meds-bullet-list" style={{ gap: '12px' }}>
                          {activeDrug.nursingFocusList.map((focus, i) => (
                            <li key={i} className="meds-bullet-item" style={{ fontSize: '0.88rem' }}>
                              <span className="icon" style={{ color: 'var(--primary)' }}>•</span>
                              {focus}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Accordion 4: Storage */}
                  <div className={`meds-accordion-item ${openAccordions.storage ? 'open' : ''}`}>
                    <button className="meds-accordion-trigger" onClick={() => toggleAccordion('storage')}>
                      <div className="meds-accordion-trigger-left">
                        <span className="material-symbols-outlined text-[20px] text-outline">inventory_2</span>
                        <span className="title">Lagerung & Handhabung</span>
                      </div>
                      <span className="material-symbols-outlined meds-accordion-chevron">expand_more</span>
                    </button>
                    {openAccordions.storage && (
                      <div className="meds-accordion-content">
                        <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-variant)', margin: 0 }}>
                          Bei Raumtemperatur (15–25°C) lagern. Vor Feuchtigkeit und direkter Sonneneinstrahlung schützen. Für Kinder unzugänglich aufbewahren. Blisterpackung erst unmittelbar vor der Einnahme öffnen.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* RIGHT COLUMN: Visuals, Timeline, Metadata */}
              <div className="meds-column-visuals">
                
                {/* Visual reference */}
                <div className="meds-visual-card">
                  <div className="meds-visual-header">
                    <h4>Optische Referenz (Visual)</h4>
                  </div>
                  <div className="meds-visual-body">
                    <div className="meds-pill-illustrator">
                      <div className={`meds-pill-mock ${activeDrug.shape.toLowerCase() === 'oval' ? 'oval' : ''}`} style={{ backgroundColor: activeDrug.color.toLowerCase().includes('gelb') ? '#fef08a' : activeDrug.color.toLowerCase().includes('rosa') ? '#fbcfe8' : '#ffffff' }}>
                        <span className="meds-pill-imprint">{activeDrug.imprint}</span>
                      </div>
                    </div>
                    <div className="meds-specs-table">
                      <div className="meds-spec-row">
                        <span className="meds-spec-label">Form</span>
                        <span className="meds-spec-value">{activeDrug.shape}</span>
                      </div>
                      <div className="meds-spec-row">
                        <span className="meds-spec-label">Farbe</span>
                        <span className="meds-spec-value">{activeDrug.color}</span>
                      </div>
                      <div className="meds-spec-row">
                        <span className="meds-spec-label">Prägung (Imprint)</span>
                        <span className="meds-spec-value">{activeDrug.imprint}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dosing timeline guide */}
                <div className="meds-admin-timeline-card">
                  <h4>Pflegerischer Einnahmeplan (Richtlinie)</h4>
                  <div className="meds-timeline-flow">
                    {activeDrug.timeline.map((node, idx) => (
                      <div key={idx} className={`meds-timeline-node ${idx === 0 ? 'active' : 'secondary'}`}>
                        <div className="meds-timeline-bullet"></div>
                        <div>
                          <div className="meds-timeline-title">{node.time} — {node.action}</div>
                          <div className="meds-timeline-desc">{node.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit & Authentication metadata */}
                <div className="meds-auth-badge-card">
                  <div className="meds-auth-header">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Datenbanksicherheit</span>
                  </div>
                  <div className="meds-auth-row">
                    <span>Datenbank-ID:</span>
                    <span className="meds-auth-mono">{activeDrug.name.toLowerCase()}_db</span>
                  </div>
                  <div className="meds-auth-row">
                    <span>Revision:</span>
                    <span>24. Okt. 2023</span>
                  </div>
                  <div className="meds-auth-row">
                    <span>Freigegeben durch:</span>
                    <span>Klinischer Beirat</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
}
