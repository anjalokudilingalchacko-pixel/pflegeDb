import fs from 'fs';

// Helper to generate unique numeric ID
function generatePZN() {
  return 'PZN-' + Math.floor(10000000 + Math.random() * 90000000);
}

// Generate complete detailed patient structure
function createFullPatient(id, name, gender, dob, room, pflegegrad, insurance, allergies, station, diagnosen, medikamente, biografie) {
  const isMale = gender.toLowerCase() === 'männlich';
  const firstName = name.split(' ')[0];
  const lastName = name.split(' ')[1] || '';
  
  // Custom stammdaten
  const stammdaten = {
    gender,
    address: `${lastName === 'Meyer' ? 'Kaiserstraße 18' : 'Hauptstraße ' + id}, ${Math.floor(10000 + Math.random() * 80000)} München`,
    phone: `089-${Math.floor(100000 + Math.random() * 900000)}`,
    emergencyContact: isMale 
      ? `Tochter: Sarah ${lastName} - 0172-${Math.floor(1000000 + Math.random() * 9000000)}` 
      : `Sohn: Thomas ${lastName} - 0176-${Math.floor(1000000 + Math.random() * 9000000)}`,
    doctor: `Dr. med. ${isMale ? 'Ursula' : 'Karl'} Weber - 089-${Math.floor(100000 + Math.random() * 900000)}`,
    religion: id % 3 === 0 ? 'Römisch-Katholisch' : id % 3 === 1 ? 'Evangelisch' : 'Keine Angabe',
    maritalStatus: id % 2 === 0 ? 'Verheiratet' : 'Verwitwet'
  };

  // Custom anamnese
  const anamnese = {
    socialHistory: `Zuvor im eigenen Haushalt gelebt. Nach zunehmender Alltagsüberforderung und Sturzereignissen nun Einzug in die stationäre Pflege zur Unterstützung.`,
    medicalHistory: diagnosen.map(d => d.title).join(', ') + `, Osteoporose, Alters-Schwerhörigkeit.`,
    sensoryLimits: id % 2 === 0 ? 'Lesebrille vorhanden, Hörgerät rechts.' : 'Lesebrille erforderlich.'
  };

  // Custom SIS values
  const sisHistory = [
    {
      date: "01.07.2026 10:00",
      user: "System",
      values: {
        themenfeld1: `Patient(in) ist kognitiv orientiert zur Person, Ort, Zeit. Kann Bedürfnisse klar äußern.`,
        themenfeld2: pflegegrad > 3 
          ? `Rollator erforderlich. Stark eingeschränkte Mobilität. Transfer benötigt Hilfestellung.` 
          : `Weitgehend selbstständig mobil mit Gehstock. Gelegentliche Gleichgewichtsstörungen.`,
        themenfeld3: `Leidet unter den Diagnosen: ${diagnosen.map(d => d.title).join(', ')}.`,
        themenfeld4: pflegegrad > 3 
          ? `Benötigt vollständige Unterstützung bei Ganzkörperpflege und Ankleiden.`
          : `Wäscht Gesicht und Oberkörper selbstständig. Benötigt Hilfe bei Beinen und Duschen.`,
        themenfeld5: `Pflegt guten Kontakt zu Angehörigen. Nimmt an den gemeinsamen Mahlzeiten teil.`,
        themenfeld6: `Wohnung kann eigenständig nicht mehr gereinigt werden.`
      }
    }
  ];

  // Custom Assessments Scores
  const barthelScore = 100 - (pflegegrad * 15) - Math.floor(Math.random() * 10);
  const bradenScore = 23 - pflegegrad - Math.floor(Math.random() * 3);
  const tinettiScore = 28 - (pflegegrad * 4) - Math.floor(Math.random() * 2);
  const mmseScore = 30 - (pflegegrad * 2) - Math.floor(Math.random() * 3);
  const nrsScore = pflegegrad > 2 ? 3 : 0;

  const assessmentsHistory = [
    { date: "01.07.2026 11:30", user: "FK Schmidt", type: "barthel", score: Math.max(10, barthelScore), values: { essen: 10, baden: 0, koerperpflege: 5, anziehen: 5, stuhl: 10, urin: 10, toilette: 5, transfer: 10, mobilaet: 10, treppe: 0 }, interpretation: pflegegrad > 3 ? "Schwere Pflegebedürftigkeit" : "Mäßige Pflegebedürftigkeit" },
    { date: "01.07.2026 11:45", user: "FK Schmidt", type: "braden", score: Math.max(10, bradenScore), values: { sensorik: 4, feuchtigkeit: 3, aktivitaet: 2, mobilitaet: 3, ernaehrung: 2, reibung: 2 }, interpretation: bradenScore < 15 ? "Mittleres Dekubitusrisiko" : "Geringes Dekubitusrisiko" },
    { date: "01.07.2026 12:00", user: "FK Schmidt", type: "tinetti", score: Math.max(5, tinettiScore), values: { gleichgewicht: 10, gang: 8 }, interpretation: tinettiScore < 19 ? "Erhöhtes Sturzrisiko" : "Kein erhöhtes Sturzrisiko" },
    { date: "01.07.2026 12:15", user: "FK Schmidt", type: "mmse", score: Math.max(10, mmseScore), values: { orientierung: 8, merkfaehigkeit: 3, aufmerksamkeit: 4, erinnern: 2, sprache: 8 }, interpretation: mmseScore < 24 ? "Leichte kognitive Beeinträchtigung" : "Keine kognitive Beeinträchtigung" },
    { date: "07.07.2026 09:30", user: "PW Wagner", type: "nrs", score: nrsScore, interpretation: nrsScore > 0 ? "Leichter Belastungsschmerz" : "Schmerzfrei" }
  ];

  const trinkprotokoll = {
    target: 1500,
    logs: [
      { time: "08:15", amount: 200, beverage: "Kaffee" },
      { time: "10:30", amount: 150, beverage: "Wasser" },
      { time: "12:15", amount: 200, beverage: "Tee" }
    ]
  };

  const pflegebericht = [
    { date: "07.07.2026 14:30", user: "PM Müller", text: "Patient(in) war heute kooperativ bei der Grundpflege. Vitalzeichen im Normbereich. Medikamente wurden eingenommen." },
    { date: "07.07.2026 08:30", user: "PW Wagner", text: "Hilfestellung beim Waschen und Ankleiden gegeben. Mobilisation in den Speisesaal zum Frühstück durchgeführt." }
  ];

  const pflegeplanung = [
    { problem: `Erhöhte Sturzgefahr wegen Gangunsicherheit und Pflegegrad ${pflegegrad}.`, goal: "Sichere Fortbewegung mit Unterstützung oder Gehhilfen.", intervention: "Hilfestellung beim Transfer, Rollator bereithalten, rutschfeste Schuhe anziehen." }
  ];

  const wundeHistory = [
    { date: "01.07.2026 08:00", user: "System", hasWound: id % 10 === 0, location: id % 10 === 0 ? "Fersen re." : "-", status: id % 10 === 0 ? "Druckstelle Rötung Grad I." : "Haut intakt.", dressing: id % 10 === 0 ? "Hydrokolloid" : "-", schedule: id % 10 === 0 ? "Jeden 2. Tag" : "-" }
  ];

  const dekubitusHistory = [
    { date: "01.07.2026 15:45", user: "FK Schmidt", riskLevel: bradenScore < 15 ? "Erhöhtes Risiko" : "Geringes Risiko", location: "Kreuzbein", measures: ["Lagerung unterstützen.", "Hautpflege nach Plan."] }
  ];

  const sturzprophylaxeHistory = [
    { date: "01.07.2026 16:00", user: "FK Schmidt", riskLevel: tinettiScore < 19 ? "Erhöhtes Risiko" : "Niedriges Risiko", measures: ["Bett niedrig stellen.", "Ggf. Begleitung."] }
  ];

  const ausscheidungHistory = [
    { date: "01.07.2026 08:00", user: "System", continenceBladder: id % 4 === 0 ? "Harninkontinenz Grad I" : "Kontinent", continenceBowel: "Kontinent", obstipationRisk: "Gering", interventions: "Regelmäßige Toilettengänge anbieten." }
  ];

  const mobilitaetHistory = [
    { date: "01.07.2026 08:00", user: "System", status: pflegegrad > 3 ? "Hilfe bei Transfer" : "Gehfähig am Rollator", aids: pflegegrad > 3 ? "Rollator, Rollstuhl" : "Rollator", transfers: pflegegrad > 3 ? "Teilunterstützung" : "Selbstständig" }
  ];

  const ernaehrungHistory = [
    { date: "01.07.2026 08:00", user: "System", diet: "Normalkost", fluidTarget: "1500 ml", weight: `${60 + Math.floor(Math.random() * 30)} kg`, problems: id % 12 === 0 ? "Leichte Kauprobleme" : "Keine Schluckbeschwerden." }
  ];

  const schmerzHistory = [
    { date: "01.07.2026 08:00", user: "System", status: nrsScore > 0 ? "Leichte Belastungsschmerzen" : "Schmerzfrei", therapy: nrsScore > 0 ? "Bedarfsmedikation eingetragen" : "Keine spezifische Schmerztherapie", lastAssessment: `NRS ${nrsScore}` }
  ];

  const vitalwerte = [
    { date: "07.07. 08:00", bp: "130/80", hr: 72, temp: "36.5", sugar: 110, spo2: 97 },
    { date: "06.07. 08:00", bp: "128/78", hr: 74, temp: "36.4", sugar: 115, spo2: 98 }
  ];

  const tagesstrukturHistory = [
    {
      date: "01.07.2026 08:00",
      user: "System",
      values: {
        morning: "Gegen 08:00 Uhr Waschen am Waschbecken, Frühstück im Zimmer.",
        noon: "Mittagessen um 12:00 Uhr im Wohnbereich, anschließende Mittagsruhe.",
        afternoon: "Kaffee trinken, Besuch empfangen oder Aktivierungsgruppe.",
        evening: "Abendbrot um 18:00 Uhr, Ausklang des Tages im Fernsehsessel.",
        night: "Nachtruhe ab 21:30 Uhr."
      }
    }
  ];

  const tagesstruktur = [
    { time: '08:00 Uhr', activity: 'Waschen & Kleiden', done: true, signedBy: 'PM Müller' },
    { time: '08:30 Uhr', activity: 'Frühstück & Medikamente', done: true, signedBy: 'PM Müller' },
    { time: '12:00 Uhr', activity: 'Mittagessen', done: false, signedBy: '' },
    { time: '18:00 Uhr', activity: 'Abendessen', done: false, signedBy: '' }
  ];

  const entlassungsmanagement = {
    items: [
      { text: "Entlassungsgespräch geführt", checked: false },
      { text: "Entlassbrief ausgehändigt", checked: false },
      { text: "Hilfsmittelbereitstellung geprüft", checked: false }
    ]
  };

  return {
    id,
    name,
    room,
    pflegegrad,
    dob,
    allergies,
    krankenkasse: insurance,
    station,
    status: 'bearbeitung',
    checklist: { pflegevertrag: true, patientenverfuegung: true, betreuungsverfuegung: false, medikamentenplan: true, vorsorgevollmacht: false },
    stammdaten,
    anamnese,
    sisHistory,
    assessmentsHistory,
    trinkprotokoll,
    pflegebericht,
    pflegeplanung,
    wundeHistory,
    dekubitusHistory,
    sturzprophylaxeHistory,
    ausscheidungHistory,
    mobilitaetHistory,
    ernaehrungHistory,
    schmerzHistory,
    vitalwerte,
    biografie,
    tagesstrukturHistory,
    tagesstruktur,
    entlassungsmanagement
  };
}

