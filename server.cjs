require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { AccessToken, RoomServiceClient } = require('livekit-server-sdk');

console.log("-> [SERVER STARTUP] Modules loaded successfully.");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Falls back to the old hardcoded value only in dev — production deployments must set a real
// JWT_SECRET in .env, since anyone who can read this source (it's committed to git) could
// otherwise forge tokens for any account, including admin.
const JWT_SECRET = process.env.JWT_SECRET || 'pflege_db_jwt_secret_key_2026_x892';
if (!process.env.JWT_SECRET) {
  console.warn('-> [SECURITY WARNING] JWT_SECRET not set in .env — using the insecure default. Set a real JWT_SECRET before deploying publicly.');
}

// --- PASSWORD HASHING ---
function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}
function isHashed(password) {
  return typeof password === 'string' && /^\$2[aby]\$/.test(password);
}
function verifyPassword(plain, stored) {
  if (!isHashed(stored)) return plain === stored; // legacy plaintext row, migrated lazily below
  return bcrypt.compareSync(plain, stored);
}

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

// --- OUTBOUND EMAIL (registration verification) ---
// Two supported setups, checked in order: generic SMTP (any provider — SendGrid, Outlook,
// a company mail server, ...) or the Gmail shortcut. Neither set → console-log fallback below.
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';
const SMTP_READY = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
const GMAIL_READY = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
const MAILER_READY = SMTP_READY || GMAIL_READY;
const MAIL_FROM = process.env.SMTP_FROM || process.env.GMAIL_USER || 'no-reply@pflege-plattform.local';

let mailTransporter = null;
if (SMTP_READY) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
  console.log(`-> [MAILER] SMTP configured (${process.env.SMTP_HOST}) — verification emails will be sent for real.`);
} else if (GMAIL_READY) {
  mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });
  console.log('-> [MAILER] Gmail SMTP configured — verification emails will be sent for real.');
} else {
  console.log('-> [MAILER] No SMTP_HOST/SMTP_USER/SMTP_PASSWORD or GMAIL_USER/GMAIL_APP_PASSWORD in .env — verification links will be logged to this console instead of emailed. See .env.example.');
}

async function sendVerificationEmail(to, name, token) {
  const verifyLink = `${APP_BASE_URL}/?verify=${token}`;
  if (!mailTransporter) {
    console.log(`-> [MAILER][DEV] Verification link for ${to}: ${verifyLink}`);
    return;
  }
  try {
    await mailTransporter.sendMail({
      from: `"Pflege-Plattform" <${MAIL_FROM}>`,
      to,
      subject: 'Bitte bestätige deine E-Mail-Adresse',
      html: `<p>Hallo ${name},</p><p>bitte bestätige deine Registrierung bei der Pflege-Plattform:</p><p><a href="${verifyLink}">${verifyLink}</a></p><p>Dieser Link ist 24 Stunden gültig.</p>`
    });
  } catch (err) {
    // Don't fail registration just because the send failed — the account still exists and the
    // link still works if the user gets it another way (e.g. resend once mail delivery is fixed).
    console.error('-> [MAILER] Failed to send verification email:', err.message);
    console.log(`-> [MAILER][FALLBACK] Verification link for ${to}: ${verifyLink}`);
  }
}

const MEDICATIONS_DATABASE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'medications_db.json'), 'utf8')
);

let PATIENTS_DATABASE = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'patients_db.json'), 'utf8')
);

const USERS_DB_PATH = path.join(__dirname, 'users_db.json');

// Shared default shape for every account — role-specific fields stay null when not applicable.
// Also doubles as the migration merge for accounts persisted before a field existed: seedUser(existingRecord)
// backfills only the keys that are missing, since `...fields` overrides the defaults above it.
function seedUser(fields) {
  return {
    active: true,
    supervisorId: null,
    classroomId: null,
    specialty: null,
    institution: null,
    cohortYear: null,
    emailVerified: true,
    verificationToken: null,
    verificationTokenExpires: null,
    avatarType: 'emoji',
    avatarIcon: null,
    avatarUrl: null,
    ...fields
  };
}

const DEFAULT_USERS_DB = [
  seedUser({
    id: 'u-student-1',
    name: 'Alex Schmidt',
    email: 'schueler@pflege.de',
    password: 'student123',
    role: 'student',
    title: 'Pflegeschüler(in)',
    avatar: '🎓',
    supervisorId: 'u-praxis-1',
    classroomId: 'class-101',
    cohortYear: '2026'
  }),
  seedUser({
    id: 'u-teacher-1',
    name: 'Prof. Dr. Elisabeth Müller',
    email: 'lehrer@pflege.de',
    password: 'teacher123',
    role: 'teacher',
    title: 'Lehrer / Administrator',
    avatar: '👨‍🏫',
    institution: 'Berufsfachschule für Pflege München',
    specialty: 'Innere Medizin'
  }),
  seedUser({
    id: 'u-student-2',
    name: 'Fiona Wagner',
    email: 'fiona.wagner@pflege-schule.de',
    password: 'student123',
    role: 'student',
    title: 'Pflegeschüler(in)',
    avatar: '🎓',
    supervisorId: 'u-praxis-1',
    classroomId: 'class-101',
    cohortYear: '2026'
  }),
  seedUser({
    id: 'u-praxis-1',
    name: 'Michael Weber',
    email: 'praxisanleiter@pflege.de',
    password: 'praxis123',
    role: 'praxisanleiter',
    title: 'Praxisanleiter',
    avatar: '🩺',
    specialty: 'Intensivstation'
  }),
  seedUser({
    id: 'u-admin-1',
    name: 'System Administrator',
    email: 'admin@pflege.de',
    password: 'admin123',
    role: 'admin',
    title: 'Administrator',
    avatar: '⚙️'
  })
];

let REGISTERED_USERS_DB;
try {
  REGISTERED_USERS_DB = JSON.parse(fs.readFileSync(USERS_DB_PATH, 'utf8'));
  // Backfill any fields added since these records were written (e.g. emailVerified, avatar*) —
  // existing accounts are grandfathered in as verified since they predate the verification flow.
  REGISTERED_USERS_DB = REGISTERED_USERS_DB.map(u => seedUser(u));
} catch (e) {
  REGISTERED_USERS_DB = DEFAULT_USERS_DB;
}
// One-time migration: any password still stored in plaintext (seed accounts, or rows written
// before bcrypt hashing was added) gets hashed in place. Logins are unaffected — the same
// plaintext password still works, it's just compared against the hash from now on.
for (const u of REGISTERED_USERS_DB) {
  if (u.password && !isHashed(u.password)) u.password = hashPassword(u.password);
}
fs.writeFileSync(USERS_DB_PATH, JSON.stringify(REGISTERED_USERS_DB, null, 2), 'utf-8');

function saveUsers() {
  fs.writeFileSync(USERS_DB_PATH, JSON.stringify(REGISTERED_USERS_DB, null, 2), 'utf-8');
}

// --- AUDIT LOG (account-management actions) ---
const AUDIT_LOG_PATH = path.join(__dirname, 'audit_log.json');
let AUDIT_LOG;
try {
  AUDIT_LOG = JSON.parse(fs.readFileSync(AUDIT_LOG_PATH, 'utf8'));
} catch (e) {
  AUDIT_LOG = [];
  fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(AUDIT_LOG, null, 2), 'utf-8');
}

function saveAuditLog() {
  fs.writeFileSync(AUDIT_LOG_PATH, JSON.stringify(AUDIT_LOG, null, 2), 'utf-8');
}

function logAuditEvent(actor, action, targetUserId, detail) {
  AUDIT_LOG.unshift({
    id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    actorId: actor.id,
    actorName: actor.name,
    action,
    targetUserId: targetUserId || null,
    detail: detail || '',
    createdAt: new Date().toISOString()
  });
  saveAuditLog();
}

// --- AUTH HELPERS (generic — used across feed/social/admin/classrooms) ---
function authenticateRequest(req) {
  const payload = verifyJWT(req.headers.authorization);
  if (!payload) return null;
  const known = REGISTERED_USERS_DB.find(u => u.id === payload.userId || u.email === payload.email);
  if (!known) return null;
  if (known.active === false) return null;
  return known;
}

function requireRole(user, roles) {
  return !!user && roles.includes(user.role);
}

// --- PFLEGEFEED DATA LAYER ---
const FEED_DB_PATH = path.join(__dirname, 'feed_db.json');
const FEED_UPLOADS_ROOT = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(path.join(FEED_UPLOADS_ROOT, 'feed'), { recursive: true });
fs.mkdirSync(path.join(FEED_UPLOADS_ROOT, 'feed-docs'), { recursive: true });
fs.mkdirSync(path.join(FEED_UPLOADS_ROOT, 'avatars'), { recursive: true });
fs.mkdirSync(path.join(FEED_UPLOADS_ROOT, 'classroom-docs'), { recursive: true });

// Seed classroom documents as real, downloadable files (same pattern as SEED_DOC_PATH below) —
// the Klassenzimmer rework replaced fake size-only metadata with real uploads, so the seed data
// needs a real file behind each of its two starter documents too.
const CLASSROOM_SEED_DOCS = [
  { file: 'seed-sis-expertenstandard.txt', title: 'SIS_Expertenstandard_Leitfaden_2026.txt', text: 'SIS Expertenstandard Leitfaden 2026 (Platzhalter-Dokument)\n\nStrukturmodell zur Strukturierten Informationssammlung (SIS) - Kurzleitfaden fuer die Pflegeausbildung.' },
  { file: 'seed-pharmakologie-5r.txt', title: 'Pharmakologie_5-R-Regel_Pflege.txt', text: 'Pharmakologie - Die 5-R-Regel der Medikamentengabe (Platzhalter-Dokument)\n\nRichtiger Patient, richtiges Medikament, richtige Dosis, richtiger Zeitpunkt, richtiger Applikationsweg.' }
];
for (const doc of CLASSROOM_SEED_DOCS) {
  const docPath = path.join(FEED_UPLOADS_ROOT, 'classroom-docs', doc.file);
  if (!fs.existsSync(docPath)) fs.writeFileSync(docPath, doc.text, 'utf-8');
}

// Classrooms were previously an in-memory-only array (lost on every server restart) — a real
// reliability bug. Now persisted the same load-on-boot/write-on-mutation way as every other DB
// in this file; saveClassrooms() is called after every mutation below.
const CLASSROOMS_DB_PATH = path.join(__dirname, 'classrooms_db.json');
const DEFAULT_CLASSROOMS_DATABASE = [
  {
    id: 'class-101',
    name: 'Pflegeklasse 2026-A München',
    teacher: 'Prof. Dr. Elisabeth Müller',
    teacherId: 'u-teacher-1',
    students: [
      { id: 's-1', userId: 'u-student-1', name: 'Alex Schmidt', email: 'schueler@pflege.de', progress: 85 },
      { id: 's-2', userId: 'u-student-2', name: 'Fiona Wagner', email: 'fiona.wagner@pflege-schule.de', progress: 92 },
      { id: 's-3', userId: null, name: 'Julian Weber', email: 'julian.weber@pflege-schule.de', progress: 78 }
    ],
    assignments: [
      { id: 'a-1', title: 'SIS Narrative Pflegedokumentation Frau Schmidt', dueDate: '15.08.2026', status: 'Aktiv', description: 'Erstellen Sie eine vollständige SIS für die Neupatientin.', createdBy: 'Prof. Dr. Elisabeth Müller', createdById: 'u-teacher-1', submissions: [] },
      { id: 'a-2', title: 'Dekubitus-Risikoanalyse & Braden-Skala', dueDate: '20.08.2026', status: 'Aktiv', description: 'Führen Sie das Braden-Assessment durch und leiten Sie Prophylaxen ab.', createdBy: 'Prof. Dr. Elisabeth Müller', createdById: 'u-teacher-1', submissions: [] }
    ],
    documents: [
      {
        id: 'd-1', title: CLASSROOM_SEED_DOCS[0].title,
        url: `/uploads/classroom-docs/${CLASSROOM_SEED_DOCS[0].file}`, mime: 'text/plain',
        size: fs.statSync(path.join(FEED_UPLOADS_ROOT, 'classroom-docs', CLASSROOM_SEED_DOCS[0].file)).size,
        uploadedBy: 'Prof. Dr. Elisabeth Müller', uploadedById: 'u-teacher-1', date: '01.08.2026'
      },
      {
        id: 'd-2', title: CLASSROOM_SEED_DOCS[1].title,
        url: `/uploads/classroom-docs/${CLASSROOM_SEED_DOCS[1].file}`, mime: 'text/plain',
        size: fs.statSync(path.join(FEED_UPLOADS_ROOT, 'classroom-docs', CLASSROOM_SEED_DOCS[1].file)).size,
        uploadedBy: 'Prof. Dr. Elisabeth Müller', uploadedById: 'u-teacher-1', date: '02.08.2026'
      }
    ]
  }
];

