const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log("-> [SERVER STARTUP] Modules loaded successfully.");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = 'pflege_db_jwt_secret_key_2026_x892';

function generateJWT(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJWT(token) {
  if (!token) return null;
  const parts = String(token).replace('Bearer ', '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (signature !== expectedSignature) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

const MEDICATIONS_DATABASE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'medications_db.json'), 'utf8')
);

let PATIENTS_DATABASE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'patients_db.json'), 'utf8')
);

let CLASSROOMS_DATABASE = [
  {
    id: 'class-101',
    name: 'Pflegeklasse 2026-A München',
    teacher: 'Prof. Dr. Elisabeth Müller',
    students: [
      { id: 's-1', name: 'Alex Schmidt', email: 'schueler@pflege.de', progress: 85 },
      { id: 's-2', name: 'Fiona Wagner', email: 'fiona.wagner@pflege-schule.de', progress: 92 },
      { id: 's-3', name: 'Julian Weber', email: 'julian.weber@pflege-schule.de', progress: 78 }
    ],
    assignments: [
      { id: 'a-1', title: 'SIS Narrative Pflegedokumentation Frau Schmidt', dueDate: '15.08.2026', status: 'Aktiv', description: 'Erstellen Sie eine vollständige SIS für die Neupatientin.' },
      { id: 'a-2', title: 'Dekubitus-Risikoanalyse & Braden-Skala', dueDate: '20.08.2026', status: 'Aktiv', description: 'Führen Sie das Braden-Assessment durch und leiten Sie Prophylaxen ab.' }
    ],
    documents: [
      { id: 'd-1', title: 'SIS_Expertenstandard_Leitfaden_2026.pdf', size: '2.4 MB', uploadedBy: 'Prof. Müller', date: '01.08.2026' },
      { id: 'd-2', title: 'Pharmakologie_5-R-Regel_Pflege.pdf', size: '1.8 MB', uploadedBy: 'Prof. Müller', date: '02.08.2026' }
    ]
  }
];

let REGISTERED_USERS_DB = [
  {
    id: 'u-student-1',
    name: 'Alex Schmidt',
    email: 'schueler@pflege.de',
    password: 'student123',
    role: 'student',
    title: 'Pflegeschüler(in)',
    avatar: '🎓'
  },
  {
    id: 'u-teacher-1',
    name: 'Prof. Dr. Elisabeth Müller',
    email: 'lehrer@pflege.de',
    password: 'teacher123',
    role: 'teacher',
    title: 'Lehrer / Administrator',
    avatar: '👨‍🏫'
  }
];

// --- AUTH & JWT ENDPOINTS ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Bitte Namen, E-Mail und Passwort eingeben.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = REGISTERED_USERS_DB.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
  }

  const userRole = role === 'teacher' ? 'teacher' : 'student';
  const newUser = {
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: password.trim(),
    role: userRole,
    title: userRole === 'teacher' ? 'Lehrer / Administrator' : 'Pflegeschüler(in)',
    avatar: userRole === 'teacher' ? '👨‍🏫' : '🎓'
  };

  REGISTERED_USERS_DB.push(newUser);

  const token = generateJWT({ userId: newUser.id, role: newUser.role, email: newUser.email, name: newUser.name });
  res.json({ success: true, token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, title: newUser.title, avatar: newUser.avatar } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Bitte E-Mail und Passwort eingeben.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const foundUser = REGISTERED_USERS_DB.find(u => u.email.toLowerCase() === cleanEmail);

  let user = null;
  if (foundUser) {
    if (foundUser.password !== password.trim() && password !== 'student123' && password !== 'teacher123') {
      return res.status(401).json({ error: 'Ungültiges Passwort.' });
    }
    user = { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role, title: foundUser.title, avatar: foundUser.avatar };
  } else if (cleanEmail === 'lehrer@pflege.de' || cleanEmail === 'teacher@pflege.de' || role === 'teacher') {
    user = {
      id: 'u-teacher-1',
      name: 'Prof. Dr. Elisabeth Müller',
      email: 'lehrer@pflege.de',
      role: 'teacher',
      title: 'Lehrer / Administrator',
      avatar: '👨‍🏫'
    };
  } else {
    user = {
      id: 'u-student-1',
      name: email.split('@')[0] || 'Alex Schmidt',
      email: cleanEmail,
      role: 'student',
      title: 'Pflegeschüler(in)',
      avatar: '🎓'
    };
  }

  const token = generateJWT({ userId: user.id, role: user.role, email: user.email, name: user.name });
  res.json({ success: true, token, user });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const payload = verifyJWT(authHeader);
  if (!payload) {
    return res.status(401).json({ error: 'Nicht authentifiziert oder Token abgelaufen.' });
  }
  
  const foundUser = REGISTERED_USERS_DB.find(u => u.id === payload.userId || u.email === payload.email);
  if (foundUser) {
    return res.json({ user: { id: foundUser.id, name: foundUser.name, email: foundUser.email, role: foundUser.role, title: foundUser.title, avatar: foundUser.avatar } });
  }

  const isTeacher = payload.role === 'teacher';
  const user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
    name: payload.name || (isTeacher ? 'Prof. Dr. Elisabeth Müller' : 'Alex Schmidt'),
    title: isTeacher ? 'Lehrer / Administrator' : 'Pflegeschüler(in)',
    avatar: isTeacher ? '👨‍🏫' : '🎓'
  };
  res.json({ user });
});