// Default 7 core patients from previous simulations to keep compatibility
const DEFAULTS = [
  {
    id: 1,
    name: 'Maria Schmidt',
    room: '102',
    pflegegrad: 3,
    dob: '12.04.1938',
    allergies: 'Penicillin, Erdbeeren',
    krankenkasse: 'AOK Bayern',
    station: 'Station 1',
    status: 'bearbeitung',
    checklist: { pflegevertrag: true, patientenverfuegung: true, betreuungsverfuegung: false, medikamentenplan: true, vorsorgevollmacht: false },
    stammdaten: {
      gender: "Weiblich",
      address: "Goethestraße 4, 80336 München",
      phone: "089-7654321",
      emergencyContact: "Lisa Schmidt (Tochter) - 0176-98765432",
      doctor: "Dr. med. Thomas Meyer - 089-7654321",
      religion: "Römisch-Katholisch",
      maritalStatus: "Verwitwet"
    },
    anamnese: {
      socialHistory: "Zuvor alleinlebend im 1. OG ohne Aufzug. Nach Sturzereignis nun Einzug in die Pflegeeinrichtung zur dauerhaften Pflege.",
      medicalHistory: "Zustand nach Schenkelhalsfraktur rechts vor 3 Monaten. Chronische Herzinsuffizienz NYHA II. Bluthochdruck.",
      sensoryLimits: "Lesebrille vorhanden, Hörgerät rechts."
    },
    sisHistory: [
      {
        date: "01.06.2026 14:00",
        user: "System",
        values: {
          themenfeld1: "Patientin ist orientiert zu Person, Ort, Zeit. Kann Wünsche klar äußern. Versteht komplexe Sätze gut.",
          themenfeld2: "Benötigt Rollator für längere Strecken. Aufstehen gelingt selbstständig. Leichte Gangunsicherheit.",
          themenfeld3: "Diabetes mellitus Typ 2, chronische Herzinsuffizienz NYHA II. Unterstützungsbedarf bei Medikamenteneinnahme.",
          themenfeld4: "Selbstständige Mundpflege und Oberkörperwäsche. Benötigt Hilfe bei Beinen und Duschen.",
          themenfeld5: "Lebt sozial integriert. Tochter kommt regelmäßig. Nimmt gerne an Gruppenaktivitäten teil.",
          themenfeld6: "Wohnung kann nicht mehr selbstständig gepflegt werden, daher Einzug erfolgt."
        }
      }
    ],
    diagnosen: [
      { icd: "I10", title: "Essentielle Hypertonie", date: "12.02.2018", status: "Chronisch" },
      { icd: "I50.9", title: "Herzinsuffizienz, nicht näher bezeichnet", date: "18.05.2021", status: "Chronisch" },
      { icd: "E11.9", title: "Diabetes mellitus, Typ 2", date: "04.09.2023", status: "In Behandlung" }
    ],
    medikamente: [
      { name: "Ramipril Ratiopharm 5mg Tabletten", dose: "1-0-0-0", indication: "Hypertonie", prescribedBy: "Dr. Meyer", notes: "Morgens nüchtern", activeIngredient: "ramipril" },
      { name: "Metoprolol Hexal 47,5mg Tabletten", dose: "1-0-1-0", indication: "Herzinsuffizienz", prescribedBy: "Dr. Meyer", notes: "Nach dem Essen", activeIngredient: "metoprolol" }
    ],
    assessmentsHistory: [
      { date: "01.06.2026 15:30", user: "FK Schmidt", type: "barthel", score: 65, values: { essen: 10, baden: 0, koerperpflege: 5, anziehen: 5, stuhl: 10, urin: 10, toilette: 5, transfer: 10, mobilaet: 10, treppe: 0 }, interpretation: "Mäßige Pflegebedürftigkeit" },
      { date: "01.06.2026 15:45", user: "FK Schmidt", type: "braden", score: 16, values: { sensorik: 4, feuchtigkeit: 3, aktivitaet: 2, mobilitaet: 3, ernaehrung: 2, reibung: 2 }, interpretation: "Leichtes Dekubitusrisiko" },
      { date: "01.06.2026 16:00", user: "FK Schmidt", type: "tinetti", score: 18, values: { gleichgewicht: 10, gang: 8 }, interpretation: "Erhöhtes Sturzrisiko" },
      { date: "07.07.2026 09:30", user: "PW Wagner", type: "nrs", score: 3, interpretation: "Leichter Belastungsschmerz Hüfte rechts" }
    ],
    trinkprotokoll: {
      target: 1500,
      logs: [
        { time: "08:15", amount: 200, beverage: "Kaffee" },
        { time: "10:00", amount: 150, beverage: "Wasser" }
      ]
    },
    pflegebericht: [
      { date: "07.07.2026 14:30", user: "PM Müller", text: "Klagte heute Mittag über leichte Hüftschmerzen rechts beim Aufstehen. NRS = 3. Nach kurzer Ruhepause im Sessel ging es ihr besser. Mobilisation im Zimmer klappte mit Rollator gut." },
      { date: "07.07.2026 08:30", user: "PW Wagner", text: "Grundpflege am Waschbecken durchgeführt. Patientin war kooperativ und wusch Gesicht und Oberkörper selbstständig. Medikamente ordnungsgemäß eingenommen." }
    ],
    pflegeplanung: [
      { problem: "Erhöhte Sturzgefahr durch Gangunsicherheit nach Schenkelhalsfraktur.", goal: "Sichere Mobilisation auf Stationsebene unter Nutzung des Rollators.", intervention: "Begleitung bei Gehübungen, Rollator stets in Reichweite positionieren." }
    ],
    wundeHistory: [
      { date: "02.06.2026 10:00", user: "FK Schmidt", hasWound: true, location: "Kreuzbein (Sakrum)", status: "Hautabschürfung, gerötet 2x2 cm.", dressing: "Hydrokolloidverband", schedule: "Täglich" },
      { date: "01.06.2026 08:00", user: "System", hasWound: false, location: "-", status: "Haut reizlos.", dressing: "-", schedule: "-" }
    ],
    dekubitusHistory: [
      { date: "01.06.2026 15:45", user: "FK Schmidt", riskLevel: "Leichtes Dekubitusrisiko (Score: 16)", location: "Kreuzbein (Sakrum)", measures: ["Lagerungswechsel alle 4 Stunden.", "Verwendung von Weichlagerungskissen."] }
    ],
    sturzprophylaxeHistory: [
      { date: "01.06.2026 16:00", user: "FK Schmidt", riskLevel: "Erhöhtes Sturzrisiko", measures: ["Bett niedrig stellen.", "Ggf. Begleitung."] }
    ],
    ausscheidungHistory: [
      { date: "01.06.2026 08:00", user: "System", continenceBladder: "Kontinent", continenceBowel: "Kontinent", obstipationRisk: "Gering", interventions: "Keine besonderen Interventionen." }
    ],
    mobilitaetHistory: [
      { date: "01.06.2026 08:00", user: "System", status: "Gehfähig, selbstständiger Transfer.", aids: "Rollator bei Bedarf.", transfers: "Selbstständig." }
    ],
    ernaehrungHistory: [
      { date: "01.06.2026 08:00", user: "System", diet: "Normalkost", fluidTarget: "1500 ml", weight: "74.5 kg", problems: "Keine Schluckbeschwerden." }
    ],
    schmerzHistory: [
      { date: "01.06.2026 08:00", user: "System", status: "Schmerzfrei.", therapy: "Keine Dauermedikation vorhanden.", lastAssessment: "NRS 0" }
    ],
    vitalwerte: [
      { date: "07.07. 08:00", bp: "135/82", hr: 72, temp: "36.6", sugar: 128, spo2: 96 },
      { date: "06.07. 08:00", bp: "130/80", hr: 75, temp: "36.5", sugar: 135, spo2: 97 }
    ],
    biografie: 'Geboren in Breslau, gelernte Schneiderin, zwei Kinder, Ehepartner verstorben. Mag klassische Musik.',
    tagesstrukturHistory: [
      {
        date: "01.06.2026 08:00",
        user: "System",
        values: {
          morning: "Gegen 08:00 Uhr Waschen am Waschbecken, Frühstück im Zimmer.",
          noon: "Mittagessen um 12:00 Uhr im Wohnbereich, anschließende Mittagsruhe.",
          afternoon: "Kaffee trinken, Besuch empfangen oder Aktivierungsgruppe.",
          evening: "Abendbrot um 18:00 Uhr, Ausklang des Tages im Fernsehsessel.",
          night: "Nachtruhe ab 21:30 Uhr."
        }
      }
    ],
    tagesstruktur: [
      { time: '08:00 Uhr', activity: 'Waschen & Kleiden', done: true, signedBy: 'PM Müller' },
      { time: '08:30 Uhr', activity: 'Frühstück & Medikamente', done: true, signedBy: 'PM Müller' },
      { time: '12:00 Uhr', activity: 'Mittagessen', done: false, signedBy: '' },
      { time: '18:00 Uhr', activity: 'Abendessen', done: false, signedBy: '' }
    ],
    entlassungsmanagement: {
      items: [
        { text: "Entlassungsgespräch geführt", checked: false },
        { text: "Entlassbrief ausgehändigt", checked: false },
        { text: "Hilfsmittelbereitstellung geprüft", checked: false }
      ]
    }
  },
  {
    id: 2,
    name: 'Hans Müller',
    room: '105',
    pflegegrad: 2,
    dob: '23.08.1945',
    allergies: 'Keine bekannten Allergien',
    krankenkasse: 'Barmer',
    station: 'Station 1',
    status: 'vollstaendig',
    checklist: { pflegevertrag: true, patientenverfuegung: true, betreuungsverfuegung: true, medikamentenplan: true, vorsorgevollmacht: true },
    stammdaten: {
      gender: "Männlich",
      address: "Birkenweg 12, 80993 München",
      phone: "089-883344",
      emergencyContact: "Rita Müller (Ehefrau) - 089-883344",
      doctor: "Dr. med. M. Weber - 089-987654",
      religion: "Evangelisch",
      maritalStatus: "Verheiratet"
    },
    anamnese: {
      socialHistory: "Lebte mit Ehefrau in einer Erdgeschosswohnung. Zunehmende rheumatische Schmerzen erschweren die Pflege zu Hause.",
      medicalHistory: "Schwere Gonarthrose beidseitig, chronische Gastritis.",
      sensoryLimits: "Brille vorhanden."
    },
    sisHistory: [
      {
        date: "15.05.2026 10:00",
        user: "System",
        values: {
          themenfeld1: "Geistig voll orientiert. Kann sich adäquat artikulieren.",
          themenfeld2: "Geht sicher am Rollator auf Stationsebene. Treppensteigen schmerzbedingt eingeschränkt.",
          themenfeld3: "Arthroseschmerzen in beiden Knien. Gastritisschutz erforderlich.",
          themenfeld4: "Übernimmt Oberkörperpflege weitgehend selbstständig. Hilfe bei Füßen/Strümpfen.",
          themenfeld5: "Ehefrau besucht ihn täglich. Nimmt aktiv an den Veranstaltungen teil.",
          themenfeld6: "Haushalt wird von Ehefrau weitergeführt."
        }
      }
    ],
    diagnosen: [
      { icd: "M17.0", title: "Beidseitige Gonarthrose", date: "10.03.2019", status: "Chronisch" },
      { icd: "K21.9", title: "Gastroösophageale Refluxkrankheit", date: "05.11.2022", status: "In Behandlung" }
    ],
    medikamente: [
      { name: "Pantoprazol AL 20mg Tabletten", dose: "1-0-0-0", indication: "Sodbrennen / Magenschutz", prescribedBy: "Dr. Weber", notes: "Nüchtern morgens", activeIngredient: "pantoprazol" },
      { name: "Ibuprofen Ratiopharm 400mg Tabletten", dose: "1-0-1-0", indication: "Chronische Gelenkschmerzen", prescribedBy: "Dr. Weber", notes: "Nach Bedarf mit reichlich Wasser", activeIngredient: "ibuprofen" }
    ],
    assessmentsHistory: [
      { date: "15.05.2026 11:30", user: "FK Schmidt", type: "barthel", score: 85, values: { essen: 10, baden: 5, koerperpflege: 5, anziehen: 10, stuhl: 10, urin: 10, toilette: 10, transfer: 15, mobilaet: 10, treppe: 0 }, interpretation: "Mäßige Pflegebedürftigkeit" }
    ],
    trinkprotokoll: { target: 1500, logs: [] },
    pflegebericht: [],
    pflegeplanung: [],
    wundeHistory: [{ date: "15.05.2026 08:00", user: "System", hasWound: false, location: "-", status: "Haut intakt.", dressing: "-", schedule: "-" }],
    dekubitusHistory: [{ date: "15.05.2026 08:00", user: "System", riskLevel: "Niedrig", location: "-", measures: ["Hautpflege."] }],
    sturzprophylaxeHistory: [{ date: "15.05.2026 08:00", user: "System", riskLevel: "Niedrig", measures: ["Rollator nutzen."] }],
    ausscheidungHistory: [{ date: "15.05.2026 08:00", user: "System", continenceBladder: "Kontinent", continenceBowel: "Kontinent", obstipationRisk: "Gering", interventions: "Keine." }],
    mobilitaetHistory: [{ date: "15.05.2026 08:00", user: "System", status: "Mobil mit Rollator", aids: "Rollator", transfers: "Selbstständig" }],
    ernaehrungHistory: [{ date: "15.05.2026 08:00", user: "System", diet: "Normalkost", fluidTarget: "1500 ml", weight: "82 kg", problems: "Keine." }],
    schmerzHistory: [{ date: "15.05.2026 08:00", user: "System", status: "Belastungsschmerz Knie", therapy: "Ibuprofen Gabe", lastAssessment: "NRS 2" }],
    vitalwerte: [{ date: "07.07. 08:00", bp: "128/76", hr: 72, temp: "36.4", sugar: 105, spo2: 98 }],
    biografie: 'Ehemaliger Maschinenschlosser, leidenschaftlicher Gärtner. Lebt seit 2 Jahren in der Einrichtung.',
    tagesstrukturHistory: [
      {
        date: "15.05.2026 08:00",
        user: "System",
        values: {
          morning: "Gegen 08:00 Uhr Aufstehen, Waschen, Frühstück im Speisesaal.",
          noon: "Mittagessen um 12:00 Uhr, Mittagsruhe im Bett.",
          afternoon: "Aktivierungsgruppe, Gartenarbeit.",
          evening: "Abendbrot um 18:00 Uhr, Ausklang im Fernsehraum.",
          night: "Nachtruhe ab 22:00 Uhr."
        }
      }
    ],
    tagesstruktur: [
      { time: '08:00 Uhr', activity: 'Aufstehen & Waschen', done: true, signedBy: 'PM Müller' },
      { time: '08:30 Uhr', activity: 'Frühstück', done: true, signedBy: 'PM Müller' },
      { time: '12:00 Uhr', activity: 'Mittagessen', done: false, signedBy: '' },
      { time: '18:00 Uhr', activity: 'Abendessen', done: false, signedBy: '' }
    ],
    entlassungsmanagement: { items: [] }
  }
];

