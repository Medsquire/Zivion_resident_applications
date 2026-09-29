import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import { DEMO_USERS } from '../src/data/authUsers.js';
import {
  COMMUNITY_NOTICES,
  EMERGENCY_ALERTS,
  FLATS_DIRECTORY,
  GUARDS_DIRECTORY,
  INITIAL_VISITOR_REQUESTS,
  PRE_APPROVED_PASSES,
  VEHICLES_LOG
} from '../src/data/mockData.js';

const SESSION_COOKIE = 'apartment_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const VALID_SERVICE_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'COMPLETED']);
const VALID_VISITOR_STATUSES = new Set(['PENDING', 'APPROVED', 'LEAVE_AT_GATE', 'DENIED', 'CHECKED_OUT']);
const LOCAL_DEMO_PASSWORD = '12345678';
const LOCAL_DEVELOPMENT_JWT_SECRET = 'zivion-local-only-secret-never-use-in-production';

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const getMongoClient = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new ApiError(503, 'MongoDB is not configured. Set MONGODB_URI in the deployment environment.');

  if (!globalThis.__apartmentMongoClientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
    globalThis.__apartmentMongoClientPromise = client.connect();
  }
  return globalThis.__apartmentMongoClientPromise;
};

const getDatabase = async () => {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB;
  return dbName ? client.db(dbName) : client.db();
};

const seedCollection = async (collection, records) => {
  if (!records.length) return;
  await collection.bulkWrite(records.map(record => {
    const seededRecord = {
      ...record,
      id: record.id || (record.flatNo ? `FLAT-${record.flatNo}` : randomUUID())
    };
    return {
    updateOne: {
      filter: { id: seededRecord.id },
      update: { $setOnInsert: seededRecord },
      upsert: true
    }
    };
  }), { ordered: false });
};

const normalizeSeedFlats = async (flatsCollection) => {
  for (const flat of FLATS_DIRECTORY) {
    const id = `FLAT-${flat.flatNo}`;
    const matches = await flatsCollection.find({ flatNo: flat.flatNo }).toArray();
    if (!matches.length) continue;

    const canonical = matches.find(record => record.id === id) || matches[0];
    const vehicles = new Map();
    for (const record of matches) {
      for (const [index, vehicle] of (record.vehicles || []).entries()) {
        vehicles.set(vehicle.plate || `${record._id}-${index}`, vehicle);
      }
    }
    const familyMembers = Math.max(...matches.map(record => Number(record.familyMembers) || 0));

    await flatsCollection.updateOne({ _id: canonical._id }, {
      $set: {
        id,
        familyMembers,
        vehicles: [...vehicles.values()]
      }
    });

    const duplicateIds = matches.filter(record => record._id.toString() !== canonical._id.toString()).map(record => record._id);
    if (duplicateIds.length) await flatsCollection.deleteMany({ _id: { $in: duplicateIds } });
  }
};

