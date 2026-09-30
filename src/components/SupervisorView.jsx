import React from 'react';
import { Building2, Clock3, Users, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SupervisorView({ selectedBlock, requests, flats, serviceRequests, emergencyAlerts, onUpdateServiceRequest }) {
  const blockFlats = flats.filter(flat => flat.flatNo.startsWith(`${selectedBlock}-`));
  const blockFlatNumbers = new Set(blockFlats.map(flat => flat.flatNo));
  const blockRequests = requests.filter(request => blockFlatNumbers.has(request.flatNo));
  const blockServiceRequests = serviceRequests.filter(request => request.flatNo.startsWith(`${selectedBlock}-`));
  const blockEmergencyAlerts = emergencyAlerts.filter(alert =>
    alert.status === 'ACTIVE' && (alert.location.includes(`Block ${selectedBlock}`) || alert.location.includes(`Tower ${selectedBlock}`))
  );
  const pendingCount = blockRequests.filter(request => request.status === 'PENDING').length;
  const approvedCount = blockRequests.filter(request => request.status === 'APPROVED').length;

  return (
    <section className="supervisor-view">
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(120deg, rgba(14, 116, 144, 0.22), rgba(16, 185, 129, 0.1))' }}>
        <div>
          <p style={{ color: '#67e8f9', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Block supervisor</p>
          <h2 style={{ color: '#fff', fontSize: 22, margin: '3px 0' }}>Block {selectedBlock}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>Resident directory and visitor activity</p>
        </div>
        <Building2 size={28} color="#67e8f9" aria-hidden="true" />
      </div>

      {blockEmergencyAlerts.map(alert => (
        <div className="alert-incoming-banner" key={alert.id}>
          <strong style={{ color: '#fff', fontSize: 12 }}>EMERGENCY ALERT · {alert.location}</strong>
          <p style={{ color: '#e0e7ff', fontSize: 10, marginTop: 5 }}>Raised by {alert.triggeredBy} at {alert.time}</p>
          <p style={{ color: '#cbd5e1', fontSize: 10, marginTop: 4 }}>{alert.actionTaken}</p>
        </div>
      ))}

      <div className="supervisor-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {[
          { icon: Users, value: blockFlats.length, label: 'Registered flats', color: '#67e8f9' },
          { icon: Clock3, value: pendingCount, label: 'Awaiting homeowner', color: '#fbbf24' },
          { icon: ShieldCheck, value: approvedCount, label: 'Approved visits', color: '#34d399' }
        ].map(({ icon: Icon, value, label, color }) => (
          <div className="glass-card" key={label} style={{ marginBottom: 14, padding: 10, minWidth: 0 }}>
            <Icon size={15} color={color} />
            <strong style={{ display: 'block', color: '#fff', fontSize: 19, marginTop: 5 }}>{value}</strong>
            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 9, lineHeight: 1.35 }}>{label}</span>
          </div>
        ))}
      </div>

      <div className="supervisor-panels">
        <section className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ color: '#fff', fontSize: 13 }}>Block {selectedBlock} residents</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{blockFlats.length} flats</span>
          </div>
          {blockFlats.map(flat => (
            <article key={flat.flatNo} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ color: '#67e8f9', fontWeight: 800, fontSize: 12, minWidth: 48 }}>{flat.flatNo.replace('-', ':')}</span>
              <div style={{ minWidth: 0 }}>
                <strong style={{ display: 'block', color: '#fff', fontSize: 12 }}>{flat.ownerName}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{flat.familyMembers} residents · {flat.vehicles.length} vehicles</span>
              </div>
            </article>
          ))}
        </section>

        <section className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ color: '#fff', fontSize: 13 }}>Visitor activity</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{blockRequests.length} records</span>
          </div>
          {blockRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 11, padding: '10px 0' }}>No visitor activity for this block.</p>
          ) : blockRequests.map(request => (
            <article key={request.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
              <span className={`badge ${request.status === 'PENDING' ? 'badge-pending' : request.status === 'DENIED' ? 'badge-denied' : 'badge-approved'}`} style={{ fontSize: 8, padding: '3px 6px' }}>
                {request.status.replace(/_/g, ' ')}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: 'block', color: '#fff', fontSize: 11 }}>{request.visitorName}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{request.category} · {request.flatNo.replace('-', ':')} · {request.entryTime}</span>
              </div>
            </article>
          ))}
        </section>

        <section className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ color: '#fff', fontSize: 13 }}>Service requests</h3>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{blockServiceRequests.filter(request => request.status !== 'COMPLETED').length} open</span>
          </div>
          {blockServiceRequests.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 11, padding: '10px 0' }}>No service requests for this block.</p>
          ) : blockServiceRequests.map(request => (
            <article key={request.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
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
                    {request.status === 'OPEN' ? <><Clock3 size={12} /> Start</> : <><CheckCircle2 size={12} /> Complete</>}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </section>
  );
}