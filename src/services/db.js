/**
 * db.js — CORE FIT Production Database Service
 * Robust, local-first storage architecture using localStorage + IndexedDB
 * Seamlessly paired with Firebase Cloud Firestore for real-time cloud backup.
 */

import { saveUserToCloud, fetchUserFromCloud } from './firebase';

const KEYS = {
  SETTINGS: 'corefit_settings',
  AUTH_USER: 'corefit_auth_user',
  WEIGHT_LOG: 'corefit_weight_log',
  WORKOUTS: 'corefit_workouts',
  ACTIVE_WORKOUT: 'corefit_active_workout',
  EXERCISE_HISTORY: 'corefit_exercise_history',
  CUSTOM_EXERCISES: 'corefit_custom_exercises',
  NUTRITION_LOG: 'corefit_nutrition_log',
  CUSTOM_FOODS: 'corefit_custom_foods',
  WATER_LOG: 'corefit_water_log',
  MOVEMENT_LOG: 'corefit_movement_log',
  HABITS_LOG: 'corefit_habits_log',
  SYSTEM_LOGS: 'corefit_system_logs'
};

const IDB_NAME = 'core_fit_db';
const IDB_STORE = 'progress_photos';

// Helper: safe load
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error(`[db] load error for ${key}:`, err);
    return fallback;
  }
}

// Helper: safe save with system logging and background cloud sync
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (key !== KEYS.SYSTEM_LOGS) {
      triggerAutoCloudSync();
    }
  } catch (e) {
    console.error(`[db] localStorage write failed for ${key}:`, e);
    addSystemLog('STORAGE_ERROR', `Failed to write key ${key}: ${e.message}`);
  }
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Cloud Synchronization Engine ──────────────────────────────────────────

let syncDebounceTimer = null;
export function triggerAutoCloudSync() {
  const user = getAuthUser();
  if (!user || (!user.uid && !user.id)) return;
  const userUid = user.uid || user.id;

  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(async () => {
    try {
      const dump = {
        settings: getSettings(),
        weightLog: getWeightLog(),
        workouts: getWorkouts(),
        nutritionLog: getNutritionLog(),
        waterLog: getWaterLog(),
        movementLog: getMovementLog(),
        habitsLog: getHabitsLog(),
        customFoods: getCustomFoods(),
        customExercises: getCustomExercises(),
        exerciseHistory: getExerciseHistory(),
        syncedAt: new Date().toISOString()
      };
      await saveUserToCloud(userUid, dump);
      addSystemLog('CLOUD_SYNC', 'Data auto-synchronized to Firebase Cloud');
    } catch (err) {
      // Graceful offline warning
      addSystemLog('CLOUD_SYNC_NOTICE', 'Cloud auto-sync pending or local mode: ' + (err.message || ''));
    }
  }, 1500);
}

export async function syncToCloudNow() {
  const user = getAuthUser();
  if (!user || (!user.uid && !user.id)) throw new Error('Please sign in with Email or Google to sync to cloud.');
  const userUid = user.uid || user.id;
  const dump = {
    settings: getSettings(),
    weightLog: getWeightLog(),
    workouts: getWorkouts(),
    nutritionLog: getNutritionLog(),
    waterLog: getWaterLog(),
    movementLog: getMovementLog(),
    habitsLog: getHabitsLog(),
    customFoods: getCustomFoods(),
    customExercises: getCustomExercises(),
    exerciseHistory: getExerciseHistory(),
    syncedAt: new Date().toISOString()
  };
  await saveUserToCloud(userUid, dump);
  addSystemLog('CLOUD_SYNC', 'Manual cloud backup uploaded to Firestore');
  return true;
}