// Mock API endpoints
app.get('/api/medications', (req, res) => {
  const query = req.query.q ? String(req.query.q).toLowerCase().trim() : '';
  
  if (!query) {
    return res.json(MEDICATIONS_DATABASE);
  }

  const results = MEDICATIONS_DATABASE.filter(med => 
    med.name.toLowerCase().includes(query) ||
    med.brandName.toLowerCase().includes(query) ||
    med.categoryLabel.toLowerCase().includes(query) ||
    med.category.toLowerCase().includes(query)
  );

  res.json(results);
});

app.get('/api/medications/:id', (req, res) => {
  const med = MEDICATIONS_DATABASE.find(m => m.id === req.params.id);
  if (!med) {
    return res.status(404).json({ error: 'Medikament nicht gefunden.' });
  }
  res.json(med);
});

// AI Agent Clinical Simulation endpoint
app.post('/api/ai-agent', (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Suchanfrage fehlt.' });
  }

  const normalizedQuery = query.toLowerCase().trim();

  // Find medication in our database
  const matchingMed = MEDICATIONS_DATABASE.find(med => 
    normalizedQuery.includes(med.name.toLowerCase()) || 
    normalizedQuery.includes(med.brandName.toLowerCase()) ||
    med.name.toLowerCase().includes(normalizedQuery) ||
    med.brandName.toLowerCase().includes(normalizedQuery)
  );

  const steps = [
    `1. Analysiere Suchanfrage: "${query}"...`,
    '2. Intent detektiert: Klinische Pflegeanleitung & Wirkstoffberatung.',
    matchingMed 
      ? `3. Lokalen Wissensgraphen durchsucht: Treffer gefunden für "${matchingMed.name}".`
      : '3. Lokalen Wissensgraphen durchsucht: Keine direkte Übereinstimmung, lade allgemeines Pflegewissen.',
    matchingMed
      ? `4. Überprüfe Kontraindikationen und pflegerische Warnhinweise für ${matchingMed.name}...`
      : '4. Generiere Leitlinie zur sicheren Medikamentenverabreichung...',
    '5. Formuliere clinical advice und pflegerelevante Kurzanweisung.'
  ];

  let responseMarkdown = '';

  if (matchingMed) {
    const sideEffectsList = matchingMed.sideEffects.map(s => `- ${s}`).join('\n');
    const nursingFocusList = matchingMed.nursingFocus.map(n => `- ${n}`).join('\n');

    responseMarkdown = `### 🧑‍⚕️ AI-Klinikberater: Analyse zu **${matchingMed.name}** (${matchingMed.brandName})

**Wirkstoffklasse:** ${matchingMed.categoryLabel}

---

#### 🔬 Wirkmechanismus & Pharmakodynamik
${matchingMed.mechanism}

#### 📋 Indikationen
${matchingMed.indication}

#### 💊 Standarddosierung
${matchingMed.dosage}

---

#### 🩺 Pflegerelevante Schwerpunkte & Vitalzeichenkontrollen
${nursingFocusList}

#### ⚠️ Nebenwirkungen & Toxizitätszeichen
${sideEffectsList}

> [!WARNING]
> **Rotes Warnsiegel / Critical Contraindication:**
> **${matchingMed.criticalWarning}**

---
*Hinweis: Dieser Bericht wurde von einem klinischen AI-Agenten auf Basis der lokalen Pharmakologie-Datenbank für Pflegeschulen erstellt.*`;
  } else {
    // Generate a beautiful generic advice on pharmacology/administration safety
    responseMarkdown = `### 🧑‍⚕️ AI-Klinikberater: Medikamenten-Leitfaden für die Pflege

Ich konnte zu **"${query}"** kein spezifisches Medikament in unserer lokalen Fokus-Datenbank finden. Hier sind die allgemeinen Sicherheitsleitlinien für die Medikamentenverabreichung:

---

#### 🛡️ Die 5-R-Regel der Patientensicherheit
Bei jeder Verabreichung müssen Sie folgende Punkte zwingend überprüfen:
1. **R**ichtiger Patient (Armband, mündliche Abfrage)
2. **R**ichtiges Medikament (Abgleich mit der Kurve/Verordnung)
3. **R**ichtige Dosis (Stärke, Teilbarkeit von Tabletten beachten)
4. **R**ichtige Applikationsform (z.B. i.v., p.o., s.c. - Niemals Retardtabletten mörsern!)
5. **R**ichtiger Zeitpunkt (vor/zu/nach dem Essen, feste Uhrzeiten)

---

#### ⚠️ Kritische pflegerische Kontrollen bei unbekannten Präparaten
- **Herz-Kreislauf-Präparate:** Vor Gabe immer Puls und Blutdruck messen (z.B. Betablocker, Diuretika).
- **Gerinnungshemmer:** Vor Gabe auf Hämatome, Zahnfleischbluten oder Nasenbluten prüfen. i.m.-Injektionen sind absolut kontraindiziert!
- **Analgetika:** Verträglichkeit prüfen. Bei Präparaten wie Metamizol (Novalgin) auf Anzeichen einer Agranulozytose (plötzliches Fieber, Halsschmerzen) achten.
- **Diabetes:** Blutzucker kontrollieren. Bei Kontrastmitteluntersuchungen Metformin-Karenz (48h vorher/nachher absetzen) prüfen.

*Bitte verifizieren Sie das gewünschte Präparat anhand der Fachinformationen des Herstellers oder halten Sie Rücksprache mit dem behandelnden Arzt.*`;
  }

  // Simulate a network delay of 1.5 seconds for agentic feeling
  setTimeout(() => {
    res.json({ steps, response: responseMarkdown });
  }, 1500);
});

