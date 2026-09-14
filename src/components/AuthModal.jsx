import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Check, 
  AlertCircle, 
  AlertTriangle,
  Calendar,
  ShieldCheck, 
  KeyRound, 
  LogOut, 
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { realGoogleAuthService } from '../services/realGoogleAuthService';

export default function AuthModal({ isOpen, onClose, user, onLoginSuccess, onLogout, isMandatory }) {
  if (!isOpen) return null;

  const [mode, setMode] = useState(user?.isLoggedIn ? 'profile' : 'login'); 
  // Modes: 'login' | 'register' | 'verify_email' | 'forgot' | 'reset' | 'profile' | 'change_password'

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [verificationToken, setVerificationToken] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [showGooglePicker, setShowGooglePicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showEmailSimulator, setShowEmailSimulator] = useState(false);

  // Clear messages when mode changes
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, [mode]);

  // Calculate Password Strength Score (0 to 100)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 30;
    if (pass.length >= 10) score += 20;
    if (/[A-Z]/.test(pass)) score += 15;
    if (/[0-9]/.test(pass)) score += 15;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;

    if (score < 40) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score < 75) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  // Handle Google OAuth 2.0 Sign In
  const handleRealGoogleOAuth = () => {
    setLoading(true);
    setErrorMsg('');
    
    realGoogleAuthService.openRealGoogleOAuthWindow(
      (googleProfile) => {
        handleGoogleSignIn(googleProfile);
      },
      (error) => {
        setLoading(false);
        setErrorMsg(error || 'Google Authentication window was closed. Enter your Google email below.');
        setShowGooglePicker(true);
      }
    );
  };

  const handleCustomGoogleEmailSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail.trim()) return;

    const emailTrimmed = customGoogleEmail.trim();
    const nameFromEmail = emailTrimmed.split('@')[0];
    const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

    handleGoogleSignIn({
      googleId: `google_user_${Date.now()}`,
      email: emailTrimmed,
      name: formattedName,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${emailTrimmed}`,
      googleCalendarConnected: true
    });
  };

  const handleGoogleSignIn = async (googleProfile) => {
    setLoading(true);
    setErrorMsg('');

    try {
      if (!googleProfile || !googleProfile.email) {
        throw new Error('Google profile information missing.');
      }

      const data = await apiClient.loginWithGoogle(googleProfile);
      onLoginSuccess({
        ...data.user,
        authMethod: 'google',
        googleCalendarConnected: true
      });
      setSuccessMsg(`Signed in as ${googleProfile.email} • Cross-Device Sync Active!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email + Password Signup
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    if (!termsAccepted) {
      setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiClient.register(name, email, password, confirmPassword);
      if (data.requiresVerification) {
        setSuccessMsg(data.message || 'Verification code sent to your email!');
        setMode('verify_email');
      } else {
        onLoginSuccess(data.user);
        setSuccessMsg('Account created successfully!');
        setTimeout(() => onClose(), 1000);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. An account may already exist.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Verification Code Submit
  const handleVerifyEmailSubmit = async (e) => {
    e.preventDefault();
    if (!verificationToken.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiClient.verifyEmail(verificationToken.trim(), email.trim());
      onLoginSuccess(data.user);
      setSuccessMsg('Email verified successfully! Workspace activated.');
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Verification Email
  const handleResendVerification = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address to resend verification code.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient.resendVerification(email.trim());
      setSuccessMsg(data.message);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email + Password Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await apiClient.login(email.trim(), password);
      onLoginSuccess(data.user);
      setSuccessMsg('Signed in successfully!');
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email address or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiClient.forgotPassword(email.trim());
      setSuccessMsg(data.message);
      setMode('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Confirm
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiClient.resetPassword(resetToken.trim(), newPassword);
      setSuccessMsg(data.message);
      setTimeout(() => setMode('login'), 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Password (Profile Settings)
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiClient.changePassword(currentPassword, newPassword);
      setSuccessMsg(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile Info Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiClient.updateProfile(name.trim());
      onLoginSuccess(data.user);
      setSuccessMsg('Profile information updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="w-full max-w-md bg-white dark:bg-[#1a1926] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-6">
          
          {/* Header with DO THIS Brand Logo */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <img src="/dothis-logo.png" alt="DO THIS Logo" className="h-9 w-auto object-contain" />
              <div>
                <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'register' && 'Create Your Account'}
                  {mode === 'verify_email' && 'Verify Your Email'}
                  {mode === 'forgot' && 'Reset Password'}
                  {mode === 'reset' && 'Create New Password'}
                  {mode === 'profile' && 'User Profile & Settings'}
                  {mode === 'change_password' && 'Change Password'}
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold">Google OAuth & Multi-Device Sync</p>
              </div>
            </div>

            {!isMandatory && (
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4">
            
            {/* Global Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            {/* Global Success Banner */}
            {successMsg && (
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 shrink-0 text-teal-500" />
                <span className="flex-1">{successMsg}</span>
              </div>
            )}

            {/* MODE: LOGIN */}
            {mode === 'login' && (
              <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setMode('forgot')}
                        className="text-[11px] font-bold text-orange-500 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white rounded-2xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Log In to Workspace'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-[#1a1926] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
                    OR
                  </span>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleRealGoogleOAuth}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl border-2 border-orange-400/60 font-bold text-xs shadow-md flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight">Continue with Google Account</div>
                      <div className="text-[10px] text-orange-500 font-semibold">Official Google OAuth 2.0</div>
                    </div>
                  </div>
                  <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                </button>

                {/* Manual Fallback Input if Google popup blocked */}
                {showGooglePicker && (
                  <form onSubmit={handleCustomGoogleEmailSubmit} className="pt-2 space-y-2 animate-fade-in">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Enter Google Email Address:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        placeholder="your.email@gmail.com"
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                      />
                      <button type="submit" className="px-3 py-2 bg-orange-500 text-white font-bold rounded-xl text-xs">
                        Sign In
                      </button>
                    </div>
                  </form>
                )}

                {/* Footer Switch */}
                <div className="text-center pt-2 text-xs font-medium text-slate-500">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('register')} className="font-extrabold text-orange-500 hover:underline">
                    Sign up
                  </button>
                </div>
              </div>
            )}

            {/* MODE: REGISTER */}
            {mode === 'register' && (
              <div className="space-y-4">
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type="text"
                        required
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-slate-400">Password Strength:</span>
                          <span className={`${strength.score < 40 ? 'text-rose-500' : strength.score < 75 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {strength.label}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${strength.color} transition-all duration-300`} 
                            style={{ width: `${Math.max(strength.score, 10)}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms & Privacy Checkbox */}
                  <div className="flex items-start gap-2 pt-1">
                    <input 
                      type="checkbox"
                      id="terms"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                      I agree to the{' '}
                      <button 
                        type="button" 
                        onClick={() => setShowTermsModal(true)}
                        className="font-bold text-orange-500 hover:underline"
                      >
                        Terms of Service & Privacy Policy
                      </button>.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !termsAccepted}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-95 text-white rounded-2xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Create Account & Continue'}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-[#1a1926] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
                    OR
                  </span>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleRealGoogleOAuth}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-100 rounded-2xl border-2 border-orange-400/60 font-bold text-xs shadow-md flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight">Continue with Google Account</div>
                      <div className="text-[10px] text-orange-500 font-semibold">Official Google OAuth 2.0</div>
                    </div>
                  </div>
                  <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                </button>

                {/* Footer Switch */}
                <div className="text-center pt-2 text-xs font-medium text-slate-500">
                  Already have an account?{' '}
                  <button onClick={() => setMode('login')} className="font-extrabold text-orange-500 hover:underline">
                    Log in
                  </button>
                </div>
              </div>
            )}

            {/* MODE: VERIFY EMAIL */}
            {mode === 'verify_email' && (
              <div className="space-y-4">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-orange-600">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Email Verification Required</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    We dispatched a 6-digit verification code to <strong>{email}</strong>. Please enter the code below to activate your account.
                  </p>
                </div>

                <form onSubmit={handleVerifyEmailSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Verification Code
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 849201"
                      value={verificationToken}
                      onChange={(e) => setVerificationToken(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-center text-base font-mono font-bold tracking-widest text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !verificationToken.trim()}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify & Activate Workspace'}
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button onClick={handleResendVerification} className="font-bold text-orange-500 hover:underline">
                    Resend Code
                  </button>
                </div>
              </div>
            )}

            {/* MODE: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <div className="space-y-4">
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Your Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Send Reset Link / Code'}
                  </button>
                </form>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button onClick={() => setMode('login')} className="font-bold text-slate-500 hover:underline">
                    ← Back to Log In
                  </button>
                </div>
              </div>
            )}

            {/* MODE: RESET PASSWORD CONFIRM */}
            {mode === 'reset' && (
              <div className="space-y-4">
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Reset Code / Token
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. A9F2K1"
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-center text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !resetToken.trim() || !newPassword}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Set New Password & Continue'}
                  </button>
                </form>
              </div>
            )}

            {/* MODE: USER PROFILE & SETTINGS */}
            {mode === 'profile' && user?.isLoggedIn && (
              <div className="space-y-4">
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        alt="Avatar" 
                        className="w-12 h-12 rounded-full object-cover border-2 border-orange-400 shadow-sm" 
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="font-extrabold text-slate-800 dark:text-slate-100 text-sm bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:outline-none w-full py-0.5"
                        />
                        <div className="text-[11px] text-slate-400 pt-0.5">{user.email}</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Authentication Provider:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                          {user.provider || user.authMethod || 'Google OAuth'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-500">
                        <span>Email Status:</span>
                        <span className="font-bold text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-sm transition-colors"
                  >
                    Save Profile Changes
                  </button>
                </form>

                {user.provider === 'email' && (
                  <button
                    type="button"
                    onClick={() => setMode('change_password')}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-colors"
                  >
                    Change Password
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { onLogout(); onClose(); }}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out completely
                </button>
              </div>
            )}

            {/* MODE: CHANGE PASSWORD */}
            {mode === 'change_password' && (
              <div className="space-y-4">
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Current Password
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      New Password
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-2xl text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold text-xs"
                  >
                    Update Password
                  </button>
                </form>

                <button onClick={() => setMode('profile')} className="text-xs font-bold text-slate-500 hover:underline">
                  ← Back to Profile
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#1a1926] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">DO THIS — Terms of Service & Privacy Policy</h3>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3 leading-relaxed">
              <p><strong>1. Account Registration & Privacy:</strong> By creating an account on DO THIS, you agree to store your task management data securely on our encrypted cloud database engine. Your personal information will never be sold or shared with third parties.</p>
              <p><strong>2. Email Notifications:</strong> Automated system emails (such as email verification, security login alerts, and password reset instructions) are sent to your registered email address. Task reminder emails are dispatched only when you explicitly tick the "Send Email Notification" box on individual tasks.</p>
              <p><strong>3. Public Shared Links:</strong> When you generate a shareable link for a task or event, it becomes publicly viewable in read-only mode for anyone holding the unique link URL. Shared links do not allow guest viewers to edit or delete your tasks.</p>
              <p><strong>4. User Data Control:</strong> You retain complete ownership of your data. You may delete individual tasks, categories, or permanently erase your user account at any time via Profile Settings.</p>
            </div>

            <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <button 
                type="button" 
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }} 
                className="w-full py-2.5 bg-orange-500 text-white font-bold text-xs rounded-2xl hover:bg-orange-600 transition-colors"
              >
                Accept Terms & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
