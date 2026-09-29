import React, { useState } from 'react';
import { Building2, Check, Shield, UserRound, Users, Wrench } from 'lucide-react';

const PEOPLE_TYPES = [
  { id: 'guard', label: 'Guards', icon: Shield },
  { id: 'household', label: 'House members', icon: UserRound },
  { id: 'staff', label: 'Staff', icon: Wrench }
];

export default function PeopleManagementView({
  accessLevel,
  selectedBlock: assignedBlock,
  flats,
  guards,
  householdMembers,
  staff,
  onAddPerson
}) {
  const [activeType, setActiveType] = useState('guard');
  const [adminBlock, setAdminBlock] = useState('A');
  const [flatNo, setFlatNo] = useState(flats[0]?.flatNo || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [assignment, setAssignment] = useState('Security Guard');
  const [gate, setGate] = useState('Gate 1');
  const [feedback, setFeedback] = useState('');

  const isAdmin = accessLevel === 'admin';
  const block = isAdmin ? adminBlock : assignedBlock;
  const blockFlats = flats.filter(flat => flat.flatNo.startsWith(`${block}-`));
  const memberFlats = isAdmin ? flats : blockFlats;
  const selectedFlatNo = memberFlats.some(flat => flat.flatNo === flatNo) ? flatNo : memberFlats[0]?.flatNo || '';
  const people = activeType === 'guard'
    ? guards.filter(person => isAdmin || !person.block || person.block === block)
    : activeType === 'household'
      ? householdMembers.filter(person => isAdmin || person.block === block)
      : staff.filter(person => isAdmin || person.block === block);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const personBlock = activeType === 'household'
      ? selectedFlatNo.split('-')[0]
      : block;
    const addedPerson = await onAddPerson({
      type: activeType,
      name: name.trim(),
      phone: phone.trim(),
      block: personBlock,
      flatNo: activeType === 'household' ? selectedFlatNo : undefined,
      assignment,
      gate: activeType === 'guard' ? gate : undefined
    });
    if (!addedPerson) return;
    setFeedback(`${name.trim()} added to ${activeType === 'household' ? `Flat ${selectedFlatNo.replace('-', ':')}` : `Block ${personBlock}`}.`);
    setName('');
    setPhone('');
  };

  const updateAdminBlock = (value) => {
    setAdminBlock(value);
    setFeedback('');
  };

  const heading = PEOPLE_TYPES.find(type => type.id === activeType)?.label;

  return (
    <section className="people-management">
      <div style={{ marginBottom: 14 }}>
        <p style={{ color: '#67e8f9', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>
          {isAdmin ? 'Apartment-wide access' : `Block ${block} access`}
        </p>
        <h2 style={{ color: '#fff', fontSize: 20, marginTop: 4 }}>People directory</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginBottom: 14 }}>
        {PEOPLE_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`btn ${activeType === id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveType(id);
              setAssignment(id === 'household' ? 'Family member' : id === 'staff' ? 'Electrical' : 'Security Guard');
              setFeedback('');
            }}
            style={{ minWidth: 0, padding: '9px 4px', fontSize: 10 }}
          >
            <Icon size={14} /> <span>{label}</span>
          </button>
        ))}
      </div>

      <form className="glass-card" onSubmit={handleSubmit}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#fff', fontSize: 14, marginBottom: 12 }}>
          <Users size={16} color="#34d399" /> Add {activeType === 'household' ? 'house member' : activeType}
        </h3>

        <div className="form-group">
          <label className="form-label" htmlFor="person-name">Full name *</label>
          <input id="person-name" className="form-input" value={name} onChange={event => setName(event.target.value)} placeholder="Enter full name" required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="person-phone">Phone number *</label>
          <input id="person-phone" type="tel" className="form-input" value={phone} onChange={event => setPhone(event.target.value)} placeholder="Enter phone number" required />
        </div>

        {isAdmin && activeType !== 'household' && (
          <div className="form-group">
            <label className="form-label" htmlFor="person-block">Assigned block *</label>
            <select id="person-block" className="form-select" value={adminBlock} onChange={event => updateAdminBlock(event.target.value)} required>
              {['A', 'B', 'C'].map(option => <option key={option} value={option}>Block {option}</option>)}
            </select>
          </div>
        )}

        {activeType === 'household' ? (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="member-flat">Flat number *</label>
              <select id="member-flat" className="form-select" value={selectedFlatNo} onChange={event => setFlatNo(event.target.value)} required>
                {memberFlats.map(flat => <option key={flat.flatNo} value={flat.flatNo}>{flat.flatNo.replace('-', ':')} · {flat.ownerName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="member-relationship">Relationship *</label>
              <select id="member-relationship" className="form-select" value={assignment} onChange={event => setAssignment(event.target.value)} required>
                <option>Family member</option>
                <option>Tenant</option>
                <option>Caregiver</option>
                <option>Other</option>
              </select>
            </div>
          </>
        ) : activeType === 'guard' ? (
          <>
            {!isAdmin && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 10 }}>Assigned block: Block {block}</p>}
            <div className="form-group">
              <label className="form-label" htmlFor="guard-role">Guard role *</label>
              <select id="guard-role" className="form-select" value={assignment} onChange={event => setAssignment(event.target.value)} required>
                <option>Security Guard</option>
                <option>Gate Supervisor</option>
                <option>Night Guard</option>
                <option>Patrol Guard</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="guard-gate">Post *</label>
              <select id="guard-gate" className="form-select" value={gate} onChange={event => setGate(event.target.value)} required>
                <option>Gate 1</option>
                <option>Gate 2</option>
                <option>Lobby / Patrol</option>
              </select>
            </div>
          </>
        ) : (
          <>
            {!isAdmin && <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 10 }}>Assigned block: Block {block}</p>}
            <div className="form-group">
              <label className="form-label" htmlFor="staff-role">Staff type *</label>
              <select id="staff-role" className="form-select" value={assignment} onChange={event => setAssignment(event.target.value)} required>
                <option>Electrical</option>
                <option>Plumbing</option>
                <option>Pumping</option>
                <option>Housekeeping</option>
                <option>Maintenance</option>
                <option>Other</option>
              </select>
            </div>
          </>
        )}

        <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: 11 }}>
          <Check size={15} /> <span>Add {activeType === 'household' ? 'house member' : activeType}</span>
        </button>
        {feedback && <p role="status" style={{ color: '#34d399', fontSize: 11, marginTop: 10 }}>{feedback}</p>}
      </form>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ color: '#fff', fontSize: 13 }}>{heading}</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{people.length} records</span>
        </div>
        {people.length === 0 ? (
          <div className="glass-card" style={{ color: 'var(--text-muted)', fontSize: 11 }}>No {heading.toLowerCase()} have been added yet.</div>
        ) : people.map(person => (
          <article className="glass-card" key={person.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: 'block', color: '#fff', fontSize: 12 }}>{person.name}</strong>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10, marginTop: 3 }}>{person.phone}</span>
              <span style={{ display: 'block', color: '#67e8f9', fontSize: 10, marginTop: 3 }}>
                {person.flatNo
                  ? `Flat ${person.flatNo.replace('-', ':')} · ${person.assignment}`
                  : `${person.block ? `Block ${person.block}` : person.gate || 'Unassigned block'} · ${person.role || person.assignment || 'Staff'}`}
              </span>
            </div>
            <Building2 size={16} color="#67e8f9" aria-hidden="true" />
          </article>
        ))}
      </section>
    </section>
  );
}