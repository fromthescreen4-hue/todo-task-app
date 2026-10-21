import React, { useState } from 'react';
import {
  saveSettings,
  exportAllData,
  importAllData,
  clearAllData,
  convertWeightLogUnit,
  syncToCloudNow,
  restoreFromCloudNow
} from '../services/db';
import { isFirebaseConfigured } from '../services/firebase';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Check,
  Shield,
  FileText,
  AlertTriangle,
  Bell,
  Scale,
  Cloud,
  UploadCloud,
  DownloadCloud,
  Key,
  CheckCircle2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function Settings({ settings, onUpdate, onResetApp, onReplaySplash }) {
  const [unit, setUnit] = useState(settings?.unit || 'kg');
  const [heightUnit, setHeightUnit] = useState(settings?.heightUnit || 'cm');
  const [height, setHeight] = useState(settings?.height || 175);
  const [age, setAge] = useState(settings?.age || 26);
  const [gender, setGender] = useState(settings?.gender || 'male');
  const [activityLevel, setActivityLevel] = useState(settings?.activityLevel || 'moderately_active');
  const [reminders, setReminders] = useState(settings?.remindersEnabled ?? true);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [cloudMessage, setCloudMessage] = useState('');
  const [cloudBusy, setCloudBusy] = useState(false);

  function handleSaveProfile(e) {
    e.preventDefault();
    if (unit !== settings?.unit) {
      convertWeightLogUnit(settings?.unit || 'kg', unit);
    }
    const updated = {
      ...settings,
      unit,
      heightUnit,
      height: parseFloat(height) || 175,
      age: parseInt(age, 10) || 26,
      gender,
      activityLevel,
      remindersEnabled: reminders
    };
    saveSettings(updated);
    if (onUpdate) onUpdate(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  async function handleManualCloudSync() {
    setCloudBusy(true);
    setCloudMessage('');
    try {
      await syncToCloudNow();
      setCloudMessage('All workout and nutrition records successfully synced.');
    } catch (err) {
      setCloudMessage('Sync notice: ' + err.message);
    } finally {
      setCloudBusy(false);
      setTimeout(() => setCloudMessage(''), 4000);
    }
  }

  async function handleManualCloudRestore() {
    if (!window.confirm('Restore records from your cloud backup? This will merge with local storage.')) return;
    setCloudBusy(true);
    setCloudMessage('');
    try {
      await restoreFromCloudNow();
      setCloudMessage('Cloud data restored successfully. Refreshing view...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setCloudMessage('Restore failed: ' + err.message);
      setCloudBusy(false);
    }
  }

  function handleExport() {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `core-fit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        importAllData(parsed);
        alert('Data imported successfully. Reloading view...');
        window.location.reload();
      } catch (err) {
        alert('Invalid JSON backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function handleExecuteClear() {
    clearAllData();
    setShowClearConfirm(false);
    if (onResetApp) {
      onResetApp();
    } else {
      window.location.reload();
    }
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Editorial Header */}
      <div className="border-b border-[#D9DDE2] pb-4 sm:pb-5">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
          App & Account Settings
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-[#15171A] tracking-tight">
          Profile & System Settings
        </h1>
        <p className="text-xs text-[#555B63] mt-0.5">
          Units of measurement, reminders, cloud backup sync, and account settings.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-[8px] text-xs font-bold text-[#16A34A] flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>Profile configuration saved and stored locally.</span>
        </div>
      )}

      {/* Cloud Sync Card */}
      <div className="ui-card p-4 sm:p-6 bg-[#FFFFFF] space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-[#0284C7] flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide">
              Cloud Backup &amp; Sync
            </h3>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
            isFirebaseConfigured()
              ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]'
              : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
          }`}>
            {isFirebaseConfigured() ? 'Cloud Sync Active' : 'Offline Mode'}
          </span>
        </div>

        <p className="text-xs text-[#555B63] leading-relaxed">
          Your workouts, weigh-ins, and food diary automatically synchronize across your devices when signed in.
        </p>

        {cloudMessage && (
          <div className="p-3 bg-[#F0F9FF] border border-[#BAE6FD] rounded-[8px] text-xs font-semibold text-[#0284C7] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{cloudMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleManualCloudSync}
            disabled={cloudBusy}
            className="btn btn-primary text-xs flex-1 py-2"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{cloudBusy ? 'Syncing...' : 'Back Up to Cloud'}</span>
          </button>
          <button
            onClick={handleManualCloudRestore}
            disabled={cloudBusy}
            className="btn btn-secondary text-xs flex-1 py-2"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-[#555B63]" />
            <span>Restore from Cloud</span>
          </button>
        </div>
      </div>

      {/* Biometric & Measurement Preferences */}
      <div className="ui-card p-4 sm:p-6 bg-[#FFFFFF] space-y-4 sm:space-y-5">
        <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide border-b border-[#D9DDE2] pb-3">
          Biometric Profile & Units
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="input-label">Weight Measurement Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="input-field text-xs font-bold"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="lbs">Pounds (lbs)</option>
              </select>
              <span className="text-[10px] text-[#555B63] mt-1 block">
                Historical weight logs are automatically mathematically converted.
              </span>
            </div>

            <div>
              <label className="input-label">Height Unit & Height</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className="input-field font-mono text-xs flex-1"
                />
                <select
                  value={heightUnit}
                  onChange={e => setHeightUnit(e.target.value)}
                  className="input-field text-xs w-24"
                >
                  <option value="cm">cm</option>
                  <option value="inches">inches</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="input-label">Chronological Age</label>
              <input
                type="number"
                min="14"
                max="100"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="input-field font-mono text-xs"
              />
            </div>

            <div>
              <label className="input-label">Biological Sex</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="input-field text-xs"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="input-label">Activity Level</label>
              <select
                value={activityLevel}
                onChange={e => setActivityLevel(e.target.value)}
                className="input-field text-xs"
              >
                <option value="sedentary">Sedentary (desk work)</option>
                <option value="lightly_active">Lightly active (1-2 days)</option>
                <option value="moderately_active">Moderately active (3-5 days)</option>
                <option value="very_active">Very active (6-7 days intense)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#555B63] flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#15171A] block">Training & Hydration Reminders</span>
                <span className="text-[10px] sm:text-[11px] text-[#555B63]">In-browser notifications for water replenishment and workout time</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={reminders}
              onChange={e => setReminders(e.target.checked)}
              className="w-4 h-4 accent-[#FFAE00] cursor-pointer ml-2"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn btn-primary text-xs w-full sm:w-auto">
              Save Profile Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Data Sovereignty: Export & Import */}
      <div className="ui-card p-4 sm:p-6 bg-[#FFFFFF] space-y-3 sm:space-y-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide border-b border-[#D9DDE2] pb-3">
          Export & Import Data Backup
        </h3>
        <p className="text-xs text-[#555B63] leading-relaxed">
          CORE FIT respects complete user privacy. You can download an offline JSON backup of your records or restore a backup file anytime.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={handleExport}
            className="btn btn-secondary text-xs flex-1 py-2 justify-center"
          >
            <Download className="w-3.5 h-3.5 text-[#555B63]" />
            <span>Export Database (JSON)</span>
          </button>

          <label className="btn btn-secondary text-xs flex-1 py-2 justify-center cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#555B63]" />
            <span>Restore from Backup (JSON)</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="ui-card p-4 sm:p-6 bg-[#FFFFFF] border-[#FCA5A5] space-y-3">
        <h3 className="text-xs sm:text-sm font-bold text-[#DC2626] uppercase tracking-wide flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
          <span>Danger Zone: Clear Local Records</span>
        </h3>
        <p className="text-xs text-[#555B63] leading-relaxed">
          Permanently eradicate all workouts, weigh-ins, nutrition logs, and progress photos on this device.
        </p>

        <div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="btn btn-destructive text-xs py-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All Local Data</span>
          </button>
        </div>
      </div>

      {/* Legal & Compliance Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#555B63] pt-4 border-t border-[#D9DDE2]">
        <div className="flex items-center gap-4 flex-wrap">
          <a href="#/privacy" className="hover:text-[#15171A] hover:underline flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </a>
          <a href="#/terms" className="hover:text-[#15171A] hover:underline flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </a>
          <a href="#/admin" className="hover:text-[#FFAE00] hover:underline flex items-center gap-1 text-[#8B939E]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Portal (/#/admin)</span>
          </a>
          {onReplaySplash && (
            <button
              onClick={onReplaySplash}
              className="hover:text-[#FFAE00] flex items-center gap-1 text-[#555B63]"
              title="Preview Animated Splash Screen"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFAE00]" />
              <span>Preview Splash Screen</span>
            </button>
          )}
        </div>
        <span className="font-mono text-[10px] text-[#8B939E]">CORE FIT v2.0.0-PROD</span>
      </div>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-6 w-full max-w-sm bg-[#FFFFFF] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-bold uppercase">Confirm Data Wipe</h4>
            </div>
            <p className="text-xs text-[#555B63] leading-relaxed">
              This will remove all weigh-ins, active workouts, nutrition logs, and photos stored in this browser.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn btn-secondary flex-1 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClear}
                className="btn btn-primary bg-[#DC2626] border-[#DC2626] flex-1 text-xs"
              >
                Yes, Wipe Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
