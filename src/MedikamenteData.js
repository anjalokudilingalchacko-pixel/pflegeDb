// Medikamente Lookup Catalog and Translation Dictionary

export const OFFLINE_DRUGS = {
  ibuprofen: {
    name: "Ibuprofen",
    generic: "Ibuprofen",
    clinical: {
      indication: "Leichte bis mäßig starke Schmerzen (Kopfschmerzen, Zahnschmerzen, Regelschmerzen), Fieber, akute Gelenkentzündungen (Arthritis), chronische Gelenkentzündungen, Arthrosen.",
      dosage: "Erwachsene: 200mg - 400mg als Einzeldosis, maximale Tagesdosis 1200mg (freiverkäuflich) bzw. 2400mg (ärztlich verordnet). Einnahmeabstand: 4 bis 6 Stunden.",
      pharmacodynamics: "Nichtsteroidales Antirheumatikum (NSAR). Hemmt die Cyclooxygenasen COX-1 und COX-2, wodurch die Synthese von entzündungs- und schmerzvermittelnden Prostaglandinen blockiert wird. Wirkt analgetisch (schmerzlindernd), antipyretisch (fiebersenkend) und antiphlogistisch (entzündungshemmend).",
      sideEffects: "Gastrointestinale Beschwerden (Übelkeit, Sodbrennen, Magen- oder Zwölffingerdarmgeschwüre, Blutungen), Kopfschmerzen, Schwindel, Ödeme (Wasseransammlungen), allergische Hautreaktionen.",
      interactions: "Erhöhtes Blutungsrisiko bei Einnahme von Antikoagulanzien (z.B. Marcumar, Apixaban) oder Thrombozytenaggregationshemmern (z.B. ASS). Abschwächung der Wirkung von Diuretika und Blutdrucksenkern (ACE-Hemmer, Betablocker). Nierenschädigung bei Kombination mit anderen NSAR oder Ciclosporin.",
      warnings: "Kontraindiziert bei aktiven Magen-Darm-Blutungen oder -Geschwüren, schwerer Leber- oder Niereninsuffizienz, schwerer Herzinsuffizienz und im letzten Schwangerschaftsdrittel. Erhöhtes Risiko für kardiovaskuläre Ereignisse bei hoher Dosierung über lange Zeit."
    },
    simplified: {
      summary: "Ein vielseitiges Schmerzmittel, das auch Entzündungen hemmt und Fieber senkt.",
      usage: "Bei Kopf-, Zahn- oder Regelschmerzen sowie Gelenkentzündungen oder Fieber. Am besten mit reichlich Wasser während oder nach einer Mahlzeit einnehmen, um den Magen zu schonen.",
      warningsSimple: "Nehmen Sie Ibuprofen ohne ärztlichen Rat nicht länger als 3-4 Tage ein. Achten Sie auf Magenschmerzen oder dunklen Stuhlgang (Anzeichen für Magenblutungen). Vermeiden Sie Alkohol während der Einnahme, da dies das Risiko von Magenproblemen erhöht."
    }
  },
  ramipril: {
    name: "Ramipril",
    generic: "Ramipril",
    clinical: {
      indication: "Arterielle Hypertonie (Bluthochdruck), Herzinsuffizienz (Herzschwäche), Zustand nach Myokardinfarkt (Herzinfarkt), Reduktion des Risikos für Herzinfarkt oder Schlaganfall bei Risikopatienten.",
      dosage: "Anfangsdosis: 1,25mg bis 2,5mg einmal täglich, schrittweise Erhöhung (Titration) auf Erhaltungsdosis von 5mg bis 10mg täglich. Einnahme idealerweise morgens zur gleichen Uhrzeit.",
      pharmacodynamics: "ACE-Hemmer (Angiotensin-Converting-Enzyme-Inhibitor). Blockiert die Umwandlung von Angiotensin I in das stark vasokonstriktorisch wirkende Angiotensin II. Dies führt zur peripheren Vasodilatation (Gefäßerweiterung) und verringert den Aldosteronspiegel, wodurch Blutdruck und Herzarbeit gesenkt werden.",
      sideEffects: "Trockener Reizhusten (durch Akkumulation von Bradykinin), Hypotonie (insbesondere Orthostase bei Therapiebeginn), Hyperkaliämie (erhöhter Kaliumspiegel), Schwindel, Kopfschmerzen, Nierenfunktionsstörungen, Angioödem (selten aber lebensgefährlich).",
      interactions: "Erhöhtes Risiko einer Hyperkaliämie bei Kombination mit kaliumsparenden Diuretika (z.B. Spironolacton) oder Kaliumpräparaten. Blutdruckabfall bei Kombination mit anderen Antihypertensiva. Abschwächung der Wirkung durch NSAR (z.B. Ibuprofen) mit Risiko einer Nierenverschlechterung.",
      warnings: "Kontraindiziert bei Schwangerschaft (teratogene Wirkung) und Stillzeit, beidseitiger Nierenarterienstenose und anamnestischem Angioödem. Nierenwerte und Kaliumspiegel müssen vor und während der Therapie regelmäßig überwacht werden."
    },
    simplified: {
      summary: "Ein Medikament zur Senkung des Blutdrucks, das die Blutgefäße weitet und das Herz entlastet.",
      usage: "Wird meistens morgens mit etwas Wasser eingenommen. Die Einnahme sollte regelmäßig erfolgen, auch wenn Sie sich gut fühlen.",
      warningsSimple: "Ein sehr häufiger, harmloser Nebeneffekt ist ein trockener, kitzelnder Reizhusten. Sollte dieser zu störend werden, sprechen Sie mit Ihrem Arzt (oft ist ein Wechsel auf eine andere Medikamentenklasse nötig). Achten Sie anfangs auf Schwindel beim schnellen Aufstehen."
    }
  },
  metoprolol: {
    name: "Metoprolol",
    generic: "Metoprololsuccinat / Metoprololtartrat",
    clinical: {
      indication: "Arterielle Hypertonie, Koronare Herzkrankheit (Angina Pectoris), Tachykarde Rhythmusstörungen, Migräneprophylaxe, stabile chronische Herzinsuffizienz (Ergänzungstherapie).",
      dosage: "Metoprololsuccinat (Retardtabletten): 47,5mg bis 190mg einmal täglich morgens. Metoprololtartrat (schnell freisetzend): 50mg bis 100mg 1-2 mal täglich.",
      pharmacodynamics: "Selektiver Beta-1-Adrenorezeptorenblocker. Blockiert die Wirkung von Adrenalin und Noradrenalin am Herzen. Senkt die Herzfrequenz (chronotrop), verringert die Kontraktionskraft (inotrop) und senkt den Blutdruck. Schützt das Herz vor Überstimulation.",
      sideEffects: "Bradykardie (langsamer Puls), Müdigkeit, Schwindel, Kopfschmerzen, kalte Hände und Füße, Magen-Darm-Beschwerden, Schlafstörungen (Alpträume), Bronchospasmen (bei prädisponierten Patienten).",
      interactions: "Verstärkung der bradykarden Wirkung bei Kombination mit Antiarrhythmika oder Calciumantagonisten vom Verapamil-Typ (Gefahr von AV-Blockaden). Verstärkte Blutdrucksenkung mit anderen Antihypertensiva. Blutzuckersenkende Effekte von Insulin können verstärkt und Symptome einer Hypoglykämie (z.B. Zittern, Herzklopfen) maskiert werden.",
      warnings: "Therapie darf nicht abrupt abgebrochen werden (ausschleichend absetzen, um Entzugssyndrom mit Tachykardie und Angina Pectoris zu verhindern). Kontraindiziert bei dekompensierter Herzinsuffizienz, kardiogenem Schock, AV-Block II. oder III. Grades und schwerem Asthma bronchiale."
    },
    simplified: {
      summary: "Ein 'Herzentlaster' (Betablocker), der den Puls verlangsamt und den Blutdruck senkt, damit das Herz ruhiger arbeiten kann.",
      usage: "Einmal täglich morgens mit etwas Wasser. Die Tabletten dürfen nicht zerkaut werden, wenn es sich um Retardtabletten handelt.",
      warningsSimple: "Setzen Sie dieses Medikament niemals plötzlich eigenständig ab! Dies kann zu gefährlichem Herzrasen führen. Es kann anfangs müde machen oder zu kalten Händen und Füßen führen. Wenn Sie Diabetiker sind, beachten Sie, dass Anzeichen von Unterzuckerung (wie Herzklopfen) abgeschwächt sein können."
    }
  },
  aspirin: {
    name: "Aspirin (ASS)",
    generic: "Acetylsalicylsäure",
    clinical: {
      indication: "Thrombozytenaggregationshemmung (TAH, 100mg) bei koronarer Herzkrankheit, akutem Myokardinfarkt, nach Bypass-Operationen, Schlaganfallprophylaxe. Analgetikum und Antipyretikum (500mg - 1000mg) bei akuten Schmerzen und Fieber.",
      dosage: "Thrombozytenaggregationshemmung: 100mg einmal täglich dauerhaft. Schmerztherapie: 500mg - 1000mg alle 4-8 Stunden (maximale Tagesdosis 3g). Einnahme nach einer Mahlzeit.",
      pharmacodynamics: "Irreversibler Hemmer der Cyclooxygenase-1 (COX-1) durch Acetylierung. Blockiert die Synthese von Thromboxan A2 in Thrombozyten, wodurch die Blutplättchenverklumpung (Aggregation) gehemmt wird. Da Blutplättchen keinen Zellkern besitzen, hält die Wirkung für deren gesamte Lebensdauer (7-10 Tage) an.",
      sideEffects: "Gastrointestinale Blutungen, Schleimhauterosionen, Magenschmerzen, erhöhtes Blutungsrisiko (Hämatome, Nasenbluten, verlängerte Blutungszeit), Asthma-Anfälle (Salicylat-Asthma), Tinnitus (bei Überdosierung).",
      interactions: "Verstärktes Blutungsrisiko bei Einnahme von oralen Antikoagulanzien (z.B. Marcumar, Eliquis, Xarelto), Heparinen oder anderen NSAR. Vermindert Ausscheidung von Harnsäure (Risiko von Gichtanfällen bei Veranlagung).",
      warnings: "Kontraindiziert bei akuten Magen-Darm-Geschwüren, krankhaft erhöhter Blutungsneigung, schwerem Leber- oder Nierenversagen und im letzten Schwangerschaftsdrittel. Bei Kindern unter 12 Jahren mit Fieber wegen des Risikos eines Reye-Syndroms (Gehirn-Leber-Schaden) kontraindiziert."
    },
    simplified: {
      summary: "In niedriger Dosis (100mg) ein Blutverdünner zur Vorbeugung von Herzinfarkten. In hoher Dosis (500mg) ein Schmerz- und Fiebermittel.",
      usage: "Zur Blutverdünnung täglich 1 Tablette (100mg) nach dem Essen einnehmen. Zur Schmerzlinderung 1 Tablette (500mg) bei Bedarf auflösen oder schlucken.",
      warningsSimple: "Da das Blut verdünnt wird, neigen Sie eher zu blauen Flecken, und Wunden bluten länger. Informieren Sie vor Operationen oder Zahnarztbesuchen Ihren Arzt über die Einnahme. Achten Sie auf teerartigen, schwarzen Stuhlgang (sofort Arzt kontaktieren!)."
    }
  },
  metformin: {
    name: "Metformin",
    generic: "Metformin-Hydrochlorid",
    clinical: {
      indication: "Diabetes mellitus Typ 2, insbesondere bei übergewichtigen Patienten, bei denen eine Ernährungsumstellung und körperliche Aktivität allein keine ausreichende Blutzuckerkontrolle erbrachten.",
      dosage: "Anfangsdosis: 500mg oder 850mg 1-2 mal täglich während oder nach den Mahlzeiten. Langsame Dosissteigerung über Wochen zur Minimierung von Magen-Darm-Beschwerden auf max. 2000mg - 3000mg täglich.",
      pharmacodynamics: "Oraler Diabetikerstoff der Biguanid-Klasse. Hemmt die Glucoseneubildung (Gluconeogenese) und Glykogenolyse in der Leber. Erhöht die Insulinsensitivität im Muskelgewebe (verbessert periphere Glucoseaufnahme) und verzögert die intestinale Glucoseaufnahme.",
      sideEffects: "Gastrointestinale Störungen (Übelkeit, Erbrechen, Durchfall, Bauchschmerzen, Appetitverlust) - sehr häufig zu Therapiebeginn; metallischer Geschmack, Vitamin B12-Resorptionsstörung, Laktatazidose (selten, aber schwere Komplikation).",
      interactions: "Jodhaltige Kontrastmittel (Gefahr von akutem Nierenversagen und Laktatazidose - Metformin 48h vor Kontrastmittelgabe absetzen). Alkohol erhöht das Risiko einer Laktatazidose. Diuretika und Corticosteroide können den Blutzucker erhöhen und die Wirkung abschwächen.",
      warnings: "Kontraindiziert bei eingeschränkter Nierenfunktion (GFR < 30 ml/min), akuter metabolischer Azidose, Dehydratation, schweren Infektionen, Gewebehypoxie (z.B. bei Herz- oder respiratorischer Insuffizienz) und Leberinsuffizienz."
    },
    simplified: {
      summary: "Ein Blutzuckersenker für Typ-2-Diabetes, der dem Körper hilft, den eigenen Zucker besser zu verwerten und die Zuckerproduktion in der Leber bremst.",
      usage: "Wird morgens und abends während oder direkt nach dem Essen eingenommen. Die Einnahme zu den Mahlzeiten verringert Magen-Darm-Probleme.",
      warningsSimple: "Besonders zu Beginn sind Durchfall oder Übelkeit sehr häufig, diese legen sich meistens. Eine seltene, aber gefährliche Nebenwirkung ist eine Übersäuerung des Blutes. Wenn Sie für eine Röntgenuntersuchung ein Kontrastmittel gespritzt bekommen, müssen Sie Metformin vorher nach Absprache absetzen."
    }
  },
  pantoprazol: {
    name: "Pantoprazol",
    generic: "Pantoprazol",
    clinical: {
      indication: "Refluxösophagitis (Sodbrennen, Speiseröhrenentzündung), Prophylaxe von NSAR-induzierten Magen-Darm-Geschwüren bei Risikopatienten, Eradikation von Helicobacter pylori (Kombinationstherapie), Zollinger-Ellison-Syndrom.",
      dosage: "Refluxtherapie: 20mg bis 40mg einmal täglich morgens, 1 Stunde vor dem Frühstück. Prophylaxe: 20mg täglich.",
      pharmacodynamics: "Protonenpumpenhemmer (PPI). Akkumuliert im sauren Milieu der Belegzellen des Magens und blockiert dort irreversibel die H+/K+-ATPase (Protonenpumpe). Hemmt somit die basale und stimulierte Magensäuresekretion hocheffektiv.",
      sideEffects: "Kopfschmerzen, Schwindel, Durchfall, Verstopfung, Blähungen, Osteoporose-Risiko (bei Langzeittherapie durch verminderte Calciumabsorption), Vitamin B12-Mangel, erhöhtes Risiko für gastrointestinale Infektionen (z.B. Clostridien).",
      interactions: "Kann die Absorption pH-Wert-abhängiger Arzneimittel vermindern (z.B. Ketoconazol, Atazanavir). Beeinflussung der Wirkung von Gerinnungshemmern möglich.",
      warnings: "Bei Langzeittherapie (> 3 Monate) Kalium- und Magnesiumspiegel kontrollieren. Ausschluss von Magenmalignomen vor Therapiebeginn bei Warnsymptomen (z.B. starker Gewichtsverlust)."
    },
    simplified: {
      summary: "Ein 'Magenschoner', der die Produktion der Magensäure stark reduziert, um Sodbrennen zu lindern oder Magenwände vor anderen Medikamenten zu schützen.",
      usage: "Morgens 1 Tablette ca. 1 Stunde vor dem Frühstück unzerkaut mit etwas Wasser einnehmen.",
      warningsSimple: "Nehmen Sie Pantoprazol nicht dauerhaft ohne ärztlichen Rat ein. Durch die reduzierte Magensäure können wichtige Vitamine und Mineralstoffe (wie Calcium) schlechter aufgenommen werden, was bei jahrelanger Einnahme das Knochenbruchrisiko erhöhen kann."
    }
  },
  amoxicillin: {
    name: "Amoxicillin",
    generic: "Amoxicillin",
    clinical: {
      indication: "Bakterielle Infektionen der Atemwege (Bronchitis, Pneumonie), Hals-Nasen-Ohren-Bereich (Otitis media, Sinusitis, Tonsillitis), Harnwege und der Haut, verursacht durch Amoxicillin-sensible Erreger.",
      dosage: "Standarddosis: 500mg bis 1000mg dreimal täglich (alle 8 Stunden). Die Therapiedauer beträgt üblicherweise 5 bis 10 Tage.",
      pharmacodynamics: "Breitband-Aminopenicillin (Beta-Laktam-Antibiotikum). Hemmt die bakterielle Zellwandsynthese durch Blockade der Penicillin-bindenden Proteine (PBPs), was zur Lyse (Auflösung) und zum Absterben der Bakterien führt (bakterizide Wirkung). Empfindlich gegenüber Beta-Laktamasen.",
      sideEffects: "Gastrointestinale Störungen (Durchfall, Übelkeit), allergische Hautreaktionen (makulopapulöses Exanthem - 'Ampicillin-Exanthem', insbesondere bei infektiöser Mononukleose), Superinfektionen mit Pilzen (Soor), reversible Leukopenie.",
      interactions: "Gleichzeitige Einnahme von Allopurinol erhöht Risiko für Hautreaktionen. Abschwächung der Wirkung von oralen Kontrazeptiva ('Pille') möglich. Methotrexat-Toxizität kann erhöht werden.",
      warnings: "Kontraindiziert bei nachgewiesener Penicillin-Allergie (Gefahr des anaphylaktischen Schocks, Kreuzallergie zu Cephalosporinen beachten!). Dosisanpassung erforderlich bei eingeschränkter Nierenfunktion."
    },
    simplified: {
      summary: "Ein Breitband-Antibiotikum aus der Penicillin-Familie, das Bakterien abtötet und bakterielle Infektionen bekämpft.",
      usage: "Wird in regelmäßigen Abständen (meist alle 8 Stunden) eingenommen. Wichtig: Die Einnahme muss genau nach Anweisung bis zum Ende durchgeführt werden, selbst wenn die Symptome bereits abgeklungen sind.",
      warningsSimple: "Bei plötzlichem Hautausschlag, Juckreiz oder Atemnot die Einnahme sofort stoppen und den Notarzt verständigen (Allergiegefahr). Häufig tritt Durchfall auf, da das Antibiotikum auch nützliche Darmbakterien angreift. Frauen sollten beachten, dass die Antibabypille an Wirkung verlieren kann."
    }
  }
};

