import React, { useState } from 'react';
import { EXERCISES, EXERCISE_CATEGORIES } from '../data/exercisesData';
import ExerciseSvgAnimation from './ExerciseSvgAnimation';
import {
  BookOpen,
  Search,
  Dumbbell,
  AlertTriangle,
  Wind,
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus
} from 'lucide-react';

export default function ExerciseLibrary({ onStartWithExercise }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [activeExerciseModal, setActiveExerciseModal] = useState(null);

  const equipmentList = ['All', 'Barbell', 'Dumbbells', 'Cable', 'Machine', 'Bodyweight'];

  const filteredExercises = EXERCISES.filter(ex => {
    // Category filter
    if (selectedCategory !== 'All' && !ex.categories.includes(selectedCategory)) {
      return false;
    }
    // Equipment filter
    if (selectedEquipment !== 'All' && ex.equipment !== selectedEquipment) {
      return false;
    }
    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = ex.name.toLowerCase().includes(q);
    const muscleMatch = ex.primaryMuscle.toLowerCase().includes(q);
    return nameMatch || muscleMatch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Editorial Header */}
      <div className="border-b border-[#D9DDE2] pb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
          Exercise Form Guides & Demonstrations
        </span>
        <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">
          Workout Library & Exercise Guide
        </h1>
        <p className="text-xs text-[#555B63] mt-0.5">
          Step-by-step form cues, breathing tips, and execution guidance across all muscle groups.
        </p>
      </div>

      {/* Search & Category Filter Ribbon */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#555B63] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search exercises by name or anatomical muscle (e.g. Bench, Squat, Deltoids, Lats)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-xs"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {EXERCISE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] border whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#15171A] text-white border-[#15171A]'
                  : 'bg-[#FFFFFF] text-[#555B63] border-[#D9DDE2] hover:bg-[#F6F6F7]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Equipment Sub-Filter */}
        <div className="flex items-center gap-2 pt-1 text-xs text-[#555B63]">
          <span className="font-bold uppercase text-[10px] text-[#8B939E]">Equipment:</span>
          <div className="flex gap-1 flex-wrap">
            {equipmentList.map(eq => (
              <button
                key={eq}
                onClick={() => setSelectedEquipment(eq)}
                className={`px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${
                  selectedEquipment === eq
                    ? 'bg-[#EAECEF] text-[#15171A] border-[#BCC3CC]'
                    : 'bg-transparent text-[#555B63] border-transparent hover:bg-[#F6F6F7]'
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(ex => (
          <div
            key={ex.id}
            onClick={() => setActiveExerciseModal(ex)}
            className="ui-card p-5 cursor-pointer hover:border-[#15171A] transition-all flex flex-col justify-between space-y-4 group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-[#15171A] group-hover:text-[#FFAE00] transition-colors">
                  {ex.name}
                </span>
                <span className="badge-tag flex-shrink-0">{ex.equipment}</span>
              </div>
              <div className="text-[11px] text-[#555B63] mt-2">
                <span className="font-semibold text-[#15171A]">Primary Target: </span>
                {ex.primaryMuscle}
              </div>
            </div>

            <div className="border-t border-[#D9DDE2] pt-3 flex items-center justify-between text-xs text-[#555B63]">
              <span className="text-[10px] font-mono uppercase bg-[#F6F6F7] px-2 py-0.5 rounded border border-[#D9DDE2]">
                {ex.level}
              </span>
              <span className="text-xs font-bold text-[#FFAE00] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>View Form Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Comprehensive Biomechanical Detail Modal */}
      {activeExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-6 w-full max-w-2xl bg-[#FFFFFF] max-h-[90vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#D9DDE2] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[#15171A]">{activeExerciseModal.name}</h3>
                  <span className="badge-tag-red">{activeExerciseModal.equipment}</span>
                </div>
                <div className="text-xs text-[#555B63] mt-1">
                  Primary: <span className="font-bold text-[#15171A]">{activeExerciseModal.primaryMuscle}</span>
                  {activeExerciseModal.secondaryMuscles && (
                    <span> • Secondary: {activeExerciseModal.secondaryMuscles.join(', ')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActiveExerciseModal(null)}
                className="text-xs font-bold text-[#555B63] hover:text-[#15171A]"
              >
                Close
              </button>
            </div>

            {/* Animated SVG Biomechanical Visualization */}
            <div>
              <span className="input-label mb-2">Biomechanical Vector & Bar Path</span>
              <ExerciseSvgAnimation type={activeExerciseModal.svgType} />
            </div>

            {/* Step-by-Step Technical Execution Cues */}
            <div className="space-y-3">
              <span className="input-label">Technical Form Cues</span>

              <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-1">
                <span className="text-xs font-bold text-[#15171A] block">1. Stance & Kinetic Setup</span>
                <p className="text-xs text-[#555B63] leading-relaxed">{activeExerciseModal.cues.stance}</p>
              </div>

              <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-1">
                <span className="text-xs font-bold text-[#15171A] block">2. Grip & Scapular Depression</span>
                <p className="text-xs text-[#555B63] leading-relaxed">{activeExerciseModal.cues.grip}</p>
              </div>

              <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-1">
                <span className="text-xs font-bold text-[#15171A] block flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>3. Intra-Abdominal Breathing (Valsalva)</span>
                </span>
                <p className="text-xs text-[#555B63] leading-relaxed">{activeExerciseModal.cues.breathing}</p>
              </div>
            </div>

            {/* Critical Mistakes to Avoid */}
            <div className="space-y-2">
              <span className="input-label text-[#DC2626] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Common Biomechanical Faults to Avoid</span>
              </span>
              <ul className="space-y-1.5 text-xs text-[#555B63]">
                {activeExerciseModal.cues.mistakes.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#DC2626] font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-[#D9DDE2] flex gap-2">
              {onStartWithExercise && (
                <button
                  onClick={() => {
                    onStartWithExercise(activeExerciseModal);
                    setActiveExerciseModal(null);
                  }}
                  className="btn btn-primary flex-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Exercise to Active Workout</span>
                </button>
              )}
              <button
                onClick={() => setActiveExerciseModal(null)}
                className="btn btn-secondary px-6 text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
