const apiRequest = async (path, options = {}) => {
  const response = await fetch(`/api/${path}`, {
    method: options.method || 'GET',
    credentials: 'same-origin',
    headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
};

export const api = {
  health: () => apiRequest('health'),
  login: (email, password) => apiRequest('login', { method: 'POST', body: { email, password } }),
  session: () => apiRequest('session'),
  logout: () => apiRequest('logout', { method: 'POST', body: {} }),
  appData: () => apiRequest('app'),
  updateVisitorStatus: (id, status, note) => apiRequest('action', { method: 'PATCH', body: { action: 'visitor-status', id, status, note } }),
  addPass: pass => apiRequest('action', { method: 'POST', body: { ...pass, action: 'pass-create' } }),
  addVehicle: vehicle => apiRequest('action', { method: 'POST', body: { ...vehicle, action: 'vehicle-create' } }),
  addNotice: notice => apiRequest('action', { method: 'POST', body: { ...notice, action: 'notice-create' } }),
  addServiceRequest: request => apiRequest('action', { method: 'POST', body: { ...request, action: 'service-create' } }),
  updateServiceRequest: (id, status) => apiRequest('action', { method: 'PATCH', body: { action: 'service-status', id, status } }),
  addEmergencyAlert: () => apiRequest('action', { method: 'POST', body: { action: 'emergency-create' } }),
  resolveEmergencyAlert: id => apiRequest('action', { method: 'PATCH', body: { action: 'emergency-resolve', id } }),
  addPerson: person => apiRequest('action', { method: 'POST', body: { ...person, action: 'people-create' } })
};