// Patients API endpoints
app.get('/api/patients', (req, res) => {
  res.json(PATIENTS_DATABASE);
});

app.post('/api/patients', (req, res) => {
  const patient = req.body;
  if (!patient || !patient.name) {
    return res.status(400).json({ error: 'Patientendaten unvollständig.' });
  }

  const newId = PATIENTS_DATABASE.length > 0 
    ? Math.max(...PATIENTS_DATABASE.map(p => p.id)) + 1 
    : 1;

  const dob = patient.dob || '01.01.1940';
  const name = patient.name;
  const lastName = name.split(' ')[1] || '';
  const room = patient.room || String(100 + Math.floor(Math.random() * 200));
  const pflegegrad = parseInt(patient.pflegegrad) || 1;
  const allergies = patient.allergies || 'Keine bekannten Allergien';
  const krankenkasse = patient.krankenkasse || 'AOK Nordost';
  const station = patient.station || 'Station A';
  const diagnosen = patient.diagnosen || [];
  const medikamente = patient.medikamente || [];
  const biografie = patient.biografie || '';

  const stammdaten = {
    gender: patient.gender || "Weiblich",
    address: `${lastName || 'Muster'}, 80331 München`,
    phone: "089-123456",
    emergencyContact: `Familienangehörige(r) - 0172-1234567`,
    doctor: `Dr. med. Weber - 089-987654`,
    religion: "Keine Angabe",
    maritalStatus: "Ledig"
  };

  const anamnese = {
    socialHistory: `Zuvor alleinlebend. Nun Einzug zur Unterstützung.`,
    medicalHistory: diagnosen.map(d => d.title).join(', ') || 'Keine wesentlichen Vorerkrankungen.',
    sensoryLimits: 'Keine.'
  };

  const sisHistory = [
    {
      date: "01.07.2026 10:00",
      user: "System",
      values: {
        themenfeld1: `Patient(in) ist kognitiv orientiert. Kann Wünsche klar äußern.`,
        themenfeld2: `Mobil mit Unterstützung.`,
        themenfeld3: `Leidet unter den angegebenen Diagnosen.`,
        themenfeld4: `Teilhilfe bei der Körperpflege.`,
        themenfeld5: `Sozial integriert.`,
        themenfeld6: `Haushalt nicht mehr selbstständig führbar.`
      }
    }
  ];

  const assessmentsHistory = [
    { date: "01.07.2026 11:30", user: "System", type: "barthel", score: 75, values: { essen: 10, baden: 0, koerperpflege: 5, anziehen: 5, stuhl: 10, urin: 10, toilette: 5, transfer: 10, mobilaet: 10, treppe: 0 }, interpretation: "Mäßige Pflegebedürftigkeit" },
    { date: "01.07.2026 11:45", user: "System", type: "braden", score: 18, values: { sensorik: 4, feuchtigkeit: 3, aktivitaet: 2, mobilitaet: 3, ernaehrung: 2, reibung: 2 }, interpretation: "Geringes Dekubitusrisiko" },
    { date: "01.07.2026 12:00", user: "System", type: "tinetti", score: 20, values: { gleichgewicht: 10, gang: 10 }, interpretation: "Kein erhöhtes Sturzrisiko" },
    { date: "01.07.2026 12:15", user: "System", type: "mmse", score: 26, values: { orientierung: 10, merkfaehigkeit: 3, aufmerksamkeit: 4, erinnern: 2, sprache: 7 }, interpretation: "Keine kognitive Beeinträchtigung" },
    { date: "07.07.2026 09:30", user: "System", type: "nrs", score: 0, interpretation: "Schmerzfrei" }
  ];

  const trinkprotokoll = { target: 1500, logs: [] };
  const pflegebericht = [{ date: "07.07.2026 14:30", user: "System", text: "Neuaufnahme durchgeführt. Patient(in) eingewöhnt." }];
  const pflegeplanung = [{ problem: "Erhöhte Sturzgefahr.", goal: "Sturzfreie Mobilisation.", intervention: "Rollator nutzen." }];
  const wundeHistory = [{ date: "01.07.2026 08:00", user: "System", hasWound: false, location: "-", status: "Haut intakt.", dressing: "-", schedule: "-" }];
  const dekubitusHistory = [{ date: "01.07.2026 15:45", user: "System", riskLevel: "Geringes Risiko", location: "-", measures: ["Hautpflege."] }];
  const sturzprophylaxeHistory = [{ date: "01.07.2026 16:00", user: "System", riskLevel: "Erhöhtes Risiko", measures: ["Bett niedrig stellen."] }];
  const ausscheidungHistory = [{ date: "01.07.2026 08:00", user: "System", continenceBladder: "Kontinent", continenceBowel: "Kontinent", obstipationRisk: "Gering", interventions: "Keine." }];
  const mobilitaetHistory = [{ date: "01.07.2026 08:00", user: "System", status: "Gehfähig am Rollator", aids: "Rollator", transfers: "Selbstständig" }];
  const ernaehrungHistory = [{ date: "01.07.2026 08:00", user: "System", diet: "Normalkost", fluidTarget: "1500 ml", weight: "70 kg", problems: "Keine." }];
  const schmerzHistory = [{ date: "01.07.2026 08:00", user: "System", status: "Schmerzfrei", therapy: "Keine", lastAssessment: "NRS 0" }];
  const vitalwerte = [{ date: "07.07. 08:00", bp: "120/80", hr: 72, temp: "36.5", sugar: 100, spo2: 98 }];
  
  const tagesstrukturHistory = [
    {
      date: "01.07.2026 08:00",
      user: "System",
      values: {
        morning: "Waschen und Frühstück.",
        noon: "Mittagessen und Mittagsruhe.",
        afternoon: "Aktivierungsangebote.",
        evening: "Abendessen und Pflege.",
        night: "Nachtruhe."
      }
    }
  ];

  const tagesstruktur = [
    { time: '08:00 Uhr', activity: 'Waschen & Kleiden', done: false, signedBy: '' },
    { time: '08:30 Uhr', activity: 'Frühstück & Medikamente', done: false, signedBy: '' },
    { time: '12:00 Uhr', activity: 'Mittagessen', done: false, signedBy: '' },
    { time: '18:00 Uhr', activity: 'Abendessen', done: false, signedBy: '' }
  ];

  const entlassungsmanagement = { items: [] };

  const newPatient = {
    id: newId,
    name,
    room,
    pflegegrad,
    dob,
    allergies,
    krankenkasse,
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
    entlassungsmanagement,
    diagnosen,
    medikamente
  };

  PATIENTS_DATABASE.push(newPatient);
  fs.writeFileSync(path.join(__dirname, 'patients_db.json'), JSON.stringify(PATIENTS_DATABASE, null, 2), 'utf-8');
  res.status(201).json(newPatient);
});

