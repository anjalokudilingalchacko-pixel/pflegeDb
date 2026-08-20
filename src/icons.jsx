import React from 'react';

// 1. Dialog (Discuss)
export const LogoDiscuss = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="discussGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F55B23" />
        <stop offset="100%" stopColor="#FD9B70" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#discussGrad)" />
    <path d="M18 20C18 17.7909 19.7909 16 22 16H42C44.2091 16 46 17.7909 46 20V36C46 38.2091 44.2091 40 42 40H30L20 47V40H18C15.7909 40 14 38.2091 14 36V24C14 21.7909 15.7909 20 18 20Z" fill="white" fillOpacity="0.25" />
    <path d="M22 22C22 19.7909 23.7909 18 26 18H46C48.2091 18 50 19.7909 50 22V38C50 40.2091 48.2091 42 46 42H34L24 49V42H22C19.7909 42 18 40.2091 18 38V26C18 23.7909 19.7909 22 22 22Z" fill="white" />
    <circle cx="29" cy="30" r="3" fill="#F55B23" />
    <circle cx="36" cy="30" r="3" fill="#F55B23" />
    <circle cx="43" cy="30" r="3" fill="#F55B23" />
  </svg>
);

// 2. Kalender (Calendar)
export const LogoCalendar = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A1E53" />
        <stop offset="100%" stopColor="#6C2E7A" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#calGrad)" />
    <rect x="14" y="18" width="36" height="34" rx="8" fill="white" />
    <path d="M14 26H50V18C50 15.7909 48.2091 14 46 14H18C15.7909 14 14 15.7909 14 18V26Z" fill="#E91E63" />
    <circle cx="23" cy="18" r="2" fill="white" />
    <circle cx="41" cy="18" r="2" fill="white" />
    <text x="32" y="44" fill="#4A1E53" fontSize="18" fontWeight="bold" fontFamily="Inter, sans-serif" textAnchor="middle">31</text>
  </svg>
);

// 3. Termine (Appointments)
export const LogoAppointments = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="apptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#0F766E" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#apptGrad)" />
    <rect x="14" y="18" width="36" height="34" rx="8" fill="white" />
    <path d="M14 26H50V18C50 15.7909 48.2091 14 46 14H18C15.7909 14 14 15.7909 14 18V26Z" fill="#0D9488" />
    <circle cx="23" cy="18" r="2" fill="white" />
    <circle cx="41" cy="18" r="2" fill="white" />
    <text x="28" y="42" fill="#0F766E" fontSize="14" fontWeight="bold" fontFamily="Inter, sans-serif" textAnchor="middle">31</text>
    <circle cx="42" cy="42" r="10" fill="#22C55E" />
    <path d="M38 42L41 45L47 39" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 4. To-do
export const LogoTodo = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="todoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0891B2" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#todoGrad)" />
    <path d="M16 32L26 42L48 20" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 48H46" stroke="#22D3EE" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// 5. Wissensdatenbank (Knowledge Base)
export const LogoKnowledge = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="knowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#knowGrad)" />
    <path d="M18 16C18 14.8954 18.8954 14 20 14H42C44.2091 14 46 15.7909 46 18V48C46 50.2091 44.2091 52 42 52H20C18.8954 52 18 51.1046 18 50V16Z" fill="white" fillOpacity="0.2" />
    <path d="M22 14H42C44.2091 14 46 15.7909 46 18V48C46 50.2091 44.2091 52 42 52H22V14Z" fill="white" />
    <path d="M28 14V34L33 30L38 34V14H28Z" fill="#EC4899" />
    <rect x="22" y="14" width="4" height="38" fill="#8B5CF6" />
    <line x1="30" y1="40" x2="40" y2="40" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
    <line x1="30" y1="46" x2="38" y2="46" stroke="#DDD6FE" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 6. Kontakte (Contacts)
export const LogoContacts = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="contactsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#contactsGrad)" />
    <rect x="14" y="18" width="36" height="28" rx="4" fill="white" />
    <circle cx="25" cy="30" r="6" fill="#059669" />
    <path d="M18 42C18 38.5 21 38 25 38C29 38 32 38.5 32 42H18Z" fill="#059669" />
    <line x1="37" y1="26" x2="45" y2="26" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
    <line x1="37" y1="32" x2="45" y2="32" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
    <line x1="37" y1="38" x2="43" y2="38" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
    <circle cx="32" cy="14" r="2" fill="white" />
  </svg>
);

// 7. CRM
export const LogoCRM = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="crmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#crmGrad)" />
    <path d="M32 12L12 32L32 52L44 40L28 24L40 12L32 12Z" fill="#06B6D4" />
    <path d="M52 32L32 52L20 40L36 24L20 8L32 8L52 32Z" fill="#7C3AED" opacity="0.85" />
  </svg>
);