const FIRST_NAMES = [
  'Heinz', 'Ursula', 'Günter', 'Inge', 'Werner', 'Renate', 'Dieter', 'Gisela', 'Helmut', 'Brigitte',
  'Karl-Heinz', 'Erika', 'Manfred', 'Christa', 'Horst', 'Hannelore', 'Rolf', 'Karin', 'Jürgen', 'Ingrid',
  'Wolfgang', 'Monika', 'Peter', 'Gisela', 'Klaus', 'Helga', 'Gerd', 'Marianne', 'Kurt', 'Ruth',
  'Erich', 'Gerda', 'Paul', 'Elfriede', 'Willi', 'Ilse', 'Alfred', 'Anneliese', 'Ernst', 'Edith',
  'Fritz', 'Ingeborg', 'Heinrich', 'Lieselotte', 'Franz', 'Erna', 'Rudolf', 'Gertrud', 'Otto', 'Marta',
  'Albert', 'Charlotte', 'Wilhelm', 'Johanna', 'Bernhard', 'Emma', 'Herbert', 'Luise', 'Josef', 'Marie'
];

const LAST_NAMES = [
  'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch',
  'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger',
  'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Schmid', 'Mueller',
  'Sommer', 'Haas', 'Vogel', 'Schreiber', 'Graf', 'Herbst', 'Brandt', 'Winter', 'Seidel', 'Stein',
  'Albrecht', 'Schuster', 'König', 'Pohl', 'Lorenz', 'Roth', 'Winkler', 'Frank', 'Franke', 'Bode'
];