export async function restoreFromCloudNow() {
  const user = getAuthUser();
  if (!user || (!user.uid && !user.id)) throw new Error('Please sign in with Email or Google to restore cloud records.');
  const userUid = user.uid || user.id;
  const cloudData = await fetchUserFromCloud(userUid);
  if (!cloudData) throw new Error('No cloud backup found for this account.');
  
  if (cloudData.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloudData.settings));
  if (cloudData.weightLog) localStorage.setItem(KEYS.WEIGHT_LOG, JSON.stringify(cloudData.weightLog));
  if (cloudData.workouts) localStorage.setItem(KEYS.WORKOUTS, JSON.stringify(cloudData.workouts));
  if (cloudData.nutritionLog) localStorage.setItem(KEYS.NUTRITION_LOG, JSON.stringify(cloudData.nutritionLog));
  if (cloudData.waterLog) localStorage.setItem(KEYS.WATER_LOG, JSON.stringify(cloudData.waterLog));
  if (cloudData.movementLog) localStorage.setItem(KEYS.MOVEMENT_LOG, JSON.stringify(cloudData.movementLog));
  if (cloudData.habitsLog) localStorage.setItem(KEYS.HABITS_LOG, JSON.stringify(cloudData.habitsLog));
  if (cloudData.customFoods) localStorage.setItem(KEYS.CUSTOM_FOODS, JSON.stringify(cloudData.customFoods));
  if (cloudData.customExercises) localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(cloudData.customExercises));
  if (cloudData.exerciseHistory) localStorage.setItem(KEYS.EXERCISE_HISTORY, JSON.stringify(cloudData.exerciseHistory));

  addSystemLog('CLOUD_RESTORE', 'Local storage restored from Firebase Cloud');
  return true;
}

// ─── System Logs (for Admin Panel) ──────────────────────────────────────────

export function getSystemLogs() {
  return load(KEYS.SYSTEM_LOGS, [
    { id: 'log-init', time: new Date().toISOString(), type: 'INFO', message: 'CORE FIT storage initialized successfully.' }
  ]);
}

