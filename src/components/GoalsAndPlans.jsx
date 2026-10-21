import React, { useState } from 'react';
import { saveSettings } from '../services/db';
import {
  Target,
  Dumbbell,
  Check,
  Flame,
  Droplets,
  Footprints,
  Calendar,
  Sparkles,
  Edit2
} from 'lucide-react';

export default function GoalsAndPlans({ settings, onUpdateSettings }) {
  const [editing, setEditing] = useState(false);
  const [goalType, setGoalType] = useState(settings?.goalType || 'improve_fitness');
  const [calorieGoal, setCalorieGoal] = useState(settings?.calorieGoal || 2200);
  const [proteinGoal, setProteinGoal] = useState(settings?.proteinGoal || 140);
  const [carbsGoal, setCarbsGoal] = useState(settings?.carbsGoal || 230);
  const [fatGoal, setFatGoal] = useState(settings?.fatGoal || 65);
  const [stepGoal, setStepGoal] = useState(settings?.stepGoal || 10000);
  const [waterGoal, setWaterGoal] = useState(settings?.waterGoal || 3000);
  const [workoutDaysGoal, setWorkoutDaysGoal] = useState(settings?.workoutDaysGoal || 4);
  const [goalWeight, setGoalWeight] = useState(settings?.goalWeight || 70);

  function handleSave() {
    const updated = {
      ...settings,
      goalType,
      calorieGoal: parseInt(calorieGoal, 10),
      proteinGoal: parseInt(proteinGoal, 10),
      carbsGoal: parseInt(carbsGoal, 10),
      fatGoal: parseInt(fatGoal, 10),
      stepGoal: parseInt(stepGoal, 10),
      waterGoal: parseInt(waterGoal, 10),
      workoutDaysGoal: parseInt(workoutDaysGoal, 10),
      goalWeight: parseFloat(goalWeight)
    };
    saveSettings(updated);
    if (onUpdateSettings) onUpdateSettings(updated);
    setEditing(false);
  }

  const goalTitles = {
    lose_weight: 'Lose Weight & Body Fat',
    build_muscle: 'Hypertrophy & Muscle Growth',
    improve_fitness: 'Athletic Conditioning & Endurance',
    maintain_health: 'General Health & Vitality',
    increase_activity: 'Increase Daily Physical Activity'
  };

  // Transparent starter workout split based on user preferences
  const routineSplits = {
    build_muscle: [
      { day: 'Day 1', name: 'Upper Body (Push Focus)', exercises: 'Bench Press, Incline DB Press, Overhead Press, Cable Lateral Raises' },
      { day: 'Day 2', name: 'Lower Body (Quad & Glute Focus)', exercises: 'Barbell Squats, Romanian Deadlifts, Calf Raises, Core Rollouts' },
      { day: 'Day 3', name: 'Active Recovery / Mobility', exercises: 'Zone 2 Walking, Hip & Thoracic Mobility Rotations' },
      { day: 'Day 4', name: 'Upper Body (Pull Focus)', exercises: 'Lat Pulldowns, Barbell Rows, Bicep Curls, Face Pulls' },
      { day: 'Day 5', name: 'Lower Body & Hamstring Focus', exercises: 'Deadlifts, Walking Lunges, Leg Curls, Hanging Leg Raises' },
      { day: 'Weekend', name: 'Rest & Nutrient Recovery', exercises: 'Hydration, 8h Sleep, Meal Prep' }
    ],
    lose_weight: [
      { day: 'Day 1', name: 'Full Body Metabolic Strength', exercises: 'Barbell Squats, Pushups, Dumbbell Rows, Plank' },
      { day: 'Day 2', name: 'Zone 2 Cadence & Cardio', exercises: '45 min Incline Treadmill Walk or Outdoor Brisk Walk' },
      { day: 'Day 3', name: 'Full Body Hypertrophy', exercises: 'Romanian Deadlifts, Dumbbell Press, Lat Pulldowns' },
      { day: 'Day 4', name: 'Active Recovery', exercises: 'Mobility, 10,000 Steps' },
      { day: 'Day 5', name: 'Cardio Intervals & Core', exercises: 'HIIT Sprints, Hanging Leg Raises, Russian Twists' },
      { day: 'Weekend', name: 'Rest', exercises: 'Sleep restoration and hydration' }
    ],
    default: [
      { day: 'Monday', name: 'Upper Body Compound Strength', exercises: 'Bench Press, Rows, Overhead Press, Arms' },
      { day: 'Tuesday', name: 'Lower Body & Posterior Chain', exercises: 'Squats, Romanian Deadlifts, Calves' },
      { day: 'Thursday', name: 'Conditioning & Core', exercises: 'Zone 2 Walking, Hanging Knee Raises, Planks' },
      { day: 'Friday', name: 'Full Body Functional Strength', exercises: 'Deadlifts, Incline Press, Lat Pulldowns' }
    ]
  };

  const activeSplit = routineSplits[goalType] || routineSplits.default;

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
            Custom Target Architecture
          </span>
          <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">Goals & Personalized Plan</h1>
          <p className="text-xs text-[#555B63] mt-0.5">
            Transparent deterministic programming based on your biometric profile and training schedule.
          </p>
        </div>

        <button
          onClick={() => setEditing(!editing)}
          className="btn btn-secondary text-xs"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#555B63]" />
          <span>{editing ? 'Cancel Editing' : 'Edit Targets'}</span>
        </button>
      </div>

      {/* Primary Goal Banner */}
      <div className="ui-card p-6 bg-[#FFFFFF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[10px] bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#FFAE00] flex-shrink-0">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#555B63] tracking-wider">Primary Objective</span>
              <h2 className="text-xl font-black text-[#15171A]">
                {goalTitles[goalType] || 'Improve Fitness'}
              </h2>
              <div className="text-xs text-[#555B63] mt-0.5">
                Target Weight: <span className="font-bold text-[#15171A] font-mono">{goalWeight} {settings?.unit || 'kg'}</span>
                {' • '}Training: <span className="font-bold text-[#15171A]">{workoutDaysGoal} days / week</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="badge-tag">Rule Engine: Biomechanical Progression</span>
            <div className="text-[11px] text-[#555B63] mt-1">Zero simulated black-box AI</div>
          </div>
        </div>

        {/* Edit Form Drawer */}
        {editing && (
          <div className="mt-6 pt-5 border-t border-[#D9DDE2] space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="input-label">Primary Goal</label>
                <select
                  value={goalType}
                  onChange={e => setGoalType(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="lose_weight">Lose weight</option>
                  <option value="build_muscle">Build muscle</option>
                  <option value="improve_fitness">Improve fitness</option>
                  <option value="maintain_health">Maintain health</option>
                  <option value="increase_activity">Increase daily activity</option>
                </select>
              </div>

              <div>
                <label className="input-label">Target Weight ({settings?.unit || 'kg'})</label>
                <input
                  type="number"
                  step="0.5"
                  value={goalWeight}
                  onChange={e => setGoalWeight(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="input-label">Workout Frequency (Days/wk)</label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={workoutDaysGoal}
                  onChange={e => setWorkoutDaysGoal(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="input-label">Calorie Goal (kcal)</label>
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={e => setCalorieGoal(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label className="input-label">Protein (g)</label>
                <input
                  type="number"
                  value={proteinGoal}
                  onChange={e => setProteinGoal(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label className="input-label">Daily Steps</label>
                <input
                  type="number"
                  step="500"
                  value={stepGoal}
                  onChange={e => setStepGoal(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label className="input-label">Hydration (ml)</label>
                <input
                  type="number"
                  step="250"
                  value={waterGoal}
                  onChange={e => setWaterGoal(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(false)} className="btn btn-secondary text-xs">
                Cancel
              </button>
              <button onClick={handleSave} className="btn btn-primary text-xs">
                <Check className="w-3.5 h-3.5" />
                <span>Save Configured Goals</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Routine Split Breakdown */}
      <div className="ui-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
              Weekly Routine Cadence
            </h3>
            <span className="text-[11px] text-[#555B63]">
              Recommended schedule customized for {goalTitles[goalType]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeSplit.map((item, idx) => (
            <div key={idx} className="p-4 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-[#FFAE00]">{item.day}</span>
                <span className="badge-tag">Prescribed</span>
              </div>
              <h4 className="text-xs font-bold text-[#15171A]">{item.name}</h4>
              <p className="text-[11px] text-[#555B63]">{item.exercises}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
