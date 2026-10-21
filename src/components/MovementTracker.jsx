import React, { useState, useEffect } from 'react';
import {
  getDayMovement,
  updateDayMovement,
  addManualActivity,
  deleteManualActivity,
  todayStr
} from '../services/db';
import {
  Footprints,
  Flame,
  Clock,
  Compass,
  Plus,
  Trash2,
  Activity,
  Edit2,
  Check,
  AlertCircle,
  Smartphone,
  RefreshCw
} from 'lucide-react';

export default function MovementTracker({ settings, onUpdateSettings }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [movement, setMovement] = useState({ steps: 0, distanceKm: 0, activeMinutes: 0, caloriesBurned: 0, activities: [] });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalVal, setGoalVal] = useState(settings?.stepGoal || 10000);

  // Manual Activity Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [actType, setActType] = useState('Walking');
  const [actDuration, setActDuration] = useState('30');
  const [actDistance, setActDistance] = useState('2.5');
  const [actCalories, setActCalories] = useState('140');
  const [actNotes, setActNotes] = useState('');

  // Device sync status architecture
  const [syncStatus, setSyncStatus] = useState('local'); // 'local' | 'syncing' | 'synced'

  useEffect(() => {
    loadMovement();
  }, [selectedDate]);

  function loadMovement() {
    const data = getDayMovement(selectedDate);
    setMovement(data);
  }

  function handleSaveGoal() {
    const parsed = parseInt(goalVal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      if (onUpdateSettings) {
        onUpdateSettings({ ...settings, stepGoal: parsed });
      }
      setEditingGoal(false);
    }
  }

  function handleAddManualSubmit(e) {
    e.preventDefault();
    addManualActivity(selectedDate, {
      type: actType,
      duration: parseFloat(actDuration) || 0,
      distanceKm: parseFloat(actDistance) || 0,
      calories: parseFloat(actCalories) || 0,
      notes: actNotes
    });
    setShowAddModal(false);
    setActNotes('');
    loadMovement();
  }

  function handleDeleteActivity(id) {
    deleteManualActivity(selectedDate, id);
    loadMovement();
  }

  // Activity type presets calculation
  function handleTypeChange(type) {
    setActType(type);
    const dur = parseFloat(actDuration) || 30;
    if (type === 'Walking') {
      setActDistance((dur * 0.08).toFixed(1));
      setActCalories(Math.round(dur * 4.2).toString());
    } else if (type === 'Running') {
      setActDistance((dur * 0.16).toFixed(1));
      setActCalories(Math.round(dur * 10.5).toString());
    } else if (type === 'Cycling') {
      setActDistance((dur * 0.3).toFixed(1));
      setActCalories(Math.round(dur * 7.5).toString());
    } else if (type === 'HIIT') {
      setActDistance('0');
      setActCalories(Math.round(dur * 9.0).toString());
    }
  }

  function handleDurationChange(val) {
    setActDuration(val);
    const dur = parseFloat(val) || 0;
    if (actType === 'Walking') {
      setActDistance((dur * 0.08).toFixed(1));
      setActCalories(Math.round(dur * 4.2).toString());
    } else if (actType === 'Running') {
      setActDistance((dur * 0.16).toFixed(1));
      setActCalories(Math.round(dur * 10.5).toString());
    } else if (actType === 'Cycling') {
      setActDistance((dur * 0.3).toFixed(1));
      setActCalories(Math.round(dur * 7.5).toString());
    }
  }

  const stepGoal = settings?.stepGoal || 10000;
  const stepPercent = Math.min(100, Math.round((movement.steps / stepGoal) * 100));

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
            Daily Activity & Cardio
          </span>
          <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">Movement & Steps</h1>
          <p className="text-xs text-[#555B63] mt-0.5">
            Log your daily steps, walks, runs, and active calorie burn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-field text-xs py-2 w-auto font-mono"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Primary Step Target Card */}
      <div className="ui-card p-6 bg-[#FFFFFF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#FFAE00] flex-shrink-0">
              <Footprints className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-[#15171A] font-mono tracking-tight">
                  {movement.steps.toLocaleString()}
                </span>
                <span className="text-xs text-[#555B63] font-bold uppercase">Steps</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#555B63]">
                  Goal: {stepGoal.toLocaleString()}
                </span>
                <button
                  onClick={() => setEditingGoal(true)}
                  className="text-[11px] font-bold text-[#FFAE00] hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Goal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-[#D9DDE2] pt-4 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#555B63] flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#555B63]" /> Distance
              </span>
              <div className="text-base font-bold font-mono text-[#15171A] mt-0.5">
                {movement.distanceKm} <span className="text-xs font-normal text-[#555B63]">km</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#555B63] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#555B63]" /> Active Time
              </span>
              <div className="text-base font-bold font-mono text-[#15171A] mt-0.5">
                {movement.activeMinutes} <span className="text-xs font-normal text-[#555B63]">min</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#555B63] flex items-center gap-1">
                <Flame className="w-3 h-3 text-[#FFAE00]" /> Est. Burn
              </span>
              <div className="text-base font-bold font-mono text-[#15171A] mt-0.5">
                {movement.caloriesBurned} <span className="text-xs font-normal text-[#555B63]">kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-[#555B63]">Daily Progress</span>
            <span className="text-[#15171A]">{stepPercent}%</span>
          </div>
          <div className="w-full bg-[#EAECEF] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#FFAE00] h-full transition-all duration-300"
              style={{ width: `${stepPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goal Edit Dialog */}
      {editingGoal && (
        <div className="ui-card p-4 bg-[#F6F6F7] border-[#15171A] flex items-center justify-between gap-4">
          <div>
            <label className="text-xs font-bold text-[#15171A] block">Set Daily Step Goal</label>
            <span className="text-[11px] text-[#555B63]">Target non-exercise movement for daily expenditure</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="500"
              value={goalVal}
              onChange={e => setGoalVal(e.target.value)}
              className="input-field text-xs py-1.5 w-28 font-mono"
            />
            <button onClick={handleSaveGoal} className="btn btn-primary text-xs py-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button onClick={() => setEditingGoal(false)} className="btn btn-secondary text-xs py-1.5">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Device Integration Architecture Notice */}
      <div className="ui-card p-4 bg-[#F6F6F7] flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-[#555B63] flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-[#15171A] block">Local-First Health Integration Architecture</span>
          <p className="text-[#555B63] mt-0.5 leading-relaxed">
            Standard web browsers cannot continuously track hardware step counters in the background without dedicated native bridges (e.g. Apple HealthKit or Google Health Connect). CORE FIT logs movement accurately through manual activity entries and direct sync exports.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="badge-tag">Sync Status: Local Storage Active</span>
            <span className="badge-tag">Last Validated: Today</span>
          </div>
        </div>
      </div>

      {/* Logged Activities Table */}
      <div className="ui-card p-5">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
            Recorded Movement Sessions ({movement.activities?.length || 0})
          </h3>
          <span className="text-xs text-[#555B63]">{selectedDate}</span>
        </div>

        {(!movement.activities || movement.activities.length === 0) ? (
          <div className="p-8 text-center bg-[#F6F6F7] rounded-[8px] border border-dashed border-[#D9DDE2]">
            <Activity className="w-8 h-8 text-[#8B939E] mx-auto mb-2" />
            <div className="text-xs font-bold text-[#15171A]">No activities logged for this date</div>
            <p className="text-[11px] text-[#555B63] mt-1">
              Add a walk, run, cycling session, or HIIT workout above to compute distance and calories.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#D9DDE2] text-[#555B63] uppercase text-[10px]">
                  <th className="pb-2 font-bold">Activity</th>
                  <th className="pb-2 font-bold">Time</th>
                  <th className="pb-2 font-bold">Duration</th>
                  <th className="pb-2 font-bold">Distance</th>
                  <th className="pb-2 font-bold">Est. Burn</th>
                  <th className="pb-2 font-bold">Notes</th>
                  <th className="pb-2 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAECEF]">
                {movement.activities.map(act => (
                  <tr key={act.id} className="hover:bg-[#F6F6F7]">
                    <td className="py-2.5 font-bold text-[#15171A]">{act.type}</td>
                    <td className="py-2.5 text-[#555B63] font-mono">{act.time}</td>
                    <td className="py-2.5 font-mono">{act.duration} min</td>
                    <td className="py-2.5 font-mono">{act.distanceKm} km</td>
                    <td className="py-2.5 font-mono text-[#FFAE00] font-bold">{act.calories} kcal</td>
                    <td className="py-2.5 text-[#555B63] truncate max-w-[140px]">{act.notes || '—'}</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        className="p-1 rounded text-[#555B63] hover:text-[#DC2626]"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-6 w-full max-w-md bg-[#FFFFFF] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
              <h4 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                Log Movement / Cardio
              </h4>
              <button onClick={() => setShowAddModal(false)} className="text-[#555B63] hover:text-[#15171A] text-xs font-bold">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddManualSubmit} className="space-y-3.5">
              <div>
                <label className="input-label">Activity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Walking', 'Running', 'Cycling', 'HIIT'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeChange(type)}
                      className={`py-2 text-xs font-bold rounded-[6px] border ${
                        actType === type
                          ? 'bg-[#FFAE00] text-white border-[#FFAE00]'
                          : 'bg-[#FFFFFF] text-[#555B63] border-[#D9DDE2]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Duration (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={actDuration}
                    onChange={e => handleDurationChange(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="input-label">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actDistance}
                    onChange={e => setActDistance(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Estimated Calories (kcal)</label>
                <input
                  type="number"
                  value={actCalories}
                  onChange={e => setActCalories(e.target.value)}
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="input-label">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Morning outdoor walk with incline"
                  value={actNotes}
                  onChange={e => setActNotes(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 text-xs"
                >
                  Save Activity Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