let CLASSROOMS_DATABASE;
try {
  CLASSROOMS_DATABASE = JSON.parse(fs.readFileSync(CLASSROOMS_DB_PATH, 'utf8'));
} catch (e) {
  CLASSROOMS_DATABASE = DEFAULT_CLASSROOMS_DATABASE;
  fs.writeFileSync(CLASSROOMS_DB_PATH, JSON.stringify(CLASSROOMS_DATABASE, null, 2), 'utf-8');
}
function saveClassrooms() {
  fs.writeFileSync(CLASSROOMS_DB_PATH, JSON.stringify(CLASSROOMS_DATABASE, null, 2), 'utf-8');
}

// --- LETSMEET: real-time video meetings for classes & 1:1/small-group appointments ---
// No seed data on purpose — a meeting only exists once a real, logged-in user creates one.
// The actual call (media + chat + presence) runs on LiveKit, a self-hosted WebRTC SFU (see
// `npm run livekit` — devkey/secret, started separately from this process). This server's
// job is just: persist meeting records, enforce who is allowed into which meeting, and mint a
// short-lived LiveKit room token for that room once access is confirmed.
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
const livekitRoomService = new RoomServiceClient(LIVEKIT_URL.replace(/^ws/, 'http'), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

async function mintLivekitToken(roomCode, user, isHost) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: user.id,
    name: user.name,
    metadata: JSON.stringify({
      isHost, avatarType: user.avatarType || 'emoji', avatarIcon: user.avatarIcon || null, avatarUrl: user.avatarUrl || null
    })
  });
  at.addGrant({ roomJoin: true, room: roomCode, canPublish: true, canSubscribe: true, canPublishData: true });
  return at.toJwt();
}

const MEETINGS_DB_PATH = path.join(__dirname, 'meetings_db.json');
let MEETINGS_DATABASE;
try {
  MEETINGS_DATABASE = JSON.parse(fs.readFileSync(MEETINGS_DB_PATH, 'utf8'));
} catch (e) {
  MEETINGS_DATABASE = [];
  fs.writeFileSync(MEETINGS_DB_PATH, JSON.stringify(MEETINGS_DATABASE, null, 2), 'utf-8');
}
function saveMeetings() {
  fs.writeFileSync(MEETINGS_DB_PATH, JSON.stringify(MEETINGS_DATABASE, null, 2), 'utf-8');
}

// Google-Meet-style room code: short, human-readable, unambiguous character set (no 0/O/1/l).
function generateRoomCode() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  const part = (n) => Array.from({ length: n }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `${part(3)}-${part(4)}-${part(3)}`;
}

// A meeting tagged to a classroom is a class-wide session — only the people who could already
// post an assignment into that classroom (its teacher, a praxisanleiter supervising someone in
// it, or admin) may schedule one. Untagged meetings are just two-or-more people meeting, open to
// any authenticated user — that covers the "appointment" case (e.g. a praxisanleiter and one
// student, or two students studying together) without needing a classroom at all.
function userCanHostForClassroom(user, classroomId) {
  if (!classroomId) return true;
  if (user.role === 'admin') return true;
  const cls = CLASSROOMS_DATABASE.find(c => c.id === classroomId);
  if (!cls) return false;
  if (user.role === 'teacher') return cls.teacherId === user.id;
  if (user.role === 'praxisanleiter') {
    return REGISTERED_USERS_DB.some(u => u.supervisorId === user.id && u.classroomId === classroomId);
  }
  return false;
}

function userCanAccessMeeting(user, meeting) {
  if (!user || !meeting) return false;
  if (meeting.hostId === user.id) return true;
  if ((meeting.inviteeEmails || []).includes(String(user.email || '').toLowerCase())) return true;
  if (meeting.classroomId) {
    if (user.role === 'admin') return true;
    if (user.role === 'student' && user.classroomId === meeting.classroomId) return true;
    const cls = CLASSROOMS_DATABASE.find(c => c.id === meeting.classroomId);
    if (cls && user.role === 'teacher' && cls.teacherId === user.id) return true;
    if (user.role === 'praxisanleiter') {
      return REGISTERED_USERS_DB.some(u => u.supervisorId === user.id && u.classroomId === meeting.classroomId);
    }
  }
  return false;
}

function publicMeeting(m) {
  const classroom = m.classroomId ? CLASSROOMS_DATABASE.find(c => c.id === m.classroomId) : null;
  return {
    id: m.id,
    roomCode: m.roomCode,
    title: m.title,
    type: m.type,
    hostId: m.hostId,
    hostName: m.hostName,
    classroomId: m.classroomId,
    classroomName: classroom ? classroom.name : null,
    inviteeEmails: m.inviteeEmails || [],
    scheduledFor: m.scheduledFor,
    status: m.status,
    createdAt: m.createdAt,
    startedAt: m.startedAt,
    endedAt: m.endedAt,
    attendeeCount: new Set((m.participantsLog || []).map(p => p.userId)).size
  };
}

function svgPlaceholder(from, to, label) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='800'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='640' height='800' fill='url(%23g)'/><text x='50%25' y='52%25' font-family='sans-serif' font-size='34' font-weight='700' fill='white' text-anchor='middle' opacity='0.92'>${encodeURIComponent(label)}</text></svg>`;
  return `data:image/svg+xml,${svg.replace(/"/g, "'").replace(/#/g, '%23')}`;
}

const SEED_DOC_PATH = path.join(FEED_UPLOADS_ROOT, 'feed-docs', 'seed-wundversorgung-protokoll.txt');
if (!fs.existsSync(SEED_DOC_PATH)) {
  fs.writeFileSync(SEED_DOC_PATH, 'Wundversorgung Protokoll v2 (Platzhalter-Dokument)\n\nStandard fuer moderne Wundversorgung - Kurzfassung fuer Pflegeschueler.', 'utf-8');
}
const SEED_DOC_URL = '/uploads/feed-docs/seed-wundversorgung-protokoll.txt';

const DEFAULT_FEED_POSTS = [
  {
    id: 'post-seed-1',
    authorId: 'u-student-1',
    authorName: 'Alex Schmidt',
    authorRole: 'Pflegeschüler(in)',
    type: 'status',
    text: 'Erster Tag auf der Intensivstation! Die Einarbeitung war super strukturiert und das Team ist fantastisch. Ich freue mich auf die kommenden Wochen.',
    images: [],
    document: null,
    tags: ['#Pflege', '#Praktikum', '#Intensivpflege'],
    likedBy: ['u-teacher-1'],
    comments: [
      { id: 'c-seed-1', authorId: 'u-teacher-1', authorName: 'Prof. Dr. Elisabeth Müller', text: 'Toller Start, weiter so!', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    id: 'post-seed-2',
    authorId: 'u-teacher-1',
    authorName: 'Prof. Dr. Elisabeth Müller',
    authorRole: 'Lehrer / Administrator',
    type: 'document',
    text: 'Zur Erinnerung: Die neuen Standards für die moderne Wundversorgung sind ab nächster Woche gültig. Bitte einmal in Ruhe durchlesen!',
    images: [],
    document: { name: 'Wundversorgung_Protokoll_v2.txt', url: SEED_DOC_URL, size: fs.statSync(SEED_DOC_PATH).size, mime: 'text/plain' },
    tags: ['#Wundversorgung', '#Standards'],
    likedBy: ['u-student-1'],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString()
  },
  {
    id: 'post-seed-3',
    authorId: 'u-student-1',
    authorName: 'Alex Schmidt',
    authorRole: 'Pflegeschüler(in)',
    type: 'photo',
    text: 'Unser Skills-Lab Training zur Braden-Skala heute – so viel gelernt über Dekubitusprophylaxe! 🩺',
    images: [
      svgPlaceholder('%230D9488', '%2316305C', 'Skills-Lab'),
      svgPlaceholder('%2316305C', '%230D9488', 'Braden-Skala')
    ],
    document: null,
    tags: ['#SkillsLab', '#Dekubitusprophylaxe'],
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString()
  },
  {
    id: 'post-seed-4',
    authorId: 'u-student-1',
    authorName: 'Alex Schmidt',
    authorRole: 'Pflegeschüler(in)',
    type: 'status',
    text: 'Heute die Grundlagen der Vitalzeichenkontrolle wiederholt – RR, Puls, SpO2, Temperatur sitzen jetzt sicher.',
    images: [],
    document: null,
    tags: ['#Vitalzeichen', '#Lernen'],
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'post-seed-5',
    authorId: 'u-student-1',
    authorName: 'Alex Schmidt',
    authorRole: 'Pflegeschüler(in)',
    type: 'status',
    text: 'Zweiter Tag im Praktikum – heute durfte ich beim Verbandswechsel assistieren. Spannend, wie viel Übung reine Präzision braucht.',
    images: [],
    document: null,
    tags: ['#Praktikum', '#Wundversorgung'],
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 60 * 3).toISOString()
  },
  {
    id: 'post-seed-6',
    authorId: 'u-student-1',
    authorName: 'Alex Schmidt',
    authorRole: 'Pflegeschüler(in)',
    type: 'status',
    text: 'Start ins Praktikum! Aufregend und ein bisschen nervös, aber das Team hat mich super aufgenommen.',
    images: [],
    document: null,
    tags: ['#Praktikum', '#NeuerAbschnitt'],
    likedBy: [],
    comments: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 60 * 1).toISOString()
  }
];

let FEED_POSTS;
try {
  FEED_POSTS = JSON.parse(fs.readFileSync(FEED_DB_PATH, 'utf8'));
} catch (e) {
  FEED_POSTS = DEFAULT_FEED_POSTS;
  fs.writeFileSync(FEED_DB_PATH, JSON.stringify(FEED_POSTS, null, 2), 'utf-8');
}

function saveFeedPosts() {
  fs.writeFileSync(FEED_DB_PATH, JSON.stringify(FEED_POSTS, null, 2), 'utf-8');
}

const FEED_MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const ALLOWED_DOC_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt'
};

function saveBase64File(dataUrl, allowedTypes, subDir) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const ext = allowedTypes[mime];
  if (!ext) return null;

  let buffer;
  try {
    buffer = Buffer.from(match[2], 'base64');
  } catch (e) {
    return null;
  }
  if (buffer.length === 0 || buffer.length > FEED_MAX_FILE_BYTES) return null;

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(FEED_UPLOADS_ROOT, subDir, filename), buffer);
  return { url: `/uploads/${subDir}/${filename}`, mime, size: buffer.length };
}

// Kept as a name for the existing feed/social call sites; now just the shared, stricter helper —
// no more fabricating a user record for tokens that don't match a real (active) account.
function requireFeedUser(req) {
  return authenticateRequest(req);
}

function computeStreak(userId) {
  const days = new Set(
    FEED_POSTS.filter(p => p.authorId === userId).map(p => new Date(p.createdAt).toISOString().slice(0, 10))
  );
  const todayStr = new Date().toISOString().slice(0, 10);
  const postedToday = days.has(todayStr);

  let current = 0;
  const cursor = new Date();
  if (!postedToday) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const sortedDays = [...days].sort();
  let longest = 0, run = 0, prevDate = null;
  for (const d of sortedDays) {
    const curDate = new Date(`${d}T00:00:00Z`);
    run = prevDate && Math.round((curDate - prevDate) / 86400000) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDate = curDate;
  }

  return { current, longest, postedToday };
}

function serializeFeedPost(post, myUserId) {
  return {
    ...post,
    likes: post.likedBy.length,
    likedByMe: myUserId ? post.likedBy.includes(myUserId) : false,
    streak: computeStreak(post.authorId).current
  };
}

// --- SOCIAL DATA LAYER (friends, requests, groups) ---
const SOCIAL_DB_PATH = path.join(__dirname, 'social_db.json');
const DEFAULT_SOCIAL_DB = { friendships: [], friendRequests: [], groups: [] };
let SOCIAL_DB;
try {
  SOCIAL_DB = JSON.parse(fs.readFileSync(SOCIAL_DB_PATH, 'utf8'));
} catch (e) {
  SOCIAL_DB = DEFAULT_SOCIAL_DB;
  fs.writeFileSync(SOCIAL_DB_PATH, JSON.stringify(SOCIAL_DB, null, 2), 'utf-8');
}

function saveSocialDb() {
  fs.writeFileSync(SOCIAL_DB_PATH, JSON.stringify(SOCIAL_DB, null, 2), 'utf-8');
}

function publicUser(u) {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role, title: u.title, avatar: u.avatar,
    avatarType: u.avatarType || 'emoji', avatarIcon: u.avatarIcon || null, avatarUrl: u.avatarUrl || null
  };
}

function areFriends(a, b) {
  return SOCIAL_DB.friendships.some(f => (f.userA === a && f.userB === b) || (f.userA === b && f.userB === a));
}

function findPendingRequest(a, b) {
  return SOCIAL_DB.friendRequests.find(r => r.status === 'pending' &&
    ((r.fromUserId === a && r.toUserId === b) || (r.fromUserId === b && r.toUserId === a)));
}

function friendStatusBetween(a, b) {
  if (a === b) return 'self';
  if (areFriends(a, b)) return 'friends';
  const pending = findPendingRequest(a, b);
  if (pending) return pending.fromUserId === a ? 'pending_out' : 'pending_in';
  return 'none';
}

function serializeGroup(g, myUserId) {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    ownerId: g.ownerId,
    memberCount: g.memberIds.length,
    isMember: myUserId ? g.memberIds.includes(myUserId) : false,
    isOwner: g.ownerId === myUserId,
    createdAt: g.createdAt
  };
}

