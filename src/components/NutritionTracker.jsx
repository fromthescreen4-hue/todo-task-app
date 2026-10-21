import React, { useState, useEffect } from 'react';
import {
  getDayNutrition,
  addFoodToMeal,
  removeFoodFromMeal,
  getCustomFoods,
  addCustomFood,
  todayStr
} from '../services/db';
import { FOOD_DATABASE, searchFoods } from '../data/nutritionData';
import {
  Utensils,
  Search,
  Plus,
  Trash2,
  Filter,
  Check,
  ChevronDown,
  Info,
  Calendar,
  Sparkles,
  PieChart
} from 'lucide-react';

export default function NutritionTracker({ settings }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [dayNutrition, setDayNutrition] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [customFoodsList, setCustomFoodsList] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All'); // 'All' | 'South Indian' | 'Wider Indian' | 'Wider Asian' | 'High Protein'
  const [selectedDiet, setSelectedDiet] = useState('all'); // 'all' | 'veg' | 'vegan' | 'non_veg'

  // Food Logging Modal
  const [activeModalMeal, setActiveModalMeal] = useState(null); // 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  const [selectedFoodItem, setSelectedFoodItem] = useState(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  // Custom Food Form
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [cfName, setCfName] = useState('');
  const [cfCategory, setCfCategory] = useState('South Indian');
  const [cfServing, setCfServing] = useState('1 Katori (150g)');
  const [cfCalories, setCfCalories] = useState('');
  const [cfProtein, setCfProtein] = useState('');
  const [cfCarbs, setCfCarbs] = useState('');
  const [cfFat, setCfFat] = useState('');
  const [cfDiet, setCfDiet] = useState('veg');

  useEffect(() => {
    loadNutrition();
    setCustomFoodsList(getCustomFoods());
  }, [selectedDate]);

  function loadNutrition() {
    setDayNutrition(getDayNutrition(selectedDate));
  }

  // Combined searchable foods (curated + user-created)
  const combinedCatalog = [...customFoodsList, ...FOOD_DATABASE];

  const filteredFoods = combinedCatalog.filter(f => {
    // Diet filter
    if (selectedDiet !== 'all') {
      if (selectedDiet === 'veg' && f.diet !== 'veg' && f.diet !== 'vegan') return false;
      if (selectedDiet === 'vegan' && f.diet !== 'vegan') return false;
      if (selectedDiet === 'non_veg' && f.diet !== 'non_veg') return false;
    }
    // Cuisine filter
    if (selectedCuisine !== 'All') {
      if (selectedCuisine === 'South Indian' && f.category !== 'South Indian') return false;
      if (selectedCuisine === 'Wider Indian' && f.category !== 'Wider Indian') return false;
      if (selectedCuisine === 'Wider Asian' && f.category !== 'Wider Asian') return false;
      if (selectedCuisine === 'High Protein' && (f.protein || 0) < 12) return false;
    }
    // Query search
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = f.name.toLowerCase().includes(q);
    const aliasMatch = f.aliases && f.aliases.some(a => a.toLowerCase().includes(q));
    const catMatch = f.category && f.category.toLowerCase().includes(q);
    return nameMatch || aliasMatch || catMatch;
  });

  // Calculate day totals
  const allMeals = [
    ...(dayNutrition.breakfast || []),
    ...(dayNutrition.lunch || []),
    ...(dayNutrition.dinner || []),
    ...(dayNutrition.snacks || [])
  ];

  const totalCalories = allMeals.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = Math.round(allMeals.reduce((acc, f) => acc + (f.protein || 0), 0));
  const totalCarbs = Math.round(allMeals.reduce((acc, f) => acc + (f.carbs || 0), 0));
  const totalFat = Math.round(allMeals.reduce((acc, f) => acc + (f.fat || 0), 0));
  const totalFibre = parseFloat(allMeals.reduce((acc, f) => acc + (f.fibre || 0), 0).toFixed(1));

  const targetCalories = settings?.calorieGoal || 2200;
  const targetProtein = settings?.proteinGoal || 140;
  const targetCarbs = settings?.carbsGoal || 230;
  const targetFat = settings?.fatGoal || 65;

  function handleLogFoodSubmit() {
    if (!selectedFoodItem || !activeModalMeal) return;
    const mult = parseFloat(portionMultiplier) || 1;
    const loggedFood = {
      foodId: selectedFoodItem.id,
      name: selectedFoodItem.name,
      serving: `${mult}x ${selectedFoodItem.serving}`,
      portionMultiplier: mult,
      calories: Math.round(selectedFoodItem.calories * mult),
      protein: parseFloat((selectedFoodItem.protein * mult).toFixed(1)),
      carbs: parseFloat((selectedFoodItem.carbs * mult).toFixed(1)),
      fat: parseFloat((selectedFoodItem.fat * mult).toFixed(1)),
      fibre: parseFloat(((selectedFoodItem.fibre || 0) * mult).toFixed(1)),
      category: selectedFoodItem.category,
      source: selectedFoodItem.source || 'ICMR-NIN'
    };
    addFoodToMeal(selectedDate, activeModalMeal, loggedFood);
    setSelectedFoodItem(null);
    setPortionMultiplier(1);
    setActiveModalMeal(null);
    loadNutrition();
  }

  function handleRemoveFood(mealType, foodId) {
    removeFoodFromMeal(selectedDate, mealType, foodId);
    loadNutrition();
  }

  function handleCreateCustomFood(e) {
    e.preventDefault();
    if (!cfName || !cfCalories) return;
    const newFood = {
      name: cfName,
      category: cfCategory,
      serving: cfServing,
      calories: parseInt(cfCalories, 10),
      protein: parseFloat(cfProtein) || 0,
      carbs: parseFloat(cfCarbs) || 0,
      fat: parseFloat(cfFat) || 0,
      fibre: 1.0,
      diet: cfDiet,
      source: 'User Custom Recipe',
      aliases: [cfName.toLowerCase()]
    };
    addCustomFood(newFood);
    setCustomFoodsList(getCustomFoods());
    setShowCustomFoodModal(false);
    setCfName('');
    setCfCalories('');
    setCfProtein('');
    setCfCarbs('');
    setCfFat('');
  }

  const mealSections = [
    { id: 'breakfast', label: 'Breakfast', desc: 'Idli, dosa, eggs, upma, oats' },
    { id: 'lunch', label: 'Lunch', desc: 'Rice, dal, sambar, thoran, curries' },
    { id: 'dinner', label: 'Dinner', desc: 'Roti, sabzi, fish curry, salad' },
    { id: 'snacks', label: 'Snacks & Beverages', desc: 'Chai, protein, buttermilk, nuts' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
            Daily Meals & Macro Tracking
          </span>
          <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">
            Nutrition & Regional Food Diary
          </h1>
          <p className="text-xs text-[#555B63] mt-0.5">
            ICMR-NIN verified compositions for South Indian & regional culinary dishes.
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
            onClick={() => setShowCustomFoodModal(true)}
            className="btn btn-secondary text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#555B63]" />
            <span>Add Custom Food</span>
          </button>
        </div>
      </div>

      {/* Daily Macro Summary */}
      <div className="ui-card p-5 bg-[#FFFFFF]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#555B63]">Daily Caloric Balance</span>
            <div className="text-2xl font-black text-[#15171A] font-mono mt-0.5">
              {totalCalories} <span className="text-sm font-bold text-[#555B63]">/ {targetCalories} kcal</span>
            </div>
          </div>
          <div className="text-xs text-[#555B63] font-medium">
            <span>Remaining: </span>
            <span className="font-bold text-[#15171A] font-mono">
              {Math.max(0, targetCalories - totalCalories)} kcal
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#EAECEF] h-2.5 rounded-full overflow-hidden mb-5">
          <div
            className="bg-[#FFAE00] h-full progress-bar-fill"
            style={{ width: `${Math.min(100, (totalCalories / targetCalories) * 100)}%` }}
          />
        </div>

        {/* 4 Macro Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#555B63]">
              <span>PROTEIN</span>
              <span className="text-[#15171A] font-mono">{totalProtein} / {targetProtein}g</span>
            </div>
            <div className="w-full bg-[#D9DDE2] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#15171A] h-full"
                style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#555B63]">
              <span>CARBS</span>
              <span className="text-[#15171A] font-mono">{totalCarbs} / {targetCarbs}g</span>
            </div>
            <div className="w-full bg-[#D9DDE2] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#0284C7] h-full"
                style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#555B63]">
              <span>FAT</span>
              <span className="text-[#15171A] font-mono">{totalFat} / {targetFat}g</span>
            </div>
            <div className="w-full bg-[#D9DDE2] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#D97706] h-full"
                style={{ width: `${Math.min(100, (totalFat / targetFat) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#555B63]">
              <span>DIETARY FIBRE</span>
              <span className="text-[#15171A] font-mono">{totalFibre}g</span>
            </div>
            <div className="w-full bg-[#D9DDE2] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#16A34A] h-full"
                style={{ width: `${Math.min(100, (totalFibre / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Meal Diary Sections */}
      <div className="space-y-4">
        {mealSections.map(meal => {
          const items = dayNutrition[meal.id] || [];
          const mealCals = items.reduce((acc, f) => acc + (f.calories || 0), 0);
          const mealProtein = Math.round(items.reduce((acc, f) => acc + (f.protein || 0), 0));

          return (
            <div key={meal.id} className="ui-card p-5 bg-[#FFFFFF]">
              <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                    {meal.label}
                  </h3>
                  <span className="text-[11px] text-[#555B63]">{meal.desc}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#15171A] block">
                      {mealCals} kcal
                    </span>
                    <span className="text-[10px] text-[#555B63] block">
                      {mealProtein}g protein
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setActiveModalMeal(meal.id);
                      setSelectedFoodItem(null);
                    }}
                    className="btn btn-primary text-xs py-1.5 px-3"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#555B63]">
                  No items logged for {meal.label.toLowerCase()}.
                </div>
              ) : (
                <div className="divide-y divide-[#EAECEF]">
                  {items.map(item => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#15171A] truncate">{item.name}</div>
                        <div className="text-[11px] text-[#555B63] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <span className="font-medium">{item.serving}</span>
                          <span>•</span>
                          <span className="font-mono text-[#FFAE00] font-semibold">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="font-mono">{item.protein}g P | {item.carbs}g C | {item.fat}g F</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFood(meal.id, item.id)}
                        className="p-1.5 text-[#555B63] hover:text-[#DC2626] rounded transition-colors flex-shrink-0"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Catalog Search & Add Food Modal */}
      {activeModalMeal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-6 w-full max-w-2xl bg-[#FFFFFF] space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                  Log Food to {activeModalMeal.toUpperCase()}
                </h4>
                <span className="text-[11px] text-[#555B63]">
                  Search authentic dishes, aliases (e.g. "kadala", "porotta", "thayir"), or high-protein items.
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveModalMeal(null);
                  setSelectedFoodItem(null);
                }}
                className="text-xs font-bold text-[#555B63] hover:text-[#15171A]"
              >
                Cancel
              </button>
            </div>

            {/* Search Input & Filter Pills */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#555B63] absolute left-3 top-3" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search by name or alias (idli, sambar, puttu, biryani, chicken, paneer)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-xs"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5">
                {['All', 'South Indian', 'Wider Indian', 'High Protein', 'Wider Asian'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCuisine(cat)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-[6px] border transition-colors ${
                      selectedCuisine === cat
                        ? 'bg-[#15171A] text-white border-[#15171A]'
                        : 'bg-[#FFFFFF] text-[#555B63] border-[#D9DDE2] hover:bg-[#F6F6F7]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Results List */}
            <div className="flex-1 overflow-y-auto border border-[#D9DDE2] rounded-[8px] divide-y divide-[#EAECEF] p-1">
              {filteredFoods.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#555B63]">
                  No matching foods found in catalog. Try adjusting your search or add a custom food.
                </div>
              ) : (
                filteredFoods.map(food => {
                  const isSelected = selectedFoodItem?.id === food.id;
                  return (
                    <div
                      key={food.id}
                      onClick={() => setSelectedFoodItem(food)}
                      className={`p-3 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#FEF2F2] border-l-4 border-[#FFAE00]' : 'hover:bg-[#F6F6F7]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-xs text-[#15171A]">{food.name}</div>
                        <div className="text-xs font-mono font-bold text-[#FFAE00]">{food.calories} kcal</div>
                      </div>
                      <div className="text-[11px] text-[#555B63] flex items-center gap-2 mt-1">
                        <span>{food.serving}</span>
                        <span>•</span>
                        <span className="font-mono">{food.protein}g Protein</span>
                        <span>•</span>
                        <span className="font-mono">{food.carbs}g Carbs</span>
                        <span>•</span>
                        <span className="font-mono">{food.fat}g Fat</span>
                        <span className="ml-auto text-[9px] uppercase font-bold text-[#8B939E] bg-[#EAECEF] px-1.5 py-0.5 rounded">
                          {food.category}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Food Portion Scaler & Confirmation */}
            {selectedFoodItem && (
              <div className="p-4 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#15171A]">Selected: {selectedFoodItem.name}</span>
                    <div className="text-[11px] text-[#555B63]">Standard serving: {selectedFoodItem.serving}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#555B63]">Portion:</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="10"
                      value={portionMultiplier}
                      onChange={e => setPortionMultiplier(e.target.value)}
                      className="w-20 p-1.5 text-xs font-mono font-bold border rounded-[6px] bg-white text-center"
                    />
                    <span className="text-xs text-[#555B63]">x</span>
                  </div>
                </div>

                <div className="text-xs font-mono flex items-center justify-between border-t border-[#D9DDE2] pt-2">
                  <span className="font-bold text-[#15171A]">
                    Total: {Math.round(selectedFoodItem.calories * (parseFloat(portionMultiplier) || 1))} kcal
                  </span>
                  <span className="text-[#555B63]">
                    {((selectedFoodItem.protein || 0) * (parseFloat(portionMultiplier) || 1)).toFixed(1)}g P |{' '}
                    {((selectedFoodItem.carbs || 0) * (parseFloat(portionMultiplier) || 1)).toFixed(1)}g C |{' '}
                    {((selectedFoodItem.fat || 0) * (parseFloat(portionMultiplier) || 1)).toFixed(1)}g F
                  </span>
                </div>

                <button
                  onClick={handleLogFoodSubmit}
                  className="btn btn-primary w-full text-xs py-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Add to {activeModalMeal.toUpperCase()}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Food Modal */}
      {showCustomFoodModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-6 w-full max-w-md bg-[#FFFFFF] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
              <h4 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                Create Custom Regional Food / Recipe
              </h4>
              <button onClick={() => setShowCustomFoodModal(false)} className="text-xs font-bold text-[#555B63]">
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateCustomFood} className="space-y-3">
              <div>
                <label className="input-label">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Home Malabar Chicken Roast"
                  value={cfName}
                  onChange={e => setCfName(e.target.value)}
                  className="input-field text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Cuisine Category</label>
                  <select
                    value={cfCategory}
                    onChange={e => setCfCategory(e.target.value)}
                    className="input-field text-xs"
                  >
                    <option value="South Indian">South Indian</option>
                    <option value="Wider Indian">Wider Indian</option>
                    <option value="Wider Asian">Wider Asian</option>
                    <option value="High Protein">High Protein</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Serving Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 Katori (160g)"
                    value={cfServing}
                    onChange={e => setCfServing(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    placeholder="240"
                    value={cfCalories}
                    onChange={e => setCfCalories(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="input-label">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="22"
                    value={cfProtein}
                    onChange={e => setCfProtein(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="10"
                    value={cfCarbs}
                    onChange={e => setCfCarbs(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="input-label">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={cfFat}
                    onChange={e => setCfFat(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomFoodModal(false)}
                  className="btn btn-secondary flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 text-xs"
                >
                  Save to Local Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