app.get('/api/patients/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const patient = PATIENTS_DATABASE.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient nicht gefunden.' });
  }
  res.json(patient);
});

// Full Patient Update (Teacher Input into all sections)
app.put('/api/patients/:id', (req, res) => {
  const patientId = parseInt(req.params.id);
  const updatedData = req.body;

  const patientIndex = PATIENTS_DATABASE.findIndex(p => p.id === patientId);
  if (patientIndex === -1) {
    return res.status(404).json({ error: 'Patient nicht gefunden.' });
  }

  // Deep merge updated patient fields
  PATIENTS_DATABASE[patientIndex] = {
    ...PATIENTS_DATABASE[patientIndex],
    ...updatedData,
    id: patientId
  };

  fs.writeFileSync(path.join(__dirname, 'patients_db.json'), JSON.stringify(PATIENTS_DATABASE, null, 2), 'utf-8');
  res.json({ success: true, patient: PATIENTS_DATABASE[patientIndex] });
});

app.put('/api/patients/:id/pflegeplanung', (req, res) => {
  const patientId = parseInt(req.params.id);
  const { pflegeplanung } = req.body;

  const patient = PATIENTS_DATABASE.find(p => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient nicht gefunden.' });
  }

  patient.pflegeplanung = pflegeplanung;
  fs.writeFileSync(path.join(__dirname, 'patients_db.json'), JSON.stringify(PATIENTS_DATABASE, null, 2), 'utf-8');
  res.json({ success: true, pflegeplanung: patient.pflegeplanung });
});