const initializeDatabase = async (db) => {
  if (globalThis.__apartmentSeedPromise) return globalThis.__apartmentSeedPromise;

  globalThis.__apartmentSeedPromise = (async () => {
    await Promise.all([
      db.collection('users').createIndex({ email: 1 }, { unique: true }),
      ...['flats', 'visitorRequests', 'passes', 'guards', 'vehicles', 'notices', 'emergencyAlerts', 'serviceRequests', 'householdMembers', 'staff']
        .map(name => db.collection(name).createIndex({ id: 1 }, { unique: true, sparse: true }))
    ]);

    await normalizeSeedFlats(db.collection('flats'));

    await Promise.all([
      seedCollection(db.collection('flats'), FLATS_DIRECTORY),
      seedCollection(db.collection('visitorRequests'), INITIAL_VISITOR_REQUESTS),
      seedCollection(db.collection('passes'), PRE_APPROVED_PASSES),
      seedCollection(db.collection('guards'), GUARDS_DIRECTORY),
      seedCollection(db.collection('vehicles'), VEHICLES_LOG),
      seedCollection(db.collection('notices'), COMMUNITY_NOTICES),
      seedCollection(db.collection('emergencyAlerts'), EMERGENCY_ALERTS)
    ]);

    const usersCollection = db.collection('users');
    const demoEmails = DEMO_USERS.map(user => user.email.toLowerCase());
    const existingDemoUsers = await usersCollection.find(
      { email: { $in: demoEmails } },
      { projection: { email: 1 } }
    ).toArray();
    const existingEmails = new Set(existingDemoUsers.map(user => user.email));
    const missingDemoUsers = DEMO_USERS.filter(user => !existingEmails.has(user.email.toLowerCase()));

    if (missingDemoUsers.length) {
      const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || (process.env.NODE_ENV !== 'production' ? LOCAL_DEMO_PASSWORD : '');
      if (!defaultPassword) {
        throw new ApiError(503, 'Set SEED_DEFAULT_PASSWORD to create the demo login accounts in MongoDB.');
      }

      const passwordHash = await bcrypt.hash(defaultPassword, 12);
      await usersCollection.bulkWrite(missingDemoUsers.map(user => {
        const email = user.email.toLowerCase();
        return {
          updateOne: {
            filter: { email },
            update: {
              $setOnInsert: {
                ...user,
                id: `demo-${email}`,
                email,
                passwordHash,
                createdAt: new Date()
              }
            },
            upsert: true
          }
        };
      }), { ordered: false });
    }
  })().catch(error => {
    globalThis.__apartmentSeedPromise = null;
    throw error;
  });

  return globalThis.__apartmentSeedPromise;
};

const toPublicRecord = (record) => {
  if (!record) return null;
  const { _id, ...publicRecord } = record;
  return publicRecord;
};

const toPublicUser = (user) => {
  const publicUser = toPublicRecord(user);
  if (publicUser) delete publicUser.passwordHash;
  return publicUser;
};

const getRequestBody = (req) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return {};
  if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > 4_300_000) {
    throw new ApiError(413, 'Request is too large. Service photos must be smaller than 3 MB.');
  }
  return req.body;
};

const getCookie = (req, name) => {
  const cookies = req.headers.cookie || '';
  const item = cookies.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
};