export function addSystemLog(type, message) {
  const logs = getSystemLogs();
  logs.unshift({ id: uid(), time: new Date().toISOString(), type, message });
  try {
    localStorage.setItem(KEYS.SYSTEM_LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch {}
}

// ─── Auth & User Session ───────────────────────────────────────────────────

export function getAuthUser() {
  return load(KEYS.AUTH_USER, null);
}

export function saveAuthUser(user) {
  save(KEYS.AUTH_USER, user);
  if (user) {
    addSystemLog('AUTH', `User ${user.email} session active via ${user.provider || 'email'}`);
  } else {
    addSystemLog('AUTH', 'User signed out');
  }
}

// ─── Settings & Profile ────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  unit: 'kg',
  heightUnit: 'cm',
  height: 175,
  startWeight: 75,
  goalWeight: 70,
  goalType: 'improve_fitness',
  activityLevel: 'moderately_active',
  age: 26,
  gender: 'male',
  startDate: todayStr(),
  stepGoal: 10000,
  waterGoal: 3000,
  calorieGoal: 2200,
  proteinGoal: 140,
  carbsGoal: 230,
  fatGoal: 65,
  workoutDaysGoal: 4,
  experience: 'intermediate',
  trainingLocation: 'gym',
  equipment: ['Barbell', 'Dumbbells', 'Cables', 'Machines'],
  availableTime: 60,
  cuisinePreferences: ['South Indian', 'Other Indian'],
  dietaryPreference: 'non_veg',
  onboardingComplete: false,
  remindersEnabled: true
};

export function getSettings() {
  return load(KEYS.SETTINGS, null);
}

export function saveSettings(settings) {
  save(KEYS.SETTINGS, settings);
}

// ─── Weight Log ─────────────────────────────────────────────────────────────

export function getWeightLog() {
  return load(KEYS.WEIGHT_LOG, []);
}

export function addWeightEntry({ date = todayStr(), weight, unit = 'kg', note = '', waist, chest, hips }) {
  const log = getWeightLog();
  const entry = {
    id: uid(),
    date,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    weight: Number(weight),
    unit,
    note: note ? note.trim() : '',
    measurements: {
      waist: waist ? Number(waist) : null,
      chest: chest ? Number(chest) : null,
      hips: hips ? Number(hips) : null
    }
  };
  log.unshift(entry);
  save(KEYS.WEIGHT_LOG, log);
  addSystemLog('WEIGHT', `Weight entry logged: ${weight} ${unit}`);
  return entry;
}

export function updateWeightEntry(id, updates) {
  const log = getWeightLog().map(e => e.id === id ? { ...e, ...updates } : e);
  save(KEYS.WEIGHT_LOG, log);
}

export function deleteWeightEntry(id) {
  save(KEYS.WEIGHT_LOG, getWeightLog().filter(e => e.id !== id));
}

export function convertWeightLogUnit(fromUnit, toUnit) {
  if (fromUnit === toUnit) return;
  const factor = fromUnit === 'kg' ? 2.20462 : 1 / 2.20462;
  const log = getWeightLog().map(e => ({
    ...e,
    weight: parseFloat((e.weight * factor).toFixed(1)),
    unit: toUnit
  }));
  save(KEYS.WEIGHT_LOG, log);
}

// ─── Workouts ──────────────────────────────────────────────────────────────

export function getWorkouts() {
  return load(KEYS.WORKOUTS, []);
}

export function saveWorkout(workout) {
  const workouts = getWorkouts();
  const id = workout.id || uid();
  const fullWorkout = {
    ...workout,
    id,
    date: workout.date || todayStr(),
    createdAt: workout.createdAt || new Date().toISOString()
  };
  const idx = workouts.findIndex(w => w.id === id);
  if (idx >= 0) {
    workouts[idx] = fullWorkout;
  } else {
    workouts.unshift(fullWorkout);
  }
  save(KEYS.WORKOUTS, workouts);
  addSystemLog('WORKOUT', `Workout "${fullWorkout.name || 'Session'}" saved (${fullWorkout.duration || 0} min)`);
  return fullWorkout;
}

export function deleteWorkout(id) {
  save(KEYS.WORKOUTS, getWorkouts().filter(w => w.id !== id));
}

// Active workout draft
export function getActiveWorkout() {
  return load(KEYS.ACTIVE_WORKOUT, null);
}

export function saveActiveWorkout(active) {
  save(KEYS.ACTIVE_WORKOUT, active);
}

export function clearActiveWorkout() {
  try {
    localStorage.removeItem(KEYS.ACTIVE_WORKOUT);
  } catch {}
}

// ─── Exercise History ───────────────────────────────────────────────────────

export function getExerciseHistory() {
  return load(KEYS.EXERCISE_HISTORY, {});
}

export function updateExerciseHistory(exerciseName, sets, date) {
  const history = getExerciseHistory();
  history[exerciseName] = { date: date || todayStr(), sets };
  save(KEYS.EXERCISE_HISTORY, history);
}

// ─── Custom Exercises ───────────────────────────────────────────────────────

export function getCustomExercises() {
  return load(KEYS.CUSTOM_EXERCISES, []);
}

export function addCustomExercise(exercise) {
  const list = getCustomExercises();
  const item = { ...exercise, id: 'ce-' + uid(), isCustom: true };
  list.unshift(item);
  save(KEYS.CUSTOM_EXERCISES, list);
  addSystemLog('EXERCISE', `Custom exercise added: ${item.name}`);
  return item;
}

export function deleteCustomExercise(id) {
  save(KEYS.CUSTOM_EXERCISES, getCustomExercises().filter(e => e.id !== id));
}

// ─── Nutrition Log ─────────────────────────────────────────────────────────

export function getNutritionLog() {
  return load(KEYS.NUTRITION_LOG, {});
}

export function getDayNutrition(date = todayStr()) {
  const log = getNutritionLog();
  return log[date] || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };
}

