import React, { useState } from 'react';
import { ArrowRight, Building2, CarFront, Eye, EyeOff, LockKeyhole, Mail, PackageCheck, ShieldCheck, UserRound } from 'lucide-react';
import { DEMO_PASSWORD, DEMO_USERS } from '../data/authUsers';
import './LoginPage.css';

export default function LoginPage({ onLogin, connectionError }) {
  const [email, setEmail] = useState(() => localStorage.getItem('zivion-login-email') || '');
  const [password, setPassword] = useState('');
  const [selectedDemoEmail, setSelectedDemoEmail] = useState(DEMO_USERS[0].email);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem('zivion-login-email')));

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
    if (rememberMe) {
      localStorage.setItem('zivion-login-email', email);
    } else {
      localStorage.removeItem('zivion-login-email');
    }
    await loginWithCredentials(email, password);
  };

  const handleDemoLogin = async (accountEmail) => {
    const selectedAccount = DEMO_USERS.find(user => user.email === accountEmail) || DEMO_USERS[0];
    setSelectedDemoEmail(selectedAccount.email);
    setEmail(selectedAccount.email);

    setPassword(DEMO_PASSWORD);
    await loginWithCredentials(selectedAccount.email, DEMO_PASSWORD);
  };

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-intro" aria-label="Zivion apartment living">
          <div className="login-brand">
            <span className="login-brand-icon"><Building2 size={28} strokeWidth={2.2} /></span>
            <span className="login-brand-copy">
              <strong>ZIVION</strong>
              <span>Apartment Living</span>
            </span>
          </div>

          <div className="login-intro-copy">
            <p className="login-kicker">YOUR COMMUNITY, CONNECTED</p>
            <h1>A Safer Community, Together</h1>
            <p>Secure access, smooth entry and a better living experience for everyone.</p>
          </div>

          <div className="login-benefits" aria-label="Community services">
            <div><UserRound size={20} /><span>Visitor Management</span></div>
            <div><CarFront size={20} /><span>Vehicle Entry</span></div>
            <div><PackageCheck size={20} /><span>Package Delivery</span></div>
            <div><ShieldCheck size={20} /><span>Security Updates</span></div>
          </div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="login-panel-heading">
            <span className="login-security-icon"><ShieldCheck size={24} /></span>
            <h2 id="login-title">Resident Login</h2>
            <p>Access your community services and manage your apartment.</p>
          </div>

          <form className="login-form" onSubmit={submitLogin}>
            {connectionError && <p className="login-error" role="status">{connectionError}</p>}
            <label htmlFor="login-email">Email address</label>
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

            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                id="login-password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                onClick={() => setIsPasswordVisible(value => !value)}
              >
                {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="login-remember">
              <input type="checkbox" checked={rememberMe} onChange={event => setRememberMe(event.target.checked)} />
              <span>Remember me</span>
            </label>

            {error && <p className="login-error" role="alert">{error}</p>}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              <span>{isSubmitting ? 'Signing in...' : 'Login'}</span>
              <ArrowRight size={17} />
            </button>

            <div className="login-divider"><span>DEMO ACCESS</span></div>
            <div className="login-demo-group">
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
                      {user.name} · {user.role === 'homeowner' ? `Flat ${user.flatNo}` : user.role === 'supervisor' ? `Block ${user.block}` : 'Admin'}
                    </option>
                  ))}
                </select>
              </div>
              <p className="login-demo-hint">Demo password: {DEMO_PASSWORD}</p>
            </div>
          </form>

          <div className="login-contact">
            <span className="login-contact-icon"><Building2 size={23} /></span>
            <span><strong>New to Zivion?</strong><small>Contact your society manager</small></span>
            <ArrowRight size={18} />
          </div>
        </section>
      </div>
      <footer className="login-footer">
        <span>Zivion Apartment Living</span>
        <span className="login-footer-tagline">SECURE <i /> CONNECTED <i /> TOGETHER</span>
      </footer>
    </main>
  );
}