const STATIONS = ['Station 1', 'Station 2', 'Station 3'];
const DIAGNOSES_POOL = [
  { icd: 'I10', title: 'Essentielle Hypertonie', med: { name: 'Ramipril Ratiopharm 5mg Tabletten', active: 'ramipril', dose: '1-0-0-0', ind: 'Hypertonie' } },
  { icd: 'I50.9', title: 'Chronische Herzinsuffizienz', med: { name: 'Metoprolol Hexal 47,5mg Tabletten', active: 'metoprolol', dose: '1-0-1-0', ind: 'Herzinsuffizienz' } },
  { icd: 'E11.9', title: 'Diabetes mellitus Typ 2', med: { name: 'Metformin Zentiva 1000mg Tabletten', active: 'metformin', dose: '1-0-1-0', ind: 'Diabetes' } },
  { icd: 'K21.9', title: 'Gastroösophageale Refluxkrankheit', med: { name: 'Pantoprazol AL 20mg Tabletten', active: 'pantoprazol', dose: '1-0-0-0', ind: 'Magenschutz' } },
  { icd: 'I48.9', title: 'Vorhofflimmern', med: { name: 'Marcumar 3mg Tabletten', active: 'phenprocoumon', dose: '0-0-0-1', ind: 'Vorhofflimmern' } },
  { icd: 'M17.0', title: 'Gonarthrose beidseitig', med: { name: 'Ibuprofen Ratiopharm 400mg Tabletten', active: 'ibuprofen', dose: '1-0-1-0', ind: 'Gelenkschmerz' } },
  { icd: 'E03.9', title: 'Hypothyreose', med: { name: 'L-Thyroxin Henning 100µg Tabletten', active: 'levothyroxin', dose: '1-0-0-0', ind: 'Hypothyreose' } }
];

