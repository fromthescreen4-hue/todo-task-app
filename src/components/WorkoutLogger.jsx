import React, { useState, useEffect, useRef } from 'react';
import {
  getWorkouts,
  saveWorkout,
  deleteWorkout,
  getExerciseHistory,
  updateExerciseHistory,
  todayStr
} from '../services/db';
import { EXERCISES } from '../data/exercisesData';
import RestTimer from './RestTimer';
import {
  Dumbbell,
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  Timer,
  Clock,
  RotateCcw,
  Search,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

export default function WorkoutLogger({ settings, initialExerciseToAdd }) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [workoutsList, setWorkoutsList] = useState([]);
  const [exerciseHistory, setExerciseHistory] = useState({});

  // Active workout state
  const [sessionName, setSessionName] = useState('Upper Body Hypertrophy');
  const [sessionNotes, setSessionNotes] = useState('');
  const [exercises, setExercises] = useState([
    {
      id: 'ex-1',
      name: 'Barbell Flat Bench Press',
      sets: [
        { id: 's-1', weight: 60, reps: 10, completed: false },
        { id: 's-2', weight: 65, reps: 8, completed: false },
        { id: 's-3', weight: 70, reps: 6, completed: false }
      ]
    }
  ]);

  // Stopwatch state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const stopwatchRef = useRef(null);

  // Rest Timer modal
  const [showRestTimer, setShowRestTimer] = useState(false);

  // Add exercise picker modal
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const unit = settings?.unit || 'kg';

  useEffect(() => {
    loadWorkouts();
    setExerciseHistory(getExerciseHistory());
  }, []);

  useEffect(() => {
    if (initialExerciseToAdd) {
      handleAddExercise(initialExerciseToAdd.name);
    }
  }, [initialExerciseToAdd]);

  useEffect(() => {
    if (timerRunning) {
      stopwatchRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(stopwatchRef.current);
    }
    return () => clearInterval(stopwatchRef.current);
  }, [timerRunning]);

  function loadWorkouts() {
    setWorkoutsList(getWorkouts());
  }

  function handleAddExercise(name) {
    const lastSession = exerciseHistory[name];
    const defaultSets = lastSession?.sets?.length > 0
      ? lastSession.sets.map((s, idx) => ({
          id: `s-${Date.now()}-${idx}`,
          weight: s.weight,
          reps: s.reps,
          completed: false
        }))
      : [
          { id: `s-${Date.now()}-1`, weight: 40, reps: 10, completed: false },
          { id: `s-${Date.now()}-2`, weight: 40, reps: 10, completed: false },
          { id: `s-${Date.now()}-3`, weight: 40, reps: 10, completed: false }
        ];

    const newEx = {
      id: `ex-${Date.now()}`,
      name,
      sets: defaultSets
    };

    setExercises(prev => [...prev, newEx]);
    setShowPicker(false);
    setPickerSearch('');
  }

  function handleAddSet(exerciseId) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet = {
          id: `s-${Date.now()}`,
          weight: lastSet ? lastSet.weight : 40,
          reps: lastSet ? lastSet.reps : 10,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  }

  function handleRemoveSet(exerciseId, setId) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      })
    );
  }

  function handleRemoveExercise(exerciseId) {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  }

  function handleUpdateSet(exerciseId, setId, field, val) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id !== setId) return s;
            return { ...s, [field]: val };
          })
        };
      })
    );
  }

  function handleToggleSetComplete(exerciseId, setId) {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id !== setId) return s;
            const nextCompleted = !s.completed;
            if (nextCompleted) {
              // Open rest timer automatically on completing a set
              setShowRestTimer(true);
            }
            return { ...s, completed: nextCompleted };
          })
        };
      })
    );
  }

  function handleFinishWorkout() {
    if (exercises.length === 0) return;
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    
    // Compute total volume
    let totalVolume = 0;
    let completedSetsCount = 0;
    exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          totalVolume += (s.weight || 0) * (s.reps || 0);
          completedSetsCount++;
        }
      });
      // Save to exercise history for progressive overload memory
      updateExerciseHistory(ex.name, ex.sets, todayStr());
    });

    const workoutRecord = {
      name: sessionName || 'Workout Session',
      date: todayStr(),
      duration: durationMins,
      volume: totalVolume,
      completedSets: completedSetsCount,
      notes: sessionNotes,
      unit: unit,
      exercises: exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps, completed: s.completed }))
      }))
    };

    saveWorkout(workoutRecord);
    setTimerRunning(false);
    setElapsedSeconds(0);
    setSessionNotes('');
    loadWorkouts();
    setActiveTab('history');
  }

  function handleDeletePastWorkout(id) {
    deleteWorkout(id);
    loadWorkouts();
  }

  // Format stopwatch
  const stopMins = Math.floor(elapsedSeconds / 60);
  const stopSecs = elapsedSeconds % 60;

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
            Sets & Progressive Overload
          </span>
          <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">Active Workout Session</h1>
          <p className="text-xs text-[#555B63] mt-0.5">
            Real-time workout tracking, set completion, and rest timer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub tabs */}
          <div className="flex bg-[#EAECEF] p-0.5 rounded-[8px]">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors ${
                activeTab === 'active' ? 'bg-[#FFFFFF] text-[#15171A] shadow-sm' : 'text-[#555B63]'
              }`}
            >
              Active Session
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors ${
                activeTab === 'history' ? 'bg-[#FFFFFF] text-[#15171A] shadow-sm' : 'text-[#555B63]'
              }`}
            >
              Workout History ({workoutsList.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-6">
          {/* Live Session Bar: Stopwatch & Rest Timer Launcher */}
          <div className="ui-card p-4 sm:p-5 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {timerRunning && (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFAE00] animate-pulse" />
                )}
                <div className="text-3xl font-black font-mono text-[#15171A] tracking-tight">
                  {String(stopMins).padStart(2, '0')}:{String(stopSecs).padStart(2, '0')}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`btn text-xs py-1.5 px-3 font-bold transition-all active:scale-95 ${
                    timerRunning ? 'btn-secondary text-[#DC2626] border-[#DC2626]' : 'btn-primary'
                  }`}
                >
                  {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{timerRunning ? 'Pause' : 'Start Timer'}</span>
                </button>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setElapsedSeconds(0);
                  }}
                  className="btn btn-secondary text-xs py-1.5 px-2"
                  title="Reset Stopwatch"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#555B63]" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRestTimer(true)}
                className="btn btn-secondary text-xs py-2"
              >
                <Timer className="w-4 h-4 text-[#FFAE00]" />
                <span>Rest Timer</span>
              </button>
              <button
                onClick={handleFinishWorkout}
                className="btn btn-primary text-xs py-2 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Finish Workout</span>
              </button>
            </div>
          </div>

          {/* Session Title & Notes */}
          <div className="ui-card p-4 bg-[#FFFFFF] space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="input-label">Session Name</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  className="input-field text-sm font-bold"
                />
              </div>
              <div>
                <label className="input-label">Session Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Good energy, increased load on bench press"
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          </div>

          {/* Exercise Sets Builder */}
          <div className="space-y-4">
            {exercises.map((ex, exIdx) => {
              const lastPerf = exerciseHistory[ex.name];
              return (
                <div key={ex.id} className="ui-card p-5 bg-[#FFFFFF] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#555B63]">#{exIdx + 1}</span>
                        <h3 className="text-sm font-black text-[#15171A]">{ex.name}</h3>
                      </div>
                      {lastPerf && lastPerf.sets?.length > 0 && (
                        <div className="text-[11px] text-[#555B63] mt-0.5">
                          Previous session ({lastPerf.date}):{' '}
                          <span className="font-mono font-semibold text-[#15171A]">
                            {lastPerf.sets.map(s => `${s.weight}k × ${s.reps}`).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="text-xs text-[#555B63] hover:text-[#DC2626] font-semibold"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#D9DDE2] text-[#555B63] uppercase text-[10px]">
                          <th className="pb-1.5 font-bold w-12">Set</th>
                          <th className="pb-1.5 font-bold">Weight ({unit})</th>
                          <th className="pb-1.5 font-bold">Reps</th>
                          <th className="pb-1.5 font-bold text-center w-20">Done</th>
                          <th className="pb-1.5 font-bold text-right w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAECEF]">
                        {ex.sets.map((set, sIdx) => (
                          <tr key={set.id} className={set.completed ? 'bg-[#F0FDF4]' : ''}>
                            <td className="py-2 font-mono font-bold text-[#555B63]">{sIdx + 1}</td>
                            <td className="py-2">
                              <input
                                type="number"
                                step="2.5"
                                value={set.weight}
                                onChange={e => handleUpdateSet(ex.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                className="w-24 p-1.5 border rounded-[6px] font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="py-2">
                              <input
                                type="number"
                                min="1"
                                value={set.reps}
                                onChange={e => handleUpdateSet(ex.id, set.id, 'reps', parseInt(e.target.value, 10) || 0)}
                                className="w-20 p-1.5 border rounded-[6px] font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <button
                                onClick={() => handleToggleSetComplete(ex.id, set.id)}
                                className={`w-7 h-7 rounded-[6px] border flex items-center justify-center mx-auto transition-all active:scale-75 ${
                                  set.completed
                                    ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-xs'
                                    : 'bg-[#FFFFFF] border-[#D9DDE2] text-[#555B63] hover:border-[#15171A]'
                                }`}
                              >
                                <Check className={`w-4 h-4 transition-transform ${set.completed ? 'scale-110' : ''}`} />
                              </button>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleRemoveSet(ex.id, set.id)}
                                className="p-1 text-[#555B63] hover:text-[#DC2626]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => handleAddSet(ex.id)}
                    className="btn btn-secondary w-full text-xs py-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Set</span>
                  </button>
                </div>
              );
            })}

            <button
              onClick={() => setShowPicker(true)}
              className="btn btn-primary w-full py-3 text-xs shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exercise to Session</span>
            </button>
          </div>
        </div>
      ) : (
        /* Workout History Tab */
        <div className="ui-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide border-b border-[#D9DDE2] pb-3">
            Logged Workout Sessions ({workoutsList.length})
          </h3>

          {workoutsList.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#555B63]">
              No workouts logged yet. Start your first session in the Active Session tab.
            </div>
          ) : (
            <div className="space-y-3">
              {workoutsList.map(w => (
                <div key={w.id} className="p-4 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-[#555B63]">{w.date}</span>
                      <h4 className="text-sm font-black text-[#15171A]">{w.name}</h4>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <span className="font-mono font-bold text-[#FFAE00] block">
                          {w.volume?.toLocaleString() || 0} {w.unit || unit} volume
                        </span>
                        <span className="text-[10px] text-[#555B63] block">
                          {w.duration || 0} min duration
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeletePastWorkout(w.id)}
                        className="p-1.5 text-[#555B63] hover:text-[#DC2626] rounded"
                        title="Delete workout"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {w.notes && (
                    <p className="text-xs text-[#555B63] italic">"{w.notes}"</p>
                  )}

                  {w.exercises && w.exercises.length > 0 && (
                    <div className="pt-2 border-t border-[#D9DDE2] text-xs text-[#555B63] space-y-1">
                      {w.exercises.map((ex, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="font-semibold text-[#15171A]">{ex.name}</span>
                          <span className="font-mono text-[11px]">
                            {ex.sets?.length || 0} sets ({ex.sets?.filter(s => s.completed).length || 0} completed)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rest Timer Modal */}
      <RestTimer isOpen={showRestTimer} onClose={() => setShowRestTimer(false)} />

      {/* Exercise Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-6 w-full max-w-lg bg-[#FFFFFF] space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
              <h4 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                Select Exercise
              </h4>
              <button onClick={() => setShowPicker(false)} className="text-xs font-bold text-[#555B63]">
                Cancel
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#555B63] absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                placeholder="Search exercise..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                className="input-field pl-9 text-xs"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#EAECEF] border border-[#D9DDE2] rounded-[8px]">
              {EXERCISES.filter(ex =>
                !pickerSearch.trim() ||
                ex.name.toLowerCase().includes(pickerSearch.toLowerCase().trim()) ||
                ex.primaryMuscle.toLowerCase().includes(pickerSearch.toLowerCase().trim())
              ).map(ex => (
                <div
                  key={ex.id}
                  onClick={() => handleAddExercise(ex.name)}
                  className="p-3 hover:bg-[#F6F6F7] cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-[#15171A]">{ex.name}</div>
                    <div className="text-[11px] text-[#555B63]">{ex.primaryMuscle} • {ex.equipment}</div>
                  </div>
                  <Plus className="w-4 h-4 text-[#FFAE00]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
