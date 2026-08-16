// Shared Patient Data for PflegeHeute and Medikamente modules

export function createDefaultPatient(id, name, dob, room, pflegegrad, versNum, insurance, admission, allergies, station, status, checklist) {
  return {
    id, name, dob, room, pflegegrad, versicherungsnummer: versNum, krankenkasse: insurance, admissionDate: admission, allergies, station, status, checklist,
    sisHistory: [
      {
        date: "06.07.2026 08:00",
        user: "System",
        values: {
          themenfeld1: "Patient ist orientiert, wendungsfähig und artikuliert Bedürfnisse klar.",
          themenfeld2: "Vollständig gehfähig ohne Gehhilfen auf Stationsebene.",
          themenfeld3: "Keine akuten Krankheitseinschränkungen bekannt.",
          themenfeld4: "Übernimmt die Körperpflege selbstständig.",
          themenfeld5: "Hat regelmäßigen Kontakt zu Angehörigen.",
          themenfeld6: "Wohnung kann eigenständig gepflegt werden."
        }
      }
    ],
    stammdaten: {
      gender: "Männlich",
      address: "Hauptstraße 12, 80331 München",
      phone: "089-123456",
      emergencyContact: "Musterkontakt (Sohn) - 0170-1234567",
      doctor: "Dr. med. M. Weber - 089-987654",
      religion: "Keine Angabe",
      maritalStatus: "Verheiratet"
    },
    anamnese: {
      socialHistory: "Eigenständiger Haushalt vor Einzug. Zunehmender Unterstützungsbedarf im Alltag.",
      medicalHistory: "Arterielle Hypertonie, rezidivierende Infekte.",
      sensoryLimits: "Brille erforderlich."
    },
    diagnosen: [],
    medikamente: [],
    tagesstrukturHistory: [
      {
        date: "06.07.2026 08:00",
        user: "System",
        values: {
          morning: "Gegen 08:00 Uhr Aufstehen, Unterstützung beim Waschen und Frühstück.",
          noon: "Mittagessen um 12:00 Uhr im Wohnbereich, anschließende Mittagsruhe.",
          afternoon: "Kaffee trinken, Besuch empfangen oder Aktivierungsangebote.",
          evening: "Abendbrot um 18:00 Uhr, Ausklang des Tages im Sessel.",
          night: "Nachtruhe ab 21:30 Uhr."
        }
      }
    ],
    assessmentsHistory: [
      { date: "06.07.2026 08:30", user: "System", type: "barthel", score: 100, values: { essen: 10, baden: 5, koerperpflege: 5, anziehen: 10, stuhl: 10, urin: 10, toilette: 10, transfer: 15, mobilaet: 15, treppe: 10 }, interpretation: "Selbstständig" },
      { date: "06.07.2026 08:30", user: "System", type: "braden", score: 23, values: { sensorik: 4, feuchtigkeit: 4, aktivitaet: 4, mobilitaet: 4, ernaehrung: 4, reibung: 3 }, interpretation: "Kein Risiko" },
      { date: "06.07.2026 08:30", user: "System", type: "tinetti", score: 28, values: { gleichgewicht: 16, gang: 12 }, interpretation: "Kein Sturzrisiko" },
      { date: "06.07.2026 08:30", user: "System", type: "mmse", score: 30, values: { orientierung: 10, merkfaehigkeit: 3, aufmerksamkeit: 5, erinnern: 3, sprache: 9 }, interpretation: "Keine kognitive Beeinträchtigung" },
      { date: "06.07.2026 08:30", user: "System", type: "nrs", score: 0, interpretation: "Schmerzfrei" }
    ],
    pflegeplanung: [],
    pflegebericht: [
      { date: "07.07.2026 08:00", user: "FK Schmidt", text: "Dienstübernahme durchgeführt. Keine akuten Veränderungen." }
    ],
    entlassungsmanagement: {
      items: [
        { text: "Entlassungsgespräch geführt", checked: false },
        { text: "Entlassbrief ausgehändigt", checked: false },
        { text: "Hilfsmittelbereitstellung geprüft", checked: false },
        { text: "Medikationsplan aktualisiert", checked: false },
        { text: "Ambulanter Dienst organisiert", checked: false }
      ]
    },
    ausscheidungHistory: [
      { date: "06.07.2026 08:00", user: "System", continenceBladder: "Kontinent", continenceBowel: "Kontinent", obstipationRisk: "Gering", interventions: "Keine besonderen Interventionen." }
    ],
    wundeHistory: [
      { date: "06.07.2026 08:00", user: "System", hasWound: false, location: "-", status: "Haut reizlos und intakt.", dressing: "-", schedule: "-" }
    ],
    sturzprophylaxeHistory: [
      { date: "06.07.2026 08:00", user: "System", riskLevel: "Niedrig", measures: ["Auf festes Schuhwerk achten.", "Lichtquellen frei halten."] }
    ],
    trinkprotokoll: { target: 1500, logs: [] },
    dekubitusHistory: [
      { date: "06.07.2026 08:00", user: "System", riskLevel: "Niedrig", location: "-", measures: ["Mobilisation fördern.", "Regelmäßige Hautpflege."] }
    ],
    mobilitaetHistory: [
      { date: "06.07.2026 08:00", user: "System", status: "Gehfähig, selbstständiger Transfer.", aids: "Gehstock bei Bedarf.", transfers: "Selbstständig." }
    ],
    ernaehrungHistory: [
      { date: "06.07.2026 08:00", user: "System", diet: "Normalkost", fluidTarget: "1500 ml", weight: "74.5 kg", problems: "Keine Schluckbeschwerden." }
    ],
    schmerzHistory: [
      { date: "06.07.2026 08:00", user: "System", status: "Schmerzfrei.", therapy: "Keine Dauermedikation vorhanden.", lastAssessment: "NRS 0" }
    ],
    vitalwerte: [
      { date: "07.07. 08:00", bp: "130/80", hr: 72, temp: "36.4", sugar: 104, spo2: 97 }
    ]
  };
}