export function addFoodToMeal(date, mealType, foodItem) {
  const log = getNutritionLog();
  if (!log[date]) {
    log[date] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
  }
  const entry = {
    id: uid(),
    ...foodItem,
    loggedAt: new Date().toISOString()
  };
  log[date][mealType] = [...(log[date][mealType] || []), entry];
  save(KEYS.NUTRITION_LOG, log);
  addSystemLog('NUTRITION', `Added ${foodItem.name} (${foodItem.calories} kcal) to ${mealType}`);
  return entry;
}

export function removeFoodFromMeal(date, mealType, foodId) {
  const log = getNutritionLog();
  if (!log[date] || !log[date][mealType]) return;
  log[date][mealType] = log[date][mealType].filter(f => f.id !== foodId);
  save(KEYS.NUTRITION_LOG, log);
}

// Custom foods added by user
export function getCustomFoods() {
  return load(KEYS.CUSTOM_FOODS, []);
}

export function addCustomFood(food) {
  const list = getCustomFoods();
  const item = { ...food, id: 'cf-' + uid(), isCustom: true };
  list.unshift(item);
  save(KEYS.CUSTOM_FOODS, list);
  addSystemLog('NUTRITION', `Custom food added: ${item.name}`);
  return item;
}

export function deleteCustomFood(id) {
  save(KEYS.CUSTOM_FOODS, getCustomFoods().filter(f => f.id !== id));
}

// ─── Water Log ─────────────────────────────────────────────────────────────

export function getWaterLog() {
  return load(KEYS.WATER_LOG, {});
}

export function getDayWater(date = todayStr()) {
  const log = getWaterLog();
  return log[date] || 0;
}

export function addWater(amountMl, date = todayStr()) {
  const log = getWaterLog();
  const current = log[date] || 0;
  const updated = Math.max(0, current + amountMl);
  log[date] = updated;
  save(KEYS.WATER_LOG, log);
  return updated;
}

export function resetWater(date = todayStr()) {
  const log = getWaterLog();
  log[date] = 0;
  save(KEYS.WATER_LOG, log);
  return 0;
}

// ─── Movement & Step Tracking ──────────────────────────────────────────────

export function getMovementLog() {
  return load(KEYS.MOVEMENT_LOG, {});
}

export function getDayMovement(date = todayStr()) {
  const log = getMovementLog();
  return log[date] || {
    steps: 0,
    distanceKm: 0,
    activeMinutes: 0,
    caloriesBurned: 0,
    activities: [],
    lastSyncTime: null,
    syncSource: 'manual'
  };
}

export function updateDayMovement(date, updates) {
  const log = getMovementLog();
  const current = getDayMovement(date);
  log[date] = { ...current, ...updates };
  save(KEYS.MOVEMENT_LOG, log);
  return log[date];
}