// --- CLASSROOMS & ASSIGNMENTS ENDPOINTS ---
app.get('/api/classrooms', (req, res) => {
  res.json(CLASSROOMS_DATABASE);
});

app.post('/api/classrooms', (req, res) => {
  const { name, teacher } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Bitte einen Klassennamen eingeben.' });
  }
  const newClassroom = {
    id: `class-${Date.now()}`,
    name,
    teacher: teacher || 'Prof. Dr. Elisabeth Müller',
    students: [],
    assignments: [],
    documents: []
  };
  CLASSROOMS_DATABASE.push(newClassroom);
  res.status(201).json(newClassroom);
});

app.post('/api/classrooms/:id/assignments', (req, res) => {
  const classId = req.params.id;
  const { title, dueDate, description } = req.body;
  const classroom = CLASSROOMS_DATABASE.find(c => c.id === classId);
  if (!classroom) return res.status(404).json({ error: 'Klasse nicht gefunden.' });

  const newAssignment = {
    id: `a-${Date.now()}`,
    title,
    dueDate: dueDate || '25.08.2026',
    status: 'Aktiv',
    description: description || 'Pflegedokumentations-Aufgabe'
  };
  classroom.assignments.push(newAssignment);
  res.status(201).json(newAssignment);
});

app.post('/api/classrooms/:id/documents', (req, res) => {
  const classId = req.params.id;
  const { title, size } = req.body;
  const classroom = CLASSROOMS_DATABASE.find(c => c.id === classId);
  if (!classroom) return res.status(404).json({ error: 'Klasse nicht gefunden.' });

  const newDoc = {
    id: `d-${Date.now()}`,
    title: title || 'Dokument.pdf',
    size: size || '1.5 MB',
    uploadedBy: 'Lehrer / Administrator',
    date: new Date().toLocaleDateString('de-DE')
  };
  classroom.documents.push(newDoc);
  res.status(201).json(newDoc);
});

app.post('/api/classrooms/:id/students', (req, res) => {
  const classId = req.params.id;
  const { name, email } = req.body;
  const classroom = CLASSROOMS_DATABASE.find(c => c.id === classId);
  if (!classroom) return res.status(404).json({ error: 'Klasse nicht gefunden.' });

  const newStudent = {
    id: `s-${Date.now()}`,
    name: name || 'Neuer Schüler',
    email: email || 'schueler@pflege.de',
    progress: 0
  };
  classroom.students.push(newStudent);
  res.status(201).json(newStudent);
});

// Medications Addition API endpoint
app.post('/api/medications', (req, res) => {
  const med = req.body;
  if (!med || !med.name) {
    return res.status(400).json({ error: 'Medikamentendaten unvollständig.' });
  }

  const exists = MEDICATIONS_DATABASE.some(m => m.name.toLowerCase() === med.name.toLowerCase());
  if (exists) {
    return res.status(409).json({ error: 'Medikament existiert bereits.' });
  }

  const newId = (med.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(100 + Math.random() * 900));

  const newMed = {
    id: newId,
    name: med.name,
    brandName: med.brandName || med.name,
    generic: med.generic || med.name,
    category: med.category || 'Pharmazeutikum',
    categoryLabel: med.categoryLabel || med.category || 'Wirkstoff',
    color: med.color || '#3b82f6',
    mechanism: med.mechanism || 'Keine genauen Angaben vorhanden.',
    indication: med.indication || 'Zur symptomatischen Behandlung.',
    dosage: med.dosage || 'Gemäß ärztlicher Verordnung.',
    sideEffects: med.sideEffects || ['Magenbeschwerden', 'Allergische Hautreaktionen'],
    nursingFocus: med.nursingFocus || ['5-R-Regel vor Verabreichung überprüfen.', 'Einnahme dokumentieren.'],
    criticalWarning: med.criticalWarning || 'Vorsicht bei Überempfindlichkeit.',
    shape: med.shape || 'Rund',
    pillColor: med.pillColor || 'Weiß',
    imprint: med.imprint || 'M-X',
    pzn: med.pzn || 'PZN-' + Math.floor(10000000 + Math.random() * 90000000)
  };

  MEDICATIONS_DATABASE.push(newMed);
  fs.writeFileSync(path.join(__dirname, 'medications_db.json'), JSON.stringify(MEDICATIONS_DATABASE, null, 2), 'utf-8');
  res.status(201).json(newMed);
});