// 7b. Pflegeheute
export const LogoPflegeheute = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pflegeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#004D43" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#pflegeGrad)" />
    <rect x="18" y="14" width="28" height="36" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
    <rect x="26" y="10" width="12" height="6" rx="2" fill="#E2E8F0" />
    <circle cx="44" cy="44" r="10" fill="#10B981" />
    <path d="M44 39V49M39 44H49" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="24" y1="24" x2="40" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
    <line x1="24" y1="32" x2="34" y2="32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
  </svg>
);

// 8. Verkauf (Sales)
export const LogoSales = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="salesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8A1C5A" />
        <stop offset="100%" stopColor="#5E0F3D" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#salesGrad)" />
    <rect x="14" y="32" width="10" height="18" rx="2" fill="#E85B2E" />
    <rect x="27" y="22" width="10" height="28" rx="2" fill="#F1C40F" />
    <rect x="40" y="14" width="10" height="36" rx="2" fill="#00A09D" />
    <path d="M14 50H50" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 9. Dashboards
export const LogoDashboards = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#dashGrad)" />
    <rect x="14" y="14" width="16" height="16" rx="4" fill="#60A5FA" />
    <rect x="34" y="14" width="16" height="24" rx="4" fill="#3B82F6" />
    <rect x="14" y="34" width="16" height="16" rx="4" fill="#93C5FD" />
    <rect x="34" y="42" width="16" height="8" rx="2" fill="#1E40AF" />
  </svg>
);

// 10. Vermietung (Rentals)
export const LogoRentals = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#rentGrad)" />
    <circle cx="24" cy="40" r="10" stroke="white" strokeWidth="6" />
    <path d="M31 33L48 16M48 16L52 20M48 16L42 12M42 22L47 27" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 11. Kassensystem (Point of Sale)
export const LogoPOS = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="posGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#posGrad)" />
    <path d="M12 28V48C12 50.2091 13.7909 52 16 52H48C50.2091 52 52 50.2091 52 48V28H12Z" fill="white" fillOpacity="0.2" />
    <path d="M10 28L14 18H50L54 28H10Z" fill="#F59E0B" />
    <path d="M14 28C16.2091 28 18 26.2091 18 24C18 21.7909 16.2091 20 14 20C11.7909 20 10 21.7909 10 24C10 26.2091 11.7909 28 14 28Z" fill="#EF4444" />
    <path d="M23 28C25.2091 28 27 26.2091 27 24C27 21.7909 25.2091 20 23 20C20.7909 20 19 21.7909 19 24C19 26.2091 20.7909 28 23 28Z" fill="#3B82F6" />
    <path d="M32 28C34.2091 28 36 26.2091 36 24C36 21.7909 34.2091 20 32 20C29.7909 20 28 21.7909 28 24C28 26.2091 29.7909 28 32 28Z" fill="#10B981" />
    <path d="M41 28C43.2091 28 45 26.2091 45 24C45 21.7909 43.2091 20 41 20C38.7909 20 37 21.7909 37 24C37 26.2091 38.7909 28 41 28Z" fill="#F59E0B" />
    <path d="M50 28C52.2091 28 54 26.2091 54 24C54 21.7909 52.2091 20 50 20C47.7909 20 46 21.7909 46 24C46 26.2091 47.7909 28 50 28Z" fill="#8B5CF6" />
    <rect x="22" y="36" width="20" height="10" rx="2" fill="white" />
  </svg>
);

// 12. Rechnungsstellung (Invoicing)
export const LogoInvoicing = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="invGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E3A8A" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#invGrad)" />
    <rect x="16" y="14" width="32" height="38" rx="6" fill="white" />
    <path d="M22 22H42M22 28H42M22 34H34" stroke="#93C5FD" strokeWidth="4" strokeLinecap="round" />
    <circle cx="38" cy="38" r="8" fill="#10B981" />
    <text x="38" y="43" fill="white" fontSize="13" fontWeight="bold" fontFamily="Inter, sans-serif" textAnchor="middle">$</text>
  </svg>
);

// 13. Klassenzimmer (Classroom) — a graduation cap mark, used on both the home tile and the
// Klassenzimmer page header so the two stay visually tied together.
export const LogoKlassenzimmer = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="kzGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0C4A6E" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#kzGrad)" />
    <path d="M32 15L55 26L32 37L9 26L32 15Z" fill="#ffffff" />
    <path d="M20 30.5V40C20 40 25 45.5 32 45.5C39 45.5 44 40 44 40V30.5" stroke="#7DD3FC" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50.5 27.5V39" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50.5" cy="42" r="2.8" fill="#FACC15" />
  </svg>
);