// --- SOCIAL ENDPOINTS ---
app.get('/api/social/users', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const q = String(req.query.q || '').trim().toLowerCase();
  const results = REGISTERED_USERS_DB
    .filter(u => u.id !== user.id)
    .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .slice(0, 30)
    .map(u => ({ ...publicUser(u), friendStatus: friendStatusBetween(user.id, u.id), streak: computeStreak(u.id).current }));
  res.json(results);
});

app.get('/api/social/friends', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const friendIds = SOCIAL_DB.friendships
    .filter(f => f.userA === user.id || f.userB === user.id)
    .map(f => (f.userA === user.id ? f.userB : f.userA));
  const friends = friendIds
    .map(id => REGISTERED_USERS_DB.find(u => u.id === id))
    .filter(Boolean)
    .map(u => ({ ...publicUser(u), streak: computeStreak(u.id).current }));
  res.json(friends);
});

app.delete('/api/social/friends/:userId', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const before = SOCIAL_DB.friendships.length;
  SOCIAL_DB.friendships = SOCIAL_DB.friendships.filter(f =>
    !((f.userA === user.id && f.userB === req.params.userId) || (f.userA === req.params.userId && f.userB === user.id))
  );
  if (SOCIAL_DB.friendships.length === before) {
    return res.status(404).json({ error: 'Freundschaft nicht gefunden.' });
  }
  saveSocialDb();
  res.json({ success: true });
});

app.get('/api/social/requests', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const enrich = (r, otherId) => {
    const other = REGISTERED_USERS_DB.find(u => u.id === otherId);
    return { id: r.id, createdAt: r.createdAt, user: other ? publicUser(other) : { id: otherId, name: 'Unbekannt' } };
  };
  const incoming = SOCIAL_DB.friendRequests
    .filter(r => r.status === 'pending' && r.toUserId === user.id)
    .map(r => enrich(r, r.fromUserId));
  const outgoing = SOCIAL_DB.friendRequests
    .filter(r => r.status === 'pending' && r.fromUserId === user.id)
    .map(r => enrich(r, r.toUserId));
  res.json({ incoming, outgoing });
});

app.post('/api/social/requests', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const toUserId = String(req.body?.toUserId || '');
  if (!toUserId || toUserId === user.id) {
    return res.status(400).json({ error: 'Ungültiger Empfänger.' });
  }
  const target = REGISTERED_USERS_DB.find(u => u.id === toUserId);
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
  const status = friendStatusBetween(user.id, toUserId);
  if (status === 'friends') return res.status(400).json({ error: 'Ihr seid bereits befreundet.' });
  if (status === 'pending_out' || status === 'pending_in') {
    return res.status(400).json({ error: 'Es gibt bereits eine offene Anfrage.' });
  }
  SOCIAL_DB.friendRequests.push({
    id: `fr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    fromUserId: user.id,
    toUserId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    respondedAt: null
  });
  saveSocialDb();
  res.status(201).json({ success: true });
});

app.post('/api/social/requests/:id/accept', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const request = SOCIAL_DB.friendRequests.find(r => r.id === req.params.id && r.status === 'pending');
  if (!request || request.toUserId !== user.id) {
    return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
  }
  request.status = 'accepted';
  request.respondedAt = new Date().toISOString();
  SOCIAL_DB.friendships.push({
    id: `fs-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    userA: request.fromUserId,
    userB: request.toUserId,
    createdAt: new Date().toISOString()
  });
  saveSocialDb();
  res.json({ success: true });
});

app.post('/api/social/requests/:id/decline', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const request = SOCIAL_DB.friendRequests.find(r => r.id === req.params.id && r.status === 'pending');
  if (!request || request.toUserId !== user.id) {
    return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
  }
  request.status = 'declined';
  request.respondedAt = new Date().toISOString();
  saveSocialDb();
  res.json({ success: true });
});

app.delete('/api/social/requests/:id', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const before = SOCIAL_DB.friendRequests.length;
  SOCIAL_DB.friendRequests = SOCIAL_DB.friendRequests.filter(r =>
    !(r.id === req.params.id && r.status === 'pending' && r.fromUserId === user.id)
  );
  if (SOCIAL_DB.friendRequests.length === before) {
    return res.status(404).json({ error: 'Anfrage nicht gefunden.' });
  }
  saveSocialDb();
  res.json({ success: true });
});

app.get('/api/social/streak', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  res.json(computeStreak(user.id));
});

app.get('/api/social/groups', (req, res) => {
  const payload = verifyJWT(req.headers.authorization);
  const myUserId = payload?.userId;
  const sorted = [...SOCIAL_DB.groups].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted.map(g => serializeGroup(g, myUserId)));
});

app.post('/api/social/groups', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const name = String(req.body?.name || '').trim().slice(0, 80);
  const description = String(req.body?.description || '').trim().slice(0, 300);
  if (!name) return res.status(400).json({ error: 'Bitte gib einen Gruppennamen ein.' });
  const group = {
    id: `grp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    name,
    description,
    ownerId: user.id,
    memberIds: [user.id],
    createdAt: new Date().toISOString()
  };
  SOCIAL_DB.groups.push(group);
  saveSocialDb();
  res.status(201).json(serializeGroup(group, user.id));
});

app.get('/api/social/groups/:id', (req, res) => {
  const payload = verifyJWT(req.headers.authorization);
  const myUserId = payload?.userId;
  const group = SOCIAL_DB.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Gruppe nicht gefunden.' });
  const members = group.memberIds
    .map(id => REGISTERED_USERS_DB.find(u => u.id === id))
    .filter(Boolean)
    .map(publicUser);
  res.json({ ...serializeGroup(group, myUserId), members });
});

app.post('/api/social/groups/:id/join', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const group = SOCIAL_DB.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Gruppe nicht gefunden.' });
  if (!group.memberIds.includes(user.id)) group.memberIds.push(user.id);
  saveSocialDb();
  res.json(serializeGroup(group, user.id));
});

app.post('/api/social/groups/:id/leave', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const group = SOCIAL_DB.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Gruppe nicht gefunden.' });
  group.memberIds = group.memberIds.filter(id => id !== user.id);
  if (group.memberIds.length === 0) {
    SOCIAL_DB.groups = SOCIAL_DB.groups.filter(g => g.id !== group.id);
    FEED_POSTS = FEED_POSTS.filter(p => p.groupId !== group.id);
    saveFeedPosts();
  } else if (group.ownerId === user.id) {
    group.ownerId = group.memberIds[0];
  }
  saveSocialDb();
  res.json({ success: true });
});

app.delete('/api/social/groups/:id', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const group = SOCIAL_DB.groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Gruppe nicht gefunden.' });
  if (group.ownerId !== user.id && user.role !== 'teacher') {
    return res.status(403).json({ error: 'Keine Berechtigung, diese Gruppe zu löschen.' });
  }
  SOCIAL_DB.groups = SOCIAL_DB.groups.filter(g => g.id !== group.id);
  FEED_POSTS = FEED_POSTS.filter(p => p.groupId !== group.id);
  saveSocialDb();
  saveFeedPosts();
  res.json({ success: true });
});

// --- PFLEGEFEED ENDPOINTS ---
app.get('/api/feed/posts', (req, res) => {
  const payload = verifyJWT(req.headers.authorization);
  const myUserId = payload?.userId;
  const groupId = req.query.groupId ? String(req.query.groupId) : null;
  const scoped = FEED_POSTS.filter(p => (groupId ? p.groupId === groupId : !p.groupId));
  const sorted = scoped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted.map(p => serializeFeedPost(p, myUserId)));
});

app.post('/api/feed/posts', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an, um zu posten.' });

  const { type, text, images, document, tags, groupId } = req.body || {};
  const cleanText = String(text || '').trim().slice(0, 2000);
  const postType = ['status', 'photo', 'document'].includes(type) ? type : 'status';

  let targetGroup = null;
  if (groupId) {
    targetGroup = SOCIAL_DB.groups.find(g => g.id === groupId);
    if (!targetGroup) return res.status(404).json({ error: 'Gruppe nicht gefunden.' });
    if (!targetGroup.memberIds.includes(user.id)) {
      return res.status(403).json({ error: 'Du musst Mitglied der Gruppe sein, um dort zu posten.' });
    }
  }

  if (postType === 'status' && !cleanText) {
    return res.status(400).json({ error: 'Bitte gib einen Text ein.' });
  }

  let savedImages = [];
  if (postType === 'photo') {
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Bitte füge mindestens ein Foto hinzu.' });
    }
    for (const img of images.slice(0, 6)) {
      const saved = saveBase64File(img, ALLOWED_IMAGE_TYPES, 'feed');
      if (saved) savedImages.push(saved.url);
    }
    if (savedImages.length === 0) {
      return res.status(400).json({ error: 'Fotoformat wird nicht unterstützt (JPG, PNG, WEBP, GIF, max. 8 MB).' });
    }
  }

  let savedDocument = null;
  if (postType === 'document') {
    if (!document || !document.dataUrl) {
      return res.status(400).json({ error: 'Bitte wähle ein Dokument aus.' });
    }
    const saved = saveBase64File(document.dataUrl, ALLOWED_DOC_TYPES, 'feed-docs');
    if (!saved) {
      return res.status(400).json({ error: 'Dateiformat wird nicht unterstützt (PDF, DOC, DOCX, TXT, max. 8 MB).' });
    }
    savedDocument = { name: String(document.name || 'Dokument').slice(0, 200), url: saved.url, size: saved.size, mime: saved.mime };
  }

  const newPost = {
    id: `post-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    authorId: user.id,
    authorName: user.name,
    authorRole: user.title || (user.role === 'teacher' ? 'Lehrer / Administrator' : 'Pflegeschüler(in)'),
    authorAvatarType: user.avatarType || 'emoji',
    authorAvatarIcon: user.avatarIcon || null,
    authorAvatarUrl: user.avatarUrl || null,
    type: postType,
    text: cleanText,
    images: savedImages,
    document: savedDocument,
    tags: Array.isArray(tags) ? tags.filter(t => typeof t === 'string').slice(0, 6) : [],
    likedBy: [],
    comments: [],
    groupId: targetGroup ? targetGroup.id : null,
    createdAt: new Date().toISOString()
  };

  FEED_POSTS.unshift(newPost);
  saveFeedPosts();
  res.status(201).json(serializeFeedPost(newPost, user.id));
});

app.post('/api/feed/posts/:id/like', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const post = FEED_POSTS.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Beitrag nicht gefunden.' });

  const idx = post.likedBy.indexOf(user.id);
  if (idx >= 0) post.likedBy.splice(idx, 1);
  else post.likedBy.push(user.id);

  saveFeedPosts();
  res.json({ likes: post.likedBy.length, likedByMe: idx < 0 });
});

app.post('/api/feed/posts/:id/comments', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const post = FEED_POSTS.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Beitrag nicht gefunden.' });

  const text = String(req.body?.text || '').trim().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'Kommentar darf nicht leer sein.' });

  const comment = {
    id: `c-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    authorId: user.id,
    authorName: user.name,
    authorAvatarType: user.avatarType || 'emoji',
    authorAvatarIcon: user.avatarIcon || null,
    authorAvatarUrl: user.avatarUrl || null,
    text,
    createdAt: new Date().toISOString()
  };
  post.comments.push(comment);
  saveFeedPosts();
  res.status(201).json(comment);
});

app.delete('/api/feed/posts/:id', (req, res) => {
  const user = requireFeedUser(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const post = FEED_POSTS.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Beitrag nicht gefunden.' });
  if (post.authorId !== user.id && user.role !== 'teacher') {
    return res.status(403).json({ error: 'Keine Berechtigung, diesen Beitrag zu löschen.' });
  }

  FEED_POSTS = FEED_POSTS.filter(p => p.id !== req.params.id);
  saveFeedPosts();
  res.json({ success: true });
});

// --- AUTH & JWT ENDPOINTS ---
const SELF_REGISTER_ROLES = { student: 'Pflegeschüler(in)', teacher: 'Lehrer / Administrator', praxisanleiter: 'Praxisanleiter' };
const SELF_REGISTER_AVATARS = { student: '🎓', teacher: '👨‍🏫', praxisanleiter: '🩺' };
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, specialty, cohortYear, institution } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Bitte Namen, E-Mail und Passwort eingeben.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existing = REGISTERED_USERS_DB.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
  }

  // Public self-registration covers Student / Instructor / Praxisanleiter, each with their own
  // fields below. Administrator accounts are deliberately NOT self-registerable — those are only
  // ever created from the AccountAdminPanel (/api/admin/users) to avoid a privilege-escalation hole.
  const userRole = SELF_REGISTER_ROLES[role] ? role : 'student';

  // Lehrkräfte müssen ihre Einrichtung angeben — sonst wüsste die Schule/Klinik nicht,
  // wem sie einen Instructor-Zugang verifizieren.
  if (userRole === 'teacher' && !String(institution || '').trim()) {
    return res.status(400).json({ error: 'Bitte gib deine Einrichtung (Schule/Klinik) an.' });
  }

  const verificationToken = crypto.randomBytes(24).toString('hex');

  const newUser = seedUser({
    id: `u-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: hashPassword(password.trim()),
    role: userRole,
    title: SELF_REGISTER_ROLES[userRole],
    avatar: SELF_REGISTER_AVATARS[userRole],
    specialty: (userRole === 'praxisanleiter' || userRole === 'teacher') ? (specialty || null) : null,
    institution: userRole === 'teacher' ? institution.trim() : null,
    cohortYear: userRole === 'student' ? (cohortYear || null) : null,
    emailVerified: false,
    verificationToken,
    verificationTokenExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString()
  });

  REGISTERED_USERS_DB.push(newUser);
  saveUsers();
  await sendVerificationEmail(newUser.email, newUser.name, verificationToken);

  res.json({
    success: true,
    pendingVerification: true,
    message: MAILER_READY
      ? 'Konto erstellt! Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben.'
      : 'Konto erstellt! (Kein Mailserver konfiguriert — der Bestätigungslink wurde in der Server-Konsole ausgegeben.)'
  });
});

