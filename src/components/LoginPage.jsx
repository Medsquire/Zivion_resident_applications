import React, { useState } from 'react';
import { ArrowRight, Building2, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { DEMO_USERS } from '../data/authUsers';
import './LoginPage.css';

const DEMO_PASSWORD_CANDIDATES = ['ZivionDemoPass2026', '12345678', 'password'];

export default function LoginPage({ onLogin, connectionError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDemoEmail, setSelectedDemoEmail] = useState(DEMO_USERS[0].email);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginWithCredentials = async (loginEmail, loginPassword) => {
    setIsSubmitting(true);
    try {
      const success = await onLogin(loginEmail, loginPassword);
      if (!success) {
        setError('Email or password is incorrect.');
        return false;
      }
      setError('');
      return true;
    } catch (loginError) {
      setError(loginError.message || 'Sign in failed. Check the server configuration and try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    await loginWithCredentials(email, password);
  };

  const handleDemoLogin = async (accountEmail) => {
    const selectedAccount = DEMO_USERS.find(user => user.email === accountEmail) || DEMO_USERS[0];
    setSelectedDemoEmail(selectedAccount.email);
    setEmail(selectedAccount.email);

    for (const candidate of DEMO_PASSWORD_CANDIDATES) {
      setPassword(candidate);
      const success = await loginWithCredentials(selectedAccount.email, candidate);
      if (success) return;
    }

    setPassword('');
    setError('Demo login is not available with the current seeded password. Use the regular sign-in form.');
  };

  return (
    <main className="login-page">
      <div className="login-layout login-layout-single">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-brand">
            <span className="login-brand-icon"><Building2 size={19} /></span>
            <span>ZIVION</span>
            <span className="login-brand-divider" />
            <span className="login-community">Smarter Communities. Better Living.</span>
          </div>

          <div className="login-heading">
            <p className="login-kicker">COMMUNITY PORTAL</p>
            <h1 id="login-title">Welcome back</h1>
            <p>Sign in to continue to your apartment workspace.</p>
          </div>

          <form className="login-form" onSubmit={submitLogin}>
            {connectionError && <p className="login-error" role="status">Server: {connectionError}</p>}
            <label htmlFor="login-email">Email address *</label>
            <div className="login-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="name@royalheights.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="login-password-label">
              <label htmlFor="login-password">Password *</label>
              <span><KeyRound size={13} /> Use the configured seed password</span>
            </div>
            <div className="login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
              <ArrowRight size={17} />
            </button>

            <div className="login-demo-group">
              <label htmlFor="demo-login-select">Demo login</label>
              <div className="login-demo-row">
                <select
                  id="demo-login-select"
                  className="login-demo-select"
                  value={selectedDemoEmail}
                  onChange={event => {
                    const nextValue = event.target.value;
                    handleDemoLogin(nextValue);
                  }}
                  disabled={isSubmitting}
                >
                  {DEMO_USERS.map(user => (
                    <option key={user.email} value={user.email}>
                      {user.name} ({user.role === 'homeowner' ? user.flatNo : user.role === 'supervisor' ? `Block ${user.block}` : 'Admin'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          <div className="login-security-note">
            <ShieldCheck size={16} />
            <span>Access is assigned by account to your role, block, or flat.</span>
          </div>
        </section>
      </div>
    </main>
  );
}