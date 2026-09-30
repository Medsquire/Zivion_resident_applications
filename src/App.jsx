import React, { useEffect, useState } from 'react';
import LoginPage from './components/LoginPage';
import SupervisorView from './components/SupervisorView';
import OwnerView from './components/OwnerView';
import AdminView from './components/AdminView';
import PeopleManagementView from './components/PeopleManagementView';
import { api } from './api/client';
import { sound } from './utils/audio';
import { LogOut, Users } from 'lucide-react';

export default function App() {
  const [activeUser, setActiveUser] = useState(null);
  const [showPeopleManagement, setShowPeopleManagement] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [backendError, setBackendError] = useState('');
  
  // App Dynamic State
  const [flats, setFlats] = useState([]);
  const [requests, setRequests] = useState([]);
  const [preApprovedPasses, setPreApprovedPasses] = useState([]);
  const [notices, setNotices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [guards, setGuards] = useState([]);
  const [householdMembers, setHouseholdMembers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const applyAppData = (data) => {
    setFlats(data.flats || []);
    setRequests(data.requests || []);
    setPreApprovedPasses(data.preApprovedPasses || []);
    setNotices(data.notices || []);
    setVehicles(data.vehicles || []);
    setGuards(data.guards || []);
    setHouseholdMembers(data.householdMembers || []);
    setStaff(data.staff || []);
    setEmergencyAlerts(data.emergencyAlerts || []);
    setServiceRequests(data.serviceRequests || []);
  };

  useEffect(() => {
    let cancelled = false;
    api.session()
      .then(async ({ user }) => {
        if (!user) return;
        const data = await api.appData();
        if (cancelled) return;
        applyAppData(data);
        setActiveUser(data.user || user);
      })
      .catch(error => {
        if (!cancelled) setBackendError(error.message);
      })
      .finally(() => {
        if (!cancelled) setSessionChecking(false);
      });
    return () => { cancelled = true; };
  }, []);

  const runAction = async (action) => {
    setBackendError('');
    try {
      return await action();
    } catch (error) {
      setBackendError(error.message);
      return null;
    }
  };

  const handleUpdateRequestStatus = (id, newStatus, note = '') => runAction(async () => {
    const { request } = await api.updateVisitorStatus(id, newStatus, note);
    setRequests(prev => prev.map(item => item.id === id ? request : item));
    return request;
  });

  const handleAddPreApprovedPass = (newPass) => runAction(async () => {
    const { pass } = await api.addPass(newPass);
    setPreApprovedPasses(prev => [pass, ...prev]);
    return pass;
  });

  const handleAddVehicle = (newVehicle) => runAction(async () => {
    const { vehicle } = await api.addVehicle(newVehicle);
    setVehicles(prev => [vehicle, ...prev]);
    setFlats(prev => prev.map(flat => flat.flatNo === vehicle.flatNo
      ? { ...flat, vehicles: [...(flat.vehicles || []), vehicle] }
      : flat));
    return vehicle;
  });

  const handleAddNotice = (newNotice) => runAction(async () => {
    const { notice } = await api.addNotice(newNotice);
    setNotices(prev => [notice, ...prev]);
    return notice;
  });

  const handleAddServiceRequest = (newRequest) => runAction(async () => {
    const { request } = await api.addServiceRequest(newRequest);
    setServiceRequests(prev => [request, ...prev]);
    return request;
  });

  const handleUpdateServiceRequest = (id, status) => runAction(async () => {
    const { request } = await api.updateServiceRequest(id, status);
    setServiceRequests(prev => prev.map(item => item.id === id ? request : item));
    return request;
  });

  const handleAddPerson = (personData) => runAction(async () => {
    const { person } = await api.addPerson(personData);
    if (personData.type === 'guard') {
      setGuards(prev => [person, ...prev]);
    } else if (personData.type === 'household') {
      setHouseholdMembers(prev => [person, ...prev]);
      setFlats(prev => prev.map(flat => flat.flatNo === person.flatNo
        ? { ...flat, familyMembers: flat.familyMembers + 1 }
        : flat));
    } else {
      setStaff(prev => [person, ...prev]);
    }
    return person;
  });

  const handleTriggerEmergency = () => runAction(async () => {
    const { alert } = await api.addEmergencyAlert();
    setEmergencyAlerts(prev => [alert, ...prev]);
    sound.playEmergencySound();
    return alert;
  });

  const handleClearEmergency = (id) => runAction(async () => {
    const { alert } = await api.resolveEmergencyAlert(id);
    setEmergencyAlerts(prev => prev.map(item => item.id === id ? alert : item));
    return alert;
  });

  const handleLogout = async () => {
    await runAction(() => api.logout());
    setShowPeopleManagement(false);
    setActiveUser(null);
    setFlats([]);
    setRequests([]);
    setPreApprovedPasses([]);
    setNotices([]);
    setVehicles([]);
    setGuards([]);
    setHouseholdMembers([]);
    setStaff([]);
    setEmergencyAlerts([]);
    setServiceRequests([]);
  };

  const handleLogin = async (email, password) => {
    const { user } = await api.login(email, password);
    const data = await api.appData();
    applyAppData(data);
    setActiveUser(data.user || user);
    setShowPeopleManagement(false);
    setBackendError('');
    return true;
  };

  if (sessionChecking || !activeUser) {
    return <LoginPage onLogin={handleLogin} connectionError={backendError} />;
  }

  const selectedOwnerFlat = flats.find(flat => flat.flatNo === activeUser.flatNo) || flats[0];

  return (
    <div className="app-viewport">
      <div className={`application-shell ${activeUser.role === 'homeowner' ? 'theme-light' : 'theme-dark'}`}>
        <main className="app-content">
          <div className="session-toolbar">
            <div>
              <span className="session-role">{activeUser.role === 'homeowner' ? 'Homeowner' : activeUser.role === 'supervisor' ? 'Supervisor' : 'Admin'}</span>
              <span className="session-assignment">
                {activeUser.role === 'homeowner' ? `Flat ${activeUser.flatNo.replace('-', ':')}` : activeUser.role === 'supervisor' ? `Block ${activeUser.block}` : activeUser.email}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {activeUser.role !== 'homeowner' && (
                <button className="session-logout" onClick={() => setShowPeopleManagement(value => !value)}>
                  <Users size={15} />
                  <span>{showPeopleManagement ? 'Dashboard' : 'Manage people'}</span>
                </button>
              )}
              <button className="session-logout" onClick={handleLogout}>
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          </div>
          {backendError && <p role="alert" style={{ color: '#ff9d91', fontSize: 11, marginBottom: 12 }}>{backendError}</p>}

          {showPeopleManagement && activeUser.role !== 'homeowner' ? (
            <PeopleManagementView
              accessLevel={activeUser.role}
              selectedBlock={activeUser.block}
              flats={flats}
              guards={guards}
              householdMembers={householdMembers}
              staff={staff}
              onAddPerson={handleAddPerson}
            />
          ) : activeUser.role === 'supervisor' ? (
            <SupervisorView
              selectedBlock={activeUser.block}
              requests={requests}
              flats={flats}
              serviceRequests={serviceRequests}
              emergencyAlerts={emergencyAlerts}
              onUpdateServiceRequest={handleUpdateServiceRequest}
            />
          ) : activeUser.role === 'homeowner' ? (
            <OwnerView
              selectedFlat={selectedOwnerFlat}
              requests={requests}
              preApprovedPasses={preApprovedPasses}
              notices={notices}
              serviceRequests={serviceRequests}
              securityContacts={guards}
              onUpdateRequestStatus={handleUpdateRequestStatus}
              onAddPreApprovedPass={handleAddPreApprovedPass}
              onAddVehicle={handleAddVehicle}
              onAddServiceRequest={handleAddServiceRequest}
              onTriggerEmergency={handleTriggerEmergency}
            />
          ) : activeUser.role === 'admin' ? (
            <AdminView
              requests={requests}
              flats={flats}
              guards={guards}
              vehicles={vehicles}
              notices={notices}
              emergencyAlerts={emergencyAlerts}
              serviceRequests={serviceRequests}
              onAddNotice={handleAddNotice}
              onUpdateServiceRequest={handleUpdateServiceRequest}
              onClearEmergency={handleClearEmergency}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