const KRANKENKASSEN = ['AOK Bayern', 'Barmer', 'Techniker Krankenkasse (TK)', 'IKK classic', 'HEK', 'DAK Gesundheit'];

// Core list setup
const patients = [...DEFAULTS];

// Add the other 5 core patients from the default list
const coreOtherPatients = [
  {
    name: "Gerhard Wagner",
    pg: 4,
    room: "204",
    dob: "08.01.1945",
    allergies: "Pflasterallergie",
    station: "Station 2",
    gender: "Männlich",
    diagnosen: [{ icd: 'E11.9', title: 'Diabetes mellitus Typ 2' }, { icd: 'G30.9', title: 'Alzheimer-Demenz' }],
    meds: [{ name: "Metformin Zentiva 1000mg Tabletten", dose: "1-0-1-0", activeIngredient: "metformin", indication: "Diabetes", prescribedBy: "Dr. Weber", notes: "Zum Essen" }]
  },
  {
    name: "Erika Fischer",
    pg: 5,
    room: "205",
    dob: "30.09.1933",
    allergies: "Keine bekannten Allergien",
    station: "Station 2",
    gender: "Weiblich",
    diagnosen: [{ icd: 'I48.9', title: 'Chronisches Vorhofflimmern' }, { icd: 'G80.9', title: 'Spastische Hemiparese links nach Apoplex' }],
    meds: [{ name: "Marcumar 3mg Tabletten", dose: "0-0-0-1", activeIngredient: "phenprocoumon", indication: "Vorhofflimmern", prescribedBy: "Dr. Müller", notes: "Laut Marcumar-Pass" }]
  },
  {
    name: "Walter Weber",
    pg: 1,
    room: "206",
    dob: "02.04.1950",
    allergies: "Hausstaubmilben",
    station: "Station 1",
    gender: "Männlich",
    diagnosen: [{ icd: 'I50.0', title: 'Rechtsherzinsuffizienz mit Beinödemen' }, { icd: 'I10.90', title: 'Hypertonie' }],
    meds: [{ name: "Furosemid Ratiopharm 40mg Tabletten", dose: "1-0-0-0", activeIngredient: "furosemid", indication: "Entwässerung", prescribedBy: "Dr. Weber", notes: "Morgens einnehmen" }]
  },
  {
    name: "Elisabeth Becker",
    pg: 3,
    room: "207",
    dob: "19.10.1936",
    allergies: "Keine bekannten Allergien",
    station: "Station 1",
    gender: "Weiblich",
    diagnosen: [{ icd: 'C50.9', title: 'Mamma-Karzinom (Metastasiert)' }, { icd: 'M81.9', title: 'Osteoporose' }],
    meds: [{ name: "Novalgin 500mg Tabletten", dose: "1-1-1-0", activeIngredient: "metamizol", indication: "Chronischer Tumorschmerz", prescribedBy: "Dr. Richter", notes: "Bei Bedarf, max 4g täglich" }]
  },
  {
    name: "Dr. Werner Kraft",
    pg: 4,
    room: "208",
    dob: "05.12.1931",
    allergies: "Keine bekannten Allergien",
    station: "Station 1",
    gender: "Männlich",
    diagnosen: [{ icd: 'E03.9', title: 'Hypothyreose (Schilddrüsenunterfunktion)' }, { icd: 'I69.4', title: 'Zustand nach Apoplex mit Dysphagie' }],
    meds: [{ name: "L-Thyroxin Henning 100µg Tabletten", dose: "1-0-0-0", activeIngredient: "levothyroxin", indication: "Hypothyreose", prescribedBy: "Dr. Weber", notes: "Morgens nüchtern, 30 Min vor dem Frühstück" }]
  }
];

