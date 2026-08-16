import React from 'react';
import './App.css';

export default function PflegeDikatView({ onHome }) {
  return (
    <div style={{ background: '#090d16', minHeight: '100vh', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header Banner */}
      <header style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #311b92 100%)', borderBottom: '1px solid rgba(168, 85, 247, 0.25)', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: onHome ? 'pointer' : 'default' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(168, 85, 247, 0.5)', boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)' }}>
              <img src="/pflegediktat_icon.png" alt="PflegeDiktat Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', background: 'linear-gradient(135deg, #c084fc 0%, #38bdf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PflegeDiktat
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Sprachgestützte Pflegedokumentation</div>
            </div>
          </div>
        </div>

        <button
          onClick={onHome}
          style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
        >
          🏠 Startseite
        </button>
      </header>

      {/* Main Empty View */}
      <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '60px 40px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎙️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '10px' }}>
            PflegeDiktat (Zurückgesetzt)
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto' }}>
            Inhalte wurden auf Wunsch vollständig geleert. Der Bereich ist für Ihre neuen Anforderungen bereit.
          </p>
        </div>
      </main>

    </div>
  );
}