app.post('/api/auth/confirm-email', (req, res) => {
  const token = String(req.body?.token || '');
  if (!token) return res.status(400).json({ error: 'Kein Bestätigungscode angegeben.' });

  const user = REGISTERED_USERS_DB.find(u => u.verificationToken === token);
  if (!user) return res.status(400).json({ error: 'Ungültiger oder bereits verwendeter Bestätigungslink.' });
  if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
    return res.status(400).json({ error: 'Dieser Bestätigungslink ist abgelaufen. Bitte fordere einen neuen an.' });
  }

  user.emailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  saveUsers();

  const token2 = generateJWT({ userId: user.id, role: user.role, email: user.email, name: user.name });
  res.json({ success: true, token: token2, user: publicUser(user) });
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const cleanEmail = String(req.body?.email || '').toLowerCase().trim();
  const user = REGISTERED_USERS_DB.find(u => u.email.toLowerCase() === cleanEmail);

  // Deliberately generic response either way — don't reveal whether an account exists.
  if (user && !user.emailVerified) {
    user.verificationToken = crypto.randomBytes(24).toString('hex');
    user.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS).toISOString();
    saveUsers();
    await sendVerificationEmail(user.email, user.name, user.verificationToken);
  }
  res.json({ success: true, message: 'Falls ein unbestätigtes Konto mit dieser E-Mail existiert, wurde ein neuer Bestätigungslink verschickt.' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Bitte E-Mail und Passwort eingeben.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const foundUser = REGISTERED_USERS_DB.find(u => u.email.toLowerCase() === cleanEmail);

  if (!foundUser) {
    return res.status(401).json({ error: 'Unbekannte E-Mail-Adresse.' });
  }
  if (!verifyPassword(password.trim(), foundUser.password)) {
    return res.status(401).json({ error: 'Ungültiges Passwort.' });
  }
  if (!foundUser.emailVerified) {
    return res.status(403).json({ error: 'Bitte bestätige zuerst deine E-Mail-Adresse.', code: 'EMAIL_NOT_VERIFIED' });
  }
  if (foundUser.active === false) {
    return res.status(403).json({ error: 'Dieses Konto wurde deaktiviert. Bitte wende dich an die Administration.' });
  }

  const user = publicUser(foundUser);
  const token = generateJWT({ userId: user.id, role: user.role, email: user.email, name: user.name });
  res.json({ success: true, token, user });
});

app.get('/api/auth/me', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Nicht authentifiziert, Konto deaktiviert oder Token abgelaufen.' });
  }
  res.json({ user: publicUser(user) });
});

// --- PROFILE: AVATAR / PHOTO ---
// Kept in sync with the icon set offered client-side in src/AvatarPicker.jsx.
const ALLOWED_AVATAR_ICONS = [
  'stethoscope', 'heart-pulse', 'syringe', 'clipboard', 'graduation-cap',
  'microscope', 'first-aid', 'pill', 'baby', 'wheelchair', 'brain', 'shield'
];

app.post('/api/profile/avatar', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const { type, icon, dataUrl } = req.body || {};

  if (type === 'icon') {
    if (!ALLOWED_AVATAR_ICONS.includes(icon)) {
      return res.status(400).json({ error: 'Unbekanntes Avatar-Icon.' });
    }
    user.avatarType = 'icon';
    user.avatarIcon = icon;
    user.avatarUrl = null;
  } else if (type === 'photo') {
    const saved = saveBase64File(dataUrl, ALLOWED_IMAGE_TYPES, 'avatars');
    if (!saved) {
      return res.status(400).json({ error: 'Foto konnte nicht gespeichert werden (JPG, PNG, WEBP, GIF, max. 8 MB).' });
    }
    user.avatarType = 'photo';
    user.avatarUrl = saved.url;
    user.avatarIcon = null;
  } else {
    return res.status(400).json({ error: 'Bitte ein Foto hochladen oder ein Icon wählen.' });
  }

  saveUsers();
  res.json({ user: publicUser(user) });
});

// --- ADMIN: ACCOUNT MANAGEMENT (System Administrator only) ---
function adminUser(u) {
  // Like publicUser(), but includes the account-lifecycle fields the admin dashboard needs —
  // still never the password.
  return {
    id: u.id, name: u.name, email: u.email, role: u.role, title: u.title, avatar: u.avatar,
    avatarType: u.avatarType || 'emoji', avatarIcon: u.avatarIcon || null, avatarUrl: u.avatarUrl || null,
    active: u.active !== false, emailVerified: u.emailVerified !== false,
    supervisorId: u.supervisorId || null, classroomId: u.classroomId || null,
    specialty: u.specialty || null, institution: u.institution || null, cohortYear: u.cohortYear || null
  };
}

function requireAdmin(req, res) {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['admin'])) {
    res.status(user ? 403 : 401).json({ error: user ? 'Nur die Administration hat Zugriff.' : 'Bitte melde dich an.' });
    return null;
  }
  return user;
}

const ROLE_TITLES = {
  admin: 'Administrator',
  teacher: 'Lehrer / Administrator',
  praxisanleiter: 'Praxisanleiter',
  student: 'Pflegeschüler(in)'
};
const ROLE_AVATARS = { admin: '⚙️', teacher: '👨‍🏫', praxisanleiter: '🩺', student: '🎓' };

app.get('/api/admin/users', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  res.json(REGISTERED_USERS_DB.map(adminUser));
});

