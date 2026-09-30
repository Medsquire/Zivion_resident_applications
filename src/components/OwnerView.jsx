import React, { useState } from 'react';
import {
  UserCheck, Shield, Clock, PlusCircle, Car, PhoneCall, Check, X, PackageCheck,
  AlertTriangle, QrCode, Share2, Copy, Search, Sparkles, Building2, Bell, ShieldAlert, Key,
  MessageSquareText, Siren, Wrench
} from 'lucide-react';
import { sound } from '../utils/audio';

export default function OwnerView({
  selectedFlat,
  requests,
  serviceRequests,
  preApprovedPasses,
  notices,
  securityContacts,
  onUpdateRequestStatus,
  onAddPreApprovedPass,
  onAddVehicle,
  onAddServiceRequest,
  onTriggerEmergency
}) {
  const [activeTab, setActiveTab] = useState('requests');

  // Pre-approval form state
  const [guestName, setGuestName] = useState('');
  const [passCategory, setPassCategory] = useState('Guest');
  const [validDate, setValidDate] = useState('Today (Valid until 11:59 PM)');
  const [expectedVeh, setExpectedVeh] = useState('');
  const [createdPass, setCreatedPass] = useState(null);

  // Denial modal state
  const [denialModalReqId, setDenialModalReqId] = useState(null);
  const [denialReason, setDenialReason] = useState('Not expecting any visitor');
  const [showSecurityContacts, setShowSecurityContacts] = useState(false);
  const [serviceCategory, setServiceCategory] = useState('Pumping');
  const [servicePriority, setServicePriority] = useState('Normal');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePhoto, setServicePhoto] = useState('');
  const [servicePhotoName, setServicePhotoName] = useState('');
  const [serviceFeedback, setServiceFeedback] = useState('');
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [vehicleFeedback, setVehicleFeedback] = useState('');

  // Filter pending requests for this flat
  const pendingRequestsForFlat = requests.filter(
    r => r.flatNo === selectedFlat.flatNo && r.status === 'PENDING'
  );

  // Filter all requests history for this flat
  const flatHistoryRequests = requests.filter(r => r.flatNo === selectedFlat.flatNo);

  // Filter pre-approved passes for this flat
  const flatPasses = preApprovedPasses.filter(p => p.flatNo === selectedFlat.flatNo);
  const flatServiceRequests = serviceRequests.filter(request => request.flatNo === selectedFlat.flatNo);
  const gateContacts = securityContacts.filter(contact => contact.status === 'ON_DUTY' && contact.gate.toLowerCase().includes('gate'));

  const submitServiceRequest = async (event) => {
    event.preventDefault();
    const savedRequest = await onAddServiceRequest({
      flatNo: selectedFlat.flatNo,
      ownerName: selectedFlat.ownerName,
      category: serviceCategory,
      priority: servicePriority,
      description: serviceDescription.trim(),
      photo: servicePhoto
    });
    if (!savedRequest) return;
    setServiceDescription('');
    setServicePhoto('');
    setServicePhotoName('');
    setServiceFeedback(`${serviceCategory} request submitted.`);
  };

  const handleServicePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setServiceFeedback('Choose an image smaller than 3 MB.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setServicePhoto(reader.result);
        setServicePhotoName(file.name);
        setServiceFeedback('');
      }
    };
    reader.readAsDataURL(file);
  };

  const submitVehicle = async (event) => {
    event.preventDefault();
    const savedVehicle = await onAddVehicle({
      flatNo: selectedFlat.flatNo,
      ownerName: selectedFlat.ownerName,
      plate: vehiclePlate.trim().toUpperCase(),
      type: vehicleType
    });
    if (!savedVehicle) return;
    setVehicleFeedback(`${vehiclePlate.trim().toUpperCase()} submitted for Admin approval.`);
    setVehiclePlate('');
    setVehicleType('Car');
    setShowVehicleModal(false);
  };

  const requestGeneralHelp = async () => {
    const savedRequest = await onAddServiceRequest({
      flatNo: selectedFlat.flatNo,
      ownerName: selectedFlat.ownerName,
      category: 'General Help',
      priority: 'Urgent',
      description: 'Resident requested assistance from security.'
    });
    if (!savedRequest) return;
    setShowSecurityContacts(false);
    setActiveTab('services');
    setServiceFeedback('Your urgent help request was sent to the block supervisor.');
  };

  const triggerEmergency = async () => {
    if (window.confirm(`Send an emergency alert for Flat ${selectedFlat.flatNo.replace('-', ':')}?`)) {
      const savedAlert = await onTriggerEmergency();
      if (!savedAlert) return;
      setShowSecurityContacts(false);
    }
  };

  const handleCreatePass = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert("Please enter guest or visitor name!");
      return;
    }

    const code = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(100 + Math.random() * 900)}`;
    const newPass = {
      id: `PASS-${Math.floor(100 + Math.random() * 900)}`,
      guestName,
      flatNo: selectedFlat.flatNo,
      category: passCategory,
      passCode: code,
      validDate,
      status: 'ACTIVE',
      expectedVeh: expectedVeh || 'N/A',
      qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-${code.replace(/\s+/g,'')}-${selectedFlat.flatNo}`
    };

    const savedPass = await onAddPreApprovedPass(newPass);
    if (!savedPass) return;
    sound.playApprovedSound();
    setCreatedPass(newPass);
    setGuestName('');
    setExpectedVeh('');
  };

  const handleAcceptRequest = (id) => {
    sound.playApprovedSound();
    onUpdateRequestStatus(id, 'APPROVED', `Accepted by Flat Owner (${selectedFlat.ownerName})`);
  };

  const handleLeaveAtGateRequest = (id) => {
    sound.playApprovedSound();
    onUpdateRequestStatus(id, 'LEAVE_AT_GATE', `Instructed by owner: Leave package at Security Desk Shelf B`);
  };

  const handleDenyRequest = (id) => {
    sound.playDeniedSound();
    onUpdateRequestStatus(id, 'DENIED', `Denied by owner: ${denialReason}`);
    setDenialModalReqId(null);
  };

  return (
    <div className="owner-view">
      {/* Resident Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(120deg, #0b1220 0%, #10243a 100%)',
        border: '1px solid rgba(50, 130, 246, 0.45)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="badge badge-approved" style={{ background: '#3282f6', color: '#ffffff' }}>
                FLAT {selectedFlat.flatNo.replace('-', ':')}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedFlat.tower}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginTop: 4 }}>{selectedFlat.ownerName}</h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedFlat.phone} • Intercom #{selectedFlat.intercom}</p>
          </div>

          <button
            onClick={() => setShowSecurityContacts(true)}
            className="btn btn-secondary"
            style={{ padding: '8px 10px', fontSize: 10, gap: 5 }}
            title="Call or message apartment security"
          >
            <PhoneCall size={15} color="#22d3ee" />
            <span>Security</span>
          </button>
        </div>
      </div>

      {showSecurityContacts && (
        <div className="modal-overlay" role="presentation" onClick={event => { if (event.target === event.currentTarget) setShowSecurityContacts(false); }}>
          <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="security-contacts-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h3 id="security-contacts-title" style={{ color: 'var(--text-main)', fontSize: 16 }}>Security contacts</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Flat {selectedFlat.flatNo.replace('-', ':')} · Intercom #{selectedFlat.intercom}</p>
              </div>
              <button className="btn btn-secondary" aria-label="Close security contacts" onClick={() => setShowSecurityContacts(false)} style={{ padding: 7 }}><X size={16} /></button>
            </div>

            {gateContacts.map(contact => (
              <article key={contact.id} style={{ padding: '12px 0', borderTop: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-main)', fontSize: 12 }}>{contact.name}</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: 10, margin: '3px 0 9px' }}>{contact.gate} · {contact.phone}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <a className="btn btn-success" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`} style={{ fontSize: 11, padding: 8, textDecoration: 'none' }}>
                    <PhoneCall size={14} /><span>Normal call</span>
                  </a>
                  <a className="btn btn-secondary" href={`sms:${contact.phone.replace(/[^+\d]/g, '')}?body=${encodeURIComponent(`Hello, I am calling from Flat ${selectedFlat.flatNo.replace('-', ':')}.`)}`} style={{ fontSize: 11, padding: 8, textDecoration: 'none' }}>
                    <MessageSquareText size={14} /><span>Message</span>
                  </a>
                </div>
              </article>
            ))}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <button className="btn btn-primary" onClick={requestGeneralHelp} style={{ fontSize: 10, padding: 9 }}>
                <Wrench size={14} /><span>Request help</span>
              </button>
              <button className="btn btn-danger" onClick={triggerEmergency} style={{ fontSize: 10, padding: 9 }}>
                <Siren size={14} /><span>Emergency SOS</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* PROMINENT REAL-TIME PENDING VISITOR REQUEST BANNER */}
      {pendingRequestsForFlat.map(req => (
        <div key={req.id} className="alert-incoming-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={16} color="#fbbf24" className="pulse-card" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                INCOMING GATE APPROVAL REQUEST
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#e0e7ff', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 10 }}>
              {req.entryTime}
            </span>
          </div>

          {/* Visitor Card Details */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <img
              src={req.photo}
              alt={req.visitorName}
              className="visitor-avatar"
              style={{ width: 54, height: 54, border: '2px solid #22d3ee' }}
            />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{req.visitorName}</h3>
              <p style={{ fontSize: 12, color: '#bfdbfe', fontWeight: 600 }}>
                {req.company} • <span style={{ color: '#ffffff' }}>{req.category}</span>
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Vehicle: {req.vehicleNo} | Purpose: {req.purpose}
              </p>
            </div>
          </div>

          {/* Interactive Response Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: req.category === 'Delivery' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
            <button
              onClick={() => handleAcceptRequest(req.id)}
              className="btn btn-success"
              style={{ padding: '10px 6px', fontSize: 11, gap: 4 }}
            >
              <Check size={14} />
              <span>ACCEPT</span>
            </button>

            {req.category === 'Delivery' && (
              <button
                onClick={() => handleLeaveAtGateRequest(req.id)}
                className="btn btn-primary"
                style={{ padding: '10px 6px', fontSize: 11, gap: 4, background: '#0284c7' }}
              >
                <PackageCheck size={14} />
                <span>LEAVE AT GATE</span>
              </button>
            )}

            <button
              onClick={() => setDenialModalReqId(req.id)}
              className="btn btn-danger"
              style={{ padding: '10px 6px', fontSize: 11, gap: 4 }}
            >
              <X size={14} />
              <span>DENY</span>
            </button>
          </div>
        </div>
      ))}

      {/* Sub Navigation Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 3, marginBottom: 14, gap: 3 }}>
        <button
          className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('requests')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Clock size={13} />
          <span>My Visitors</span>
        </button>

        <button
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('services'); setServiceFeedback(''); }}
          style={{ width: '100%', fontSize: 10, padding: '7px 3px', borderRadius: 9, border: 'none' }}
        >
          <Wrench size={13} />
          <span>Services</span>
        </button>

        <button
          className={`btn ${activeTab === 'preapprove' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('preapprove')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <QrCode size={13} />
          <span>Pre-Approve</span>
        </button>

        <button
          className={`btn ${activeTab === 'vehicles' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('vehicles')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Car size={13} />
          <span>My Vehicles</span>
        </button>

        <button
          className={`btn ${activeTab === 'notices' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('notices')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Building2 size={13} />
          <span>Notices</span>
        </button>
      </div>

      {/* TAB 1: MY VISITORS HISTORY */}
      {activeTab === 'requests' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Visitor History ({flatHistoryRequests.length})</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flat {selectedFlat.flatNo.replace('-', ':')}</span>
          </div>

          {flatHistoryRequests.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <Shield size={32} color="#3282f6" style={{ opacity: 0.72, marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>No visitor history yet</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>New entry requests from the gate will appear here.</p>
            </div>
          ) : (
            <div className="visitor-history-grid">
              {flatHistoryRequests.map(req => (
                <article key={req.id} className="glass-card visitor-history-card">
                  <div className="visitor-card-header">
                    <div className="visitor-card-person">
                      <img src={req.photo} alt={req.visitorName} className="visitor-avatar" />
                      <div className="visitor-card-identity">
                        <h4>{req.visitorName}</h4>
                        <p>{req.company} <span aria-hidden="true">·</span> {req.category}</p>
                      </div>
                    </div>
                    {req.status === 'APPROVED' && <span className="badge badge-approved">APPROVED</span>}
                    {req.status === 'LEAVE_AT_GATE' && <span className="badge badge-leave">AT GATE</span>}
                    {req.status === 'DENIED' && <span className="badge badge-denied">DENIED</span>}
                    {req.status === 'CHECKED_OUT' && <span className="badge badge-checkout">EXITED</span>}
                    {req.status === 'PENDING' && <span className="badge badge-pending">PENDING</span>}
                  </div>

                  <div className="visitor-card-details">
                    <div>
                      <Clock size={15} aria-hidden="true" />
                      <span><small>Entry time</small><strong>{req.entryTime}</strong><em>{req.date}</em></span>
                    </div>
                    <div>
                      <Car size={15} aria-hidden="true" />
                      <span><small>Vehicle</small><strong>{req.vehicleNo || 'Not provided'}</strong></span>
                    </div>
                  </div>

                  {req.notes && <p className="visitor-card-note">{req.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRE-APPROVE GUEST PASS GENERATOR */}
      {activeTab === 'preapprove' && (
        <div>
          <form onSubmit={handleCreatePass} className="glass-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="#3282f6" />
              <span>Pre-Approve Visitor / Create Access Pass</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Guest / Visitor Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Aunt Kavita, Urban Company Electrician"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={passCategory}
                  onChange={(e) => setPassCategory(e.target.value)}
                >
                  <option value="Guest">Guest / Friend</option>
                  <option value="Delivery">Delivery / Courier</option>
                  <option value="Service">Service Technician</option>
                  <option value="Cab">Cab Driver</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Validity Period</label>
                <select
                  className="form-select"
                  value={validDate}
                  onChange={(e) => setValidDate(e.target.value)}
                >
                  <option value="Today (Valid until 11:59 PM)">Today Only</option>
                  <option value="Tomorrow (Valid 24 Hours)">Tomorrow</option>
                  <option value="This Weekend">This Weekend</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expected Vehicle Plate (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. MH 12 AB 9988"
                value={expectedVeh}
                onChange={(e) => setExpectedVeh(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              <QrCode size={16} />
              <span>GENERATE 6-DIGIT PASSCODE</span>
            </button>
          </form>

          {/* Newly Generated Pass Card with Share/Copy */}
          {createdPass && (
            <div className="glass-card" style={{ border: '1.5px solid #10b981', background: 'rgba(16, 185, 129, 0.08)' }}>
              <div style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 800, color: '#34d399', letterSpacing: 1 }}>
                ✅ PASS CREATED SUCCESSFULLY
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>{createdPass.guestName}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{createdPass.validDate}</p>
                </div>
                <img src={createdPass.qrUrl} alt="QR Code" style={{ width: 50, height: 50, borderRadius: 6, border: '1px solid #fff' }} />
              </div>

              <div style={{
                background: '#0f172a',
                padding: '10px',
                borderRadius: 8,
                textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 22,
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: 4,
                marginBottom: 10
              }}>
                {createdPass.passCode}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(createdPass.passCode);
                    alert(`Passcode ${createdPass.passCode} copied to clipboard! Share with ${createdPass.guestName}.`);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: 11, gap: 5 }}
                >
                  <Copy size={13} />
                  <span>Copy Code</span>
                </button>

                <button
                  onClick={() => alert(`Invoking WhatsApp share link for ${createdPass.guestName}... Passcode: ${createdPass.passCode}`)}
                  className="btn btn-success"
                  style={{ flex: 1, fontSize: 11, gap: 5 }}
                >
                  <Share2 size={13} />
                  <span>Share Pass</span>
                </button>
              </div>
            </div>
          )}

          {/* List of Active Pre-Approved Passes */}
          <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', margin: '14px 0 8px 0' }}>Active Gate Passes</h4>
          <div className="owner-record-grid">
          {flatPasses.map(p => (
            <div key={p.id} className="glass-card" style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{p.guestName}</h5>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.validDate} • {p.category}</p>
                </div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  background: '#eff6ff',
                  color: '#2563eb',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: 13
                }}>
                  {p.passCode}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="owner-service-layout">
          <form onSubmit={submitServiceRequest} className="glass-card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Wrench size={16} color="#3282f6" /> Request apartment service
            </h3>
            <div className="form-group">
              <label className="form-label" htmlFor="service-category">Service type *</label>
              <select id="service-category" className="form-select" value={serviceCategory} onChange={event => setServiceCategory(event.target.value)} required>
                <option>Pumping</option>
                <option>Electrical</option>
                <option>Plumbing</option>
                <option>Lift / Elevator</option>
                <option>Water supply</option>
                <option>Cleaning</option>
                <option>Pest control</option>
                <option>General Help</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="service-priority">Priority *</label>
              <select id="service-priority" className="form-select" value={servicePriority} onChange={event => setServicePriority(event.target.value)} required>
                <option>Normal</option>
                <option>Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="service-description">Describe the issue *</label>
              <textarea id="service-description" className="form-textarea" rows={3} value={serviceDescription} onChange={event => setServiceDescription(event.target.value)} placeholder="Add details to help the team respond" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="service-photo">Issue photo (Optional)</label>
              <input key={servicePhotoName || 'empty'} id="service-photo" type="file" className="form-input" accept="image/*" onChange={handleServicePhotoChange} />
              {servicePhoto && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <img src={servicePhoto} alt="Service issue preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{servicePhotoName}</span>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 11 }}>
              <Wrench size={15} /><span>SUBMIT SERVICE REQUEST</span>
            </button>
            {serviceFeedback && <p role="status" style={{ color: '#34d399', fontSize: 11, marginTop: 10 }}>{serviceFeedback}</p>}
          </form>

          <section className="glass-card">
            <h3 style={{ color: 'var(--text-main)', fontSize: 13, marginBottom: 8 }}>Service history ({flatServiceRequests.length})</h3>
            {flatServiceRequests.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>No service requests for this flat.</p>
            ) : (
              <div className="owner-record-grid">
              {flatServiceRequests.map(request => (
              <article key={request.id} style={{ padding: '10px 0', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <strong style={{ color: 'var(--text-main)', fontSize: 12 }}>{request.category}</strong>
                  <span className={`badge ${request.status === 'COMPLETED' ? 'badge-approved' : request.status === 'IN_PROGRESS' ? 'badge-leave' : 'badge-pending'}`} style={{ fontSize: 8 }}>{request.status.replace('_', ' ')}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 5 }}>{request.description}</p>
                {request.photo && <img src={request.photo} alt={`${request.category} issue`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 6, marginTop: 8 }} />}
                <span style={{ color: '#8b98a8', fontSize: 9 }}>{request.priority} priority · {request.createdAt}</span>
              </article>
              ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: MY VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="glass-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Car size={16} color="#3282f6" />
            <span>Registered Vehicles for {selectedFlat.flatNo.replace('-', ':')}</span>
          </h3>

          {selectedFlat.vehicles && selectedFlat.vehicles.length > 0 ? (
            <div className="owner-record-grid">
            {selectedFlat.vehicles.map((v, idx) => (
              <div key={idx} style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                marginBottom: 8,
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    color: '#fbbf24',
                    background: '#0f172a',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {v.plate}
                  </span>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{v.type}</p>
                </div>
                <span className={`badge ${v.status === 'PENDING_APPROVAL' ? 'badge-pending' : 'badge-approved'}`} style={{ fontSize: 9 }}>{v.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : v.slot}</span>
              </div>
            ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No vehicles registered yet for this flat.</p>
          )}

          <button
            onClick={() => setShowVehicleModal(true)}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 8, fontSize: 12 }}
          >
            + Add vehicle
          </button>
          {vehicleFeedback && <p role="status" style={{ color: '#34d399', fontSize: 11, marginTop: 9 }}>{vehicleFeedback}</p>}
        </div>
      )}

      {showVehicleModal && (
        <div className="modal-overlay" role="presentation" onClick={event => { if (event.target === event.currentTarget) setShowVehicleModal(false); }}>
          <form className="modal-content" role="dialog" aria-modal="true" aria-labelledby="add-vehicle-title" onSubmit={submitVehicle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 id="add-vehicle-title" style={{ color: 'var(--text-main)', fontSize: 16 }}>Add vehicle</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Flat {selectedFlat.flatNo.replace('-', ':')}</p>
              </div>
              <button type="button" className="btn btn-secondary" aria-label="Close vehicle form" onClick={() => setShowVehicleModal(false)} style={{ padding: 7 }}><X size={16} /></button>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="vehicle-plate">Registration plate *</label>
              <input id="vehicle-plate" className="form-input" value={vehiclePlate} onChange={event => setVehiclePlate(event.target.value)} placeholder="e.g. MH 12 CD 9000" autoComplete="off" required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="vehicle-type">Vehicle type *</label>
              <select id="vehicle-type" className="form-select" value={vehicleType} onChange={event => setVehicleType(event.target.value)} required>
                <option>Car</option>
                <option>Motorcycle</option>
                <option>Scooter</option>
                <option>Electric vehicle</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit for approval</button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: COMMUNITY NOTICES */}
      {activeTab === 'notices' && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>Society Announcements</h3>
          <div className="owner-record-grid">
          {notices.map(n => (
            <div key={n.id} className="glass-card">
              <span className="chip" style={{ background: 'rgba(50,130,246,0.1)', color: '#2563eb', marginBottom: 6 }}>
                {n.category}
              </span>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>{n.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0' }}>{n.content}</p>
              <div style={{ fontSize: 10, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
                <span>Posted by: {n.postedBy}</span>
                <span>{n.date}</span>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* DENIAL REASON MODAL OVERLAY */}
      {denialModalReqId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', marginBottom: 10 }}>Deny Visitor Entry</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Select a reason for denying entry so the gate guard can inform the visitor:
            </p>

            {[
              "Not expecting any visitor or delivery",
              "Wrong Flat destination selected by guard",
              "Unsolicited vendor / Marketing solicitor",
              "Security concern / Ask visitor to call resident"
            ].map((reason, idx) => (
              <div
                key={idx}
                onClick={() => setDenialReason(reason)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: denialReason === reason ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.04)',
                  border: denialReason === reason ? '1px solid #ef4444' : '1px solid var(--border-color)',
                  color: denialReason === reason ? '#f87171' : 'var(--text-main)',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 8,
                  cursor: 'pointer'
                }}
              >
                {reason}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={() => setDenialModalReqId(null)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDenyRequest(denialModalReqId)}
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                CONFIRM DENIAL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