const setSessionCookie = (res, token) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${secure}`);
};

const clearSessionCookie = (res) => {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
};

const getAuthenticatedUser = async (req, db) => {
  const secret = getJwtSecret();
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) throw new ApiError(401, 'Sign in is required.');

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    throw new ApiError(401, 'Your session expired. Please sign in again.');
  }

  const user = await db.collection('users').findOne({ id: payload.sub });
  if (!user) throw new ApiError(401, 'Your account is no longer available.');
  return toPublicUser(user);
};

const requireRole = (user, allowedRoles) => {
  if (!allowedRoles.includes(user.role)) throw new ApiError(403, 'You do not have permission to do that.');
};

const canAccessFlat = (user, flatNo) => {
  if (user.role === 'admin') return true;
  if (user.role === 'supervisor') return flatNo.startsWith(`${user.block}-`);
  return user.role === 'homeowner' && user.flatNo === flatNo;
};

const getRoleScopedData = async (db, user) => {
  const flatFilter = user.role === 'admin'
    ? {}
    : user.role === 'supervisor'
      ? { flatNo: { $regex: `^${user.block}-` } }
      : { flatNo: user.flatNo };
  const [flats, requests, passes, guards, vehicles, notices, emergencyAlerts, serviceRequests, householdMembers, staff] = await Promise.all([
    db.collection('flats').find(flatFilter).toArray(),
    db.collection('visitorRequests').find(flatFilter).sort({ id: -1 }).toArray(),
    db.collection('passes').find(user.role === 'admin'
      ? {}
      : user.role === 'supervisor'
        ? { flatNo: { $regex: `^${user.block}-` } }
        : { flatNo: user.flatNo }).toArray(),
    db.collection('guards').find(user.role === 'supervisor' ? { $or: [{ block: user.block }, { block: { $exists: false } }] } : {}).toArray(),
    db.collection('vehicles').find(flatFilter).toArray(),
    db.collection('notices').find({}).sort({ date: -1 }).toArray(),
    db.collection('emergencyAlerts').find(user.role === 'admin'
      ? {}
      : user.role === 'supervisor'
        ? { $or: [{ location: { $regex: `Block ${user.block}` } }, { location: { $regex: `Tower ${user.block}` } }] }
        : { location: { $regex: `Flat ${user.flatNo.replace('-', ':')}` } }).sort({ time: -1 }).toArray(),
    db.collection('serviceRequests').find(flatFilter).sort({ createdAt: -1 }).toArray(),
    db.collection('householdMembers').find(user.role === 'admin' ? {} : user.role === 'supervisor' ? { block: user.block } : { flatNo: user.flatNo }).toArray(),
    db.collection('staff').find(user.role === 'admin' ? {} : user.role === 'supervisor' ? { block: user.block } : { block: '__not_visible__' }).toArray()
  ]);

  return {
    user,
    flats: flats.map(toPublicRecord),
    requests: requests.map(toPublicRecord),
    preApprovedPasses: passes.map(toPublicRecord),
    guards: guards.map(toPublicRecord),
    vehicles: vehicles.map(toPublicRecord),
    notices: notices.map(toPublicRecord),
    emergencyAlerts: emergencyAlerts.map(toPublicRecord),
    serviceRequests: serviceRequests.map(toPublicRecord),
    householdMembers: householdMembers.map(toPublicRecord),
    staff: staff.map(toPublicRecord)
  };
};

const createRecord = (body, extra = {}) => ({
  ...body,
  ...extra,
  id: randomUUID(),
  createdAt: new Date().toISOString()
});

const send = (res, status, payload) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(payload);
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();

  const rawSegments = new URL(req.url, 'http://localhost').pathname
    .replace(/^\/api\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(segment => decodeURIComponent(segment));
  const method = req.method || 'GET';
  const body = method === 'GET' ? {} : getRequestBody(req);
  const aliases = {
    login: ['auth', 'login'],
    session: ['auth', 'me'],
    logout: ['auth', 'logout'],
    action: {
      'visitor-status': ['visitor-requests', body.id, 'status'],
      'pass-create': ['passes'],
      'vehicle-create': ['vehicles'],
      'notice-create': ['notices'],
      'service-create': ['service-requests'],
      'service-status': ['service-requests', body.id, 'status'],
      'emergency-create': ['emergency-alerts'],
      'emergency-resolve': ['emergency-alerts', body.id, 'resolve'],
      'people-create': ['people']
    }
  };
  const segments = rawSegments[0] === 'action'
    ? aliases.action[body.action] || rawSegments
    : aliases[rawSegments[0]] || rawSegments;

  if (segments[0] === 'health' && method === 'GET') {
    return send(res, 200, { status: 'ok', databaseConfigured: Boolean(process.env.MONGODB_URI) });
  }

  if (segments[0] === 'auth' && segments[1] === 'logout' && method === 'POST') {
    clearSessionCookie(res);
    return send(res, 200, { ok: true });
  }

  try {
    const db = await getDatabase();
    await initializeDatabase(db);

    if (segments[0] === 'auth' && segments[1] === 'login' && method === 'POST') {
      const body = getRequestBody(req);
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!email || !password) throw new ApiError(400, 'Email and password are required.');
      const account = await db.collection('users').findOne({ email });
      if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
        throw new ApiError(401, 'Email or password is incorrect.');
      }
      const secret = getJwtSecret();
      const token = jwt.sign({ sub: account.id }, secret, { expiresIn: SESSION_MAX_AGE });
      setSessionCookie(res, token);
      return send(res, 200, { user: toPublicUser(account) });
    }

    if (segments[0] === 'auth' && segments[1] === 'me' && method === 'GET') {
      if (!getCookie(req, SESSION_COOKIE)) return send(res, 200, { user: null });
      return send(res, 200, { user: await getAuthenticatedUser(req, db) });
    }

    const user = await getAuthenticatedUser(req, db);

    if (segments[0] === 'app' && method === 'GET') {
      return send(res, 200, await getRoleScopedData(db, user));
    }

    if (segments[0] === 'visitor-requests' && segments[1] && segments[2] === 'status' && method === 'PATCH') {
      requireRole(user, ['homeowner', 'admin']);
      const body = getRequestBody(req);
      if (!VALID_VISITOR_STATUSES.has(body.status)) throw new ApiError(400, 'Visitor status is invalid.');
      const query = user.role === 'homeowner' ? { id: segments[1], flatNo: user.flatNo } : { id: segments[1] };
      const result = await db.collection('visitorRequests').findOneAndUpdate(
        query,
        { $set: { status: body.status, ...(body.note ? { notes: body.note } : {}) } },
        { returnDocument: 'after' }
      );
      if (!result) throw new ApiError(404, 'Visitor request was not found.');
      return send(res, 200, { request: toPublicRecord(result) });
    }

    if (segments[0] === 'passes' && method === 'POST') {
      requireRole(user, ['homeowner']);
      const body = getRequestBody(req);
      if (!body.guestName || !body.category || !body.validDate) throw new ApiError(400, 'Guest name, category, and validity are required.');
      const pass = createRecord(body, { flatNo: user.flatNo, status: 'ACTIVE' });
      await db.collection('passes').insertOne(pass);
      return send(res, 201, { pass });
    }

    if (segments[0] === 'vehicles' && method === 'POST') {
      requireRole(user, ['homeowner']);
      const body = getRequestBody(req);
      if (!body.plate || !body.type) throw new ApiError(400, 'Vehicle plate and type are required.');
      const flat = await db.collection('flats').findOne({ flatNo: user.flatNo });
      if (!flat) throw new ApiError(404, 'Assigned flat was not found.');
      const vehicle = createRecord({ plate: String(body.plate).trim().toUpperCase(), type: String(body.type).trim() }, {
        flatNo: user.flatNo,
        ownerName: flat.ownerName,
        entryTime: 'Just now',
        status: 'PENDING_APPROVAL',
        slot: 'Awaiting Admin approval'
      });
      await Promise.all([
        db.collection('vehicles').insertOne(vehicle),
        db.collection('flats').updateOne({ flatNo: user.flatNo }, { $push: { vehicles: vehicle } })
      ]);
      return send(res, 201, { vehicle });
    }

    if (segments[0] === 'service-requests' && segments.length === 1 && method === 'POST') {
      requireRole(user, ['homeowner']);
      const body = getRequestBody(req);
      if (!body.category || !body.priority || !body.description) throw new ApiError(400, 'Service type, priority, and description are required.');
      if (body.photo && (!String(body.photo).startsWith('data:image/') || String(body.photo).length > 4_200_000)) {
        throw new ApiError(400, 'Photo must be an image smaller than 3 MB.');
      }
      const flat = await db.collection('flats').findOne({ flatNo: user.flatNo });
      const request = createRecord(body, { flatNo: user.flatNo, ownerName: flat?.ownerName || user.name, status: 'OPEN' });
      await db.collection('serviceRequests').insertOne(request);
      return send(res, 201, { request });
    }

    if (segments[0] === 'service-requests' && segments[1] && segments[2] === 'status' && method === 'PATCH') {
      requireRole(user, ['supervisor', 'admin']);
      const body = getRequestBody(req);
      if (!VALID_SERVICE_STATUSES.has(body.status)) throw new ApiError(400, 'Service request status is invalid.');
      const query = user.role === 'supervisor'
        ? { id: segments[1], flatNo: { $regex: `^${user.block}-` } }
        : { id: segments[1] };
      const result = await db.collection('serviceRequests').findOneAndUpdate(query, { $set: { status: body.status } }, { returnDocument: 'after' });
      if (!result) throw new ApiError(404, 'Service request was not found in your assigned area.');
      return send(res, 200, { request: toPublicRecord(result) });
    }

    if (segments[0] === 'emergency-alerts' && segments.length === 1 && method === 'POST') {
      requireRole(user, ['homeowner']);
      const now = new Date();
      const block = user.flatNo.split('-')[0];
      const alert = createRecord({
        type: 'PANIC_SOS',
        location: `Flat ${user.flatNo.replace('-', ':')} (Block ${block})`,
        triggeredBy: user.name,
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'ACTIVE',
        actionTaken: 'Emergency alert sent to the block supervisor and apartment admin.'
      });
      await db.collection('emergencyAlerts').insertOne(alert);
      return send(res, 201, { alert });
    }

    if (segments[0] === 'emergency-alerts' && segments[1] && segments[2] === 'resolve' && method === 'PATCH') {
      requireRole(user, ['admin']);
      const result = await db.collection('emergencyAlerts').findOneAndUpdate({ id: segments[1] }, { $set: { status: 'RESOLVED' } }, { returnDocument: 'after' });
      if (!result) throw new ApiError(404, 'Emergency alert was not found.');
      return send(res, 200, { alert: toPublicRecord(result) });
    }

    if (segments[0] === 'notices' && method === 'POST') {
      requireRole(user, ['admin']);
      const body = getRequestBody(req);
      if (!body.title || !body.category || !body.content) throw new ApiError(400, 'Notice title, category, and content are required.');
      const notice = createRecord(body, { date: 'Just now', postedBy: user.name });
      await db.collection('notices').insertOne(notice);
      return send(res, 201, { notice });
    }

    if (segments[0] === 'people' && method === 'POST') {
      requireRole(user, ['admin', 'supervisor']);
      const body = getRequestBody(req);
      if (!['guard', 'household', 'staff'].includes(body.type) || !body.name || !body.phone) {
        throw new ApiError(400, 'Person type, name, and phone are required.');
      }

      let block = user.role === 'supervisor' ? user.block : body.block;
      let flatNo = body.flatNo;
      let collectionName;
      let record;

      if (body.type === 'household') {
        collectionName = 'householdMembers';
        if (!flatNo || !canAccessFlat(user, flatNo)) throw new ApiError(403, 'You cannot add a house member to that flat.');
        const flat = await db.collection('flats').findOne({ flatNo });
        if (!flat) throw new ApiError(404, 'The selected flat was not found.');
        block = flatNo.split('-')[0];
        record = createRecord({ name: String(body.name).trim(), phone: String(body.phone).trim(), assignment: String(body.assignment || 'Family member') }, { type: 'household', flatNo, block });
      } else if (body.type === 'guard') {
        collectionName = 'guards';
        if (!['A', 'B', 'C'].includes(block)) throw new ApiError(400, 'A valid block assignment is required.');
        if (user.role === 'supervisor' && body.block && body.block !== user.block) throw new ApiError(403, 'You can only add people to your assigned block.');
        record = createRecord({
          name: String(body.name).trim(),
          phone: String(body.phone).trim(),
          role: String(body.assignment || 'Security Guard'),
          gate: `${String(body.gate || 'Gate 1')} · Block ${block}`,
          block,
          shift: 'Not assigned',
          status: 'ON_DUTY'
        }, { badgeNo: `GS-${randomUUID().slice(0, 8).toUpperCase()}` });
      } else {
        collectionName = 'staff';
        if (!['A', 'B', 'C'].includes(block)) throw new ApiError(400, 'A valid block assignment is required.');
        if (user.role === 'supervisor' && body.block && body.block !== user.block) throw new ApiError(403, 'You can only add people to your assigned block.');
        record = createRecord({ name: String(body.name).trim(), phone: String(body.phone).trim(), assignment: String(body.assignment || 'Maintenance'), block, type: 'staff' });
      }

      await db.collection(collectionName).insertOne(record);
      if (body.type === 'household') {
        await db.collection('flats').updateOne({ flatNo }, { $inc: { familyMembers: 1 } });
      }
      return send(res, 201, { person: record });
    }

    return send(res, 404, { error: 'API endpoint not found.' });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    if (status >= 500) console.error('API request failed:', error.name, error.code || '');
    return send(res, status, { error: status === 500 ? 'The server could not complete the request.' : error.message });
  }
}

const getJwtSecret = () => {
  const configuredSecret = process.env.JWT_SECRET;
  if (configuredSecret && configuredSecret.trim().length >= 32) return configuredSecret.trim();

  if (process.env.NODE_ENV !== 'production' || !configuredSecret) {
    return LOCAL_DEVELOPMENT_JWT_SECRET;
  }

  return LOCAL_DEVELOPMENT_JWT_SECRET;
};