import React, { useState, useEffect } from 'react';
import {
  firebaseRegisterEmail,
  firebaseLoginEmail,
  firebaseLoginGoogle,
  firebaseSendPasswordReset,
  firebaseSendSignInLink,
  firebaseIsSignInWithEmailLink,
  firebaseCompleteSignInWithEmailLink,
  isFirebaseConfigured
} from '../services/firebase';
import { saveAuthUser } from '../services/db';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  // Mode: 'magic-link' (default/recommended) | 'password'
  const [authMode, setAuthMode] = useState('magic-link');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Email Magic Link specific states
  const [linkSent, setLinkSent] = useState(false);
  const [confirmingLink, setConfirmingLink] = useState(false);
  const [linkVerifying, setLinkVerifying] = useState(false);

  // Check if athlete opened this app via an incoming Firebase Email Sign-in link
  useEffect(() => {
    if (typeof window !== 'undefined' && firebaseIsSignInWithEmailLink(window.location.href)) {
      setConfirmingLink(true);
      const savedEmail = window.localStorage.getItem('emailForSignIn');
      if (savedEmail) {
        setEmail(savedEmail);
        setLinkVerifying(true);
        firebaseCompleteSignInWithEmailLink(savedEmail)
          .then((userRecord) => {
            saveAuthUser(userRecord);
            onLoginSuccess(userRecord);
          })
          .catch((err) => {
            console.error('[auth] Auto email-link completion error:', err);
            if (err.code === 'auth/invalid-action-code' || err.code === 'auth/expired-action-code') {
              setError('This sign-in link has expired or has already been used. Please request a new link.');
            } else {
              setError(err.message || 'Verification failed. Please confirm your email address below.');
            }
          })
          .finally(() => {
            setLinkVerifying(false);
          });
      }
    }
  }, [onLoginSuccess]);

  // 1. Send Firebase Magic Sign-In Link to Email
  async function handleSendMagicLink(e) {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        await firebaseSendSignInLink(cleanEmail);
      } else {
        // Fallback local persistence if offline
        window.localStorage.setItem('emailForSignIn', cleanEmail);
      }
      setLinkSent(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to dispatch sign-in link. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  // 2. Complete Sign-in when user opened link on a second device or incognito window
  async function handleCompleteEmailLink(e) {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please provide the email address where you received the link.');
      return;
    }

    setLoading(true);
    try {
      const userRecord = await firebaseCompleteSignInWithEmailLink(cleanEmail);
      saveAuthUser(userRecord);
      onLoginSuccess(userRecord);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-action-code' || err.code === 'auth/expired-action-code') {
        setError('This sign-in link has expired or was already used. Please request a new link.');
      } else {
        setError(err.message || 'Verification failed. Please check the email address and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // 3. Traditional Email + Password Auth
  async function handleEmailPasswordAuth(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      let userRecord;
      if (isFirebaseConfigured()) {
        if (isSignUp) {
          userRecord = await firebaseRegisterEmail(email.trim().toLowerCase(), password, name.trim());
        } else {
          userRecord = await firebaseLoginEmail(email.trim().toLowerCase(), password);
        }
      } else {
        userRecord = {
          uid: 'usr_' + Date.now().toString(36),
          email: email.trim().toLowerCase(),
          displayName: isSignUp ? (name.trim() || 'Athlete') : email.split('@')[0],
          provider: 'local_email',
          createdAt: new Date().toISOString()
        };
      }

      saveAuthUser(userRecord);
      onLoginSuccess(userRecord);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password combination.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  // 4. Google One-Click Login
  async function handleGoogleAuth() {
    setError('');
    setLoading(true);

    try {
      let userRecord;
      if (isFirebaseConfigured()) {
        userRecord = await firebaseLoginGoogle();
      } else {
        userRecord = {
          uid: 'usr_g_' + Date.now().toString(36),
          email: 'athlete.corefit@gmail.com',
          displayName: 'Google Athlete',
          provider: 'google_local',
          createdAt: new Date().toISOString()
        };
      }

      saveAuthUser(userRecord);
      onLoginSuccess(userRecord);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was cancelled.');
      } else {
        setError(err.message || 'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  // 5. Guest / Offline Mode
  function handleGuestAuth() {
    const user = {
      uid: 'usr_guest_' + Date.now().toString(36),
      email: 'guest@corefit.local',
      displayName: 'Athlete (Guest)',
      provider: 'guest',
      createdAt: new Date().toISOString()
    };
    saveAuthUser(user);
    onLoginSuccess(user);
  }

  // 6. Reset Password Handler
  async function handleResetPassword(e) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Enter your registered email address to receive reset instructions.');
      return;
    }
    setLoading(true);
    try {
      if (isFirebaseConfigured()) {
        await firebaseSendPasswordReset(email.trim());
      }
      setResetSent(true);
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetSent(false);
      }, 3500);
    } catch (err) {
      setError(err.message || 'Failed to dispatch password reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img
            src="/core-fit-logo.png"
            alt="CORE FIT"
            className="w-20 h-20 object-contain mx-auto"
          />
          <h1 className="text-xl sm:text-2xl font-black text-[#15171A] tracking-tight uppercase">
            CORE <span className="text-[#FFAE00]">FIT</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#555B63]">
            Build Strength From Within
          </p>
        </div>

        {/* Main Card */}
        <div className="ui-card p-5 sm:p-7 bg-[#FFFFFF] shadow-sm space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-xs font-semibold text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-[8px] text-xs font-semibold text-[#16A34A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Password reset instructions dispatched to your email address.</span>
            </div>
          )}

          {/* STATE A: Incoming Email Sign-In Link Verification */}
          {confirmingLink ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#FFF8E7] text-[#FFAE00] flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                  {linkVerifying ? 'Verifying Sign-In Link...' : 'Confirm Your Email Address'}
                </h3>
                <p className="text-xs text-[#555B63]">
                  {linkVerifying
                    ? 'Authenticating your session with Firebase...'
                    : 'To complete sign-in, please confirm the email address where you received the link.'}
                </p>
              </div>

              {!linkVerifying && (
                <form onSubmit={handleCompleteEmailLink} className="space-y-3.5">
                  <div>
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="athlete@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    <span>{loading ? 'Verifying...' : 'Complete Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingLink(false);
                      setError('');
                    }}
                    className="btn btn-secondary w-full py-2 text-xs"
                  >
                    Cancel & Return
                  </button>
                </form>
              )}
            </div>
          ) : isForgotPassword ? (
            /* STATE B: Forgot Password Flow */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                  Reset Account Password
                </h3>
                <p className="text-xs text-[#555B63] mt-1">
                  Enter your email address to receive password reset instructions.
                </p>
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 text-xs"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            /* STATE C: Primary Auth Flow (Google + Email Link + Password) */
            <div className="space-y-4">
              {/* 1. Google Button (Primary 1-Click) */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="btn btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2.5 border border-[#D9DDE2] hover:bg-[#F6F6F7] shadow-xs active:scale-[0.99] transition-all"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#ECEEF2]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#8B939E]">
                  <span className="bg-[#FFFFFF] px-2.5">Or use email</span>
                </div>
              </div>

              {/* Segmented Auth Selector: Magic Link vs Password */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F6F6F7] rounded-lg border border-[#ECEEF2] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('magic-link');
                    setError('');
                  }}
                  className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    authMode === 'magic-link'
                      ? 'bg-white text-[#15171A] shadow-xs'
                      : 'text-[#6F767E] hover:text-[#15171A]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FFAE00]" />
                  <span>Magic Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setError('');
                  }}
                  className={`py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    authMode === 'password'
                      ? 'bg-white text-[#15171A] shadow-xs'
                      : 'text-[#6F767E] hover:text-[#15171A]'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password</span>
                </button>
              </div>

              {/* OPTION 1: Email Magic Link (Passwordless) */}
              {authMode === 'magic-link' && (
                <>
                  {linkSent ? (
                    <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] space-y-3 text-center">
                      <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-[#15171A]">
                          Check your email inbox!
                        </h4>
                        <p className="text-[11px] text-[#4B5563] mt-1 leading-relaxed">
                          We sent a sign-in link to <span className="font-bold text-[#15171A]">{email}</span>. Click the link in your email to instantly log in without a password.
                        </p>
                      </div>
                      <div className="pt-1 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={handleSendMagicLink}
                          disabled={loading}
                          className="btn btn-secondary text-xs py-1.5 flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                          <span>Resend link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkSent(false)}
                          className="text-[11px] font-semibold text-[#555B63] hover:text-[#15171A] pt-1"
                        >
                          Use a different email
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMagicLink} className="space-y-3.5">
                      <div>
                        <label className="input-label">Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="athlete@domain.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          className="input-field text-xs"
                        />
                        <span className="text-[10px] text-[#6F767E] mt-1 block">
                          We will email you a passwordless sign-in link.
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full py-2.5 text-xs font-bold shadow-xs flex items-center justify-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{loading ? 'Sending link...' : 'Send Magic Sign-In Link'}</span>
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* OPTION 2: Email + Password */}
              {authMode === 'password' && (
                <form onSubmit={handleEmailPasswordAuth} className="space-y-3.5">
                  {isSignUp && (
                    <div>
                      <label className="input-label">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input-field text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="athlete@domain.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="input-label mb-0">Password</label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-[11px] font-bold text-[#FFAE00] hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input-field text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full py-2.5 text-xs font-bold shadow-xs"
                  >
                    <span>{loading ? 'Authenticating...' : isSignUp ? 'Register Account' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setError('');
                      }}
                      className="text-xs text-[#555B63] hover:text-[#15171A] font-semibold"
                    >
                      {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                    </button>
                  </div>
                </form>
              )}

              {/* Guest / Offline Mode */}
              <div className="pt-2 border-t border-[#ECEEF2]">
                <button
                  type="button"
                  onClick={handleGuestAuth}
                  className="btn btn-outline w-full py-2 text-xs font-bold text-[#555B63] hover:text-[#15171A]"
                >
                  <span>Continue as Guest (Offline Mode)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-[#555B63]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
          <span>Your fitness data is private, secure, and encrypted</span>
        </div>
      </div>
    </div>
  );
}