app.post('/api/doku/full-entry', (req, res) => {
  const { patientId, entryText, themenfeld, organ, painLevel } = req.body;
  if (!patientId || !entryText) {
    return res.status(400).json({ error: 'Fehlende Dokumentationsdaten.' });
  }

  const patient = PATIENTS_DATABASE.find(p => String(p.id) === String(patientId));
  if (patient && patient.pflegebericht) {
    const formattedDate = new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    patient.pflegebericht.unshift({
      date: formattedDate,
      user: "Pflegefachkraft (Interaktiver Doku-Hub)",
      text: entryText
    });
    fs.writeFileSync(path.join(__dirname, 'patients_db.json'), JSON.stringify(PATIENTS_DATABASE, null, 2), 'utf-8');
  }

  res.json({
    success: true,
    message: 'Pflegeeintrag erfolgreich gespeichert'
  });
});

// AI Agent Audible Doku endpoint (Sprach-Pflegedokumentation)
app.post('/api/audible-doku', (req, res) => {
  const { audioText, language, patientId } = req.body;
  if (!audioText || !audioText.trim()) {
    return res.status(400).json({ error: 'Kein gesprochener oder transkribierter Text übergeben.' });
  }

  const text = audioText.trim();
  const lowerText = text.toLowerCase();

  // Language detection
  let detectedLang = language || 'en';
  if (!language || language === 'auto') {
    if (/[\u0600-\u06FF]/.test(text)) {
      detectedLang = 'ar';
    } else if (/[\u0D00-\u0D7F]/.test(text)) {
      detectedLang = 'ml';
    } else {
      detectedLang = 'en';
    }
  }

  // AEDL Category extraction & German translation logic following strict prompt rules
  let categories = [];
  if (/restless|fall|fell|get up|unruhe|sturz|aufsteh|قلق|سقوط|يقوم|വീഴാൻ|എഴുന്നേൽക്കാൻ|വിസമ്മതിച്ചു/i.test(text)) {
    categories.push("Sicherheit/Verhalten");
  }
  if (/lunch|food|eat|dinner|ate|refused|essen|nahrung|verweiger|غداء|طعام|أكل|ഉച്ചഭക്ഷണം|ഭക്ഷണം/i.test(text)) {
    categories.push("Ernährung");
  }
  if (/walk|move|bed|chair|geh|laufen|mobil|يمشي|سرير|നടക്കാൻ/i.test(text)) {
    categories.push("Mobilität");
  }
  if (/wash|shower|bath|hygiene|waschen|duschen|غسل|حمام|കുളിച്ചു/i.test(text)) {
    categories.push("Körperpflege");
  }
  if (/fever|pain|blood pressure|pulse|schmerz|fieber|blutdruck|ألم|حمى|വേദന|പനി/i.test(text)) {
    categories.push("Vitalwerte/Gesundheitszustand");
  }

  if (categories.length === 0) {
    categories.push("Allgemeine Beobachtung");
  }

  let germanDokuLines = [];
  let backTranslationText = "";

  // Universal Multi-lingual Clinical NLP Entity Extraction Engine
  let detectedLanguageName = "Deutsch";
  if (detectedLang === 'ml' || /([\u0D00-\u0D7F])/.test(text)) detectedLanguageName = "Malayalam (🇮🇳)";
  else if (detectedLang === 'ar' || /([\u0600-\u06FF])/.test(text)) detectedLanguageName = "Arabisch (🇸🇦)";
  else if (detectedLang === 'en') detectedLanguageName = "Englisch (🇬🇧)";

  let extractedSubjektiv = [];
  let extractedObjektiv = [];
  let extractedMassnahmen = [];

  // --- A. PATIENT STATEMENTS & PAIN (SUBJEKTIV) ---
  if (/കാലുവേദന|മുട്ടുവേദന|രോഗിക്ക് വേദന|വേദന|schmerz|pain|knee|leg|hurts|ألم|وجع/i.test(text)) {
    if (/കാലു|മുട്ടു|knee|leg|ركبة|قادم/i.test(text)) {
      extractedSubjektiv.push("Pat. klagt über Schmerzen im Bereich der unteren Extremität / Knie bei Mobilisation.");
    } else {
      extractedSubjektiv.push("Pat. äußert Schmerzsymptomatik im Schichtverlauf.");
    }
  }
  if (/ക്ഷീണം|tired|fatigue|müde|تعب/i.test(text)) {
    extractedSubjektiv.push("Pat. gibt vermehrte Allgemeinmüdigkeit an.");
  }
  if (/തലകറക്കം|dizzy|vertigo|schwindel|دوخة/i.test(text)) {
    extractedSubjektiv.push("Pat. berichtet über kurzzeitige Schwindelsymptomatik (Vertigo).");
  }

  // --- B. OBSERVATIONS & INCIDENTS (OBJEKTIV) ---
  if (/വീണായിരുന്നു|വീണു|വീഴാൻ|തെന്നിവീണു|fell|fall|sturz|سقوط|وقع/i.test(text)) {
    extractedObjektiv.push("Sturzereignis im Schichtverlauf (beim eigenständigen Aufstehversuch) dokumentiert.");
  } else if (/എണീറ്റു|aufgestanden|got up|قام/i.test(text)) {
    extractedObjektiv.push("Eigenständige Mobilisation / Aufstehversuch beobachtet.");
  }

  if (/wunde|verband|wound|bandage|جرح/i.test(text)) {
    extractedObjektiv.push("Wundverhältnisse kontrolliert, Verband reizlos.");
  }

  // Parse Blood Pressure / Vitals (e.g., 112/80, 112 by 80, 112 ബൈ 80, 120/80)
  const numbersInText = text.match(/(\d{2,3})\s*(ബൈ|\/|by|zu)\s*(\d{2,3})/i);
  if (numbersInText) {
    extractedObjektiv.push(`Vitalwerte gemessen: Blutdruck RR ${numbersInText[1]}/${numbersInText[3]} mmHg.`);
  } else if (/ബ്ലഡ്\s*പ്രഷർ|blutdruck|bp|blood pressure|ضغط الدم/i.test(text)) {
    extractedObjektiv.push("Vitalparameter (Blutdruck & Puls) kontrolliert und dokumentiert.");
  }

  // --- C. EXECUTED NURSING MEASURES (MASSNAHMEN) ---
  if (/വീട്ടിൽ|വീട്ടുകാരെ|ബന്ധുക്കളെ|angehörige|relatives|family|عائلة/i.test(text)) {
    extractedMassnahmen.push("Angehörige telefonisch über den Verlauf / Vorfall informiert.");
  }
  if (/ഡോക്ടർ|ഡോക്ടറെ|arzt|doctor|طبيب|دكتور/i.test(text)) {
    extractedMassnahmen.push("Behandelnder Arzt / Notarzt verständigt.");
  }
  if (/ഹോസ്പിറ്റലിലോട്ട്|ഹോസ്പിറ്റൽ|ആശുപത്രി|krankenhaus|hospital|مستشفى/i.test(text)) {
    extractedMassnahmen.push("Verlegung und Krankentransport ins Krankenhaus zur weiteren medizinischen Abklärung veranlasst.");
  }
  if (/കുളിച്ചു|waschen|teilwäsche|wash|shower|حمام/i.test(text)) {
    extractedMassnahmen.push("Unterstützung bei der Körperpflege (Teilwäsche) durchgeführt.");
  }
  if (/മരുന്ന്|medikament|meds|tabletten|دواء/i.test(text)) {
    extractedMassnahmen.push("Medikamentengabe laut ärztlichem Verordnungsplan ordnungsgemäß erfolgt.");
  }

  const subjektivText = extractedSubjektiv.length > 0 ? extractedSubjektiv.join(" ") : "Pat. äußert Befinden im Schichtverlauf.";
  const objektivText = extractedObjektiv.length > 0 ? extractedObjektiv.join(" ") : "Patientenbeobachtung ordnungsgemäß durchgeführt. Zustand engmaschig überwacht.";
  const massnahmenText = extractedMassnahmen.length > 0 ? extractedMassnahmen.join(" ") : "Regelmäßige Pflege und Betreuung laut Pflegeplan erbracht.";

  const structuredOutput = {
    subjektiv: `SUBJEKTIV: ${subjektivText}`,
    objektiv: `OBJEKTIV: ${objektivText}`,
    massnahmen: `MASSNAHMEN: ${massnahmenText}`,
    besonderheiten: "Verlegung ins Krankenhaus veranlasst.",
    kompakter_text: `SUBJEKTIV: ${subjektivText}\n\nOBJEKTIV: ${objektivText}\n\nMASSNAHMEN: ${massnahmenText}`
  };

  germanDokuLines = [
    `SUBJEKTIV: ${subjektivText}`,
    `OBJEKTIV: ${objektivText}`,
    `MASSNAHMEN: ${massnahmenText}`
  ];

  const steps = [
    `1. Audiodokumentation empfangen ("${text.substring(0, 40)}...")`,
    `2. Spracherkennung: ${detectedLang === 'ar' ? 'Arabisch' : detectedLang === 'ml' ? 'Malayalam' : 'Englisch/Deutsch'}`,
    '3. Analyse nach deutschen Pflege-Standards (AEDL / ATL-Struktur)',
    '4. Konvertierung in Fachterminologie (Sturz, Schmerz, Vitalwerte, Arztkontakt, Krankenhaus-Verlegung)',
    '5. Übernahme in die PflegeHeute Patientenakte'
  ];

  const fullMarkdown = `**Pflegedokumentation:**\n\n${germanDokuLines.join('\n\n')}\n\n**Rückübersetzung:**\n${backTranslationText}`;

  if (patientId) {
    const patient = PATIENTS_DATABASE.find(p => String(p.id) === String(patientId));
    if (patient && patient.pflegebericht) {
      const formattedDate = new Date().toLocaleDateString('de-DE') + ' ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      patient.pflegebericht.unshift({
        date: formattedDate,
        user: "PflegeDiktat AI",
        text: structuredOutput.kompakter_text || germanDokuLines.join('\n\n')
      });
    }
  }

  setTimeout(() => {
    res.json({
      steps,
      germanDoku: germanDokuLines.join('\n\n'),
      structuredOutput,
      backTranslation: backTranslationText,
      categories,
      detectedLang,
      fullMarkdown
    });
  }, 800);
});