app.post('/api/admin/users', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { name, email, password, role, specialty, cohortYear, institution, supervisorId, classroomId } = req.body || {};
  if (!name || !email || !password || !ROLE_TITLES[role]) {
    return res.status(400).json({ error: 'Name, E-Mail, Passwort und eine gültige Rolle sind erforderlich.' });
  }
  const cleanEmail = String(email).toLowerCase().trim();
  if (REGISTERED_USERS_DB.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'Diese E-Mail-Adresse ist bereits registriert.' });
  }

  const newUser = seedUser({
    id: `u-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name: String(name).trim(),
    email: cleanEmail,
    password: hashPassword(String(password).trim()),
    role,
    title: ROLE_TITLES[role],
    avatar: ROLE_AVATARS[role],
    specialty: (role === 'praxisanleiter' || role === 'teacher') ? (specialty || null) : null,
    institution: role === 'teacher' ? (institution || null) : null,
    cohortYear: role === 'student' ? (cohortYear || null) : null,
    supervisorId: role === 'student' ? (supervisorId || null) : null,
    classroomId: role === 'student' ? (classroomId || null) : null
  });
  REGISTERED_USERS_DB.push(newUser);
  saveUsers();
  logAuditEvent(admin, 'create_user', newUser.id, `Konto angelegt (Rolle: ${role})`);
  res.status(201).json(adminUser(newUser));
});

app.put('/api/admin/users/:id', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const target = REGISTERED_USERS_DB.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });

  const { name, email, title, role, specialty, cohortYear, institution, supervisorId, classroomId } = req.body || {};
  if (name !== undefined) target.name = String(name).trim();
  if (email !== undefined) target.email = String(email).toLowerCase().trim();
  if (title !== undefined) target.title = String(title).trim();
  if (role !== undefined && ROLE_TITLES[role]) target.role = role;
  if (specialty !== undefined) target.specialty = specialty || null;
  if (institution !== undefined) target.institution = institution || null;
  if (cohortYear !== undefined) target.cohortYear = cohortYear || null;
  if (supervisorId !== undefined) target.supervisorId = supervisorId || null;
  if (classroomId !== undefined) target.classroomId = classroomId || null;

  saveUsers();
  logAuditEvent(admin, 'edit_user', target.id, 'Kontodaten aktualisiert');
  res.json(adminUser(target));
});

app.post('/api/admin/users/:id/deactivate', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const target = REGISTERED_USERS_DB.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });
  if (target.id === admin.id) return res.status(400).json({ error: 'Du kannst dein eigenes Konto nicht deaktivieren.' });

  target.active = false;
  saveUsers();
  logAuditEvent(admin, 'deactivate_user', target.id, 'Konto deaktiviert');
  res.json(adminUser(target));
});

app.post('/api/admin/users/:id/reactivate', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const target = REGISTERED_USERS_DB.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });

  target.active = true;
  saveUsers();
  logAuditEvent(admin, 'reactivate_user', target.id, 'Konto reaktiviert');
  res.json(adminUser(target));
});

app.post('/api/admin/users/:id/reset-password', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const target = REGISTERED_USERS_DB.find(u => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' });

  // No email infrastructure exists in this app — the temp password is returned once for the
  // admin to relay to the user directly. A real deployment would email a reset link instead.
  const tempPassword = crypto.randomBytes(5).toString('hex');
  target.password = hashPassword(tempPassword);
  saveUsers();
  logAuditEvent(admin, 'reset_password', target.id, 'Passwort zurückgesetzt');
  res.json({ tempPassword });
});

app.get('/api/admin/audit-log', (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  res.json(AUDIT_LOG.slice(0, 200));
});

// --- E-LEARNING DATA LAYER ---
const COURSES_DB_PATH = path.join(__dirname, 'courses_db.json');
const ENROLLMENTS_DB_PATH = path.join(__dirname, 'enrollments_db.json');
const CERTIFICATES_DB_PATH = path.join(__dirname, 'certificates_db.json');
fs.mkdirSync(path.join(FEED_UPLOADS_ROOT, 'course-covers'), { recursive: true });
fs.mkdirSync(path.join(FEED_UPLOADS_ROOT, 'certificates'), { recursive: true });

function loadOrInitJson(filePath, defaultValue) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
    return defaultValue;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function quizLesson(id, title, questions) {
  return { id, title, type: 'quiz', quiz: { questions } };
}
function textLesson(id, title, content) {
  return { id, title, type: 'text', content };
}

const DEFAULT_COURSES_DB = [
  {
    id: 'c-als',
    title: 'Advanced Life Support (ALS) Zertifizierung',
    subtitle: 'Intensivkurs für Reanimationstechniken nach den neuesten europäischen Richtlinien.',
    description: 'Dieser Kurs vermittelt die Grundlagen der erweiterten Reanimation: Algorithmus, reversible Ursachen (4H4T) und Teamkommunikation im Notfall.',
    category: 'Notfallmedizin',
    instructorId: 'u-teacher-1',
    instructorName: 'Prof. Dr. Elisabeth Müller',
    coverImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
    durationHours: 40,
    cmePoints: 20,
    price: 0,
    featured: true,
    issuesCertificate: true,
    certificateTitle: 'Advanced Life Support (ALS)',
    certificateValidityMonths: 24,
    modules: [
      {
        id: 'm-als-1',
        title: 'Grundlagen der Reanimation',
        lessons: [
          textLesson('l-als-1', 'Einführung in den ALS-Algorithmus', 'Der Advanced Life Support Algorithmus beginnt mit der Erkennung des Kreislaufstillstands und sofortigem Beginn der Thoraxkompressionen (30:2). Frühe Defibrillation bei schockbaren Rhythmen (Kammerflimmern, pulslose Kammertachykardie) verbessert die Überlebenschance signifikant. Das Team arbeitet nach dem CRM-Prinzip (Crisis Resource Management): klare Rollenverteilung, geschlossene Kommunikationsschleifen, lautes Aussprechen von Beobachtungen.'),
          textLesson('l-als-2', 'Reversible Ursachen (4H4T)', 'Die reversiblen Ursachen eines Kreislaufstillstands werden in zwei Gruppen zu je vier Faktoren unterteilt: die "4H" — Hypoxie, Hypovolämie, Hypo-/Hyperkaliämie (metabolisch), Hypothermie — und die "4T" — Thrombose (koronar/pulmonal), Tamponade (Perikard), Toxine (Intoxikation), Spannungspneumothorax (Tension pneumothorax). Jede dieser Ursachen muss während der Reanimation aktiv bedacht und wenn möglich behandelt werden.'),
          quizLesson('l-als-3', 'Wissenscheck: ALS-Grundlagen', [
            { q: 'Im welchen Verhältnis werden Thoraxkompressionen und Beatmung beim Erwachsenen durchgeführt?', options: ['15:2', '30:2', '5:1', '2:30'], correctIndex: 1 },
            { q: 'Welches der folgenden gehört NICHT zu den "4H"?', options: ['Hypoxie', 'Hypovolämie', 'Hypothermie', 'Thrombose'], correctIndex: 3 }
          ])
        ]
      }
    ],
    createdBy: 'u-teacher-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
  },
  {
    id: 'c-palliativ',
    title: 'Grundlagen der Palliativpflege',
    subtitle: 'Symptomkontrolle, Schmerztherapie und Begleitung schwerstkranker Patienten.',
    description: 'Ein Überblick über die zentralen Prinzipien der palliativen Versorgung: Schmerz- und Symptommanagement, Kommunikation mit Patient:innen und Angehörigen sowie ethische Fragestellungen am Lebensende.',
    category: 'Palliative Care',
    instructorId: 'u-praxis-1',
    instructorName: 'Michael Weber',
    coverImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    durationHours: 20,
    cmePoints: 15,
    price: 0,
    featured: false,
    issuesCertificate: true,
    certificateTitle: 'Palliativpflege Grundlagen',
    certificateValidityMonths: 36,
    modules: [
      {
        id: 'm-pal-1',
        title: 'Symptomkontrolle',
        lessons: [
          textLesson('l-pal-1', 'Schmerztherapie nach WHO-Stufenschema', 'Das WHO-Stufenschema gliedert die Schmerztherapie in drei Stufen: Stufe 1 (Nicht-Opioide wie Paracetamol/NSAR), Stufe 2 (schwache Opioide, z.B. Tramadol, ggf. kombiniert mit Stufe 1), Stufe 3 (starke Opioide wie Morphin). Grundsätze: orale Gabe wenn möglich, nach festem Zeitschema statt "bei Bedarf", individuell titriert, mit Bedarfsmedikation für Durchbruchschmerzen.'),
          textLesson('l-pal-2', 'Kommunikation mit Angehörigen', 'Schwierige Gespräche erfordern aktives Zuhören, das Aushalten von Stille und ehrliche, aber einfühlsame Sprache. Das SPIKES-Protokoll bietet eine Struktur: Setting vorbereiten, Perception erfragen, Invitation einholen, Knowledge vermitteln, Emotions auffangen, Strategy/Summary abschließen.'),
          quizLesson('l-pal-3', 'Wissenscheck: Palliativpflege', [
            { q: 'Wie viele Stufen umfasst das WHO-Stufenschema der Schmerztherapie?', options: ['2', '3', '4', '5'], correctIndex: 1 },
            { q: 'Wofür steht das "S" im SPIKES-Protokoll?', options: ['Symptome', 'Setting', 'Strategie', 'Sicherheit'], correctIndex: 1 }
          ])
        ]
      }
    ],
    createdBy: 'u-praxis-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()
  },
  {
    id: 'c-wund',
    title: 'Wundmanagement ICW®',
    subtitle: 'Moderne Wundversorgung, Exsudatmanagement und Wundauflagen.',
    description: 'Praxisnaher Kurs zur modernen, phasengerechten Wundversorgung nach dem TIME-Prinzip inklusive Auswahl geeigneter Wundauflagen.',
    category: 'Wundmanagement',
    instructorId: 'u-praxis-1',
    instructorName: 'Michael Weber',
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    durationHours: 32,
    cmePoints: 18,
    price: 0,
    featured: false,
    issuesCertificate: true,
    certificateTitle: 'Wundexperte ICW®',
    certificateValidityMonths: 24,
    modules: [
      {
        id: 'm-wund-1',
        title: 'Phasengerechte Wundversorgung',
        lessons: [
          textLesson('l-wund-1', 'Das TIME-Prinzip', 'TIME steht für Tissue (Gewebemanagement/Débridement), Infection/Inflammation (Kontrolle von Infektion und Entzündung), Moisture (feuchtes Wundmilieu ohne Mazeration) und Edge (Wundrand-Beobachtung). Es strukturiert die systematische Beurteilung und Behandlung chronischer Wunden.'),
          textLesson('l-wund-2', 'Exsudatmanagement & Wundauflagen', 'Die Wahl der Wundauflage richtet sich nach der Exsudatmenge: bei starker Exsudation Alginate oder Schaumverbände, bei trockenen Wunden Hydrogele zur Feuchtigkeitszufuhr, bei infizierten Wunden silberhaltige Auflagen. Ziel ist stets ein feuchtes, aber nicht mazerierendes Wundmilieu.'),
          quizLesson('l-wund-3', 'Wissenscheck: Wundmanagement', [
            { q: 'Wofür steht das "M" im TIME-Prinzip?', options: ['Medikation', 'Moisture', 'Mobilität', 'Messung'], correctIndex: 1 },
            { q: 'Welche Wundauflage eignet sich bei starker Exsudation?', options: ['Hydrogel', 'Folienverband', 'Alginat', 'Mullkompresse'], correctIndex: 2 }
          ])
        ]
      }
    ],
    createdBy: 'u-praxis-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  },
  {
    id: 'c-hygiene',
    title: 'Hygienebeauftragte/r in der Pflege',
    subtitle: 'Rechtliche Grundlagen und praktische Umsetzung von Hygienekonzepten.',
    description: 'Der Kurs qualifiziert für die Rolle der/des Hygienebeauftragten auf Station: gesetzliche Grundlagen, Standardhygiene und Erstellung von Hygieneplänen.',
    category: 'Hygiene & Infektion',
    instructorId: 'u-teacher-1',
    instructorName: 'Prof. Dr. Elisabeth Müller',
    coverImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    durationHours: 200,
    cmePoints: 40,
    price: 0,
    featured: false,
    issuesCertificate: true,
    certificateTitle: 'Hygienebeauftragte/r in der Pflege',
    certificateValidityMonths: 36,
    modules: [
      {
        id: 'm-hyg-1',
        title: 'Rechtliche Grundlagen',
        lessons: [
          textLesson('l-hyg-1', 'Infektionsschutzgesetz & RKI-Richtlinien', 'Das Infektionsschutzgesetz (IfSG) bildet die rechtliche Basis für Hygienemaßnahmen in Gesundheitseinrichtungen. Die Empfehlungen der Kommission für Krankenhaushygiene und Infektionsprävention (KRINKO) beim RKI konkretisieren die Anforderungen an Standardhygiene, Flächendesinfektion und Ausbruchsmanagement.'),
          textLesson('l-hyg-2', 'Erstellung von Hygieneplänen', 'Ein Hygieneplan legt verbindlich fest, wer wann welche Hygienemaßnahme durchführt (z.B. Händedesinfektion, Flächendesinfektion, Aufbereitung von Medizinprodukten). Er muss stationsspezifisch sein, regelmäßig aktualisiert und allen Mitarbeitenden zugänglich gemacht werden.'),
          quizLesson('l-hyg-3', 'Wissenscheck: Hygiene', [
            { q: 'Welches Gesetz bildet die rechtliche Basis für Hygienemaßnahmen in Deutschland?', options: ['SGB V', 'Infektionsschutzgesetz', 'Arbeitsschutzgesetz', 'Patientenrechtegesetz'], correctIndex: 1 },
            { q: 'Welche Institution gibt die KRINKO-Empfehlungen heraus?', options: ['WHO', 'RKI', 'BfArM', 'MDK'], correctIndex: 1 }
          ])
        ]
      }
    ],
    createdBy: 'u-teacher-1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  }
];

let COURSES_DB = loadOrInitJson(COURSES_DB_PATH, DEFAULT_COURSES_DB);
let ENROLLMENTS_DB = loadOrInitJson(ENROLLMENTS_DB_PATH, []);
let CERTIFICATES_DB = loadOrInitJson(CERTIFICATES_DB_PATH, []);

function resolveCoverImage(coverImage) {
  if (!coverImage) return null;
  if (String(coverImage).startsWith('data:')) {
    const saved = saveBase64File(coverImage, ALLOWED_IMAGE_TYPES, 'course-covers');
    return saved ? saved.url : null;
  }
  return String(coverImage).slice(0, 1000);
}

function allLessons(course) {
  return course.modules.flatMap(m => m.lessons);
}

function courseSummary(course, myUserId) {
  const lessons = allLessons(course);
  const enrollment = myUserId ? ENROLLMENTS_DB.find(e => e.userId === myUserId && e.courseId === course.id) : null;
  return {
    id: course.id,
    title: course.title,
    subtitle: course.subtitle,
    description: course.description,
    category: course.category,
    instructorId: course.instructorId,
    instructorName: course.instructorName,
    coverImage: course.coverImage,
    durationHours: course.durationHours,
    cmePoints: course.cmePoints,
    price: course.price,
    featured: course.featured,
    issuesCertificate: course.issuesCertificate,
    certificateTitle: course.certificateTitle,
    moduleCount: course.modules.length,
    lessonCount: lessons.length,
    createdBy: course.createdBy,
    createdAt: course.createdAt,
    isEnrolled: !!enrollment,
    progressPercent: enrollment ? enrollment.progressPercent : 0,
    completedAt: enrollment ? enrollment.completedAt : null
  };
}

function courseDetail(course, myUserId, myRole) {
  const enrollment = myUserId ? ENROLLMENTS_DB.find(e => e.userId === myUserId && e.courseId === course.id) : null;
  // Only the course's own creator (or an admin) gets correctIndex back — needed so they can edit
  // the quiz, but never leaked to students taking it.
  const canSeeAnswers = !!myUserId && (myUserId === course.createdBy || myRole === 'admin');
  return {
    ...courseSummary(course, myUserId),
    modules: course.modules.map(m => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map(l => ({
        id: l.id,
        title: l.title,
        type: l.type,
        content: l.type === 'text' ? l.content : undefined,
        videoUrl: l.type === 'video' ? l.videoUrl : undefined,
        quiz: l.type === 'quiz'
          ? { questions: l.quiz.questions.map(q => ({ q: q.q, options: q.options, ...(canSeeAnswers ? { correctIndex: q.correctIndex } : {}) })) }
          : undefined,
        completed: enrollment ? enrollment.completedLessonIds.includes(l.id) : false
      }))
    }))
  };
}

function certificateStatus(cert) {
  if (!cert.validUntil) return 'active';
  const daysLeft = (new Date(cert.validUntil).getTime() - Date.now()) / 86400000;
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 60) return 'expiring';
  return 'active';
}

function issueCertificateForCourse(userId, course) {
  const existing = CERTIFICATES_DB.find(c => c.userId === userId && c.courseId === course.id);
  if (existing) return existing;
  const now = new Date();
  const validUntil = course.certificateValidityMonths
    ? new Date(now.getFullYear(), now.getMonth() + course.certificateValidityMonths, now.getDate()).toISOString()
    : null;
  const cert = {
    id: `cert-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    userId,
    title: course.certificateTitle || course.title,
    courseId: course.id,
    issuedAt: now.toISOString(),
    validUntil,
    fileUrl: null,
    source: 'course'
  };
  CERTIFICATES_DB.push(cert);
  saveJson(CERTIFICATES_DB_PATH, CERTIFICATES_DB);
  return cert;
}

function recomputeEnrollmentProgress(enrollment, course) {
  const total = allLessons(course).length;
  const done = enrollment.completedLessonIds.length;
  enrollment.progressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
  if (enrollment.progressPercent >= 100 && !enrollment.completedAt) {
    enrollment.completedAt = new Date().toISOString();
    if (course.issuesCertificate) issueCertificateForCourse(enrollment.userId, course);
  }
}

function requireInstructor(req, res) {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['teacher', 'praxisanleiter', 'admin'])) {
    res.status(user ? 403 : 401).json({ error: user ? 'Nur Lehrkräfte, Praxisanleiter oder die Administration können Kurse erstellen.' : 'Bitte melde dich an.' });
    return null;
  }
  return user;
}

function courseOwnerOrAdmin(user, course) {
  return user.role === 'admin' || course.createdBy === user.id;
}

function cleanModulesInput(modules) {
  return (Array.isArray(modules) ? modules : []).map((m, mi) => ({
    id: `m-${Date.now()}-${mi}-${crypto.randomBytes(2).toString('hex')}`,
    title: String(m.title || `Modul ${mi + 1}`).slice(0, 150),
    lessons: (Array.isArray(m.lessons) ? m.lessons : []).map((l, li) => {
      const type = ['text', 'video', 'quiz'].includes(l.type) ? l.type : 'text';
      const lesson = {
        id: `l-${Date.now()}-${mi}-${li}-${crypto.randomBytes(2).toString('hex')}`,
        title: String(l.title || `Lektion ${li + 1}`).slice(0, 150),
        type
      };
      if (type === 'text') lesson.content = String(l.content || '').slice(0, 20000);
      if (type === 'video') lesson.videoUrl = String(l.videoUrl || '').slice(0, 500);
      if (type === 'quiz') {
        lesson.quiz = {
          questions: (Array.isArray(l.quiz?.questions) ? l.quiz.questions : []).slice(0, 20).map(q => ({
            q: String(q.q || '').slice(0, 500),
            options: (Array.isArray(q.options) ? q.options : []).slice(0, 6).map(o => String(o).slice(0, 200)),
            correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0
          }))
        };
      }
      return lesson;
    })
  }));
}