export function getInitialPatients() {
  const list = [];
  
  // Patient 1: Maria Schmidt (Station 1)
  let p1 = createDefaultPatient(
    1, "Maria Schmidt", "12.04.1938", "102", 3, "X120984756", "AOK Bayern", "01.06.2026", "Penicillin, Erdbeeren", "Station 1", "bearbeitung",
    { pflegevertrag: true, patientenverfuegung: true, betreuungsverfuegung: false, medikamentenplan: true, vorsorgevollmacht: false }
  );
  p1.stammdaten.gender = "Weiblich";
  p1.stammdaten.maritalStatus = "Verwitwet";
  p1.stammdaten.religion = "Römisch-Katholisch";
  p1.stammdaten.emergencyContact = "Lisa Schmidt (Tochter) - 0176-98765432";
  p1.stammdaten.doctor = "Dr. med. Thomas Meyer - 089-7654321";
  p1.sisHistory = [
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
  ];
  p1.anamnese = {
    socialHistory: "Zuvor alleinlebend im 1. OG ohne Aufzug. Nach Sturzereignis nun Einzug in die Pflegeeinrichtung zur dauerhaften Pflege.",
    medicalHistory: "Zustand nach Schenkelhalsfraktur rechts vor 3 Monaten. Chronische Herzinsuffizienz NYHA II. Bluthochdruck.",
    sensoryLimits: "Lesebrille vorhanden, Hörgerät rechts."
  };
  p1.diagnosen = [
    { icd: "I10", title: "Essentielle Hypertonie", date: "12.02.2018", status: "Chronisch" },
    { icd: "I50.9", title: "Herzinsuffizienz, nicht näher bezeichnet", date: "18.05.2021", status: "Chronisch" },
    { icd: "E11.9", title: "Diabetes mellitus, Typ 2", date: "04.09.2023", status: "In Behandlung" }
  ];
  p1.medikamente = [
    { name: "Ramipril 5mg", dose: "1 - 0 - 0 - 0", indication: "Hypertonie", prescribedBy: "Dr. Meyer", notes: "Morgens nüchtern", activeIngredient: "ramipril" },
    { name: "Metoprolol 47,5mg", dose: "1 - 0 - 1 - 0", indication: "Herzinsuffizienz", prescribedBy: "Dr. Meyer", notes: "Nach dem Essen", activeIngredient: "metoprolol" }
  ];
  p1.assessmentsHistory = [
    { date: "01.06.2026 15:30", user: "FK Schmidt", type: "barthel", score: 65, values: { essen: 10, baden: 0, koerperpflege: 5, anziehen: 5, stuhl: 10, urin: 10, toilette: 5, transfer: 10, mobilaet: 10, treppe: 0 }, interpretation: "Mäßige Pflegebedürftigkeit" },
    { date: "01.06.2026 15:45", user: "FK Schmidt", type: "braden", score: 16, values: { sensorik: 4, feuchtigkeit: 3, aktivitaet: 2, mobilitaet: 3, ernaehrung: 2, reibung: 2 }, interpretation: "Leichtes Dekubitusrisiko" },
    { date: "01.06.2026 16:00", user: "FK Schmidt", type: "tinetti", score: 18, values: { gleichgewicht: 10, gang: 8 }, interpretation: "Erhöhtes Sturzrisiko" },
    { date: "07.07.2026 09:30", user: "PW Wagner", type: "nrs", score: 3, interpretation: "Leichter Belastungsschmerz Hüfte rechts" }
  ];
  p1.trinkprotokoll = {
    target: 1500,
    logs: [
      { time: "08:15", amount: 200, beverage: "Kaffee" },
      { time: "10:00", amount: 150, beverage: "Wasser" }
    ]
  };
  p1.pflegebericht = [
    { date: "07.07.2026 14:30", user: "PM Müller", text: "Klagte heute Mittag über leichte Hüftschmerzen rechts beim Aufstehen. NRS = 3. Nach kurzer Ruhepause im Sessel ging es ihr besser. Mobilisation im Zimmer klappte mit Rollator gut." },
    { date: "07.07.2026 08:30", user: "PW Wagner", text: "Grundpflege am Waschbecken durchgeführt. Patientin war kooperativ und wusch Gesicht und Oberkörper selbstständig. Medikamente ordnungsgemäß eingenommen." }
  ];
  p1.pflegeplanung = [
    { problem: "Erhöhte Sturzgefahr durch Gangunsicherheit nach Schenkelhalsfraktur.", goal: "Sichere Mobilisation auf Stationsebene unter Nutzung des Rollators.", intervention: "Begleitung bei Gehübungen, Rollator stets in Reichweite positionieren." }
  ];
  p1.wundeHistory = [
    { date: "02.06.2026 10:00", user: "FK Schmidt", hasWound: true, location: "Kreuzbein (Sakrum)", status: "Hautabschürfung, gerötet 2x2 cm.", dressing: "Hydrokolloidverband", schedule: "Täglich" },
    { date: "01.06.2026 08:00", user: "System", hasWound: false, location: "-", status: "Haut reizlos.", dressing: "-", schedule: "-" }
  ];
  p1.dekubitusHistory = [
    { date: "01.06.2026 15:45", user: "FK Schmidt", riskLevel: "Leichtes Dekubitusrisiko (Score: 16)", location: "Kreuzbein (Sakrum)", measures: ["Lagerungswechsel alle 4 Stunden.", "Verwendung von Weichlagerungskissen."] }
  ];
  p1.vitalwerte = [
    { date: "07.07. 08:00", bp: "135/82", hr: 72, temp: "36.6", sugar: 128, spo2: 96 },
    { date: "06.07. 08:00", bp: "130/80", hr: 75, temp: "36.5", sugar: 135, spo2: 97 }
  ];
  list.push(p1);

  // Patient 2: Hans Müller (Station 1)
  let p2 = createDefaultPatient(
    2, "Hans Müller", "23.08.1945", "105", 2, "Y983748291", "Barmer", "15.05.2026", "Keine", "Station 1", "vollstaendig",
    { pflegevertrag: true, patientenverfuegung: true, betreuungsverfuegung: true, medikamentenplan: true, vorsorgevollmacht: true }
  );
  p2.stammdaten.religion = "Evangelisch";
  p2.diagnosen = [
    { icd: "I10", title: "Essentielle Hypertonie", date: "15.01.2015", status: "Chronisch" }
  ];
  p2.medikamente = [
    { name: "Pantoprazol 20mg", dose: "1 - 0 - 0 - 0", indication: "Sodbrennen / Magenschutz", prescribedBy: "Dr. Weber", notes: "Nüchtern morgens", activeIngredient: "pantoprazol" },
    { name: "Ibuprofen 400mg", dose: "1 - 0 - 1 - 0", indication: "Chronische Gelenkschmerzen", prescribedBy: "Dr. Weber", notes: "Nach Bedarf mit reichlich Wasser", activeIngredient: "ibuprofen" }
  ];
  list.push(p2);

  // Other patients
  const otherPatientsDetails = [
    { name: "Gerhard Wagner", pg: 4, room: "204", meds: [{ name: "Metformin 1000mg", dose: "1 - 0 - 1 - 0", indication: "Diabetes Typ 2", prescribedBy: "Dr. Weber", notes: "Zum Essen", activeIngredient: "metformin" }] },
    { name: "Erika Fischer", pg: 5, room: "205", meds: [{ name: "Marcumar 3mg", dose: "0 - 0 - 0 - 1", indication: "Vorhofflimmern", prescribedBy: "Dr. Müller", notes: "Laut Marcumar-Pass", activeIngredient: "marcumar" }] },
    { name: "Walter Weber", pg: 1, room: "206", meds: [{ name: "Furosemid 40mg", dose: "1 - 0 - 0 - 0", indication: "Herzinsuffizienz / Ödeme", prescribedBy: "Dr. Weber", notes: "Morgens einnehmen", activeIngredient: "furosemid" }] },
    { name: "Elisabeth Becker", pg: 3, room: "207", meds: [{ name: "Novalgin 500mg", dose: "1 - 1 - 1 - 0", indication: "Chronischer Tumorschmerz", prescribedBy: "Dr. Richter", notes: "Bei Bedarf, max 4g täglich", activeIngredient: "novalgin" }] },
    { name: "Dr. Werner Kraft", pg: 4, room: "208", meds: [{ name: "L-Thyroxin 100µg", dose: "1 - 0 - 0 - 0", indication: "Hypothyreose", prescribedBy: "Dr. Weber", notes: "Morgens nüchtern, 30 Min vor dem Frühstück", activeIngredient: "l-thyroxin" }] }
  ];

  otherPatientsDetails.forEach((details, index) => {
    const id = index + 3;
    let p = createDefaultPatient(id, details.name, "05.11.1950", details.room, details.pg, "Z11111111", "Musterkasse", "10.06.2026", "Keine", "Station 2", "bearbeitung", { pflegevertrag: true, patientenverfuegung: true, betreuungsverfuegung: false, medikamentenplan: true, vorsorgevollmacht: false });
    p.medikamente = details.meds;
    list.push(p);
  });

  return list;
}