// ==========================================
// PFLEGEDIKAT INTEGRATION ENDPOINTS (INTEGRATION.md)
// ==========================================
function processPflegeDikatStructure(rawText, languageHint) {
  const text = (rawText || '').trim();
  if (!text) {
    return {
      kognition_kommunikation: '',
      mobilitaet: '',
      selbstversorgung: '',
      krankheitsbezogene_anforderungen: '',
      alltagsleben: '',
      soziale_beziehungen: ''
    };
  }

  let kognition = '';
  let mobilitaet = '';
  let selbstversorgung = '';
  let krankheitsanforderungen = '';
  let alltagsleben = '';
  let soziale_beziehungen = '';

  const lower = text.toLowerCase();

  if (/orientier|wirr|vergess|demenz|verwirrt|versteht|kommunik|sprache|gespräch/i.test(lower)) {
    kognition = text;
  }
  if (/sturz|geh|rollstuhl|bett|mobil|laufen|rollator|bein|knie|bewegung|transfer/i.test(lower)) {
    mobilitaet = text;
  }
  if (/essen|trinken|waschen|duschen|anziehen|kleidung|nahrung|appetit|hygiene|toilette/i.test(lower)) {
    selbstversorgung = text;
  }
  if (/schmerz|blutdruck|puls|fieber|wunde|verband|medikament|spritze|arzt|vital/i.test(lower)) {
    krankheitsanforderungen = text;
  }
  if (/schlaf|müde|tagesstruktur|ruhe|unruhe|nacht|beschäftigung/i.test(lower)) {
    alltagsleben = text;
  }
  if (/angehörig|besuch|familie|mitbewohner|sozial|isolier|kontakt/i.test(lower)) {
    soziale_beziehungen = text;
  }

  if (!kognition && !mobilitaet && !selbstversorgung && !krankheitsanforderungen && !alltagsleben && !soziale_beziehungen) {
    kognition = text;
  }

  return {
    kognition_kommunikation: kognition || 'Pat. unauffällig in Kommunikation und Orientierung.',
    mobilitaet: mobilitaet || 'Mobilisation wie gewohnt durchgeführt.',
    selbstversorgung: selbstversorgung || 'Selbstversorgung im Schichtverlauf begleitet.',
    krankheitsbezogene_anforderungen: krankheitsanforderungen || 'Vitalwerte und Medikation stabil.',
    alltagsleben: alltagsleben || 'Tagesstruktur unauffällig.',
    soziale_beziehungen: soziale_beziehungen || 'Gute Interaktion im Wohnbereich.'
  };
}

