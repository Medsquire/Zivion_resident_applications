import seedData from '../data/data.json';

const DATA_KEY = 'zivion-demo-data-v1';
const SESSION_KEY = 'zivion-demo-session-v1';
let memoryData;
let memorySession = null;

const clone = value => JSON.parse(JSON.stringify(value));

const getData = () => {
  if (typeof window === 'undefined') return clone(memoryData || seedData);
  try {
    const stored = window.localStorage.getItem(DATA_KEY);
    return stored ? JSON.parse(stored) : clone(seedData);
  } catch {
    return clone(seedData);
  }
};

const saveData = data => {
  if (typeof window === 'undefined') {
    memoryData = data;
    return;
  }
  window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
};

const getSessionEmail = () => typeof window === 'undefined'
  ? memorySession
  : window.localStorage.getItem(SESSION_KEY);

const saveSession = email => {
  memorySession = email;
  if (typeof window !== 'undefined') {
    if (email) window.localStorage.setItem(SESSION_KEY, email);
    else window.localStorage.removeItem(SESSION_KEY);
  }
};

const getUser = () => {
  const email = getSessionEmail();
  const user = getData().demoUsers.find(account => account.email.toLowerCase() === email);
  if (!user) return null;
  const publicUser = { ...user };
  delete publicUser.password;
  return publicUser;
};

const requireUser = () => {
  const user = getUser();
  if (!user) throw new Error('Sign in is required.');
  return user;
};

const createRecord = record => ({
  ...record,
  id: globalThis.crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  createdAt: new Date().toLocaleString()
});

const updateData = updater => {
  const data = getData();
  const result = updater(data);
  saveData(data);
  return result;
};

const getScopedData = user => {
  const data = getData();
  const flatMatches = flatNo => user.role === 'admin'
    || (user.role === 'supervisor' && flatNo.startsWith(`${user.block}-`))
    || (user.role === 'homeowner' && flatNo === user.flatNo);
  const blockMatches = block => user.role === 'admin'
    || (user.role === 'supervisor' && block === user.block);
  const flatRecords = records => records.filter(record => flatMatches(record.flatNo || ''));

  return {
    user,
    flats: data.flats.filter(flat => flatMatches(flat.flatNo)),
    requests: flatRecords(data.requests),
    preApprovedPasses: flatRecords(data.preApprovedPasses),
    notices: data.notices,
    vehicles: flatRecords(data.vehicles),
    guards: data.guards.filter(guard => user.role !== 'supervisor' || !guard.block || guard.block === user.block),
    householdMembers: data.householdMembers.filter(person => user.role === 'admin'
      || (user.role === 'supervisor' && person.block === user.block)
      || (user.role === 'homeowner' && person.flatNo === user.flatNo)),
    staff: data.staff.filter(person => user.role === 'admin' || blockMatches(person.block)),
    emergencyAlerts: data.emergencyAlerts.filter(alert => user.role === 'admin'
      || (user.role === 'supervisor' && (alert.location.includes(`Block ${user.block}`) || alert.location.includes(`Tower ${user.block}`)))
      || (user.role === 'homeowner' && alert.location.includes(`Flat ${user.flatNo.replace('-', ':')}`))),
    serviceRequests: flatRecords(data.serviceRequests)
  };
};

const ensureRole = (user, roles) => {
  if (!roles.includes(user.role)) throw new Error('You do not have permission to do that.');
};