coreOtherPatients.forEach((details, index) => {
  const id = index + 3;
  const p = createFullPatient(
    id,
    details.name,
    details.gender,
    details.dob,
    details.room,
    details.pg,
    'Musterkasse',
    details.allergies,
    details.station,
    details.diagnosen,
    details.meds,
    `Ehemalige(r) ${id % 2 === 0 ? 'Lehrer(in)' : 'Bankkaufmann/-frau'}. Lebt seit 2024 hier.`
  );
  p.medikamente = details.meds;
  p.diagnosen = details.diagnosen;
  patients.push(p);
});

// Now generate the remaining 93 patients (from ID 8 to 100)
for (let i = 8; i <= 100; i++) {
  const gender = Math.random() > 0.5 ? 'Männlich' : 'Weiblich';
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;
  
  const room = String(100 + Math.floor(i / 3) * 10 + (i % 3));
  const pflegegrad = Math.floor(1 + Math.random() * 5);
  const birthYear = 1930 + Math.floor(Math.random() * 20); // 1930-1950
  const birthMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const birthDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  const dob = `${birthDay}.${birthMonth}.${birthYear}`;
  
  const allergies = Math.random() > 0.7 ? 'Penicillin' : 'Keine bekannten Allergien';
  const krankenkasse = KRANKENKASSEN[Math.floor(Math.random() * KRANKENKASSEN.length)];
  const station = STATIONS[i % STATIONS.length];

  // Pick 1 or 2 diagnoses and meds from the pool
  const diagCount = 1 + Math.floor(Math.random() * 2);
  const diagIndices = [];
  while (diagIndices.length < diagCount) {
    const idx = Math.floor(Math.random() * DIAGNOSES_POOL.length);
    if (!diagIndices.includes(idx)) {
      diagIndices.push(idx);
    }
  }

  const diagnosen = diagIndices.map(idx => ({
    icd: DIAGNOSES_POOL[idx].icd,
    title: DIAGNOSES_POOL[idx].title
  }));

  const medikamente = diagIndices.map(idx => {
    const p = DIAGNOSES_POOL[idx].med;
    return {
      name: p.name,
      dose: p.dose,
      activeIngredient: p.active,
      indication: p.ind,
      notes: 'Gemäß ärztlicher Verordnung.'
    };
  });

  const biografie = `Geboren in ${lastName === 'Schneider' ? 'Dresden' : 'Berlin'}. Ehemalige(r) ${i % 2 === 0 ? 'Kaufmann' : 'Krankenschwester'}. Lebt gerne hier.`;

  const p = createFullPatient(
    i,
    name,
    gender,
    dob,
    room,
    pflegegrad,
    krankenkasse,
    allergies,
    station,
    diagnosen,
    medikamente,
    biografie
  );
  
  p.medikamente = medikamente;
  p.diagnosen = diagnosen;

  patients.push(p);
}

// Write to patients_db.json
fs.writeFileSync('patients_db.json', JSON.stringify(patients, null, 2), 'utf-8');

console.log(`Successfully generated ${patients.length} fully detailed German patients in patients_db.json!`);