export function addManualActivity(date, activity) {
  const current = getDayMovement(date);
  const entry = {
    id: uid(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type: activity.type || 'Walking',
    duration: Number(activity.duration || 30),
    distanceKm: Number(activity.distanceKm || 0),
    calories: Number(activity.calories || 0),
    notes: activity.notes || '',
    isManual: true
  };
  const updatedActivities = [entry, ...(current.activities || [])];
  const totalCals = updatedActivities.reduce((acc, a) => acc + (a.calories || 0), 0);
  const totalMins = updatedActivities.reduce((acc, a) => acc + (a.duration || 0), 0);
  const totalDist = parseFloat(updatedActivities.reduce((acc, a) => acc + (a.distanceKm || 0), 0).toFixed(2));
  
  let addedSteps = 0;
  if (entry.type === 'Walking') addedSteps = Math.round(entry.distanceKm * 1300 || entry.duration * 100);
  else if (entry.type === 'Running') addedSteps = Math.round(entry.distanceKm * 1100 || entry.duration * 150);

  return updateDayMovement(date, {
    activities: updatedActivities,
    activeMinutes: totalMins,
    caloriesBurned: totalCals,
    distanceKm: totalDist,
    steps: (current.steps || 0) + addedSteps
  });
}

export function deleteManualActivity(date, activityId) {
  const current = getDayMovement(date);
  const updatedActivities = (current.activities || []).filter(a => a.id !== activityId);
  const totalCals = updatedActivities.reduce((acc, a) => acc + (a.calories || 0), 0);
  const totalMins = updatedActivities.reduce((acc, a) => acc + (a.duration || 0), 0);
  const totalDist = parseFloat(updatedActivities.reduce((acc, a) => acc + (a.distanceKm || 0), 0).toFixed(2));
  return updateDayMovement(date, {
    activities: updatedActivities,
    activeMinutes: totalMins,
    caloriesBurned: totalCals,
    distanceKm: totalDist
  });
}

// ─── Habits Tracker ────────────────────────────────────────────────────────

export const DEFAULT_HABIT_DEFINITIONS = [
  { id: 'h_sleep', title: '8 Hours Sleep', icon: 'Moon', desc: 'Rest & nervous system recovery' },
  { id: 'h_steps', title: 'Step Target Hit', icon: 'Footprints', desc: 'Active non-exercise movement' },
  { id: 'h_protein', title: 'Hit Protein Target', icon: 'Utensils', desc: 'Muscle protein synthesis support' },
  { id: 'h_water', title: 'Hydration Goal', icon: 'Droplets', desc: 'Electrolytes & cellular hydration' },
  { id: 'h_stretch', title: 'Mobility & Stretching', icon: 'Activity', desc: '10 min daily joint care' },
  { id: 'h_creatine', title: 'Creatine / Supplements', icon: 'Pill', desc: 'Daily saturation consistency' }
];

export function getHabitsLog() {
  return load(KEYS.HABITS_LOG, {});
}

export function getDayHabits(date = todayStr()) {
  const log = getHabitsLog();
  return log[date] || [];
}

export function toggleHabit(date, habitId) {
  const log = getHabitsLog();
  const completed = log[date] || [];
  if (completed.includes(habitId)) {
    log[date] = completed.filter(id => id !== habitId);
  } else {
    log[date] = [...completed, habitId];
  }
  save(KEYS.HABITS_LOG, log);
  return log[date];
}

// ─── Progress Photos (IndexedDB) ───────────────────────────────────────────

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getProgressPhotos() {
  try {
    const db = await openPhotoDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).getAll();
      req.onsuccess = () =>
        resolve(req.result.sort((a, b) => b.date.localeCompare(a.date)));
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('[db] getProgressPhotos error:', err);
    return [];
  }
}

export async function addProgressPhoto({ date = todayStr(), note = '', dataUrl }) {
  const db = await openPhotoDB();
  const photo = { id: uid(), date, note: note.trim(), dataUrl, createdAt: new Date().toISOString() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(photo);
    req.onsuccess = () => {
      addSystemLog('MEDIA', 'Progress photo added');
      resolve(photo);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProgressPhoto(id) {
  const db = await openPhotoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).delete(id);
    req.onsuccess = () => {
      addSystemLog('MEDIA', 'Progress photo deleted');
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// ─── Backup, Export & Clear ────────────────────────────────────────────────

export function exportAllData() {
  const dump = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    dump[name] = load(key, null);
  });
  return {
    app: 'CORE FIT',
    version: '2.0.0-prod',
    exportedAt: new Date().toISOString(),
    data: dump
  };
}

export function importAllData(payload) {
  if (!payload || !payload.data) throw new Error('Invalid backup file format');
  Object.entries(payload.data).forEach(([name, val]) => {
    if (KEYS[name] && val !== null) {
      localStorage.setItem(KEYS[name], JSON.stringify(val));
    }
  });
  addSystemLog('DATA', 'Complete backup restored successfully');
  triggerAutoCloudSync();
  return true;
}

export function clearAllData() {
  Object.values(KEYS).forEach(k => {
    try {
      localStorage.removeItem(k);
    } catch {}
  });
  try {
    indexedDB.deleteDatabase(IDB_NAME);
  } catch {}
  addSystemLog('DATA', 'All local data cleared');
}
