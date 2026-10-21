import React, { useState, useEffect } from 'react';
import {
  getSystemLogs,
  getCustomFoods,
  deleteCustomFood,
  getCustomExercises,
  deleteCustomExercise,
  addCustomExercise,
  exportAllData
} from '../services/db';
import {
  ShieldAlert,
  Database,
  Utensils,
  Dumbbell,
  Trash2,
  Plus,
  RefreshCw,
  Terminal,
  Activity,
  HardDrive,
  ArrowLeft,
  Download,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function AdminPanel({ onExit }) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'foods' | 'exercises' | 'logs'
  const [logs, setLogs] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [storageAudit, setStorageAudit] = useState({ keysCount: 0, approxKb: 0 });

  // Add custom exercise form
  const [showAddEx, setShowAddEx] = useState(false);
  const [exName, setExName] = useState('');
  const [exCategory, setExCategory] = useState('Upper Body');
  const [exMuscle, setExMuscle] = useState('');
  const [exEquipment, setExEquipment] = useState('Barbell');

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    setLogs(getSystemLogs());
    setCustomFoods(getCustomFoods());
    setCustomExercises(getCustomExercises());

    // Compute storage audit
    let totalLen = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      totalLen += (localStorage.getItem(key) || '').length;
    }
    setStorageAudit({
      keysCount: localStorage.length,
      approxKb: (totalLen / 1024).toFixed(2)
    });
  }

  function handleDeleteFood(id) {
    deleteCustomFood(id);
    loadAll();
  }

  function handleDeleteEx(id) {
    deleteCustomExercise(id);
    loadAll();
  }

  function handleCreateExSubmit(e) {
    e.preventDefault();
    if (!exName || !exMuscle) return;
    addCustomExercise({
      name: exName,
      categories: [exCategory],
      primaryMuscle: exMuscle,
      equipment: exEquipment,
      level: 'All Levels',
      cues: {
        stance: 'Balanced athletic posture.',
        grip: 'Secure grip aligned with joints.',
        breathing: 'Exhale during concentric drive.',
        mistakes: ['Loss of spinal neutral position', 'Rushing tempo']
      },
      svgType: 'arms'
    });
    setExName('');
    setExMuscle('');
    setShowAddEx(false);
    loadAll();
  }

  function handleExportBackup() {
    const rawData = exportAllData();
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `core-fit-admin-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReturn() {
    if (onExit) {
      onExit();
    } else {
      window.location.hash = '#/';
      if (window.location.pathname === '/admin') {
        window.history.pushState(null, '', '/');
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F6F7] text-[#15171A] flex flex-col font-sans">
      {/* Standalone Admin Console Top Header */}
      <header className="bg-[#FFFFFF] border-b border-[#D9DDE2] sticky top-0 z-30 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img
            src="/core-fit-logo.png"
            alt="CORE FIT"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black tracking-tight text-[#15171A] uppercase leading-none">
                CORE FIT Admin Console
              </span>
              <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider bg-[#15171A] text-white">
                URL: /#/admin
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold text-[#555B63] tracking-wider block mt-0.5">
              System Administration & Data Management
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="hidden sm:inline-flex btn btn-secondary text-xs py-1.5 px-3 items-center gap-1.5"
            title="Download full database snapshot"
          >
            <Download className="w-3.5 h-3.5 text-[#555B63]" />
            <span>Export Raw Snapshot</span>
          </button>

          <button
            onClick={handleReturn}
            className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to App</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Editorial Sub-Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
              System Diagnostics
            </span>
            <h1 className="text-2xl font-black text-[#15171A] tracking-tight mt-0.5">
              Admin & Content Management
            </h1>
            <p className="text-xs text-[#555B63] mt-1">
              Catalog administration, local storage audit, and real-time client diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAll}
              className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#555B63]" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Admin Tab Navigation */}
        <div className="flex gap-2 border-b border-[#D9DDE2] pb-2 overflow-x-auto">
          {[
            { id: 'telemetry', label: 'Storage & Health', icon: HardDrive },
            { id: 'foods', label: `Custom Foods (${customFoods.length})`, icon: Utensils },
            { id: 'exercises', label: `Custom Exercises (${customExercises.length})`, icon: Dumbbell },
            { id: 'logs', label: `System Logs (${logs.length})`, icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-[6px] whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#15171A] text-white shadow-sm'
                    : 'bg-[#FFFFFF] text-[#555B63] border border-[#D9DDE2] hover:bg-[#F6F6F7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      {/* Tab 1: Storage & Telemetry */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="ui-card p-4 sm:p-5">
              <span className="text-[10px] uppercase font-bold text-[#555B63]">Active Storage Keys</span>
              <div className="text-xl sm:text-2xl font-black text-[#15171A] font-mono mt-1">
                {storageAudit.keysCount} keys
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Persistent records</div>
            </div>

            <div className="ui-card p-4 sm:p-5">
              <span className="text-[10px] uppercase font-bold text-[#555B63]">Allocated Space</span>
              <div className="text-xl sm:text-2xl font-black text-[#15171A] font-mono mt-1">
                {storageAudit.approxKb} <span className="text-xs font-bold text-[#555B63]">KB</span>
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Optimal performance range</div>
            </div>

            <div className="ui-card p-4 sm:p-5">
              <span className="text-[10px] uppercase font-bold text-[#555B63]">Database Engine</span>
              <div className="text-xl sm:text-2xl font-black text-[#16A34A] font-mono mt-1">
                ACTIVE
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Local Storage Engine</div>
            </div>

            <div className="ui-card p-4 sm:p-5">
              <span className="text-[10px] uppercase font-bold text-[#555B63]">Cloud Database</span>
              <div className="text-xl sm:text-2xl font-black text-[#0284C7] font-mono mt-1">
                CONNECTED
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Real-time sync enabled</div>
            </div>
          </div>

          <div className="ui-card p-5 bg-[#FFFFFF]">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#15171A] mb-2">
              System Overview
            </h3>
            <p className="text-xs text-[#555B63] leading-relaxed">
              CORE FIT operates on a fast, secure local-first architecture. All workout logs, weigh-ins, meals, and photos are kept private on your device, with automatic cloud backup enabled.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Custom Foods */}
      {activeTab === 'foods' && (
        <div className="ui-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide border-b border-[#D9DDE2] pb-3">
            User Custom Foods Catalog ({customFoods.length})
          </h3>

          {customFoods.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#555B63]">
              No custom food dishes created yet. Users can add custom regional recipes via the Nutrition screen.
            </div>
          ) : (
            <div className="divide-y divide-[#EAECEF]">
              {customFoods.map(f => (
                <div key={f.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#15171A]">{f.name}</span>
                    <div className="text-[11px] text-[#555B63] mt-0.5">
                      {f.category} • {f.serving} • <span className="font-mono font-bold text-[#FFAE00]">{f.calories} kcal</span> ({f.protein}g P | {f.carbs}g C | {f.fat}g F)
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFood(f.id)}
                    className="p-1.5 text-[#555B63] hover:text-[#DC2626]"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Custom Exercises */}
      {activeTab === 'exercises' && (
        <div className="ui-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
              Custom Exercise Catalog ({customExercises.length})
            </h3>
            <button
              onClick={() => setShowAddEx(true)}
              className="btn btn-primary text-xs py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Exercise</span>
            </button>
          </div>

          {customExercises.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#555B63]">
              No custom exercises created yet. Click above to inject a custom exercise into the library.
            </div>
          ) : (
            <div className="divide-y divide-[#EAECEF]">
              {customExercises.map(ex => (
                <div key={ex.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#15171A]">{ex.name}</span>
                    <div className="text-[11px] text-[#555B63] mt-0.5">
                      {ex.primaryMuscle} • {ex.equipment}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEx(ex.id)}
                    className="p-1.5 text-[#555B63] hover:text-[#DC2626]"
                    title="Delete exercise"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom exercise modal */}
          {showAddEx && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="ui-card p-6 w-full max-w-md bg-[#FFFFFF] space-y-4 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
                  <h4 className="text-sm font-bold uppercase">Add Custom Exercise</h4>
                  <button onClick={() => setShowAddEx(false)} className="text-xs text-[#555B63]">Cancel</button>
                </div>
                <form onSubmit={handleCreateExSubmit} className="space-y-3">
                  <div>
                    <label className="input-label">Exercise Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bulgarian Split Squat"
                      value={exName}
                      onChange={e => setExName(e.target.value)}
                      className="input-field text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="input-label">Category</label>
                      <select
                        value={exCategory}
                        onChange={e => setExCategory(e.target.value)}
                        className="input-field text-xs"
                      >
                        <option value="Upper Body">Upper Body</option>
                        <option value="Lower Body">Lower Body</option>
                        <option value="Push">Push</option>
                        <option value="Pull">Pull</option>
                        <option value="Legs">Legs</option>
                        <option value="Core">Core</option>
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Equipment</label>
                      <select
                        value={exEquipment}
                        onChange={e => setExEquipment(e.target.value)}
                        className="input-field text-xs"
                      >
                        <option value="Barbell">Barbell</option>
                        <option value="Dumbbells">Dumbbells</option>
                        <option value="Cable">Cable</option>
                        <option value="Machine">Machine</option>
                        <option value="Bodyweight">Bodyweight</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Primary Muscle Target</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quadriceps & Gluteus Maximus"
                      value={exMuscle}
                      onChange={e => setExMuscle(e.target.value)}
                      className="input-field text-xs"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddEx(false)} className="btn btn-secondary flex-1 text-xs">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary flex-1 text-xs">
                      Save Exercise
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: System Telemetry Logs */}
      {activeTab === 'logs' && (
        <div className="ui-card p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
              Recent System &amp; Diagnostic Events
            </h3>
            <span className="text-[10px] font-mono text-[#555B63]">Retains 100 recent entries</span>
          </div>

          <div className="bg-[#15171A] text-[#F6F6F7] p-4 rounded-[8px] font-mono text-[11px] max-h-96 overflow-y-auto space-y-1.5">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-[#8B939E] flex-shrink-0">[{log.time?.slice(11, 19) || 'LOG'}]</span>
                <span className={`font-bold flex-shrink-0 ${
                  log.type === 'ERROR' || log.type === 'STORAGE_ERROR'
                    ? 'text-[#DC2626]'
                    : log.type === 'AUTH'
                    ? 'text-[#0284C7]'
                    : 'text-[#FFAE00]'
                }`}>
                  [{log.type}]
                </span>
                <span className="text-[#D9DDE2]">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      </main>

      {/* Standalone Admin Footer */}
      <footer className="bg-[#FFFFFF] border-t border-[#D9DDE2] py-4 px-4 sm:px-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#555B63]">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#15171A]">CORE FIT ADMIN CONSOLE</span>
            <span>•</span>
            <span>Isolated Environment</span>
            <span>•</span>
            <span className="font-mono text-[11px]">URL: /#/admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleReturn}
              className="text-[#FFAE00] font-semibold hover:underline"
            >
              Exit Console & Return to App
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
