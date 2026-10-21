import React, { useState } from 'react';
import {
  firebaseRegisterEmail,
  firebaseLoginEmail,
  firebaseLoginGoogle,
  firebaseSendPasswordReset,
  isFirebaseConfigured
} from '../services/firebase';
import { saveAuthUser } from '../services/db';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function AuthModal({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleEmailAuth(e) {
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
        // Real Firebase Authentication
        if (isSignUp) {
          userRecord = await firebaseRegisterEmail(email.trim().toLowerCase(), password, name.trim());
        } else {
          userRecord = await firebaseLoginEmail(email.trim().toLowerCase(), password);
        }
      } else {
        // Fallback local session if Firebase credentials not yet supplied
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
      // Clean user-friendly error messages
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

  async function handleGoogleAuth() {
    setError('');
    setLoading(true);

    try {
      let userRecord;
      if (isFirebaseConfigured()) {
        // Real Firebase Google Login popup
        userRecord = await firebaseLoginGoogle();
      } else {
        // Graceful local athlete fallback
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

        {/* Card */}
        <div className="ui-card p-5 sm:p-8 bg-[#FFFFFF] shadow-sm space-y-4 sm:space-y-5">

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

          {isForgotPassword ? (
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
            <form onSubmit={handleEmailAuth} className="space-y-3.5 sm:space-y-4">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide">
                  {isSignUp ? 'Create Athlete Account' : 'Sign In to CORE FIT'}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#555B63] mt-0.5">
                  {isSignUp ? 'Sync your fitness journey across all devices' : 'Access your saved workouts, nutrition, and progress'}
                </p>
              </div>

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
                className="btn btn-primary w-full py-2.5 text-xs font-bold shadow-sm"
              >
                <span>{loading ? 'Authenticating...' : isSignUp ? 'Register & Connect Cloud' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D9DDE2]" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-[#8B939E]">
                  <span className="bg-[#FFFFFF] px-2">Or continue with</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="btn btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Guest / Offline Mode */}
              <button
                type="button"
                onClick={handleGuestAuth}
                className="btn btn-outline w-full py-2.5 text-xs font-bold"
              >
                <span>Continue as Guest (Offline Mode)</span>
              </button>

              {/* Toggle Sign Up vs Sign In */}
              <div className="text-center pt-1.5">
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
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-[#555B63]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
          <span>Your fitness data is private and secure</span>
        </div>
      </div>
    </div>
  );
}