// Medical Translation Dictionary (English to German mapping)
export const TRANSLATION_MAP = {
  "dosage and administration": "Dosierung & Anwendung",
  "dosage": "Dosierung",
  "administration": "Anwendung",
  "warnings and precautions": "Warnhinweise & Vorsichtsmaßnahmen",
  "warnings": "Warnhinweise",
  "precautions": "Sicherheitsmaßnahmen",
  "indications and usage": "Anwendungsgebiete (Indikationen)",
  "indications": "Indikationen",
  "indication": "Indikation",
  "drug interactions": "Wechselwirkungen mit anderen Mitteln",
  "interactions": "Wechselwirkungen",
  "interaction": "Wechselwirkung",
  "adverse reactions": "Nebenwirkungen (Unerwünschte Arzneimittelwirkungen)",
  "side effects": "Nebenwirkungen",
  "side effect": "Nebenwirkung",
  "active ingredient": "Aktiver Wirkstoff",
  "active ingredients": "Aktive Wirkstoffe",
  "inactive ingredients": "Inaktive Hilfsstoffe",
  "contraindications": "Gegenanzeigen (Kontraindikationen)",
  "mechanism of action": "Wirkungsweise (Pharmakodynamik)",
  "pharmacokinetics": "Pharmakokinetik",
  "overdosage": "Überdosierung",
  "pregnancy": "Schwangerschaft & Stillzeit",
  "nursing mothers": "Stillende Mütter",
  "pediatric use": "Anwendung bei Kindern",
  "geriatric use": "Anwendung bei älteren Patienten",
  "description": "Allgemeine Beschreibung",
  "clinical pharmacology": "Klinische Pharmakologie",
  "how supplied": "Handelsformen & Lagerung",
  "storage and handling": "Lagerung & Handhabung",
  "information for patients": "Patienten-Informationen",
  "patient counseling information": "Hinweise zur Patientenberatung",
  
  // Common symptoms/conditions
  "hypertension": "Bluthochdruck (Hypertonie)",
  "hypotension": "Niedriger Blutdruck (Hypotonie)",
  "pain": "Schmerzen",
  "fever": "Fieber",
  "headache": "Kopfschmerzen",
  "nausea": "Übelkeit",
  "vomiting": "Erbrechen",
  "diarrhea": "Durchfall",
  "constipation": "Verstopfung",
  "heart failure": "Herzschwäche (Herzinsuffizienz)",
  "myocardial infarction": "Herzinfarkt",
  "stroke": "Schlaganfall",
  "renal impairment": "Nierenfunktionsstörung",
  "hepatic impairment": "Leberfunktionsstörung",
  "breastfeeding": "Stillen",
  "dizziness": "Schwindel",
  "rash": "Ausschlag",
  "allergic reaction": "Allergische Reaktion",
  "bleeding": "Blutungsrisiko",
  "asthma": "Asthma",
  "diabetes": "Zuckerkrankheit (Diabetes)",
  "blood sugar": "Blutzucker",
  "urine": "Urin",
  "liver": "Leber",
  "kidney": "Niere",
  "heart": "Herz",
  "stomach": "Magen"
};

// Helper function to translate English clinical text using the translation map
export function translateText(text) {
  if (!text) return "";
  let translated = text;
  
  // Replace direct phrases in translation map (case insensitive)
  Object.entries(TRANSLATION_MAP).forEach(([en, de]) => {
    const regex = new RegExp("\\b" + en + "\\b", "gi");
    translated = translated.replace(regex, de);
  });

  return translated;
}
