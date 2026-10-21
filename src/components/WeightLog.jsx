import React, { useState, useEffect, useRef } from 'react';
import {
  getWeightLog,
  addWeightEntry,
  updateWeightEntry,
  deleteWeightEntry,
  convertWeightLogUnit,
  getProgressPhotos,
  addProgressPhoto,
  deleteProgressPhoto,
  todayStr
} from '../services/db';
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Minus,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Camera,
  Calendar,
  Image as ImageIcon,
  Ruler
} from 'lucide-react';

export default function WeightLog({ settings, onUpdateSettings }) {
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'photos'
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [period, setPeriod] = useState('30d'); // 7d, 30d, 90d, 180d, 365d, all
  const [editingId, setEditingId] = useState(null);
  const [editWeightVal, setEditWeightVal] = useState('');

  // New weight entry form
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(todayStr());
  const [newNote, setNewNote] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newHips, setNewHips] = useState('');
  const [showMeasurements, setShowMeasurements] = useState(false);

  // Photo upload
  const [photoNote, setPhotoNote] = useState('');
  const [photoDate, setPhotoDate] = useState(todayStr());
  const fileInputRef = useRef(null);

  const unit = settings?.unit || 'kg';
  const startWeight = settings?.startWeight || null;
  const goalWeight = settings?.goalWeight || null;

  useEffect(() => {
    loadWeights();
    loadPhotos();
  }, []);

  function loadWeights() {
    setEntries(getWeightLog());
  }

  async function loadPhotos() {
    try {
      const p = await getProgressPhotos();
      setPhotos(p);
    } catch (e) {
      console.error(e);
    }
  }

  function handleUnitToggle() {
    const nextUnit = unit === 'kg' ? 'lbs' : 'kg';
    convertWeightLogUnit(unit, nextUnit);
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings, unit: nextUnit });
    }
    loadWeights();
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!newWeight || isNaN(newWeight)) return;
    addWeightEntry({
      date: newDate,
      weight: parseFloat(newWeight),
      unit: unit,
      note: newNote,
      waist: newWaist,
      chest: newChest,
      hips: newHips
    });
    setNewWeight('');
    setNewNote('');
    setNewWaist('');
    setNewChest('');
    setNewHips('');
    setShowMeasurements(false);
    loadWeights();
  }

  function handleDelete(id) {
    deleteWeightEntry(id);
    loadWeights();
  }

  function handleStartEdit(entry) {
    setEditingId(entry.id);
    setEditWeightVal(entry.weight.toString());
  }

  function handleSaveEdit(id) {
    const parsed = parseFloat(editWeightVal);
    if (!isNaN(parsed) && parsed > 0) {
      updateWeightEntry(id, { weight: parsed });
      setEditingId(null);
      loadWeights();
    }
  }

  // Photo handlers
  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      await addProgressPhoto({
        date: photoDate,
        note: photoNote,
        dataUrl
      });
      setPhotoNote('');
      loadPhotos();
    };
    reader.readAsDataURL(file);
  }

  async function handleDeletePhoto(id) {
    await deleteProgressPhoto(id);
    loadPhotos();
  }

  // Filter entries for chart
  const now = Date.now();
  const periodDays = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
    'all': 9999
  }[period] || 30;

  const filtered = entries.filter(e => {
    const diffDays = Math.floor((now - new Date(e.date + 'T00:00:00').getTime()) / 86400000);
    return diffDays <= periodDays;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const latest = entries.length > 0 ? entries[0] : null;
  const oldest = entries.length > 0 ? entries[entries.length - 1] : null;
  const netChange = latest && oldest && latest !== oldest ? (latest.weight - oldest.weight).toFixed(1) : '0.0';

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
            Body Weight & Measurements
          </span>
          <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">Weight & Metrics</h1>
          <p className="text-xs text-[#555B63] mt-0.5">
            Logged weights, optional circumference measurements, and private progress photos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Toggle Button */}
          <button
            onClick={handleUnitToggle}
            className="btn btn-secondary text-xs font-mono font-bold"
            title="Convert measurement unit"
          >
            Unit: {unit.toUpperCase()}
          </button>
          {/* Sub tabs */}
          <div className="flex bg-[#EAECEF] p-0.5 rounded-[8px]">
            <button
              onClick={() => setActiveTab('log')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors ${
                activeTab === 'log' ? 'bg-[#FFFFFF] text-[#15171A] shadow-sm' : 'text-[#555B63]'
              }`}
            >
              Weigh-In Log
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors ${
                activeTab === 'photos' ? 'bg-[#FFFFFF] text-[#15171A] shadow-sm' : 'text-[#555B63]'
              }`}
            >
              Private Photos ({photos.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'log' ? (
        <>
          {/* Summary Metric Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="ui-card p-4">
              <span className="text-[10px] font-bold uppercase text-[#555B63] block">Current Weight</span>
              <div className="text-2xl font-black text-[#15171A] font-mono mt-1">
                {latest ? `${latest.weight} ${unit}` : 'None'}
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">{latest ? latest.date : 'No logs yet'}</div>
            </div>

            <div className="ui-card p-4">
              <span className="text-[10px] font-bold uppercase text-[#555B63] block">Starting Weight</span>
              <div className="text-2xl font-black text-[#15171A] font-mono mt-1">
                {startWeight ? `${startWeight} ${unit}` : 'Unset'}
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Initial benchmark</div>
            </div>

            <div className="ui-card p-4">
              <span className="text-[10px] font-bold uppercase text-[#555B63] block">Goal Weight</span>
              <div className="text-2xl font-black text-[#15171A] font-mono mt-1">
                {goalWeight ? `${goalWeight} ${unit}` : 'Unset'}
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Configured target</div>
            </div>

            <div className="ui-card p-4">
              <span className="text-[10px] font-bold uppercase text-[#555B63] block">Net Trajectory</span>
              <div className="text-2xl font-black font-mono mt-1 flex items-center gap-1">
                {latest && oldest && Number(netChange) !== 0 ? (
                  Number(netChange) < 0 ? (
                    <span className="text-[#16A34A] flex items-center">
                      <TrendingDown className="w-5 h-5 mr-1" />
                      {netChange} {unit}
                    </span>
                  ) : (
                    <span className="text-[#DC2626] flex items-center">
                      <TrendingUp className="w-5 h-5 mr-1" />
                      +{netChange} {unit}
                    </span>
                  )
                ) : (
                  <span className="text-[#555B63] flex items-center">
                    <Minus className="w-5 h-5 mr-1" />
                    0.0 {unit}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#555B63] mt-0.5">Over available entries</div>
            </div>
          </div>

          {/* Quick-Add Weight Form */}
          <div className="ui-card p-5 bg-[#FFFFFF]">
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FFAE00]" />
              <span>Log New Body Weight & Circumference</span>
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Weight ({unit})</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 74.2"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="input-field text-base font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="input-label">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Fasted, post-workout"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Optional Measurements Collapsible */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowMeasurements(!showMeasurements)}
                  className="text-xs font-bold text-[#555B63] hover:text-[#15171A] flex items-center gap-1.5"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{showMeasurements ? 'Hide Body Measurements' : '+ Add Optional Body Measurements (Waist, Chest, Hips)'}</span>
                </button>

                {showMeasurements && (
                  <div className="grid grid-cols-3 gap-3 mt-3 p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2] animate-in fade-in duration-150">
                    <div>
                      <label className="input-label">Waist (cm/in)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 82"
                        value={newWaist}
                        onChange={e => setNewWaist(e.target.value)}
                        className="input-field font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="input-label">Chest (cm/in)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 100"
                        value={newChest}
                        onChange={e => setNewChest(e.target.value)}
                        className="input-field font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="input-label">Hips (cm/in)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="e.g. 96"
                        value={newHips}
                        onChange={e => setNewHips(e.target.value)}
                        className="input-field font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button type="submit" className="btn btn-primary text-xs">
                  Save Entry
                </button>
              </div>
            </form>
          </div>

          {/* Genuine Chart Card */}
          <div className="ui-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9DDE2] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                  Weight Trend Line
                </h3>
                <span className="text-[11px] text-[#555B63]">
                  Direct scatter and line plotting from stored records
                </span>
              </div>
              <div className="flex gap-1 bg-[#EAECEF] p-0.5 rounded-[6px]">
                {['7d', '30d', '90d', '180d', '365d', 'all'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-[4px] uppercase transition-colors ${
                      period === p ? 'bg-[#FFFFFF] text-[#15171A] shadow-sm' : 'text-[#555B63]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length < 2 ? (
              <div className="p-10 text-center bg-[#F6F6F7] rounded-[8px] border border-dashed border-[#D9DDE2]">
                <Scale className="w-8 h-8 text-[#8B939E] mx-auto mb-2" />
                <div className="text-xs font-bold text-[#15171A]">Insufficient Data Points</div>
                <p className="text-[11px] text-[#555B63] mt-1 max-w-sm mx-auto">
                  At least two real weight entries are required within this time range ({period}) to render a trend line. CORE FIT never invents fabricated curves.
                </p>
              </div>
            ) : (
              <div>
                <SimpleSvgWeightChart entries={filtered} unit={unit} />
              </div>
            )}
          </div>

          {/* Weight Log Table */}
          <div className="ui-card p-5">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3 mb-4">
              <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
                History & Logs ({entries.length})
              </h3>
            </div>

            {entries.length === 0 ? (
              <div className="text-xs text-[#555B63] text-center py-6">
                No weigh-ins recorded yet. Log your first measurement above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#D9DDE2] text-[#555B63] uppercase text-[10px]">
                      <th className="pb-2 font-bold">Date & Time</th>
                      <th className="pb-2 font-bold">Weight</th>
                      <th className="pb-2 font-bold">Circumference</th>
                      <th className="pb-2 font-bold">Notes</th>
                      <th className="pb-2 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAECEF]">
                    {entries.map(entry => {
                      const isEditing = editingId === entry.id;
                      return (
                        <tr key={entry.id} className="hover:bg-[#F6F6F7]">
                          <td className="py-2.5 font-mono text-[#555B63]">
                            {entry.date} <span className="text-[10px] text-[#8B939E]">{entry.time || ''}</span>
                          </td>
                          <td className="py-2.5 font-bold font-mono text-[#15171A]">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.1"
                                value={editWeightVal}
                                onChange={e => setEditWeightVal(e.target.value)}
                                className="w-20 p-1 border rounded text-xs font-mono font-bold"
                              />
                            ) : (
                              `${entry.weight} ${entry.unit || unit}`
                            )}
                          </td>
                          <td className="py-2.5 text-[#555B63]">
                            {entry.measurements?.waist || entry.measurements?.chest || entry.measurements?.hips ? (
                              <span className="font-mono text-[11px]">
                                W:{entry.measurements.waist || '-'} C:{entry.measurements.chest || '-'} H:{entry.measurements.hips || '-'}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 text-[#555B63] truncate max-w-[150px]">
                            {entry.note || '—'}
                          </td>
                          <td className="py-2.5 text-right space-x-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(entry.id)}
                                  className="p-1 text-[#16A34A] hover:bg-[#F0FDF4] rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 text-[#555B63] hover:bg-[#F6F6F7] rounded"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartEdit(entry)}
                                  className="p-1 text-[#555B63] hover:text-[#15171A] rounded"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="p-1 text-[#555B63] hover:text-[#DC2626] rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Private Progress Photos Vault (IndexedDB) */
        <div className="space-y-6">
          <div className="ui-card p-5 bg-[#FFFFFF]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#FFAE00]" />
                  <span>Private Progress Photos</span>
                </h3>
                <span className="text-[11px] text-[#555B63]">
                  Stored securely on your device for your eyes only.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="input-label">Date</label>
                <input
                  type="date"
                  value={photoDate}
                  onChange={e => setPhotoDate(e.target.value)}
                  className="input-field font-mono text-xs"
                />
              </div>
              <div>
                <label className="input-label">Note</label>
                <input
                  type="text"
                  placeholder="e.g. Front relaxed, week 4"
                  value={photoNote}
                  onChange={e => setPhotoNote(e.target.value)}
                  className="input-field text-xs"
                />
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary w-full text-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Local Photo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          <div className="ui-card p-5">
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide mb-4">
              Stored Progress Snapshots ({photos.length})
            </h3>
            {photos.length === 0 ? (
              <div className="p-8 text-center bg-[#F6F6F7] rounded-[8px] border border-dashed border-[#D9DDE2]">
                <ImageIcon className="w-8 h-8 text-[#8B939E] mx-auto mb-2" />
                <div className="text-xs font-bold text-[#15171A]">No progress photos stored</div>
                <p className="text-[11px] text-[#555B63] mt-1">
                  Upload photos taken under identical lighting to visually monitor physique adaptation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map(p => (
                  <div key={p.id} className="ui-card overflow-hidden group relative">
                    <img
                      src={p.dataUrl}
                      alt={p.note || 'Progress snapshot'}
                      className="w-full h-48 object-cover bg-[#F6F6F7]"
                    />
                    <div className="p-2.5 bg-[#FFFFFF]">
                      <div className="text-xs font-bold font-mono text-[#15171A]">{p.date}</div>
                      <div className="text-[11px] text-[#555B63] truncate">{p.note || 'No note'}</div>
                    </div>
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-[6px] bg-black/60 text-white hover:bg-[#DC2626] transition-colors"
                      title="Delete photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Clean SVG weight chart
function SimpleSvgWeightChart({ entries, unit }) {
  const W = 600;
  const H = 200;
  const PAD = { top: 20, right: 30, bottom: 40, left: 45 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const weights = entries.map(e => e.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const pts = entries.map((e, idx) => {
    const x = PAD.left + (idx / (entries.length - 1)) * innerW;
    const y = PAD.top + innerH - ((e.weight - minW) / range) * innerH;
    return [x, y];
  });

  const polyline = pts.map(p => p.join(',')).join(' ');
  const area = `M ${pts[0][0]},${PAD.top + innerH} L ${pts.map(p => p.join(',')).join(' L ')} L ${pts[pts.length - 1][0]},${PAD.top + innerH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        <defs>
          <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFAE00" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFAE00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1={PAD.left} y1={PAD.top} x2={W - PAD.right} y2={PAD.top} stroke="#EAECEF" strokeWidth="1" strokeDasharray="3,3" />
        <line x1={PAD.left} y1={PAD.top + innerH / 2} x2={W - PAD.right} y2={PAD.top + innerH / 2} stroke="#EAECEF" strokeWidth="1" strokeDasharray="3,3" />
        <line x1={PAD.left} y1={PAD.top + innerH} x2={W - PAD.right} y2={PAD.top + innerH} stroke="#D9DDE2" strokeWidth="1" />

        {/* Shaded Area */}
        <path d={area} fill="url(#wtGrad)" />

        {/* Main Line */}
        <polyline points={polyline} fill="none" stroke="#FFAE00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#FFFFFF" stroke="#FFAE00" strokeWidth="2.5" />
        ))}

        {/* Labels */}
        <text x={PAD.left - 8} y={PAD.top + 4} textAnchor="end" fill="#555B63" fontSize="10" fontFamily="monospace">
          {maxW.toFixed(1)}
        </text>
        <text x={PAD.left - 8} y={PAD.top + innerH} textAnchor="end" fill="#555B63" fontSize="10" fontFamily="monospace">
          {minW.toFixed(1)}
        </text>
        <text x={pts[0][0]} y={H - 15} textAnchor="start" fill="#555B63" fontSize="9" fontFamily="monospace">
          {entries[0].date}
        </text>
        <text x={pts[pts.length - 1][0]} y={H - 15} textAnchor="end" fill="#555B63" fontSize="9" fontFamily="monospace">
          {entries[entries.length - 1].date}
        </text>
      </svg>
    </div>
  );
}
