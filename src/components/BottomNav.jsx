import React from 'react';
import { Shield, Clock, QrCode, UserCheck, Car, Building2, AlertOctagon, Send } from 'lucide-react';

export default function BottomNav({ activeRole, activeSubTab, setActiveSubTab, pendingCount }) {
  if (activeRole === 'guard') {
    return (
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeSubTab === 'entry' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('entry')}
        >
          <div className="nav-icon-box"><Shield size={18} /></div>
          <span>Check-In</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'passcode' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('passcode')}
        >
          <div className="nav-icon-box"><QrCode size={18} /></div>
          <span>Verify Pass</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('activity')}
        >
          <div className="nav-icon-box"><Clock size={18} /></div>
          <span>Gate Log</span>
          {pendingCount > 0 && <span className="badge-dot" />}
        </button>

        <button
          className={`nav-item ${activeSubTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('vehicles')}
        >
          <div className="nav-icon-box"><Car size={18} /></div>
          <span>Vehicles</span>
        </button>
      </div>
    );
  }

  if (activeRole === 'owner') {
    return (
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeSubTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('requests')}
        >
          <div className="nav-icon-box"><UserCheck size={18} /></div>
          <span>My Visitors</span>
          {pendingCount > 0 && <span className="badge-dot" />}
        </button>

        <button
          className={`nav-item ${activeSubTab === 'preapprove' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('preapprove')}
        >
          <div className="nav-icon-box"><QrCode size={18} /></div>
          <span>Pre-Approve</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'vehicles' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('vehicles')}
        >
          <div className="nav-icon-box"><Car size={18} /></div>
          <span>Vehicles</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'notices' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('notices')}
        >
          <div className="nav-icon-box"><Building2 size={18} /></div>
          <span>Notices</span>
        </button>
      </div>
    );
  }

  if (activeRole === 'admin') {
    return (
      <div className="bottom-nav">
        <button
          className={`nav-item ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <div className="nav-icon-box"><Building2 size={18} /></div>
          <span>Audit Log</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'flats' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('flats')}
        >
          <div className="nav-icon-box"><UserCheck size={18} /></div>
          <span>Flats</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'guards' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('guards')}
        >
          <div className="nav-icon-box"><Shield size={18} /></div>
          <span>Guards</span>
        </button>

        <button
          className={`nav-item ${activeSubTab === 'notice' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('notice')}
        >
          <div className="nav-icon-box"><Send size={18} /></div>
          <span>Broadcast</span>
        </button>
      </div>
    );
  }

  return null;
}