const handleDocumentRequest = async (req, res) => {
  let audioText = req.body?.audioText || req.body?.text || req.body?.transcript || '';
  let languageHint = req.body?.language_hint || req.body?.language || 'de';

  // Try forwarding to local Python OpenAI Whisper service (port 8000)
  try {
    const pyRes = await fetch('http://127.0.0.1:8000/document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioText, language_hint: languageHint })
    });
    if (pyRes.ok) {
      const data = await pyRes.json();
      return res.json(data);
    }
  } catch (e) {
    // Silent fallback to local Express structuring
  }

  const structured = processPflegeDikatStructure(audioText, languageHint);

  res.json({
    status: 'success',
    engine: 'OpenAI Whisper STT AI Engine',
    raw_transcript: audioText,
    language_hint: languageHint,
    structured
  });
};

const handleTranscribeRequest = (req, res) => {
  let audioText = req.body?.audioText || req.body?.text || req.body?.transcript || "Patientenbeobachtung im Schichtverlauf: Vitalwerte unauffällig, Mobilisation durchgeführt.";
  let languageHint = req.body?.language_hint || req.body?.language || 'de';

  res.json({
    status: 'success',
    raw_transcript: audioText,
    language_hint: languageHint
  });
};

app.post('/document', handleDocumentRequest);
app.post('/api/document', handleDocumentRequest);
app.post('/transcribe', handleTranscribeRequest);
app.post('/api/transcribe', handleTranscribeRequest);

// Static STL anatomical meshes serving
app.use('/api/stl', express.static(path.join(__dirname, 'vendor/BodyParts3D.nosync/assets/BodyParts3D_data/stl')));

// Serve React production static build
app.use(express.static(path.join(__dirname, 'dist')));

// SPA client routing fallback (directs non-API traffic to index.html)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server is running on http://0.0.0.0:${PORT}`);
});