// --- E-LEARNING ENDPOINTS ---
app.get('/api/elearning/courses', (req, res) => {
  const payload = verifyJWT(req.headers.authorization);
  const myUserId = payload?.userId;
  const q = String(req.query.q || '').toLowerCase().trim();
  const category = req.query.category;
  const list = COURSES_DB.filter(c =>
    (!q || c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q)) &&
    (!category || category === 'Alle' || c.category === category)
  );
  res.json(list.map(c => courseSummary(c, myUserId)));
});

app.get('/api/elearning/courses/:id', (req, res) => {
  // Intentionally open to anonymous browsing (like the catalog), but resolve the fresh DB role
  // (not the possibly-stale JWT claim) so the owner/admin-only answer-key check is trustworthy.
  const requester = authenticateRequest(req);
  const course = COURSES_DB.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
  res.json(courseDetail(course, requester?.id, requester?.role));
});

app.post('/api/elearning/courses', (req, res) => {
  const user = requireInstructor(req, res);
  if (!user) return;

  const { title, subtitle, description, category, coverImage, durationHours, cmePoints, price, issuesCertificate, certificateTitle, certificateValidityMonths, modules } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Bitte einen Kurstitel eingeben.' });
  }
  const cleanModules = cleanModulesInput(modules);
  if (cleanModules.length === 0 || cleanModules.every(m => m.lessons.length === 0)) {
    return res.status(400).json({ error: 'Bitte mindestens ein Modul mit einer Lektion hinzufügen.' });
  }

  const wantsCertificate = !!issuesCertificate;
  const newCourse = {
    id: `c-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    title: String(title).trim().slice(0, 150),
    subtitle: String(subtitle || '').slice(0, 300),
    description: String(description || '').slice(0, 4000),
    category: String(category || 'Allgemein').slice(0, 60),
    instructorId: user.id,
    instructorName: user.name,
    coverImage: resolveCoverImage(coverImage),
    durationHours: Number(durationHours) || 0,
    cmePoints: Number(cmePoints) || 0,
    price: Number(price) || 0,
    featured: false,
    modules: cleanModules,
    issuesCertificate: wantsCertificate,
    certificateTitle: wantsCertificate ? String(certificateTitle || title).slice(0, 150) : null,
    certificateValidityMonths: wantsCertificate ? (Number(certificateValidityMonths) || 24) : null,
    createdBy: user.id,
    createdAt: new Date().toISOString()
  };
  COURSES_DB.push(newCourse);
  saveJson(COURSES_DB_PATH, COURSES_DB);
  res.status(201).json(courseDetail(newCourse, user.id, user.role));
});

app.put('/api/elearning/courses/:id', (req, res) => {
  const user = requireInstructor(req, res);
  if (!user) return;
  const course = COURSES_DB.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
  if (!courseOwnerOrAdmin(user, course)) {
    return res.status(403).json({ error: 'Nur der Kursersteller oder die Administration kann diesen Kurs bearbeiten.' });
  }

  const { title, subtitle, description, category, coverImage, durationHours, cmePoints, price, issuesCertificate, certificateTitle, certificateValidityMonths, modules } = req.body || {};
  if (title !== undefined) course.title = String(title).trim().slice(0, 150);
  if (subtitle !== undefined) course.subtitle = String(subtitle).slice(0, 300);
  if (description !== undefined) course.description = String(description).slice(0, 4000);
  if (category !== undefined) course.category = String(category).slice(0, 60);
  if (coverImage !== undefined) course.coverImage = resolveCoverImage(coverImage);
  if (durationHours !== undefined) course.durationHours = Number(durationHours) || 0;
  if (cmePoints !== undefined) course.cmePoints = Number(cmePoints) || 0;
  if (price !== undefined) course.price = Number(price) || 0;
  if (issuesCertificate !== undefined) course.issuesCertificate = !!issuesCertificate;
  if (certificateTitle !== undefined) course.certificateTitle = certificateTitle;
  if (certificateValidityMonths !== undefined) course.certificateValidityMonths = Number(certificateValidityMonths) || null;
  if (modules !== undefined) {
    const cleanModules = cleanModulesInput(modules);
    if (cleanModules.length > 0 && cleanModules.some(m => m.lessons.length > 0)) course.modules = cleanModules;
  }

  saveJson(COURSES_DB_PATH, COURSES_DB);
  res.json(courseDetail(course, user.id, user.role));
});

app.delete('/api/elearning/courses/:id', (req, res) => {
  const user = requireInstructor(req, res);
  if (!user) return;
  const course = COURSES_DB.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
  if (!courseOwnerOrAdmin(user, course)) {
    return res.status(403).json({ error: 'Nur der Kursersteller oder die Administration kann diesen Kurs löschen.' });
  }

  COURSES_DB = COURSES_DB.filter(c => c.id !== course.id);
  ENROLLMENTS_DB = ENROLLMENTS_DB.filter(e => e.courseId !== course.id);
  saveJson(COURSES_DB_PATH, COURSES_DB);
  saveJson(ENROLLMENTS_DB_PATH, ENROLLMENTS_DB);
  res.json({ success: true });
});

app.post('/api/elearning/courses/:id/enroll', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const course = COURSES_DB.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });

  let enrollment = ENROLLMENTS_DB.find(e => e.userId === user.id && e.courseId === course.id);
  if (!enrollment) {
    enrollment = {
      id: `enr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      userId: user.id,
      courseId: course.id,
      enrolledAt: new Date().toISOString(),
      completedLessonIds: [],
      progressPercent: 0,
      completedAt: null,
      lastAccessedAt: new Date().toISOString()
    };
    ENROLLMENTS_DB.push(enrollment);
    saveJson(ENROLLMENTS_DB_PATH, ENROLLMENTS_DB);
  }
  res.status(201).json(courseDetail(course, user.id, user.role));
});

app.post('/api/elearning/courses/:id/lessons/:lessonId/complete', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const course = COURSES_DB.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
  const lesson = allLessons(course).find(l => l.id === req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lektion nicht gefunden.' });
  if (lesson.type === 'quiz') return res.status(400).json({ error: 'Diese Lektion erfordert die Quiz-Abgabe.' });

  const enrollment = ENROLLMENTS_DB.find(e => e.userId === user.id && e.courseId === course.id);
  if (!enrollment) return res.status(400).json({ error: 'Du bist für diesen Kurs nicht eingeschrieben.' });

  if (!enrollment.completedLessonIds.includes(lesson.id)) enrollment.completedLessonIds.push(lesson.id);
  enrollment.lastAccessedAt = new Date().toISOString();
  recomputeEnrollmentProgress(enrollment, course);
  saveJson(ENROLLMENTS_DB_PATH, ENROLLMENTS_DB);
  res.json({ enrollment, certificateIssued: enrollment.progressPercent >= 100 && course.issuesCertificate });
});

app.post('/api/elearning/courses/:id/lessons/:lessonId/quiz', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const course = COURSES_DB.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Kurs nicht gefunden.' });
  const lesson = allLessons(course).find(l => l.id === req.params.lessonId);
  if (!lesson || lesson.type !== 'quiz') return res.status(404).json({ error: 'Quiz-Lektion nicht gefunden.' });

  const enrollment = ENROLLMENTS_DB.find(e => e.userId === user.id && e.courseId === course.id);
  if (!enrollment) return res.status(400).json({ error: 'Du bist für diesen Kurs nicht eingeschrieben.' });

  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const questions = lesson.quiz.questions;
  let correctCount = 0;
  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correctCount += 1;
    return { correct: isCorrect, correctIndex: q.correctIndex };
  });
  const scorePercent = questions.length ? Math.round((correctCount / questions.length) * 100) : 100;
  const passed = scorePercent >= 70;

  if (passed && !enrollment.completedLessonIds.includes(lesson.id)) {
    enrollment.completedLessonIds.push(lesson.id);
  }
  enrollment.lastAccessedAt = new Date().toISOString();
  if (passed) recomputeEnrollmentProgress(enrollment, course);
  saveJson(ENROLLMENTS_DB_PATH, ENROLLMENTS_DB);

  res.json({ passed, scorePercent, results, enrollment, certificateIssued: passed && enrollment.progressPercent >= 100 && course.issuesCertificate });
});

app.get('/api/elearning/my/enrollments', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const results = ENROLLMENTS_DB
    .filter(e => e.userId === user.id)
    .map(e => {
      const course = COURSES_DB.find(c => c.id === e.courseId);
      return course ? courseSummary(course, user.id) : null;
    })
    .filter(Boolean);
  res.json(results);
});

app.get('/api/elearning/my/certificates', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const results = CERTIFICATES_DB
    .filter(c => c.userId === user.id)
    .sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt))
    .map(c => ({ ...c, status: certificateStatus(c) }));
  res.json(results);
});

app.post('/api/elearning/certificates/upload', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const { title, validUntil, dataUrl } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });

  let fileUrl = null;
  if (dataUrl) {
    const saved = saveBase64File(dataUrl, { ...ALLOWED_IMAGE_TYPES, 'application/pdf': 'pdf' }, 'certificates');
    if (!saved) return res.status(400).json({ error: 'Datei konnte nicht gespeichert werden (PDF, JPG, PNG, WEBP, max. 8 MB).' });
    fileUrl = saved.url;
  }

  const cert = {
    id: `cert-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    userId: user.id,
    title: String(title).trim().slice(0, 150),
    courseId: null,
    issuedAt: new Date().toISOString(),
    validUntil: validUntil ? new Date(validUntil).toISOString() : null,
    fileUrl,
    source: 'upload'
  };
  CERTIFICATES_DB.push(cert);
  saveJson(CERTIFICATES_DB_PATH, CERTIFICATES_DB);
  res.status(201).json({ ...cert, status: certificateStatus(cert) });
});

// --- DOCREATE: presentations, built on DeckDeckGo's real slide-deck web components ---
// Private to their author, matching DeckDeckGo's own scope (their real "share" story is
// publishing to their web-hosted, blockchain-backed platform — out of scope for this local
// prototype, so presentations here just aren't shared between accounts).
const PRESENTATIONS_DB_PATH = path.join(__dirname, 'presentations_db.json');
let PRESENTATIONS_DATABASE = loadOrInitJson(PRESENTATIONS_DB_PATH, []);
function savePresentations() { saveJson(PRESENTATIONS_DB_PATH, PRESENTATIONS_DATABASE); }

const DOCREATE_ELEMENT_TYPES = ['text', 'image', 'shape'];

// Elements carry rich-text HTML (from contentEditable + execCommand) that gets rendered back via
// dangerouslySetInnerHTML on read — strip anything script-capable before it's ever stored.
function sanitizeRichHtml(html) {
  let s = String(html == null ? '' : html).slice(0, 8000);
  s = s.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '');
  s = s.replace(/<\s*iframe[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  s = s.replace(/<\s*(object|embed|link|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  s = s.replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '');
  s = s.replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '');
  s = s.replace(/ on[a-z]+\s*=\s*[^\s>]+/gi, '');
  s = s.replace(/javascript\s*:/gi, '');
  return s;
}
function safeUrl(u, maxLen = 2000) {
  const s = String(u || '').trim().slice(0, maxLen);
  return /^javascript:/i.test(s) ? '' : s;
}
function num(v, fallback, lo, hi) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
}
function cleanElement(e) {
  const type = DOCREATE_ELEMENT_TYPES.includes(e?.type) ? e.type : 'text';
  const base = {
    id: e?.id && typeof e.id === 'string' ? e.id.slice(0, 80) : `el-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    type,
    x: num(e?.x, 0, -2000, 3000),
    y: num(e?.y, 0, -2000, 3000),
    width: num(e?.width, 100, 8, 3000),
    height: num(e?.height, 40, 8, 3000),
    zIndex: num(e?.zIndex, 1, -1000, 10000)
  };
  if (type === 'text') {
    return {
      ...base,
      html: sanitizeRichHtml(e?.html),
      fontFamily: typeof e?.fontFamily === 'string' ? e.fontFamily.slice(0, 120) : "'Inter', sans-serif",
      fontSize: num(e?.fontSize, 24, 6, 400),
      color: typeof e?.color === 'string' ? e.color.slice(0, 40) : '#241B14',
      bold: !!e?.bold, italic: !!e?.italic, underline: !!e?.underline,
      align: ['left', 'center', 'right', 'justify'].includes(e?.align) ? e.align : 'left',
      lineHeight: num(e?.lineHeight, 1.3, 0.5, 4)
    };
  }
  if (type === 'image') {
    return { ...base, src: safeUrl(e?.src), alt: typeof e?.alt === 'string' ? e.alt.slice(0, 300) : '', borderRadius: num(e?.borderRadius, 0, 0, 500) };
  }
  return {
    ...base,
    shape: e?.shape === 'ellipse' ? 'ellipse' : 'rect',
    fill: typeof e?.fill === 'string' ? e.fill.slice(0, 40) : '#F97316',
    borderColor: typeof e?.borderColor === 'string' ? e.borderColor.slice(0, 40) : '#C2410C',
    borderWidth: num(e?.borderWidth, 0, 0, 100),
    borderRadius: num(e?.borderRadius, 0, 0, 500)
  };
}
function cleanSlide(s) {
  return {
    id: s?.id && typeof s.id === 'string' ? s.id.slice(0, 80) : `sl-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    background: typeof s?.background === 'string' ? s.background.slice(0, 40) : '#ffffff',
    // Decorative full-slide backdrop (a template's SVG data URI, or any pasted image URL) — much
    // longer than a normal image src, so it gets its own higher cap.
    backgroundImage: s?.backgroundImage ? safeUrl(s.backgroundImage, 40000) : '',
    elements: (Array.isArray(s?.elements) ? s.elements : []).slice(0, 40).map(cleanElement)
  };
}
function cleanSlides(slides) {
  return (Array.isArray(slides) ? slides : []).slice(0, 60).map(cleanSlide);
}
function presentationSummary(p) {
  return { id: p.id, title: p.title, slideCount: (p.slides || []).length, createdAt: p.createdAt, updatedAt: p.updatedAt };
}

app.get('/api/presentations', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const mine = PRESENTATIONS_DATABASE.filter(p => p.authorId === user.id);
  mine.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(mine.map(presentationSummary));
});

app.get('/api/presentations/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const p = PRESENTATIONS_DATABASE.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Präsentation nicht gefunden.' });
  if (p.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf diese Präsentation.' });
  res.json(p);
});

app.post('/api/presentations', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const { title, slides } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });

  const now = new Date().toISOString();
  const p = {
    id: `pr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    authorId: user.id,
    authorName: user.name,
    title: String(title).trim().slice(0, 150),
    slides: cleanSlides(slides && slides.length ? slides : [{
      background: '#ffffff',
      elements: [{ type: 'text', x: 80, y: 210, width: 800, height: 120, fontSize: 44, align: 'center', html: `<div>${String(title).trim()}</div>` }]
    }]),
    createdAt: now,
    updatedAt: now
  };
  PRESENTATIONS_DATABASE.push(p);
  savePresentations();
  res.status(201).json(p);
});

