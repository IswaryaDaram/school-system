import { useState, useEffect, useCallback } from 'react';
import { classAPI, marksAPI } from '../../utils/api';
import {
  Award, Save, Loader2, Check, BookOpen, Users,
  AlertCircle, RefreshCw, Eye, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const EXAM_TYPES = [
  { value: 'unit1',      label: 'Unit Test 1'  },
  { value: 'unit2',      label: 'Unit Test 2'  },
  { value: 'midterm',    label: 'Mid-Term'     },
  { value: 'final',      label: 'Final Exam'   },
  { value: 'assignment', label: 'Assignment'   },
  { value: 'practical',  label: 'Practical'    },
];

const grade = (o, m) => {
  const p = (o / m) * 100;
  if (p >= 90) return 'A+'; if (p >= 80) return 'A'; if (p >= 70) return 'B+';
  if (p >= 60) return 'B';  if (p >= 50) return 'C'; if (p >= 35) return 'D';
  return 'F';
};
const GRADE_CLR = { 'A+':'text-emerald-400','A':'text-green-400','B+':'text-blue-400','B':'text-indigo-400','C':'text-amber-400','D':'text-orange-400','F':'text-red-400' };
const FIELD = "bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function TeacherMarks() {
  const [classes,       setClasses]        = useState([]);
  const [selectedClass, setSelectedClass]  = useState('');
  const [selectedSub,   setSelectedSub]    = useState('');
  const [examType,      setExamType]       = useState('unit1');
  const [maxMarks,      setMaxMarks]       = useState(100);
  const [students,      setStudents]       = useState([]);
  const [existing,      setExisting]       = useState({});  // sid → marks
  const [entries,       setEntries]        = useState({});  // sid → input string
  const [saving,        setSaving]         = useState({});
  const [saved,         setSaved]          = useState({});
  const [viewMode,      setViewMode]       = useState('entry');
  const [allMarks,      setAllMarks]       = useState([]);
  const [marksLoading,  setMarksLoading]   = useState(false);
  const [classesLoaded, setClassesLoaded]  = useState(false);

  // Load classes on mount
  useEffect(() => {
    classAPI.getAll()
      .then(res => {
        const list = res.data || [];
        setClasses(list);
        setClassesLoaded(true);
        if (list.length > 0) {
          const first = list[0];
          setSelectedClass(String(first._id));
          const studentList = (first.students || []).filter(s => s && s._id && s.user);
          setStudents(studentList);
        }
      })
      .catch(() => { toast.error('Failed to load classes'); setClassesLoaded(true); });
  }, []);

  // When class changes, update students list and reset
  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSub('');
    setEntries({});
    setExisting({});
    setSaved({});
    if (classId) {
      const cls = classes.find(c => String(c._id) === classId);
      const list = (cls?.students || []).filter(s => s && s._id && s.user);
      setStudents(list);
    } else {
      setStudents([]);
    }
  };

  // Subjects for selected class
  const classSubjects = selectedClass
    ? (classes.find(c => String(c._id) === selectedClass)?.subjects || [])
    : [];

  // Load existing marks when subject + examType changes
  const loadExisting = useCallback(async () => {
    if (!selectedClass || !selectedSub) { setExisting({}); return; }
    try {
      const res = await marksAPI.getClass({ classId: selectedClass, subjectId: selectedSub, examType });
      const map = {};
      (res.data || []).forEach(m => {
        const sid = String(m.student?._id || m.student);
        map[sid] = m.marksObtained;
      });
      setExisting(map);
      // Pre-fill entries with existing values
      setEntries(prev => {
        const next = { ...prev };
        Object.entries(map).forEach(([sid, val]) => {
          if (!next[sid] || next[sid] === '') next[sid] = String(val);
        });
        return next;
      });
    } catch { /* no marks yet is fine */ }
  }, [selectedClass, selectedSub, examType]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  // Load all marks for view mode
  const loadAllMarks = useCallback(async () => {
    if (!selectedClass) return;
    setMarksLoading(true);
    try {
      const res = await marksAPI.getClass({ classId: selectedClass });
      setAllMarks(res.data || []);
    } catch { toast.error('Failed to load marks'); }
    finally { setMarksLoading(false); }
  }, [selectedClass]);

  useEffect(() => {
    if (viewMode === 'view' && selectedClass) loadAllMarks();
  }, [viewMode, selectedClass, loadAllMarks]);

  // Save single student
  const saveMark = async (studentId) => {
    const val = parseInt(entries[studentId]);
    if (isNaN(val) || val < 0 || val > parseInt(maxMarks))
      return toast.error(`Enter a value between 0 and ${maxMarks}`);
    if (!selectedSub) return toast.error('Select a subject first');
    setSaving(p => ({ ...p, [studentId]: true }));
    try {
      await marksAPI.add({
        studentId, subjectId: selectedSub, examType,
        marksObtained: val, maxMarks: parseInt(maxMarks)
      });
      setExisting(p => ({ ...p, [studentId]: val }));
      setSaved(p => ({ ...p, [studentId]: true }));
      setTimeout(() => setSaved(p => ({ ...p, [studentId]: false })), 2500);
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(p => ({ ...p, [studentId]: false })); }
  };

  // Save all filled entries
  const saveAll = async () => {
    if (!selectedSub) return toast.error('Select a subject first');
    const ids = Object.keys(entries).filter(id => entries[id] !== '');
    if (!ids.length) return toast.error('Fill in at least one mark');
    let ok = 0;
    for (const id of ids) {
      const val = parseInt(entries[id]);
      if (isNaN(val) || val < 0 || val > parseInt(maxMarks)) continue;
      try {
        await marksAPI.add({
          studentId: id, subjectId: selectedSub, examType,
          marksObtained: val, maxMarks: parseInt(maxMarks)
        });
        setExisting(p => ({ ...p, [id]: val }));
        setSaved(p => ({ ...p, [id]: true }));
        ok++;
      } catch { /* continue with next */ }
    }
    toast.success(`Saved marks for ${ok} student${ok !== 1 ? 's' : ''}!`);
    setTimeout(() => setSaved({}), 2500);
  };

  // Group allMarks by subject · examType for table view
  const grouped = allMarks.reduce((acc, m) => {
    const key = `${m.subject?.name || '?'} · ${EXAM_TYPES.find(t => t.value === m.examType)?.label || m.examType}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const filledCount = Object.values(entries).filter(v => v !== '').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Award size={24} className="text-indigo-400" /> Marks
          </h1>
          <p className="text-slate-400 text-sm mt-1">Enter and review student exam marks</p>
        </div>
        <div className="flex gap-2">
          {[['entry','✏️ Enter'],['view','👁 View All']].map(([m, l]) => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Configure panel */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Configure</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Class */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Class *</label>
            {!classesLoaded ? (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2.5 bg-slate-800 rounded-xl">
                <Loader2 size={12} className="animate-spin" /> Loading...
              </div>
            ) : classes.length === 0 ? (
              <div className="flex items-center gap-1.5 text-amber-400 text-xs p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertCircle size={12} /> No classes assigned
              </div>
            ) : (
              <select className={`w-full ${FIELD}`} value={selectedClass}
                onChange={e => handleClassChange(e.target.value)}>
                <option value="">— Select —</option>
                {classes.map(c => (
                  <option key={c._id} value={String(c._id)}>{c.name} – {c.section}</option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Subject *</label>
            <select className={`w-full ${FIELD}`} value={selectedSub}
              onChange={e => { setSelectedSub(e.target.value); setEntries({}); setSaved({}); }}
              disabled={!selectedClass}>
              <option value="">— {selectedClass ? 'Select' : 'Pick class first'} —</option>
              {classSubjects.map(s => (
                <option key={s._id || s} value={String(s._id || s)}>
                  {s.name || s} {s.code ? `(${s.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exam Type</label>
            <select className={`w-full ${FIELD}`} value={examType}
              onChange={e => { setExamType(e.target.value); setEntries({}); setSaved({}); setExisting({}); }}>
              {EXAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Max Marks */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Max Marks</label>
            <input type="number" className={`w-full ${FIELD}`} value={maxMarks}
              onChange={e => setMaxMarks(e.target.value)} min={1} max={500} />
          </div>
        </div>
      </div>

      {/* ── ENTRY MODE ──────────────────────────────────────────────────────── */}
      {viewMode === 'entry' && (
        <>
          {!selectedClass ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a class to begin entering marks</p>
            </div>
          ) : !selectedSub ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Award size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a subject to enter marks</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Users size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No students in this class</p>
            </div>
          ) : (
            <>
              {/* Action bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-slate-400">{students.length} students</span>
                {filledCount > 0 && <span className="text-sm text-indigo-400">{filledCount} filled</span>}
                {Object.keys(existing).length > 0 && (
                  <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-xl">
                    ✓ {Object.keys(existing).length} marks already saved
                  </span>
                )}
                {filledCount > 0 && selectedSub && (
                  <button onClick={saveAll}
                    className="ml-auto flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
                    <Save size={14} /> Save All ({filledCount})
                  </button>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-800/40">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">Student</div>
                  <div className="col-span-2 text-center">Saved</div>
                  <div className="col-span-3 text-center">Enter / {maxMarks}</div>
                  <div className="col-span-1 text-center">Grade</div>
                  <div className="col-span-1 text-center">Save</div>
                </div>
                <div className="divide-y divide-slate-800">
                  {students.map((s, idx) => {
                    const sid      = String(s._id);
                    const val      = entries[sid] ?? '';
                    const prev     = existing[sid];
                    const num      = val !== '' ? parseInt(val) : NaN;
                    const pct      = !isNaN(num) ? Math.round((num / parseInt(maxMarks)) * 100) : null;
                    const g        = pct !== null ? grade(num, parseInt(maxMarks)) : null;
                    const changed  = val !== '' && prev !== undefined && num !== prev;
                    const isSaving = saving[sid];
                    const isSaved  = saved[sid];

                    return (
                      <div key={sid} className={`grid grid-cols-12 gap-3 items-center px-5 py-3.5 transition-colors ${isSaved ? 'bg-green-500/5' : 'hover:bg-slate-800/30'}`}>
                        <div className="col-span-1 text-sm text-slate-500">{idx + 1}</div>
                        <div className="col-span-4 flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.user?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{s.user?.name || '—'}</p>
                            <p className="text-xs text-slate-500">{s.rollNumber}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          {prev !== undefined
                            ? <span className={`text-xs font-semibold ${changed ? 'text-amber-400' : 'text-slate-400'}`}>{prev}/{maxMarks}</span>
                            : <span className="text-xs text-slate-600">—</span>}
                        </div>
                        <div className="col-span-3">
                          <input type="number" min={0} max={maxMarks}
                            value={val}
                            onChange={e => setEntries(p => ({ ...p, [sid]: e.target.value }))}
                            placeholder={`0–${maxMarks}`}
                            className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                              changed ? 'border-amber-500/50' : 'border-slate-700'
                            }`} />
                        </div>
                        <div className="col-span-1 text-center">
                          {g && <span className={`text-sm font-bold ${GRADE_CLR[g] || 'text-slate-400'}`}>{g}</span>}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button onClick={() => saveMark(sid)}
                            disabled={isSaving || val === ''}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 ${
                              isSaved ? 'bg-green-500/20 text-green-400' : 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-400 hover:text-white'
                            }`}>
                            {isSaving ? <Loader2 size={13} className="animate-spin" /> : isSaved ? <Check size={13} /> : <Save size={13} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── VIEW ALL MODE ────────────────────────────────────────────────────── */}
      {viewMode === 'view' && (
        <>
          {!selectedClass ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <BookOpen size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a class to view marks</p>
            </div>
          ) : marksLoading ? (
            <div className="p-10 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" /></div>
          ) : allMarks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Award size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No marks entered for this class yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{allMarks.length} records · {Object.keys(grouped).length} exam groups</p>
                <button onClick={loadAllMarks}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 rounded-xl transition-colors">
                  <RefreshCw size={12} /> Refresh
                </button>
              </div>
              {Object.entries(grouped).map(([key, marks]) => {
                const avg = (marks.reduce((s, m) => s + ((m.marksObtained / m.maxMarks) * 100), 0) / marks.length).toFixed(1);
                return (
                  <div key={key} className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-700/50 bg-slate-800/40 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{key}</span>
                      <span className="text-xs text-slate-400">Class avg: <span className="text-white font-medium">{avg}%</span></span>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {marks.map((m, i) => {
                        const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
                        const g   = grade(m.marksObtained, m.maxMarks);
                        return (
                          <div key={i} className="grid grid-cols-12 gap-3 px-5 py-3 items-center hover:bg-slate-800/20">
                            <div className="col-span-5 flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {m.student?.user?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm text-white">{m.student?.user?.name || '—'}</p>
                                <p className="text-xs text-slate-500">{m.student?.rollNumber}</p>
                              </div>
                            </div>
                            <div className="col-span-3 text-center">
                              <span className="text-sm font-semibold text-white">{m.marksObtained}</span>
                              <span className="text-xs text-slate-500"> / {m.maxMarks}</span>
                            </div>
                            <div className="col-span-2 text-center text-xs text-slate-400">{pct}%</div>
                            <div className="col-span-2 text-center">
                              <span className={`text-sm font-bold ${GRADE_CLR[g] || 'text-slate-400'}`}>{g}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
