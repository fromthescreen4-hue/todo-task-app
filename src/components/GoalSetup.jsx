import React, { useState } from 'react';
import { saveSettings, DEFAULT_SETTINGS, todayStr } from '../services/db';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Target,
  User,
  Dumbbell,
  Utensils,
  Bell,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function GoalSetup({ onComplete }) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Step 2: Goal
  const [goalType, setGoalType] = useState('improve_fitness');

  // Step 3: Personal Info & Units
  const [unit, setUnit] = useState('kg');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [height, setHeight] = useState('175');
  const [currentWeight, setCurrentWeight] = useState('75');
  const [targetWeight, setTargetWeight] = useState('70');
  const [age, setAge] = useState('26');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderately_active');

  // Step 4: Training Preferences
  const [experience, setExperience] = useState('intermediate');
  const [trainingLocation, setTrainingLocation] = useState('gym');
  const [selectedEquipment, setSelectedEquipment] = useState(['Barbell', 'Dumbbells', 'Cables']);
  const [workoutDays, setWorkoutDays] = useState(4);
  const [sessionTime, setSessionTime] = useState(60);
  const [limitations, setLimitations] = useState('');

  // Step 5: Nutrition Preferences
  const [cuisines, setCuisines] = useState(['South Indian', 'Other Indian']);
  const [dietaryPreference, setDietaryPreference] = useState('non_veg');

  // Step 6: Targets & Reminders
  const [stepGoal, setStepGoal] = useState(10000);
  const [waterGoal, setWaterGoal] = useState(3000);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Error validation
  const [validationError, setValidationError] = useState('');

  // Equipment toggle helper
  function toggleEquipment(eq) {
    if (selectedEquipment.includes(eq)) {
      setSelectedEquipment(selectedEquipment.filter(item => item !== eq));
    } else {
      setSelectedEquipment([...selectedEquipment, eq]);
    }
  }

  // Cuisine toggle helper
  function toggleCuisine(c) {
    if (cuisines.includes(c)) {
      setCuisines(cuisines.filter(item => item !== c));
    } else {
      setCuisines([...cuisines, c]);
    }
  }

  // Transparent calculation: Harris-Benedict BMR & TDEE
  function calculateTransparentTargets() {
    const w = parseFloat(currentWeight) || 75;
    const h = parseFloat(height) || 175;
    const a = parseInt(age, 10) || 26;

    // Weight in kg
    const wKg = unit === 'lbs' ? w / 2.20462 : w;
    const hCm = heightUnit === 'inches' ? h * 2.54 : h;

    let bmr = 10 * wKg + 6.25 * hCm - 5 * a + (gender === 'female' ? -161 : 5);
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725
    };
    let tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.4));

    // Goal adjustment
    let targetCals = tdee;
    if (goalType === 'lose_weight') targetCals = Math.round(tdee - 450);
    else if (goalType === 'build_muscle') targetCals = Math.round(tdee + 250);

    // Macros: Protein 1.8-2.0g per kg bodyweight
    const targetProtein = Math.round(wKg * 1.8);
    const targetFat = Math.round((targetCals * 0.25) / 9);
    const remainingCals = targetCals - (targetProtein * 4 + targetFat * 9);
    const targetCarbs = Math.max(50, Math.round(remainingCals / 4));

    return {
      calorieGoal: targetCals,
      proteinGoal: targetProtein,
      carbsGoal: targetCarbs,
      fatGoal: targetFat
    };
  }

  function handleNextStep() {
    setValidationError('');

    // Step 3 validation
    if (step === 3) {
      if (!currentWeight || isNaN(currentWeight) || parseFloat(currentWeight) <= 20) {
        setValidationError('Please provide a realistic current weight measurement.');
        return;
      }
      if (!height || isNaN(height) || parseFloat(height) <= 50) {
        setValidationError('Please enter a valid height measurement.');
        return;
      }
      if (!age || isNaN(age) || parseInt(age, 10) < 14) {
        setValidationError('Must be at least 14 years of age for training eligibility.');
        return;
      }
    }

    setStep(prev => Math.min(totalSteps, prev + 1));
  }

  function handleSaveFinal() {
    const transparent = calculateTransparentTargets();
    const finalSettings = {
      ...DEFAULT_SETTINGS,
      unit,
      heightUnit,
      height: parseFloat(height) || 175,
      startWeight: parseFloat(currentWeight) || 75,
      goalWeight: targetWeight ? parseFloat(targetWeight) : parseFloat(currentWeight) || 75,
      goalType,
      activityLevel,
      age: parseInt(age, 10) || 26,
      gender,
      startDate: todayStr(),
      stepGoal: parseInt(stepGoal, 10) || 10000,
      waterGoal: parseInt(waterGoal, 10) || 3000,
      workoutDaysGoal: parseInt(workoutDays, 10) || 4,
      experience,
      trainingLocation,
      equipment: selectedEquipment,
      availableTime: parseInt(sessionTime, 10) || 60,
      limitations: limitations.trim(),
      cuisinePreferences: cuisines,
      dietaryPreference,
      onboardingComplete: true,
      remindersEnabled,
      calorieGoal: transparent.calorieGoal,
      proteinGoal: transparent.proteinGoal,
      carbsGoal: transparent.carbsGoal,
      fatGoal: transparent.fatGoal
    };

    saveSettings(finalSettings);
    onComplete(finalSettings);
  }

  const generatedTargets = calculateTransparentTargets();

  return (
    <div className="min-h-screen bg-[#F6F6F7] flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Top Progress Ribbon */}
        {step > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#555B63]">
              <span className="uppercase tracking-wider">Step {step} of {totalSteps}</span>
              <span className="font-mono">{Math.round((step / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-[#D9DDE2] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#FFAE00] h-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Wizard Card */}
        <div className="ui-card p-6 sm:p-8 bg-[#FFFFFF] shadow-sm space-y-6">
          {validationError && (
            <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] text-xs font-semibold text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div className="text-center space-y-6 py-4">
              <img
                src="/core-fit-logo.png"
                alt="CORE FIT"
                className="w-28 h-28 object-contain mx-auto"
              />
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#15171A] uppercase tracking-tight">
                  CORE <span className="text-[#FFAE00]">FIT</span>
                </h1>
                <p className="text-sm font-extrabold uppercase tracking-widest text-[#FFAE00] mt-1">
                  Build Strength From Within
                </p>
                <p className="text-xs text-[#555B63] max-w-md mx-auto mt-3 leading-relaxed">
                  A high-performance fitness web application featuring verified South Indian and regional nutrition tracking, exercise form guides, and structured workout progression.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="btn btn-primary w-full py-3.5 text-xs font-bold shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT A GOAL */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FFAE00] tracking-wider block">Objective</span>
                <h2 className="text-xl font-extrabold text-[#15171A]">Select Your Primary Goal</h2>
                <p className="text-xs text-[#555B63] mt-0.5">
                  This calibrates your baseline training split and daily caloric expenditure. You can modify this anytime in settings.
                </p>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'lose_weight', title: 'Lose Weight & Body Fat', desc: 'Caloric deficit, metabolic density, and sustained cardiovascular health.' },
                  { id: 'build_muscle', title: 'Build Muscle (Hypertrophy)', desc: 'Mechanical tension, progressive overload, and muscle protein synthesis.' },
                  { id: 'improve_fitness', title: 'Improve Fitness & Conditioning', desc: 'Aerobic base, muscular endurance, and athletic work capacity.' },
                  { id: 'maintain_health', title: 'Maintain Health & Vitality', desc: 'Energy balance, joint mobility, and restorative daily habits.' },
                  { id: 'increase_activity', title: 'Increase Daily Activity', desc: 'Elevate non-exercise physical activity and daily step counts.' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGoalType(item.id)}
                    className={`w-full p-4 rounded-[8px] border text-left transition-colors flex items-center justify-between ${
                      goalType === item.id
                        ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#15171A]'
                        : 'bg-[#FFFFFF] border-[#D9DDE2] text-[#15171A] hover:bg-[#F6F6F7]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{item.title}</div>
                      <div className="text-[11px] text-[#555B63] mt-0.5">{item.desc}</div>
                    </div>
                    {goalType === item.id && (
                      <Check className="w-4 h-4 text-[#FFAE00] flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: PERSONAL INFORMATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FFAE00] tracking-wider block">Biometrics</span>
                <h2 className="text-xl font-extrabold text-[#15171A]">Personal Information</h2>
                <p className="text-xs text-[#555B63] mt-0.5">
                  Used solely to calculate basal metabolic rate (BMR) and recommended protein targets.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Preferred Weight Unit</label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="input-field text-xs font-bold"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Preferred Height Unit</label>
                  <select
                    value={heightUnit}
                    onChange={e => setHeightUnit(e.target.value)}
                    className="input-field text-xs font-bold"
                  >
                    <option value="cm">Centimeters (cm)</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Current Weight ({unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={currentWeight}
                    onChange={e => setCurrentWeight(e.target.value)}
                    className="input-field font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="input-label">Optional Target Weight ({unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 70"
                    value={targetWeight}
                    onChange={e => setTargetWeight(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div>
                  <label className="input-label">Height ({heightUnit})</label>
                  <input
                    type="number"
                    required
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="input-label">Age</label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    required
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
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={e => setActivityLevel(e.target.value)}
                  className="input-field text-xs"
                >
                  <option value="sedentary">Sedentary (desk work, minimal movement)</option>
                  <option value="lightly_active">Lightly Active (1-2 days active movement)</option>
                  <option value="moderately_active">Moderately Active (3-5 days workout session)</option>
                  <option value="very_active">Very Active (6-7 days heavy training)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 4: TRAINING PREFERENCES */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FFAE00] tracking-wider block">Training</span>
                <h2 className="text-xl font-extrabold text-[#15171A]">Training Preferences</h2>
                <p className="text-xs text-[#555B63] mt-0.5">
                  Configure your equipment availability and scheduling parameters.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Experience Level</label>
                  <select
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    className="input-field text-xs font-bold"
                  >
                    <option value="beginner">Beginner (under 1 year)</option>
                    <option value="intermediate">Intermediate (1-3 years)</option>
                    <option value="advanced">Advanced (3+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Environment</label>
                  <select
                    value={trainingLocation}
                    onChange={e => setTrainingLocation(e.target.value)}
                    className="input-field text-xs font-bold"
                  >
                    <option value="gym">Commercial / Dedicated Gym</option>
                    <option value="home">Home Gym / Bodyweight</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Available Equipment</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['Barbell', 'Dumbbells', 'Cables', 'Machines', 'Resistance Bands', 'Bodyweight Only'].map(eq => {
                    const isSelected = selectedEquipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`p-2.5 rounded-[6px] text-xs font-semibold border transition-colors ${
                          isSelected
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#FFAE00]'
                            : 'bg-[#FFFFFF] border-[#D9DDE2] text-[#555B63] hover:bg-[#F6F6F7]'
                        }`}
                      >
                        {eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Preferred Days / Week</label>
                  <select
                    value={workoutDays}
                    onChange={e => setWorkoutDays(parseInt(e.target.value, 10))}
                    className="input-field text-xs font-mono font-bold"
                  >
                    <option value={2}>2 Days / week</option>
                    <option value={3}>3 Days / week (Full Body)</option>
                    <option value={4}>4 Days / week (Upper/Lower)</option>
                    <option value={5}>5 Days / week (PPL Split)</option>
                    <option value={6}>6 Days / week (High Frequency)</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Session Duration (min)</label>
                  <select
                    value={sessionTime}
                    onChange={e => setSessionTime(parseInt(e.target.value, 10))}
                    className="input-field text-xs font-mono font-bold"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">Physical / Joint Limitations (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Mild lower back sensitivity, avoid behind-the-neck presses"
                  value={limitations}
                  onChange={e => setLimitations(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 5: NUTRITION PREFERENCES */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FFAE00] tracking-wider block">Nutrition</span>
                <h2 className="text-xl font-extrabold text-[#15171A]">Nutrition Preferences</h2>
                <p className="text-xs text-[#555B63] mt-0.5">
                  Select your dietary background to prioritize verified regional food catalogs.
                </p>
              </div>

              <div>
                <label className="input-label">Regional Cuisines Consumed Regularly</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'South Indian', desc: 'Idli, dosa, puttu, sambar, avial, fish curry, matta rice' },
                    { id: 'Other Indian', desc: 'Roti, dal tadka, paneer, rajma, chole, khichdi' },
                    { id: 'Wider Asian', desc: 'Teriyaki, tofu stir-fries, edamame, miso, noodles' },
                    { id: 'Continental / Fitness', desc: 'Oats, grilled chicken, eggs, whey protein, yogurt' }
                  ].map(c => {
                    const isSelected = cuisines.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCuisine(c.id)}
                        className={`p-3 rounded-[8px] text-left border transition-colors ${
                          isSelected
                            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#15171A]'
                            : 'bg-[#FFFFFF] border-[#D9DDE2] text-[#555B63] hover:bg-[#F6F6F7]'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#15171A] flex items-center justify-between">
                          <span>{c.id}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FFAE00]" />}
                        </div>
                        <div className="text-[11px] text-[#555B63] mt-0.5">{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="input-label">Dietary Framework</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'non_veg', label: 'Non-Vegetarian' },
                    { id: 'veg', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDietaryPreference(d.id)}
                      className={`py-2 text-xs font-bold rounded-[6px] border ${
                        dietaryPreference === d.id
                          ? 'bg-[#15171A] text-white border-[#15171A]'
                          : 'bg-[#FFFFFF] text-[#555B63] border-[#D9DDE2] hover:bg-[#F6F6F7]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: TARGETS AND REMINDERS */}
          {step === 6 && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#FFAE00] tracking-wider block">Habits</span>
                <h2 className="text-xl font-extrabold text-[#15171A]">Targets & Reminders</h2>
                <p className="text-xs text-[#555B63] mt-0.5">
                  Set daily physical targets. We never force unrealistic calorie restrictions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Daily Step Goal</label>
                  <input
                    type="number"
                    step="500"
                    value={stepGoal}
                    onChange={e => setStepGoal(e.target.value)}
                    className="input-field font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-[#555B63] mt-1 block">Default: 10,000 steps</span>
                </div>

                <div>
                  <label className="input-label">Hydration Target (ml)</label>
                  <input
                    type="number"
                    step="250"
                    value={waterGoal}
                    onChange={e => setWaterGoal(e.target.value)}
                    className="input-field font-mono text-xs font-bold"
                  />
                  <span className="text-[10px] text-[#555B63] mt-1 block">Default: 3,000 ml</span>
                </div>
              </div>

              <div className="p-4 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#15171A] block">Enable Routine Reminders</span>
                  <span className="text-[11px] text-[#555B63]">Pings for water replenishment and training session time</span>
                </div>
                <input
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={e => setRemindersEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#FFAE00] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* STEP 7: PERSONALIZED PLAN */}
          {step === 7 && (
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#16A34A] tracking-wider block">Generated Architecture</span>
                <h2 className="text-xl font-extrabold text-[#15171A]">Your Deterministic Starter Plan</h2>
                <p className="text-xs text-[#555B63] mt-0.5">
                  Computed via validated Harris-Benedict formulas and your exact training schedule. Zero fabricated black-box AI.
                </p>
              </div>

              <div className="p-4 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15171A]">Calculated Caloric Expenditure</span>
                  <span className="text-base font-black font-mono text-[#FFAE00]">{generatedTargets.calorieGoal} kcal</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[#D9DDE2]">
                  <div className="p-2 bg-[#FFFFFF] rounded border">
                    <span className="text-[10px] uppercase font-bold text-[#555B63]">Protein</span>
                    <div className="text-sm font-bold font-mono text-[#15171A] mt-0.5">{generatedTargets.proteinGoal}g</div>
                  </div>
                  <div className="p-2 bg-[#FFFFFF] rounded border">
                    <span className="text-[10px] uppercase font-bold text-[#555B63]">Carbs</span>
                    <div className="text-sm font-bold font-mono text-[#15171A] mt-0.5">{generatedTargets.carbsGoal}g</div>
                  </div>
                  <div className="p-2 bg-[#FFFFFF] rounded border">
                    <span className="text-[10px] uppercase font-bold text-[#555B63]">Fat</span>
                    <div className="text-sm font-bold font-mono text-[#15171A] mt-0.5">{generatedTargets.fatGoal}g</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#FFFFFF] rounded-[8px] border border-[#D9DDE2] space-y-2">
                <span className="text-xs font-bold text-[#15171A] block uppercase">Training Prescription</span>
                <div className="text-xs text-[#555B63] leading-relaxed">
                  {workoutDays} days / week • {sessionTime} min sessions • {trainingLocation === 'gym' ? 'Gym Equipment' : 'Home Setup'}
                </div>
                <div className="text-[11px] text-[#555B63]">
                  Catalog prioritized for: {cuisines.join(', ')} ({dietaryPreference})
                </div>
              </div>
            </div>
          )}

          {/* Nav Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-[#D9DDE2]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(prev => Math.max(1, prev - 1))}
                className="btn btn-secondary text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < totalSteps ? (
              step !== 1 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary text-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleSaveFinal}
                className="btn btn-primary text-xs shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile & Open Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