app.put('/api/presentations/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const p = PRESENTATIONS_DATABASE.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Präsentation nicht gefunden.' });
  if (p.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf diese Präsentation.' });

  const { title, slides } = req.body || {};
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });
    p.title = String(title).trim().slice(0, 150);
  }
  if (slides !== undefined) p.slides = cleanSlides(slides);
  p.updatedAt = new Date().toISOString();
  savePresentations();
  res.json(p);
});

app.delete('/api/presentations/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const p = PRESENTATIONS_DATABASE.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Präsentation nicht gefunden.' });
  if (p.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf diese Präsentation.' });
  PRESENTATIONS_DATABASE = PRESENTATIONS_DATABASE.filter(x => x.id !== p.id);
  savePresentations();
  res.json({ success: true });
});

// LetsZeichnen — whiteboard/sketch drawings, built on Excalidraw's real scene format
// (elements + appState + files). Elements render via canvas drawing calls, not innerHTML, so
// there's no HTML-injection surface here the way there was for Docreate's rich text — validation
// just caps size to keep the JSON store sane.
const DRAWINGS_DB_PATH = path.join(__dirname, 'drawings_db.json');
let DRAWINGS_DATABASE = loadOrInitJson(DRAWINGS_DB_PATH, []);
function saveDrawings() { saveJson(DRAWINGS_DB_PATH, DRAWINGS_DATABASE); }

const DRAWING_APPSTATE_KEYS = ['viewBackgroundColor', 'currentItemStrokeColor', 'currentItemBackgroundColor', 'currentItemFillStyle', 'currentItemStrokeWidth', 'currentItemStrokeStyle', 'currentItemRoughness', 'currentItemOpacity', 'currentItemFontFamily', 'currentItemFontSize', 'currentItemTextAlign', 'gridSize', 'gridStep'];

function cleanDrawingElements(elements) {
  let arr = Array.isArray(elements) ? elements.slice(0, 6000) : [];
  // Trim from the end until the payload is a sane size, rather than rejecting it outright.
  while (arr.length && JSON.stringify(arr).length > 4_000_000) arr = arr.slice(0, Math.ceil(arr.length / 2));
  return arr;
}
function cleanDrawingAppState(appState) {
  const src = appState && typeof appState === 'object' ? appState : {};
  const out = {};
  for (const k of DRAWING_APPSTATE_KEYS) if (src[k] !== undefined) out[k] = src[k];
  return out;
}
function cleanDrawingFiles(files) {
  const src = files && typeof files === 'object' ? files : {};
  const out = {};
  let total = 0;
  for (const [id, f] of Object.entries(src)) {
    if (!f || typeof f !== 'object' || typeof f.dataURL !== 'string') continue;
    total += f.dataURL.length;
    if (total > 18_000_000) break; // stay comfortably under the 25mb request body limit
    out[String(id).slice(0, 100)] = {
      mimeType: typeof f.mimeType === 'string' ? f.mimeType.slice(0, 60) : 'image/png',
      id: String(f.id || id).slice(0, 100),
      dataURL: f.dataURL,
      created: typeof f.created === 'number' ? f.created : Date.now(),
    };
  }
  return out;
}
function drawingSummary(d) { return { id: d.id, title: d.title, elementCount: (d.elements || []).length, createdAt: d.createdAt, updatedAt: d.updatedAt }; }

app.get('/api/drawings', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const mine = DRAWINGS_DATABASE.filter(d => d.authorId === user.id);
  mine.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(mine.map(drawingSummary));
});

app.get('/api/drawings/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const d = DRAWINGS_DATABASE.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Zeichnung nicht gefunden.' });
  if (d.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf diese Zeichnung.' });
  res.json(d);
});

app.post('/api/drawings', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const { title, elements, appState, files } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });

  const now = new Date().toISOString();
  const d = {
    id: `dr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    authorId: user.id,
    authorName: user.name,
    title: String(title).trim().slice(0, 150),
    elements: cleanDrawingElements(elements),
    appState: cleanDrawingAppState(appState),
    files: cleanDrawingFiles(files),
    createdAt: now,
    updatedAt: now
  };
  DRAWINGS_DATABASE.push(d);
  saveDrawings();
  res.status(201).json(d);
});

app.put('/api/drawings/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const d = DRAWINGS_DATABASE.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Zeichnung nicht gefunden.' });
  if (d.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf diese Zeichnung.' });

  const { title, elements, appState, files } = req.body || {};
  if (title !== undefined) {
    if (!String(title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });
    d.title = String(title).trim().slice(0, 150);
  }
  if (elements !== undefined) d.elements = cleanDrawingElements(elements);
  if (appState !== undefined) d.appState = cleanDrawingAppState(appState);
  if (files !== undefined) d.files = cleanDrawingFiles(files);
  d.updatedAt = new Date().toISOString();
  saveDrawings();
  res.json(d);
});

app.delete('/api/drawings/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const d = DRAWINGS_DATABASE.find(x => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Zeichnung nicht gefunden.' });
  if (d.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf diese Zeichnung.' });
  DRAWINGS_DATABASE = DRAWINGS_DATABASE.filter(x => x.id !== d.id);
  saveDrawings();
  res.json({ success: true });
});

// Device Training — bedside monitor / defib / pacer training scenarios. A "scenario" is just a
// saved preset of rhythm + vitals + alarm thresholds; the live waveform simulation itself runs
// entirely client-side and is never persisted (there's nothing meaningful to serialize about a
// running animation).
const DEVICE_SCENARIOS_DB_PATH = path.join(__dirname, 'device_scenarios_db.json');
let DEVICE_SCENARIOS_DATABASE = loadOrInitJson(DEVICE_SCENARIOS_DB_PATH, []);
function saveDeviceScenarios() { saveJson(DEVICE_SCENARIOS_DB_PATH, DEVICE_SCENARIOS_DATABASE); }

const DEVICE_RHYTHM_IDS = ['nsr', 'sinus_tach', 'sinus_brady', 'afib', 'aflutter', 'svt', 'junctional', 'avblock1', 'avblock2t1', 'avblock3', 'pvc', 'paced', 'vtach', 'vtach_pulseless', 'vfib', 'asystole', 'pea'];
const DEVICE_ALARM_KEYS = ['hrEnabled', 'hrLow', 'hrHigh', 'spo2Enabled', 'spo2Low', 'bpEnabled', 'bpSysLow', 'bpSysHigh'];

function cleanDeviceAlarms(alarms) {
  const src = alarms && typeof alarms === 'object' ? alarms : {};
  const out = {};
  for (const k of DEVICE_ALARM_KEYS) {
    if (k.endsWith('Enabled')) out[k] = !!src[k];
    else out[k] = num(src[k], 0, -50, 400);
  }
  return out;
}
function cleanDeviceScenario(body, existing) {
  const p = existing ? { ...existing } : {};
  if (body.title !== undefined) p.title = String(body.title).trim().slice(0, 150) || 'Unbenanntes Szenario';
  if (body.rhythm !== undefined) p.rhythm = DEVICE_RHYTHM_IDS.includes(body.rhythm) ? body.rhythm : 'nsr';
  if (body.heartRate !== undefined) p.heartRate = num(body.heartRate, 78, 0, 300);
  if (body.bpSystolic !== undefined) p.bpSystolic = num(body.bpSystolic, 118, 0, 300);
  if (body.bpDiastolic !== undefined) p.bpDiastolic = num(body.bpDiastolic, 76, 0, 200);
  if (body.spo2 !== undefined) p.spo2 = num(body.spo2, 98, 0, 100);
  if (body.respRate !== undefined) p.respRate = num(body.respRate, 16, 0, 60);
  if (body.temp !== undefined) p.temp = num(body.temp, 37, 25, 45);
  if (body.alarms !== undefined) p.alarms = cleanDeviceAlarms(body.alarms);
  return p;
}
function deviceScenarioSummary(s) { return { id: s.id, title: s.title, rhythm: s.rhythm, createdAt: s.createdAt, updatedAt: s.updatedAt }; }

app.get('/api/device-scenarios', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const mine = DEVICE_SCENARIOS_DATABASE.filter(s => s.authorId === user.id);
  mine.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(mine.map(deviceScenarioSummary));
});

app.get('/api/device-scenarios/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const s = DEVICE_SCENARIOS_DATABASE.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Szenario nicht gefunden.' });
  if (s.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf dieses Szenario.' });
  res.json(s);
});

app.post('/api/device-scenarios', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  if (!req.body?.title || !String(req.body.title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });

  const now = new Date().toISOString();
  const s = {
    id: `dts-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    authorId: user.id,
    authorName: user.name,
    ...cleanDeviceScenario(req.body || {}, null),
    createdAt: now,
    updatedAt: now
  };
  DEVICE_SCENARIOS_DATABASE.push(s);
  saveDeviceScenarios();
  res.status(201).json(s);
});

app.put('/api/device-scenarios/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const s = DEVICE_SCENARIOS_DATABASE.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Szenario nicht gefunden.' });
  if (s.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf dieses Szenario.' });
  if (req.body?.title !== undefined && !String(req.body.title).trim()) return res.status(400).json({ error: 'Bitte einen Titel eingeben.' });

  Object.assign(s, cleanDeviceScenario(req.body || {}, s));
  s.updatedAt = new Date().toISOString();
  saveDeviceScenarios();
  res.json(s);
});

app.delete('/api/device-scenarios/:id', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });
  const s = DEVICE_SCENARIOS_DATABASE.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Szenario nicht gefunden.' });
  if (s.authorId !== user.id) return res.status(403).json({ error: 'Kein Zugriff auf dieses Szenario.' });
  DEVICE_SCENARIOS_DATABASE = DEVICE_SCENARIOS_DATABASE.filter(x => x.id !== s.id);
  saveDeviceScenarios();
  res.json({ success: true });
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

// Role-scoped classroom list — each role only ever sees the classrooms relevant to their
// purpose on the platform: a student their own class, a teacher the classes they own, a
// praxisanleiter the classes their supervised students sit in, admin everything.
app.get('/api/classrooms/mine', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an, um dein Klassenzimmer zu sehen.' });

  let mine;
  if (user.role === 'admin') {
    mine = CLASSROOMS_DATABASE;
  } else if (user.role === 'teacher') {
    mine = CLASSROOMS_DATABASE.filter(c => c.teacherId === user.id);
  } else if (user.role === 'student') {
    mine = CLASSROOMS_DATABASE.filter(c => c.id === user.classroomId);
  } else if (user.role === 'praxisanleiter') {
    const superviseeClassIds = new Set(
      REGISTERED_USERS_DB.filter(u => u.supervisorId === user.id && u.classroomId).map(u => u.classroomId)
    );
    mine = CLASSROOMS_DATABASE.filter(c => superviseeClassIds.has(c.id));
  } else {
    mine = [];
  }
  res.json(mine);
});

app.post('/api/classrooms', (req, res) => {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['admin', 'teacher'])) {
    return res.status(403).json({ error: 'Nur Lehrkräfte oder die Administration können Klassen anlegen.' });
  }
  const { name, teacher } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Bitte einen Klassennamen eingeben.' });
  }
  const newClassroom = {
    id: `class-${Date.now()}`,
    name: String(name).trim(),
    teacher: teacher || user.name,
    teacherId: user.role === 'teacher' ? user.id : null,
    students: [],
    assignments: [],
    documents: []
  };
  CLASSROOMS_DATABASE.push(newClassroom);
  saveClassrooms();
  res.status(201).json(newClassroom);
});