// 14. Planung (Planning)
export const LogoPlanning = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="planGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F766E" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#planGrad)" />
    <rect x="14" y="20" width="36" height="24" rx="4" fill="white" fillOpacity="0.15" />
    <rect x="18" y="24" width="16" height="6" rx="3" fill="#FBBF24" />
    <rect x="30" y="34" width="16" height="6" rx="3" fill="#22D3EE" />
    <path d="M18 27H46M18 37H46" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
  </svg>
);

// 15. Medikamente
export const LogoMedikamente = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="medsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#312E81" />
        <stop offset="100%" stopColor="#1E1B4B" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#medsGrad)" />
    {/* Stylized Pill Capsule */}
    <g transform="translate(32 32) rotate(-45) translate(-20 -10)">
      <rect x="0" y="0" width="20" height="20" rx="10" fill="#F43F5E" />
      <rect x="20" y="0" width="20" height="20" rx="10" fill="#FFFFFF" />
      <rect x="10" y="0" width="20" height="20" stroke="white" strokeWidth="2.5" fill="none" />
    </g>
    {/* Medical Cross */}
    <circle cx="48" cy="18" r="8" fill="#10B981" />
    <path d="M48 14V22M44 18H52" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 16. E-Learning (eLearning / pflegeHeute)
export const LogoELearning = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="learnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0E7490" />
        <stop offset="100%" stopColor="#164E63" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#learnGrad)" />
    <path d="M32 14L52 24L32 34L12 24L32 14Z" fill="white" />
    <path d="M18 27.5V42C18 45 24 48 32 48C40 48 46 45 46 42V27.5L32 34.5L18 27.5Z" fill="white" fillOpacity="0.3" />
    <path d="M48 25V40" stroke="#F1C40F" strokeWidth="4" strokeLinecap="round" />
    <polygon points="48,40 44,43 48,48 52,43" fill="#F1C40F" />
    <path d="M32 34.5V48" stroke="white" strokeWidth="2" strokeDasharray="3 3" />
  </svg>
);

// 17. Veranstaltungen (Events)
export const LogoEvents = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eventGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B91C1C" />
        <stop offset="100%" stopColor="#7F1D1D" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#eventGrad)" />
    <path d="M16 48L32 18L48 48H16Z" fill="white" fillOpacity="0.2" />
    <path d="M32 18L14 44H50L32 18Z" stroke="white" strokeWidth="4" strokeLinejoin="round" />
    <circle cx="32" cy="12" r="3" fill="#F1C40F" />
    <path d="M24 44C24 40 28 38 32 38C36 38 40 40 40 44" fill="white" />
    <line x1="14" y1="48" x2="50" y2="48" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// 18. Umfragen (Surveys)
export const LogoSurveys = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="surveyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0369A1" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#surveyGrad)" />
    <rect x="14" y="16" width="36" height="6" rx="3" fill="#60A5FA" />
    <rect x="14" y="28" width="36" height="6" rx="3" fill="#3B82F6" />
    <rect x="14" y="40" width="36" height="6" rx="3" fill="#1D4ED8" />
    <circle cx="22" cy="19" r="5" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
    <circle cx="36" cy="31" r="5" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
    <circle cx="28" cy="43" r="5" fill="white" stroke="#3B82F6" strokeWidth="2.5" />
  </svg>
);

// 19. E-Signatur (Sign)
export const LogoSign = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="signGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F766E" />
        <stop offset="100%" stopColor="#115E59" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#signGrad)" />
    <path d="M16 48C20 40 28 36 34 36C40 36 44 40 44 44C44 48 38 50 32 50C26 50 18 46 22 34C26 22 38 16 48 16" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M42 48H52" stroke="#22D3EE" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 20. Mitarbeiter (Employees / Students)
export const LogoEmployees = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="empGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3730A3" />
        <stop offset="100%" stopColor="#312E81" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#empGrad)" />
    <circle cx="32" cy="24" r="8" fill="white" />
    <path d="M16 48C16 38 23.1634 38 32 38C40.8366 38 48 38 48 48H16Z" fill="white" />
    <circle cx="18" cy="30" r="5" fill="#818CF8" />
    <path d="M8 48C8 42 12.4772 41 18 41C20.5 41 23 41.5 24 43" fill="#818CF8" />
    <circle cx="46" cy="30" r="5" fill="#818CF8" />
    <path d="M56 48C56 42 51.5228 41 46 41C43.5 41 41 41.5 40 43" fill="#818CF8" />
  </svg>
);

// 21. Apps
export const LogoApps = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="appsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#appsGrad)" />
    <circle cx="32" cy="32" r="20" stroke="white" strokeWidth="2.5" />
    <path d="M32 12V52" stroke="white" strokeWidth="2.5" />
    <path d="M12 32H52" stroke="white" strokeWidth="2.5" />
    <circle cx="22" cy="22" r="6" fill="#F1C40F" />
    <circle cx="42" cy="22" r="6" fill="#00A09D" />
    <circle cx="22" cy="42" r="6" fill="#E85B2E" />
    <circle cx="42" cy="42" r="6" fill="#714B67" />
  </svg>
);