export const api = {
  login: async (email, password) => {
    const account = getData().demoUsers.find(user => user.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || account.password !== password) throw new Error('Email or password is incorrect.');
    saveSession(account.email.toLowerCase());
    const user = { ...account };
    delete user.password;
    return { user };
  },
  session: async () => ({ user: getUser() }),
  logout: async () => {
    saveSession(null);
    return { ok: true };
  },
  appData: async () => getScopedData(requireUser()),
  updateVisitorStatus: async (id, status, note) => {
    const user = requireUser();
    ensureRole(user, ['homeowner', 'admin']);
    const request = updateData(data => {
      const record = data.requests.find(item => item.id === id && (user.role === 'admin' || item.flatNo === user.flatNo));
      if (!record) throw new Error('Visitor request was not found.');
      record.status = status;
      if (note) record.notes = note;
      return record;
    });
    return { request };
  },
  addPass: async pass => {
    const user = requireUser();
    ensureRole(user, ['homeowner']);
    const record = createRecord({ ...pass, flatNo: user.flatNo, status: 'ACTIVE' });
    updateData(data => data.preApprovedPasses.unshift(record));
    return { pass: record };
  },
  addVehicle: async vehicle => {
    const user = requireUser();
    ensureRole(user, ['homeowner']);
    const data = getData();
    const flat = data.flats.find(item => item.flatNo === user.flatNo);
    if (!flat) throw new Error('Assigned flat was not found.');
    const record = createRecord({
      ...vehicle,
      plate: String(vehicle.plate).trim().toUpperCase(),
      flatNo: user.flatNo,
      ownerName: flat.ownerName,
      entryTime: 'Just now',
      status: 'PENDING_APPROVAL',
      slot: 'Awaiting Admin approval'
    });
    updateData(current => {
      current.vehicles.unshift(record);
      const targetFlat = current.flats.find(item => item.flatNo === user.flatNo);
      targetFlat.vehicles.push(record);
    });
    return { vehicle: record };
  },
  addNotice: async notice => {
    const user = requireUser();
    ensureRole(user, ['admin']);
    const record = createRecord({ ...notice, date: 'Just now', postedBy: user.name });
    updateData(data => data.notices.unshift(record));
    return { notice: record };
  },
  addServiceRequest: async request => {
    const user = requireUser();
    ensureRole(user, ['homeowner']);
    const data = getData();
    const flat = data.flats.find(item => item.flatNo === user.flatNo);
    const record = createRecord({ ...request, flatNo: user.flatNo, ownerName: flat?.ownerName || user.name, status: 'OPEN' });
    updateData(current => current.serviceRequests.unshift(record));
    return { request: record };
  },
  updateServiceRequest: async (id, status) => {
    const user = requireUser();
    ensureRole(user, ['supervisor', 'admin']);
    const request = updateData(data => {
      const record = data.serviceRequests.find(item => item.id === id
        && (user.role === 'admin' || item.flatNo.startsWith(`${user.block}-`)));
      if (!record) throw new Error('Service request was not found in your assigned area.');
      record.status = status;
      return record;
    });
    return { request };
  },
  addEmergencyAlert: async () => {
    const user = requireUser();
    ensureRole(user, ['homeowner']);
    const block = user.flatNo.split('-')[0];
    const alert = createRecord({
      type: 'PANIC_SOS',
      location: `Flat ${user.flatNo.replace('-', ':')} (Block ${block})`,
      triggeredBy: user.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE',
      actionTaken: 'Emergency alert sent to the block supervisor and apartment admin.'
    });
    updateData(data => data.emergencyAlerts.unshift(alert));
    return { alert };
  },
  resolveEmergencyAlert: async id => {
    const user = requireUser();
    ensureRole(user, ['admin']);
    const alert = updateData(data => {
      const record = data.emergencyAlerts.find(item => item.id === id);
      if (!record) throw new Error('Emergency alert was not found.');
      record.status = 'RESOLVED';
      return record;
    });
    return { alert };
  },
  addPerson: async person => {
    const user = requireUser();
    ensureRole(user, ['admin', 'supervisor']);
    const block = user.role === 'supervisor' ? user.block : person.block;
    const record = createRecord({
      ...person,
      block: person.type === 'household' ? person.flatNo.split('-')[0] : block,
      ...(person.type === 'guard' ? {
        role: person.assignment || 'Security Guard',
        gate: `${person.gate || 'Gate 1'} · Block ${block}`,
        shift: 'Not assigned',
        status: 'ON_DUTY',
        badgeNo: `GS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
      } : {})
    });
    updateData(data => {
      const collection = person.type === 'guard' ? data.guards
        : person.type === 'household' ? data.householdMembers
          : data.staff;
      collection.unshift(record);
      if (person.type === 'household') {
        const flat = data.flats.find(item => item.flatNo === person.flatNo);
        if (flat) flat.familyMembers += 1;
      }
    });
    return { person: record };
  }
};