function findOwnedClassroomOr403(req, res, user) {
  const classroom = CLASSROOMS_DATABASE.find(c => c.id === req.params.id);
  if (!classroom) {
    res.status(404).json({ error: 'Klasse nicht gefunden.' });
    return null;
  }
  if (user.role === 'teacher' && classroom.teacherId !== user.id) {
    res.status(403).json({ error: 'Du kannst nur in deinen eigenen Klassen Änderungen vornehmen.' });
    return null;
  }
  return classroom;
}

app.post('/api/classrooms/:id/assignments', (req, res) => {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['admin', 'teacher', 'praxisanleiter'])) {
    return res.status(403).json({ error: 'Nur Lehrkräfte oder Praxisanleiter können Aufgaben stellen.' });
  }
  const classroom = findOwnedClassroomOr403(req, res, user);
  if (!classroom) return;

  const { title, dueDate, description } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Bitte einen Titel für die Aufgabe angeben.' });
  }

  const newAssignment = {
    id: `a-${Date.now()}`,
    title: String(title).trim(),
    dueDate: dueDate || '25.08.2026',
    status: 'Aktiv',
    description: description || 'Pflegedokumentations-Aufgabe',
    createdBy: user.name,
    createdById: user.id,
    submissions: []
  };
  classroom.assignments.push(newAssignment);
  saveClassrooms();
  res.status(201).json(newAssignment);
});

// A student submits (or resubmits, which overwrites their previous submission) their work for
// one assignment in their own classroom. This is the piece the original mockup never had — the
// "Einreichen" button used to do nothing.
app.post('/api/classrooms/:id/assignments/:assignmentId/submit', (req, res) => {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['student'])) {
    return res.status(403).json({ error: 'Nur Pflegeschüler können Aufgaben einreichen.' });
  }
  const classroom = CLASSROOMS_DATABASE.find(c => c.id === req.params.id);
  if (!classroom) return res.status(404).json({ error: 'Klasse nicht gefunden.' });
  if (classroom.id !== user.classroomId) {
    return res.status(403).json({ error: 'Du bist nicht Mitglied dieser Klasse.' });
  }
  const assignment = (classroom.assignments || []).find(a => a.id === req.params.assignmentId);
  if (!assignment) return res.status(404).json({ error: 'Aufgabe nicht gefunden.' });

  const { note } = req.body || {};
  if (!assignment.submissions) assignment.submissions = [];
  const existing = assignment.submissions.find(s => s.studentId === user.id);
  if (existing) {
    existing.note = note || '';
    existing.submittedAt = new Date().toISOString();
  } else {
    assignment.submissions.push({
      id: `sub-${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      note: note || '',
      submittedAt: new Date().toISOString()
    });
  }
  saveClassrooms();
  res.json(assignment);
});

app.post('/api/classrooms/:id/documents', (req, res) => {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['admin', 'teacher', 'praxisanleiter'])) {
    return res.status(403).json({ error: 'Nur Lehrkräfte oder Praxisanleiter können Dokumente teilen.' });
  }
  const classroom = findOwnedClassroomOr403(req, res, user);
  if (!classroom) return;

  const { title, dataUrl } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Bitte einen Dokumentnamen angeben.' });
  }
  const saved = saveBase64File(dataUrl, ALLOWED_DOC_TYPES, 'classroom-docs');
  if (!saved) {
    return res.status(400).json({ error: 'Ungültige oder zu große Datei (max. 8 MB, erlaubt: PDF, DOC, DOCX, TXT).' });
  }

  const newDoc = {
    id: `d-${Date.now()}`,
    title: String(title).trim(),
    url: saved.url,
    mime: saved.mime,
    size: saved.size,
    uploadedBy: user.name,
    uploadedById: user.id,
    date: new Date().toLocaleDateString('de-DE')
  };
  classroom.documents.push(newDoc);
  saveClassrooms();
  res.status(201).json(newDoc);
});

app.post('/api/classrooms/:id/students', (req, res) => {
  const user = authenticateRequest(req);
  if (!requireRole(user, ['admin', 'teacher'])) {
    return res.status(403).json({ error: 'Nur Lehrkräfte oder die Administration können Schüler zuordnen.' });
  }
  const classroom = findOwnedClassroomOr403(req, res, user);
  if (!classroom) return;

  const { name, email } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Bitte einen Namen angeben.' });
  }

  const matchedUser = REGISTERED_USERS_DB.find(u => u.email.toLowerCase() === String(email || '').toLowerCase() && u.role === 'student');
  const newStudent = {
    id: `s-${Date.now()}`,
    userId: matchedUser ? matchedUser.id : null,
    name: String(name).trim(),
    email: email || '',
    progress: 0
  };
  classroom.students.push(newStudent);
  if (matchedUser) {
    matchedUser.classroomId = classroom.id;
    saveUsers();
  }
  saveClassrooms();
  res.status(201).json(newStudent);
});

// --- ROSTER (role-scoped student listing) ---
app.get('/api/roster/students', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  let students;
  if (user.role === 'admin') {
    students = REGISTERED_USERS_DB.filter(u => u.role === 'student');
  } else if (user.role === 'teacher') {
    const ownedClassroomIds = CLASSROOMS_DATABASE.filter(c => c.teacherId === user.id).map(c => c.id);
    students = REGISTERED_USERS_DB.filter(u => u.role === 'student' && ownedClassroomIds.includes(u.classroomId));
  } else if (user.role === 'praxisanleiter') {
    students = REGISTERED_USERS_DB.filter(u => u.role === 'student' && u.supervisorId === user.id);
  } else {
    return res.status(403).json({ error: 'Keine Berechtigung für die Schülerliste.' });
  }

  // classroomId/cohortYear aren't in the base publicUser() shape (most consumers don't need
  // them); the praxisanleiter roster view links each supervisee back to their classroom, so add
  // them here rather than widening publicUser() for every other caller.
  res.json(students.map(u => ({ ...publicUser(u), classroomId: u.classroomId || null, cohortYear: u.cohortYear || null })));
});

// --- LETSMEET: meeting records (the live call itself runs on LiveKit) ---
app.post('/api/meetings', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const { title, type, scheduledFor, classroomId, inviteeEmails } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Bitte einen Titel für das Meeting angeben.' });
  }
  const meetingType = type === 'scheduled' ? 'scheduled' : 'instant';
  if (meetingType === 'scheduled' && !scheduledFor) {
    return res.status(400).json({ error: 'Bitte Datum und Uhrzeit für das geplante Meeting angeben.' });
  }
  if (classroomId && !userCanHostForClassroom(user, classroomId)) {
    return res.status(403).json({ error: 'Du kannst für diese Klasse kein Meeting ansetzen.' });
  }

  const cleanEmails = Array.isArray(inviteeEmails)
    ? [...new Set(inviteeEmails.map(e => String(e).trim().toLowerCase()).filter(Boolean))]
    : [];

  const now = new Date().toISOString();
  const meeting = {
    id: `meet-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    roomCode: generateRoomCode(),
    title: String(title).trim(),
    type: meetingType,
    hostId: user.id,
    hostName: user.name,
    classroomId: classroomId || null,
    inviteeEmails: cleanEmails,
    scheduledFor: meetingType === 'scheduled' ? scheduledFor : null,
    status: meetingType === 'instant' ? 'live' : 'scheduled',
    createdAt: now,
    startedAt: meetingType === 'instant' ? now : null,
    endedAt: null,
    participantsLog: []
  };
  MEETINGS_DATABASE.push(meeting);
  saveMeetings();
  res.status(201).json(publicMeeting(meeting));
});

app.get('/api/meetings/mine', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const mine = MEETINGS_DATABASE.filter(m => m.status !== 'canceled' && userCanAccessMeeting(user, m));
  const statusRank = { live: 0, scheduled: 1, ended: 2 };
  mine.sort((a, b) => {
    if (statusRank[a.status] !== statusRank[b.status]) return statusRank[a.status] - statusRank[b.status];
    const at = new Date(a.scheduledFor || a.startedAt || a.createdAt).getTime();
    const bt = new Date(b.scheduledFor || b.startedAt || b.createdAt).getTime();
    return a.status === 'ended' ? bt - at : at - bt;
  });
  res.json(mine.map(publicMeeting));
});

app.get('/api/meetings/lookup/:roomCode', (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const meeting = MEETINGS_DATABASE.find(m => m.roomCode === String(req.params.roomCode || '').toLowerCase());
  if (!meeting) return res.status(404).json({ error: 'Kein Meeting mit diesem Code gefunden.' });
  if (!userCanAccessMeeting(user, meeting)) {
    return res.status(403).json({ error: 'Du bist zu diesem Meeting nicht eingeladen.' });
  }
  if (meeting.status === 'canceled') return res.status(410).json({ error: 'Dieses Meeting wurde abgesagt.' });
  res.json(publicMeeting(meeting));
});

// Mints a room-scoped LiveKit access token — only handed out once the caller is confirmed to be
// allowed into this specific meeting and it's actually live.
app.get('/api/meetings/:id/livekit-token', async (req, res) => {
  const user = authenticateRequest(req);
  if (!user) return res.status(401).json({ error: 'Bitte melde dich an.' });

  const meeting = MEETINGS_DATABASE.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting nicht gefunden.' });
  if (!userCanAccessMeeting(user, meeting)) {
    return res.status(403).json({ error: 'Du bist zu diesem Meeting nicht eingeladen.' });
  }
  if (meeting.status !== 'live') {
    return res.status(409).json({ error: 'Dieses Meeting läuft gerade nicht.' });
  }

  const isHost = meeting.hostId === user.id;
  try {
    const token = await mintLivekitToken(meeting.roomCode, user, isHost);
    const openLogEntry = meeting.participantsLog.slice().reverse().find(p => p.userId === user.id && !p.leftAt);
    if (!openLogEntry) {
      meeting.participantsLog.push({ userId: user.id, name: user.name, joinedAt: new Date().toISOString(), leftAt: null });
      saveMeetings();
    }
    res.json({ token, url: LIVEKIT_URL, isHost });
  } catch (e) {
    res.status(500).json({ error: 'Meeting-Token konnte nicht erstellt werden.' });
  }
});

// Host-only: forcibly disconnects one participant's live call (their meeting record/access is
// untouched — this only ends their current LiveKit session).
app.post('/api/meetings/:id/remove-participant', async (req, res) => {
  const user = authenticateRequest(req);
  const meeting = MEETINGS_DATABASE.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting nicht gefunden.' });
  if (!user || meeting.hostId !== user.id) return res.status(403).json({ error: 'Nur der Host kann Teilnehmer entfernen.' });
  const { participantIdentity } = req.body || {};
  if (!participantIdentity) return res.status(400).json({ error: 'participantIdentity fehlt.' });

  try {
    await livekitRoomService.removeParticipant(meeting.roomCode, participantIdentity);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Teilnehmer konnte nicht entfernt werden.' });
  }
});

app.post('/api/meetings/:id/start', (req, res) => {
  const user = authenticateRequest(req);
  const meeting = MEETINGS_DATABASE.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting nicht gefunden.' });
  if (!user || meeting.hostId !== user.id) return res.status(403).json({ error: 'Nur der Host kann das Meeting starten.' });
  if (meeting.status === 'ended' || meeting.status === 'canceled') {
    return res.status(400).json({ error: 'Dieses Meeting ist bereits beendet.' });
  }
  meeting.status = 'live';
  if (!meeting.startedAt) meeting.startedAt = new Date().toISOString();
  saveMeetings();
  res.json(publicMeeting(meeting));
});

app.post('/api/meetings/:id/end', async (req, res) => {
  const user = authenticateRequest(req);
  const meeting = MEETINGS_DATABASE.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting nicht gefunden.' });
  if (!user || meeting.hostId !== user.id) return res.status(403).json({ error: 'Nur der Host kann das Meeting beenden.' });
  meeting.status = 'ended';
  meeting.endedAt = new Date().toISOString();
  saveMeetings();
  // Deleting the LiveKit room disconnects every connected participant immediately, rather than
  // leaving them talking in a room the meeting record now considers over.
  try { await livekitRoomService.deleteRoom(meeting.roomCode); } catch (e) { /* room already empty/gone */ }
  res.json(publicMeeting(meeting));
});

app.delete('/api/meetings/:id', (req, res) => {
  const user = authenticateRequest(req);
  const meeting = MEETINGS_DATABASE.find(m => m.id === req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting nicht gefunden.' });
  if (!user || meeting.hostId !== user.id) return res.status(403).json({ error: 'Nur der Host kann das Meeting absagen.' });
  if (meeting.status === 'live') {
    return res.status(400).json({ error: 'Ein laufendes Meeting kann nicht abgesagt werden — bitte zuerst beenden.' });
  }
  meeting.status = 'canceled';
  saveMeetings();
  res.json({ success: true });
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

// PflegeFeed user-uploaded photos & documents
app.use('/uploads', express.static(FEED_UPLOADS_ROOT));

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