// 22. Einstellungen (Settings)
export const LogoSettings = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="settingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#settingsGrad)" />
    <circle cx="32" cy="32" r="8" stroke="white" strokeWidth="5" />
    <path d="M32 10V18M32 46V54M10 32H18M46 32H54" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
    <path d="M16.5 16.5L22 22M42 42L47.5 47.5M16.5 47.5L22 42M42 22L47.5 16.5" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
  </svg>
);

// 23. PflegeDiktat (Sprach-Pflegedokumentation AI)
export const LogoPflegeDiktat = () => (
  <img 
    src="/pflegediktat_icon.png" 
    alt="PflegeDiktat" 
    style={{ width: '100%', height: '100%', borderRadius: '16px', objectFit: 'cover', display: 'block' }} 
  />
);
export const LogoAudibleDoku = LogoPflegeDiktat;
export const LogoPflegeDikat = LogoPflegeDiktat;

// 24. LetsMeet (real-time video calls — classes & appointments, powered by LiveKit)
export const LogoLetsMeet = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="letsmeetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#letsmeetGrad)" />
    <rect x="9" y="20" width="30" height="24" rx="6" fill="#ffffff" />
    <path d="M44 27L55 19.5V44.5L44 37V27Z" fill="#ffffff" />
    <circle cx="49" cy="15" r="5" fill="#FBBF24" />
  </svg>
);

// LetsZeichnen (whiteboard/sketching, built on Excalidraw's real drawing engine)
export const LogoLetsZeichnen = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="letszeichnenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B7CF6" />
        <stop offset="100%" stopColor="#5B4FCF" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#letszeichnenGrad)" />
    <path d="M14 40 Q 22 26, 32 34 T 50 24" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity="0.85" />
    <rect x="12" y="12" width="16" height="12" rx="2" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.6" transform="rotate(-6 20 18)" />
    <path d="M37 41L47 31C48.1 29.9 49.9 29.9 51 31C52.1 32.1 52.1 33.9 51 35L41 45L35 47L37 41Z" fill="#ffffff" />
  </svg>
);

// Gerätetraining (bedside monitor / defib / pacer simulator, inspired by Infirmary Integrated)
export const LogoDeviceTraining = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="deviceTrainingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F2528C" />
        <stop offset="100%" stopColor="#A6134A" />
      </linearGradient>
      <linearGradient id="deviceTrainingScreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1A222C" />
        <stop offset="100%" stopColor="#0B0F14" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#deviceTrainingGrad)" />
    <rect x="8" y="12" width="48" height="33" rx="5" fill="url(#deviceTrainingScreen)" />
    <rect x="8" y="12" width="48" height="33" rx="5" stroke="#ffffff" strokeOpacity="0.12" />
    <path d="M11 29h6 Q19 22 21 29 h4 l3 -16 l4 22 l3.5 -13 Q38 18 42 29 h11"
      stroke="#3CFF7A" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="46" cy="18" r="2.4" fill="#3CFF7A" opacity="0.95" />
    <circle cx="9" cy="52" r="3.2" fill="#ffffff" opacity="0.55" />
    <circle cx="19" cy="52" r="3.2" fill="#ffffff" opacity="0.85" />
    <circle cx="29" cy="52" r="3.2" fill="#ffffff" opacity="0.55" />
    <circle cx="48" cy="47" r="12.5" fill="#ffffff" />
    <circle cx="48" cy="47" r="12.5" fill="none" stroke="#A6134A" strokeOpacity="0.15" strokeWidth="1" />
    <path d="M50 37.5 L42.5 49 H47.5 L45.5 56.5 L54 44.5 H49 Z" fill="#D6194E" />
  </svg>
);

// Docreate (presentations, built on DeckDeckGo's real slide-deck web components)
export const LogoDocreate = () => (
  <svg viewBox="0 0 64 64" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="docreateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="url(#docreateGrad)" />
    <rect x="10" y="12" width="36" height="24" rx="3" fill="#ffffff" />
    <rect x="14" y="17" width="14" height="4" rx="1.5" fill="#F97316" fillOpacity="0.35" />
    <rect x="14" y="24" width="28" height="2.4" rx="1.2" fill="#F97316" fillOpacity="0.5" />
    <rect x="14" y="29" width="20" height="2.4" rx="1.2" fill="#F97316" fillOpacity="0.3" />
    <rect x="20" y="40" width="24" height="16" rx="3" fill="#ffffff" stroke="#C2410C" strokeWidth="1.5" />
    <path d="M25 48h14M25 52h9" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
  </svg>
);


