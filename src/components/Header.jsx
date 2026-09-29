import React from 'react';
import { Shield, Smartphone, Monitor, AlertTriangle, UserCheck, Key, Building2, Users } from 'lucide-react';

export default function Header({
  activeRole,
  setActiveRole,
  selectedBlock,
  setSelectedBlock,
  selectedOwnerFlat,
  setSelectedOwnerFlat,
  flatsList,
  isMockupMode,
  setIsMockupMode,
  pendingCount,
  emergencyActive,
  onClearEmergency
}) {
  return (
    <header className="app-header">
      {/* Top Bar Logo & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
              GateShield <span style={{ fontSize: 10, background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>PRO</span>
            </h1>
            <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Royal Heights Apartment</p>
          </div>
        </div>

        {/* View Toggle (Mockup frame vs Fullwidth) */}
        <button
          onClick={() => setIsMockupMode(!isMockupMode)}
          className="btn btn-secondary"
          style={{ padding: '5px 9px', fontSize: 11, gap: 5, borderRadius: 20 }}
          title={isMockupMode ? "Switch to Fullscreen mode" : "Switch to Phone Mockup frame"}
        >
          {isMockupMode ? <Monitor size={13} /> : <Smartphone size={13} />}
          <span>{isMockupMode ? "Mobile Frame" : "Full View"}</span>
        </button>
      </div>

      {/* Emergency Active Alert Bar */}
      {emergencyActive && (
        <div className="emergency-banner" style={{ marginBottom: 10 }}>
          <AlertTriangle size={24} color="#ffffff" className="pulse-card" />
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase' }}>🚨 EMERGENCY SOS TRIGGERED!</h4>
            <p style={{ fontSize: 11, opacity: 0.9 }}>Guards & Admin have been dispatched to location.</p>
          </div>
          <button
            onClick={onClearEmergency}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Role Switcher Pills */}
      <div className="role-switcher-container">
        <button
          className={`role-btn ${activeRole === 'admin' ? 'active admin-theme' : ''}`}
          onClick={() => setActiveRole('admin')}
        >
          <Building2 size={14} />
          <span>Admin</span>
        </button>

        <button
          className={`role-btn ${activeRole === 'supervisor' ? 'active supervisor-theme' : ''}`}
          onClick={() => setActiveRole('supervisor')}
        >
          <Users size={14} />
          <span>Supervisor</span>
        </button>

        <button
          className={`role-btn ${activeRole === 'homeowner' ? 'active owner-theme' : ''}`}
          onClick={() => setActiveRole('homeowner')}
        >
          <UserCheck size={14} />
          <span>Homeowner</span>
          {pendingCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              padding: '1px 5px',
              borderRadius: 10,
              fontWeight: 800
            }}>
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeRole === 'supervisor' && (
        <div className="role-context-picker">
          <label htmlFor="supervisor-block">Assigned block</label>
          <select
            id="supervisor-block"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="role-context-select"
          >
            {['A', 'B', 'C'].map(block => <option key={block} value={block}>Block {block}</option>)}
          </select>
        </div>
      )}

      {activeRole === 'homeowner' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          padding: '6px 12px',
          background: 'rgba(99, 102, 241, 0.1)',
          borderRadius: 10,
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#c7d2fe', fontWeight: 600 }}>
            <Key size={13} color="#818cf8" />
            <span>Homeowner flat</span>
          </div>
          <select
            value={selectedOwnerFlat.flatNo}
            onChange={(e) => {
              const found = flatsList.find(f => f.flatNo === e.target.value);
              if (found) setSelectedOwnerFlat(found);
            }}
            style={{
              background: '#1e1b4b',
              color: '#fff',
              border: '1px solid #4338ca',
              borderRadius: 6,
              fontSize: 12,
              padding: '3px 8px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {flatsList.map(f => (
              <option key={f.flatNo} value={f.flatNo}>
                {f.flatNo.replace('-', ':')} ({f.ownerName})
              </option>
            ))}
          </select>
        </div>
      )}
    </header>
  );
}
