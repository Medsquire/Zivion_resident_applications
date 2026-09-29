import React, { useState } from 'react';
import {
  Building2, Shield, Users, Car, AlertTriangle, FileText, Plus, Search,
  CheckCircle2, XCircle, Clock, Send, ShieldAlert, Award, Phone, UserCheck, Wrench
} from 'lucide-react';

export default function AdminView({
  requests,
  flats,
  guards,
  vehicles,
  notices,
  emergencyAlerts,
  serviceRequests,
  onAddNotice,
  onUpdateServiceRequest,
  onClearEmergency
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'flats', 'guards', 'audit', 'notice'

  // Notice creation state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Maintenance');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTarget, setNoticeTarget] = useState('ALL_RESIDENTS');

  // Search state
  const [flatSearch, setFlatSearch] = useState('');

  const totalVisitorsToday = requests.length;
  const approvedToday = requests.filter(r => r.status === 'APPROVED' || r.status === 'CHECKED_OUT').length;
  const deniedToday = requests.filter(r => r.status === 'DENIED').length;
  const pendingNow = requests.filter(r => r.status === 'PENDING').length;

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      alert("Please fill in notice title and content!");
      return;
    }

    const newNotice = {
      id: `NOT-${Math.floor(100 + Math.random() * 900)}`,
      title: noticeTitle,
      category: noticeCategory,
      date: "Just now",
      postedBy: "Chief Apartment Admin",
      content: noticeContent,
      target: noticeTarget
    };

    const savedNotice = await onAddNotice(newNotice);
    if (!savedNotice) return;
    alert("Notice broadcasted successfully to all residents!");
    setNoticeTitle('');
    setNoticeContent('');
    setActiveTab('overview');
  };

  const filteredFlats = flats.filter(f =>
    f.flatNo.toLowerCase().includes(flatSearch.toLowerCase()) ||
    f.ownerName.toLowerCase().includes(flatSearch.toLowerCase()) ||
    f.tower.toLowerCase().includes(flatSearch.toLowerCase())
  );

  return (
    <div className="admin-view">
      {/* Admin Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
        <div className="glass-card" style={{ background: 'linear-gradient(110deg, rgba(50, 130, 246, 0.22), rgba(34, 211, 238, 0.1))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#93c5fd', fontWeight: 600 }}>Total Visitors</span>
            <Users size={16} color="#3282f6" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0' }}>{totalVisitorsToday}</div>
          <div style={{ fontSize: 10, color: '#34d399' }}>✓ {approvedToday} Approved | ✗ {deniedToday} Denied</div>
        </div>

        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 600 }}>Occupied Flats</span>
            <Building2 size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0' }}>{flats.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Blocks A, B, C</div>
        </div>

        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#fde68a', fontWeight: 600 }}>Active Guards</span>
            <Shield size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0' }}>{guards.filter(g => g.status === 'ON_DUTY').length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>On Day Shift</div>
        </div>

        <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 116, 144, 0.1) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#67e8f9', fontWeight: 600 }}>Parked Vehicles</span>
            <Car size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '4px 0' }}>{vehicles.length}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Res & Guest Bays</div>
        </div>
      </div>

      {/* Admin Sub Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 3, marginBottom: 14, gap: 2 }}>
        <button
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <FileText size={13} />
          <span>Audit Log</span>
        </button>

        <button
          className={`btn ${activeTab === 'flats' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('flats')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Building2 size={13} />
          <span>Flats</span>
        </button>

        <button
          className={`btn ${activeTab === 'guards' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('guards')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Shield size={13} />
          <span>Guards</span>
        </button>

        <button
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('services')}
          style={{ width: '100%', fontSize: 9, padding: '7px 2px', borderRadius: 9, border: 'none' }}
        >
          <Wrench size={13} />
          <span>Services</span>
        </button>

        <button
          className={`btn ${activeTab === 'notice' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('notice')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Send size={13} />
          <span>Broadcast</span>
        </button>
      </div>

      {/* TAB 1: AUDIT LOG */}
      {activeTab === 'overview' && (
        <div className="glass-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Security Access Audit Trail</h3>
          {emergencyAlerts.filter(alert => alert.status === 'ACTIVE').map(alert => (
            <div key={alert.id} className="alert-incoming-banner" style={{ margin: '0 0 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <strong style={{ color: '#fff', fontSize: 12 }}>EMERGENCY · {alert.location}</strong>
                  <p style={{ color: '#e0e7ff', fontSize: 10, marginTop: 4 }}>{alert.triggeredBy} · {alert.time}</p>
                  <p style={{ color: '#cbd5e1', fontSize: 10, marginTop: 4 }}>{alert.actionTaken}</p>
                </div>
                <button className="btn btn-secondary" onClick={() => onClearEmergency(alert.id)} style={{ padding: '5px 7px', fontSize: 9 }}>
                  <CheckCircle2 size={13} /> Acknowledge
                </button>
              </div>
            </div>
          ))}
          {requests.map(req => (
            <div key={req.id} style={{
              padding: '10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              marginBottom: 8,
              border: '1px solid var(--border-color)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <img src={req.photo} alt={req.visitorName} className="visitor-avatar" style={{ width: 36, height: 36 }} />
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{req.visitorName} ({req.company})</h4>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Target: Flat {req.flatNo.replace('-', ':')} • {req.entryTime}</p>
                </div>
              </div>

              <div>
                {req.status === 'APPROVED' && <span className="badge badge-approved" style={{ fontSize: 9 }}>APPROVED</span>}
                {req.status === 'LEAVE_AT_GATE' && <span className="badge badge-leave" style={{ fontSize: 9 }}>LEAVE AT GATE</span>}
                {req.status === 'DENIED' && <span className="badge badge-denied" style={{ fontSize: 9 }}>DENIED</span>}
                {req.status === 'PENDING' && <span className="badge badge-pending" style={{ fontSize: 9 }}>PENDING</span>}
                {req.status === 'CHECKED_OUT' && <span className="badge badge-checkout" style={{ fontSize: 9 }}>EXITED</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'services' && (
        <section className="glass-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Apartment service requests</h3>
          {serviceRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>No service requests have been submitted.</p>
          ) : serviceRequests.map(request => (
            <article key={request.id} style={{ padding: '11px 0', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <strong style={{ color: '#fff', fontSize: 12 }}>{request.category} · {request.flatNo.replace('-', ':')}</strong>
                <span className={`badge ${request.status === 'COMPLETED' ? 'badge-approved' : request.priority === 'Urgent' ? 'badge-denied' : 'badge-pending'}`} style={{ fontSize: 8 }}>{request.status.replace('_', ' ')}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '5px 0' }}>{request.description}</p>
              {request.photo && <img src={request.photo} alt={`${request.category} issue`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#8b98a8', fontSize: 9 }}>{request.ownerName} · {request.priority} · {request.createdAt}</span>
                {request.status !== 'COMPLETED' && (
                  <button className="btn btn-secondary" onClick={() => onUpdateServiceRequest(request.id, request.status === 'OPEN' ? 'IN_PROGRESS' : 'COMPLETED')} style={{ padding: '5px 7px', fontSize: 9 }}>
                    {request.status === 'OPEN' ? 'Start work' : 'Mark complete'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* TAB 2: FLATS DIRECTORY */}
      {activeTab === 'flats' && (
        <div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search tower, flat number or owner..."
              value={flatSearch}
              onChange={(e) => setFlatSearch(e.target.value)}
              style={{ paddingLeft: 30, fontSize: 12 }}
            />
          </div>

          {filteredFlats.map(f => (
            <div key={f.flatNo} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="chip" style={{ background: '#10243a', color: '#7dd3fc', fontWeight: 800 }}>
                    {f.flatNo.replace('-', ':')} ({f.tower})
                  </span>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 6 }}>{f.ownerName}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Phone: {f.phone} | Intercom Ext: #{f.intercom}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-approved" style={{ fontSize: 9 }}>{f.familyMembers} Residents</span>
                  <p style={{ fontSize: 10, color: '#38bdf8', marginTop: 4 }}>{f.vehicles.length} Vehicles</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: GUARD ROSTER MANAGEMENT */}
      {activeTab === 'guards' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Security Staff Roster</h3>
            <button
              onClick={() => alert("Add Guard Staff Modal simulation")}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: 10 }}
            >
              + Add Guard
            </button>
          </div>

          {guards.map(g => (
            <div key={g.id} style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              padding: 10,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              marginBottom: 10,
              border: '1px solid var(--border-color)'
            }}>
              <img src={g.photo} alt={g.name} className="visitor-avatar" style={{ width: 44, height: 44 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{g.name}</h4>
                  <span className={`badge ${g.status === 'ON_DUTY' ? 'badge-approved' : 'badge-checkout'}`} style={{ fontSize: 9 }}>
                    {g.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#22d3ee', fontWeight: 600 }}>{g.role}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>{g.gate} • {g.shift}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: BROADCAST ANNOUNCEMENT NOTICE */}
      {activeTab === 'notice' && (
        <form onSubmit={handlePostNotice} className="glass-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Send size={16} color="#22d3ee" />
            <span>Broadcast Notice to Apartment</span>
          </h3>

          <div className="form-group">
            <label className="form-label">Announcement Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Water Tank Cleaning Schedule"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={noticeCategory}
                onChange={(e) => setNoticeCategory(e.target.value)}
              >
                <option value="Maintenance">Maintenance</option>
                <option value="Security & Parking">Security & Parking</option>
                <option value="Event / AGM">Event / AGM</option>
                <option value="Urgent Alert">Urgent Alert</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Audience</label>
              <select
                className="form-select"
                value={noticeTarget}
                onChange={(e) => setNoticeTarget(e.target.value)}
              >
                <option value="ALL_RESIDENTS">All Residents & Owners</option>
                <option value="GUARDS_ONLY">Security Guards Only</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notice Message Content *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Enter full details of the announcement..."
              value={noticeContent}
              onChange={(e) => setNoticeContent(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            <Send size={16} />
            <span>PUBLISH ANNOUNCEMENT BROADCAST</span>
          </button>
        </form>
      )}
    </div>
  );
}
