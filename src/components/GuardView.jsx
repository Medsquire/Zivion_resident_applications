import React, { useState } from 'react';
import {
  UserPlus, Clock, Car, AlertOctagon, CheckCircle2, XCircle, ShieldCheck,
  PhoneCall, QrCode, Search, Filter, Camera, ArrowRight, Check, AlertTriangle, Package, User, Truck, Wrench
} from 'lucide-react';
import { sound } from '../utils/audio';

export default function GuardView({
  requests,
  flats,
  guards,
  vehicles,
  preApprovedPasses,
  onAddRequest,
  onUpdateRequestStatus,
  onTriggerEmergency,
  onVerifyPass
}) {
  const [activeTab, setActiveTab] = useState('entry'); // 'entry', 'activity', 'vehicles', 'passcode'
  
  // Check-in Form state
  const [category, setCategory] = useState('Delivery');
  const [company, setCompany] = useState('Amazon Prime');
  const [targetFlat, setTargetFlat] = useState('A-402');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [photoIndex, setPhotoIndex] = useState(0);

  // Passcode verification state
  const [inputPasscode, setInputPasscode] = useState('');
  const [passVerificationResult, setPassVerificationResult] = useState(null);

  // Filter state for Activity Log
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample photo set for guard camera simulation
  const samplePhotos = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200"
  ];

  const brandPresets = {
    Delivery: ["Amazon Prime", "Zomato", "Swiggy", "Dunzo", "Flipkart", "Blinkit", "Courier"],
    Guest: ["Personal Friend", "Relative", "Family Member", "Neighbor"],
    "Daily Help": ["House Maid", "Cook", "Car Washer", "Gardener", "Driver"],
    Cab: ["Uber", "Ola", "InDrive", "Rapido"],
    Service: ["Plumber", "Electrician", "Urban Company", "Internet Tech", "Carpenter"]
  };

  const handleSendApprovalRequest = (e) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      alert("Please enter visitor's name!");
      return;
    }

    const flatObj = flats.find(f => f.flatNo === targetFlat) || flats[0];

    const newReq = {
      id: `VIS-${Math.floor(1000 + Math.random() * 9000)}`,
      visitorName,
      category,
      company: company || category,
      phone: visitorPhone || "+91 98000 00000",
      flatNo: targetFlat,
      ownerName: flatObj.ownerName,
      gate: "Gate 1 (Main Entrance)",
      vehicleNo: vehicleNo.trim() ? vehicleNo : "N/A",
      photo: samplePhotos[photoIndex],
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: "Today",
      status: "PENDING",
      purpose: purpose || `${category} Visit`,
      requestedByGuard: "Ramesh Singh (Gate 1)",
      notes: "Awaiting Resident Confirmation"
    };

    onAddRequest(newReq);
    sound.playNotificationSound();

    // Reset form
    setVisitorName('');
    setVisitorPhone('');
    setVehicleNo('');
    setPurpose('');
    setPhotoIndex((prev) => (prev + 1) % samplePhotos.length);
    setActiveTab('activity');
  };

  const handleVerifyPasscode = (e) => {
    e.preventDefault();
    const cleanCode = inputPasscode.replace(/\s+/g, '');
    const foundPass = preApprovedPasses.find(p => p.passCode.replace(/\s+/g, '') === cleanCode);

    if (foundPass) {
      sound.playApprovedSound();
      setPassVerificationResult({
        success: true,
        pass: foundPass,
        message: `PASS VERIFIED! Entry granted for ${foundPass.guestName} to Flat ${foundPass.flatNo}.`
      });

      // Automatically create approved log
      const newReq = {
        id: `VIS-${Math.floor(1000 + Math.random() * 9000)}`,
        visitorName: foundPass.guestName,
        category: foundPass.category,
        company: "Pre-Approved Pass",
        phone: "+91 98765 00112",
        flatNo: foundPass.flatNo,
        ownerName: flats.find(f => f.flatNo === foundPass.flatNo)?.ownerName || "Resident",
        gate: "Gate 1 (Main Entrance)",
        vehicleNo: foundPass.expectedVeh || "N/A",
        photo: samplePhotos[1],
        entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: "Today",
        status: "APPROVED",
        purpose: `Pre-Approved Guest Pass #${foundPass.id}`,
        requestedByGuard: "Gate Verified Pass",
        notes: "Verified via 6-digit Resident Access OTP"
      };
      onAddRequest(newReq);
    } else {
      sound.playDeniedSound();
      setPassVerificationResult({
        success: false,
        message: "INVALID PASSCODE! Code not found or expired. Please check with Flat Owner."
      });
    }
  };

  // Filtered requests for Activity tab
  const filteredRequests = requests.filter(req => {
    const matchesFilter = activityFilter === 'ALL' || req.status === activityFilter;
    const matchesQuery = searchQuery === '' ||
      req.visitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.flatNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="guard-view">
      {/* Guard Status Header Card */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={guards[0].photo}
              alt={guards[0].name}
              style={{ width: 44, height: 44, borderRadius: 12, border: '2px solid #10b981', objectFit: 'cover' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{guards[0].name}</h3>
                <span className="badge badge-approved" style={{ fontSize: 9 }}>ON DUTY</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{guards[0].gate} • {guards[0].badgeNo}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (window.confirm("ARE YOU SURE? This will trigger an EMERGENCY SOS ALERT across all flats!")) {
                onTriggerEmergency();
              }
            }}
            className="btn btn-danger"
            style={{ padding: '8px 12px', fontSize: 11, gap: 5, borderRadius: 10 }}
          >
            <AlertOctagon size={16} />
            <span>PANIC SOS</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 3, marginBottom: 14, gap: 2 }}>
        <button
          className={`btn ${activeTab === 'entry' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('entry')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <UserPlus size={13} />
          <span>Check-In</span>
        </button>

        <button
          className={`btn ${activeTab === 'passcode' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('passcode')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <QrCode size={13} />
          <span>Verify OTP</span>
        </button>

        <button
          className={`btn ${activeTab === 'activity' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('activity')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none', position: 'relative' }}
        >
          <Clock size={13} />
          <span>Activity Log</span>
          {requests.filter(r => r.status === 'PENDING').length > 0 && (
            <span style={{ position: 'absolute', top: 3, right: 3, width: 7, height: 7, borderRadius: '50%', background: '#f59e0b' }} />
          )}
        </button>

        <button
          className={`btn ${activeTab === 'vehicles' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('vehicles')}
          style={{ flex: 1, fontSize: 11, padding: '7px 4px', borderRadius: 9, border: 'none' }}
        >
          <Car size={13} />
          <span>Vehicles</span>
        </button>
      </div>

      {/* TAB 1: VISITOR CHECK-IN FORM */}
      {activeTab === 'entry' && (
        <form onSubmit={handleSendApprovalRequest} className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={16} color="#10b981" />
              <span>New Gate Entry Check-In</span>
            </h3>
            <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6 }}>Gate 1</span>
          </div>

          {/* Category Selector */}
          <div className="form-group">
            <label className="form-label">Visitor Type Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { id: 'Delivery', icon: Package, label: 'Delivery' },
                { id: 'Guest', icon: User, label: 'Guest' },
                { id: 'Daily Help', icon: ShieldCheck, label: 'Daily Help' },
                { id: 'Cab', icon: Truck, label: 'Cab / Taxi' },
                { id: 'Service', icon: Wrench, label: 'Service Tech' }
              ].map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      setCompany(brandPresets[cat.id]?.[0] || cat.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid #6366f1' : '1px solid var(--border-color)',
                      color: isSelected ? '#a5b4fc' : 'var(--text-muted)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Brand Presets Chips */}
          <div className="form-group">
            <label className="form-label">Company / Service Brand</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {(brandPresets[category] || []).map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setCompany(b)}
                  className={`chip ${company === b ? 'active' : ''}`}
                  style={{
                    background: company === b ? '#6366f1' : 'rgba(255,255,255,0.06)',
                    color: company === b ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Amazon, Zomato, Relative"
            />
          </div>

          {/* Target Flat Selection */}
          <div className="form-group">
            <label className="form-label">Destination Flat Number</label>
            <select
              className="form-select"
              value={targetFlat}
              onChange={(e) => setTargetFlat(e.target.value)}
            >
              {flats.map(f => (
                <option key={f.flatNo} value={f.flatNo}>
                  {f.flatNo} — {f.ownerName} ({f.tower})
                </option>
              ))}
            </select>
          </div>

          {/* Visitor Personal Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Visitor Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rahul Sharma"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98765 00000"
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Vehicle & Photo Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Vehicle Plate (If Any)</label>
              <input
                type="text"
                className="form-input"
                placeholder="MH 12 AB 1234"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gate Camera Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img
                  src={samplePhotos[photoIndex]}
                  alt="Gate Snap"
                  className="visitor-avatar"
                  style={{ width: 38, height: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setPhotoIndex((prev) => (prev + 1) % samplePhotos.length)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 10px', fontSize: 10, gap: 4 }}
                >
                  <Camera size={12} />
                  <span>Snap</span>
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purpose / Order Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Delivery box, Guest stay, AC repair"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Submit Action */}
          <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '12px', fontSize: 13, gap: 8, marginTop: 4 }}>
            <ArrowRight size={16} />
            <span>SEND APPROVAL REQUEST TO FLAT OWNER</span>
          </button>
        </form>
      )}

      {/* TAB 2: VERIFY 6-DIGIT RESIDENT PASSCODE */}
      {activeTab === 'passcode' && (
        <div className="glass-card">
          <div style={{ textAlign: 'center', padding: '10px 0 16px 0' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}>
              <QrCode size={26} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Verify Resident Passcode</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter 6-digit OTP code provided by visitor or scan pass</p>
          </div>

          <form onSubmit={handleVerifyPasscode}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit OTP (e.g. 849 201)"
                value={inputPasscode}
                onChange={(e) => setInputPasscode(e.target.value)}
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: 4,
                  textAlign: 'center',
                  padding: '14px',
                  background: '#0f172a',
                  color: '#38bdf8',
                  border: '1.5px solid #3b82f6'
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              <ShieldCheck size={16} />
              <span>VERIFY PASSCODE & ALLOW ENTRY</span>
            </button>
          </form>

          {/* Verification Feedback Card */}
          {passVerificationResult && (
            <div style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 10,
              background: passVerificationResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: passVerificationResult.success ? '1px solid #10b981' : '1px solid #ef4444',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}>
              {passVerificationResult.success ? <CheckCircle2 color="#10b981" size={20} /> : <XCircle color="#ef4444" size={20} />}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: passVerificationResult.success ? '#34d399' : '#f87171' }}>
                  {passVerificationResult.success ? "Pass Verified!" : "Verification Failed"}
                </h4>
                <p style={{ fontSize: 11, color: 'var(--text-main)', marginTop: 2 }}>{passVerificationResult.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GATE ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div>
          {/* Search & Filter bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: 11 }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search visitor, flat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, fontSize: 12 }}
              />
            </div>
          </div>

          {/* Status Filters */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 6, marginBottom: 10 }}>
            {['ALL', 'PENDING', 'APPROVED', 'LEAVE_AT_GATE', 'DENIED', 'CHECKED_OUT'].map(status => (
              <button
                key={status}
                onClick={() => setActivityFilter(status)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  border: activityFilter === status ? '1px solid #6366f1' : '1px solid var(--border-color)',
                  background: activityFilter === status ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)',
                  color: activityFilter === status ? '#a5b4fc' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Request Cards */}
          {filteredRequests.map(req => {
            const getBadge = (s) => {
              switch (s) {
                case 'PENDING': return <span className="badge badge-pending">PENDING OWNER</span>;
                case 'APPROVED': return <span className="badge badge-approved">APPROVED</span>;
                case 'LEAVE_AT_GATE': return <span className="badge badge-leave">LEAVE AT GATE</span>;
                case 'DENIED': return <span className="badge badge-denied">DENIED</span>;
                case 'CHECKED_OUT': return <span className="badge badge-checkout">EXITED</span>;
                default: return null;
              }
            };

            return (
              <div key={req.id} className="glass-card" style={{
                borderLeft: req.status === 'PENDING' ? '4px solid #f59e0b' :
                           req.status === 'APPROVED' ? '4px solid #10b981' :
                           req.status === 'DENIED' ? '4px solid #ef4444' : '4px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img src={req.photo} alt={req.visitorName} className="visitor-avatar" />
                    <div>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{req.visitorName}</h4>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>{req.company}</span> • {req.category}
                      </p>
                    </div>
                  </div>
                  {getBadge(req.status)}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  fontSize: 11,
                  background: 'rgba(0,0,0,0.2)',
                  padding: '8px 10px',
                  borderRadius: 8,
                  marginBottom: 8
                }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Flat:</span> <strong style={{ color: '#38bdf8' }}>{req.flatNo}</strong> ({req.ownerName})</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Entry:</span> {req.entryTime}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Vehicle:</span> {req.vehicleNo}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Gate:</span> {req.gate}</div>
                </div>

                {req.notes && (
                  <p style={{ fontSize: 11, color: '#9ca3af', italic: 'true', marginBottom: 8 }}>
                    💡 <em>{req.notes}</em>
                  </p>
                )}

                {/* Guard Action Buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {req.status === 'APPROVED' && (
                    <button
                      onClick={() => onUpdateRequestStatus(req.id, 'CHECKED_OUT', 'Checked Out by Gate Security')}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: 10, flex: 1 }}
                    >
                      Mark Exit (Check Out)
                    </button>
                  )}

                  {req.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        sound.playNotificationSound();
                        alert(`Re-sent notification alert to Flat ${req.flatNo} (${req.ownerName})!`);
                      }}
                      className="btn btn-warning"
                      style={{ padding: '6px 10px', fontSize: 10, flex: 1 }}
                    >
                      Resend Alert
                    </button>
                  )}

                  <button
                    onClick={() => alert(`Simulating intercom call to Flat ${req.flatNo}... Ext #${flats.find(f => f.flatNo === req.flatNo)?.intercom || '101'}`)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 10px', fontSize: 10 }}
                  >
                    <PhoneCall size={12} />
                    <span>Call Intercom</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: VEHICLE LOG REGISTRY */}
      {activeTab === 'vehicles' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Car size={16} color="#38bdf8" />
              <span>Vehicle Security Registry</span>
            </h3>
            <span className="badge badge-approved" style={{ fontSize: 9 }}>{vehicles.length} Inside</span>
          </div>

          {vehicles.map(v => (
            <div key={v.id} style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '10px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              marginBottom: 8,
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 800,
                    color: '#fbbf24',
                    background: '#1e1b4b',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 12,
                    border: '1px solid #4338ca'
                  }}>
                    {v.plate}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{v.flatNo}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {v.type} • {v.ownerName}
                </p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-approved" style={{ fontSize: 9 }}>{v.slot}</span>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{v.entryTime}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
