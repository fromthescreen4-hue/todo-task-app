import React, { useState, useEffect } from 'react';
import {
  getWorkouts,
  getWeightLog,
  getNutritionLog,
  getExerciseHistory
} from '../services/db';
import {
  TrendingUp,
  Award,
  Calendar,
  Dumbbell,
  Scale,
  Flame,
  CheckCircle2,
  BarChart2,
  AlertCircle
} from 'lucide-react';

export default function ProgressReports({ settings }) {
  const [workouts, setWorkouts] = useState([]);
  const [weights, setWeights] = useState([]);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [nutritionLogs, setNutritionLogs] = useState({});

  const unit = settings?.unit || 'kg';

  useEffect(() => {
    setWorkouts(getWorkouts());
    setWeights(getWeightLog());
    setExerciseHistory(getExerciseHistory());
    setNutritionLogs(getNutritionLog());
  }, []);

  // Compute Volume Over Time
  const volumeByWorkout = workouts.map(w => ({
    name: w.name,
    date: w.date,
    volume: w.volume || 0
  })).reverse();

  // Compute Real Personal Records (PRs) from saved workouts
  const exercisePRs = {};
  workouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        if (set.completed && set.weight > 0) {
          const currentPR = exercisePRs[ex.name] || 0;
          if (set.weight > currentPR) {
            exercisePRs[ex.name] = set.weight;
          }
        }
      });
    });
  });

  const prList = Object.entries(exercisePRs).map(([name, maxWeight]) => ({
    name,
    weight: maxWeight
  }));

  // Adherence: days logged in nutrition
  const loggedDaysCount = Object.keys(nutritionLogs).length;
  const workoutsCount = workouts.length;
  const weightsCount = weights.length;

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Editorial Header */}
      <div className="border-b border-[#D9DDE2] pb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
          Insights & Performance History
        </span>
        <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">
          Progress & Performance Reports
        </h1>
        <p className="text-xs text-[#555B63] mt-0.5">
          Track your workout volume, weigh-in trends, and long-term fitness consistency.
        </p>
      </div>

      {/* Aggregate Audit KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ui-card p-5">
          <span className="text-[10px] uppercase font-bold text-[#555B63] block">Total Sessions Completed</span>
          <div className="text-2xl font-black text-[#15171A] font-mono mt-1">
            {workoutsCount}
          </div>
          <div className="text-[11px] text-[#555B63] mt-0.5">Verified workout history</div>
        </div>

        <div className="ui-card p-5">
          <span className="text-[10px] uppercase font-bold text-[#555B63] block">Weigh-Ins Recorded</span>
          <div className="text-2xl font-black text-[#15171A] font-mono mt-1">
            {weightsCount}
          </div>
          <div className="text-[11px] text-[#555B63] mt-0.5">Body weight data points</div>
        </div>

        <div className="ui-card p-5">
          <span className="text-[10px] uppercase font-bold text-[#555B63] block">Nutrition Days Logged</span>
          <div className="text-2xl font-black text-[#15171A] font-mono mt-1">
            {loggedDaysCount}
          </div>
          <div className="text-[11px] text-[#555B63] mt-0.5">Daily food journal entries</div>
        </div>
      </div>

      {/* Training Volume Progression */}
      <div className="ui-card p-5">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
              Workout Volume Progression
            </h3>
            <span className="text-[11px] text-[#555B63]">
              Cumulative load (Weight × Reps) per completed workout
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#FFAE00]">{unit.toUpperCase()} Volume</span>
        </div>

        {volumeByWorkout.length < 2 ? (
          <div className="p-8 text-center bg-[#F6F6F7] rounded-[8px] border border-dashed border-[#D9DDE2]">
            <BarChart2 className="w-8 h-8 text-[#8B939E] mx-auto mb-2" />
            <div className="text-xs font-bold text-[#15171A]">Insufficient Volume History</div>
            <p className="text-[11px] text-[#555B63] mt-1">
              Complete at least two active workouts with checked sets to view volume overload progression.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {volumeByWorkout.map((w, idx) => {
              const maxVol = Math.max(...volumeByWorkout.map(v => v.volume)) || 1;
              const pct = Math.round((w.volume / maxVol) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#15171A]">{w.name} <span className="text-[#555B63] font-mono text-[10px]">({w.date})</span></span>
                    <span className="font-mono text-[#FFAE00]">{w.volume.toLocaleString()} {unit}</span>
                  </div>
                  <div className="w-full bg-[#EAECEF] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#FFAE00] h-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Personal Records Table */}
      <div className="ui-card p-5">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3 mb-4">
          <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide flex items-center gap-2">
            <Award className="w-4 h-4 text-[#FFAE00]" />
            <span>Verified Personal Records (PRs)</span>
          </h3>
          <span className="text-xs text-[#555B63]">Highest load lifted with completed sets</span>
        </div>

        {prList.length === 0 ? (
          <div className="text-xs text-[#555B63] text-center py-6">
            No personal records found. Complete sets in the Active Workout Logger to establish benchmark PRs.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {prList.map((pr, idx) => (
              <div key={idx} className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#15171A]">{pr.name}</div>
                  <div className="text-[10px] text-[#555B63] uppercase">Top Set Weight</div>
                </div>
                <div className="text-base font-black font-mono text-[#15171A]">
                  {pr.weight} <span className="text-xs font-bold text-[#FFAE00]">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
