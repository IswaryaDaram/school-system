import { useState, useEffect, useCallback } from 'react';
import { classAPI, attendanceAPI } from '../../utils/api';
import {
  ClipboardList, Clock, Loader2, Users, CheckCircle2,
  XCircle, AlertCircle, Save, CalendarDays, BarChart2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS = [
  { value: 'present', label: 'P', title: 'Present', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40', dot: 'bg-green-400' },
  { value: 'absent',  label: 'A', title: 'Absent',  color: 'text-red-400',   bg: 'bg-red-500/20 border-red-500/40',     dot: 'bg-red-400'   },
  { value: 'late',    label: 'L', title: 'Late',    color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', dot: 'bg-amber-400' },
];

export default function TeacherAttendance() {
  const [classes,       setClasses]       = useState([]);
  const [classesLoaded, setClassesLoaded] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [date,          setDate]          = useState(format(new Date(), 'yyyy-MM-dd'));
  const [students,      setStudents]      = useState([]);
  const [attendance,    setAttendance]    = useState({});
  const [existing,      setExisting]      = useState({});
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [viewMode,      setViewMode]      = useState('mark');
  const [summary,       setSummary]       = useState([]);
  const [summaryLoading,setSummaryLoading]= useState(false);

  // ── Load classes once on mount ────────────────────────────────────────────
  useEffect(() => {
    classAPI.getAll()
      .then(res => {
        const list = res.data || [];
        setClasses(list);
        setClassesLoaded(true);
        if (list.length > 0) setSelectedClass(String(list[0]._id));
      })
      .catch(() => { toast.error('Failed to load classes'); setClassesLoaded(true); });
  }, []);

  // ── Load students + existing attendance when class or date changes ─────────
  const loadClassData = useCallback(async (classId, dateStr, classList) => {
    if (!classId || !classList.length) return;
    const cls = classList.find(c => String(c._id) === String(classId));
    if (!cls) return;

    const studentList = (cls.students || []).filter(s => s && s._id && s.user);
    setStudents(studentList);

    if (studentList.length === 0) {
      setAttendance({});
      setExisting({});
      return;
    }

    setLoading(true);
    try {
      const attRes = await attendanceAPI.getClass({ classId, date: dateStr });
      const existMap = {};
      (attRes.data || []).forEach(r => {
        const sid = r.student?._id ? String(r.student._id) : String(r.student);
        if (sid) existMap[sid] = r.status;
      });

      const init = {};
      studentList.forEach(s => {
        const sid = String(s._id);
        init[sid] = existMap[sid] || 'present';
      });

      setAttendance(init);
      setExisting(existMap);
    } catch { toast.error('Failed to load attendance records'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (classesLoaded && selectedClass) {
      loadClassData(selectedClass, date, classes);
    }
  }, [selectedClass, date, classesLoaded, classes, loadClassData]);

  // ── Summary ───────────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    if (!selectedClass) return;
    setSummaryLoading(true);
    try {
      const endDate   = date;
      const startDate = format(subDays(new Date(date), 29), 'yyyy-MM-dd');
      const res = await attendanceAPI.getSummary({ classId: selectedClass, startDate, endDate });
      setSummary(res.data || []);
    } catch { toast.error('Failed to load summary'); }
    finally { setSummaryLoading(false); }
  }, [selectedClass, date]);

  useEffect(() => {
    if (viewMode === 'summary' && selectedClass) loadSummary();
  }, [viewMode, selectedClass, loadSummary]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const setStatus = (sid, status) => setAttendance(prev => ({ ...prev, [sid]: status }));

  const markAll = (status) => {
    const next = {};
    students.forEach(s => { next[String(s._id)] = status; });
    setAttendance(next);
  };

  const handleSave = async () => {
    if (!selectedClass || !students.length) return;
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendance[String(s._id)] || 'present'
      }));
      await attendanceAPI.mark({ classId: selectedClass, date, records });
      setExisting({ ...attendance });
      toast.success(`Attendance saved for ${format(new Date(date + 'T12:00:00'), 'dd MMM yyyy')}!`);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const presentCount  = students.filter(s => attendance[String(s._id)] === 'present').length;
  const absentCount   = students.filter(s => attendance[String(s._id)] === 'absent').length;
  const lateCount     = students.filter(s => attendance[String(s._id)] === 'late').length;
  const hasChanges    = students.some(s => attendance[String(s._id)] !== (existing[String(s._id)] || undefined));
  const isAlreadyDone = Object.keys(existing).length > 0;
  const selectedCls   = classes.find(c => String(c._id) === String(selectedClass));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <ClipboardList size={24} className="text-indigo-400" /> Attendance
          </h1>
          <p className="text-slate-400 text-sm mt-1">Mark and track daily student attendance</p>
        </div>
        <div className="flex items-center gap-2">
          {['mark','summary'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${viewMode === m ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {m === 'mark' ? '✏️ Mark' : '📊 Summary'}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Class</label>
          {!classesLoaded ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> Loading classes...
            </div>
          ) : classes.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
              <AlertCircle size={14} /> No classes assigned — ask admin to assign you a class
            </div>
          ) : (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {classes.map(c => (
                <option key={c._id} value={String(c._id)}>
                  {c.name} – Section {c.section}  ({(c.students || []).filter(s => s.user).length} students)
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>

      {/* ── MARK MODE ──────────────────────────────────────────────────────── */}
      {viewMode === 'mark' && (
        <>
          {/* Stats bar */}
          {students.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2 text-sm">
                <Users size={14} className="text-slate-400" />
                <span className="text-slate-400">Total</span>
                <span className="text-white font-bold">{students.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-400 font-medium">{presentCount} Present</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-red-400 font-medium">{absentCount} Absent</span>
              </div>
              {lateCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400 font-medium">{lateCount} Late</span>
                </div>
              )}
              {isAlreadyDone && (
                <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                  ✓ Previously marked
                </span>
              )}
            </div>
          )}

          {/* Bulk mark buttons */}
          {students.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Mark all:</span>
              {STATUS.map(({ value, title, dot }) => (
                <button key={value} onClick={() => markAll(value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-colors">
                  <div className={`w-2 h-2 rounded-full ${dot}`} /> {title}
                </button>
              ))}
              <button onClick={() => loadClassData(selectedClass, date, classes)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-xl transition-colors">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          )}

          {/* Student list */}
          {loading ? (
            <div className="bg-slate-900 rounded-2xl p-10 text-center">
              <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" />
              <p className="text-slate-400 text-sm mt-2">Loading students...</p>
            </div>
          ) : !selectedClass ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-10 text-center">
              <ClipboardList size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a class above to mark attendance</p>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Users size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No students in this class yet</p>
              <p className="text-slate-500 text-sm mt-1">Ask admin to add students to {selectedCls?.name}</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-800/40">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Student</div>
                <div className="col-span-3">Roll No.</div>
                <div className="col-span-3">Status</div>
              </div>
              <div className="divide-y divide-slate-700/30 max-h-[540px] overflow-y-auto">
                {students.map((s, idx) => {
                  const sid    = String(s._id);
                  const status = attendance[sid] || 'present';
                  return (
                    <div key={sid}
                      className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-colors ${
                        status === 'absent' ? 'bg-red-500/5' : status === 'late' ? 'bg-amber-500/5' : 'hover:bg-slate-800/30'
                      }`}>
                      <div className="col-span-1 text-sm text-slate-500">{idx + 1}</div>
                      <div className="col-span-5 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-white truncate">{s.user?.name || '—'}</span>
                      </div>
                      <div className="col-span-3 text-sm text-slate-400 font-mono">{s.rollNumber || '—'}</div>
                      <div className="col-span-3">
                        <div className="flex gap-1">
                          {STATUS.map(({ value, label, bg, color }) => (
                            <button key={value} onClick={() => setStatus(sid, value)}
                              title={value}
                              className={`w-8 h-8 rounded-lg border text-xs font-bold flex items-center justify-center transition-all ${
                                status === value
                                  ? `${bg} ${color}`
                                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                              }`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save bar */}
          {students.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700/50 rounded-2xl">
              <div className="text-sm">
                {hasChanges
                  ? <span className="text-amber-400 flex items-center gap-1.5"><AlertCircle size={14} /> Unsaved changes</span>
                  : <span className="text-green-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> All saved</span>}
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-medium text-sm disabled:opacity-60 transition-all shadow-lg shadow-indigo-900/40">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} /> {isAlreadyDone ? 'Update' : 'Save Attendance'}</>}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── SUMMARY MODE ───────────────────────────────────────────────────── */}
      {viewMode === 'summary' && (
        <>
          {!selectedClass ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-10 text-center">
              <BarChart2 size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Select a class to view summary</p>
            </div>
          ) : summaryLoading ? (
            <div className="bg-slate-900 rounded-2xl p-10 text-center">
              <Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" />
            </div>
          ) : summary.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-10 text-center">
              <BarChart2 size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No attendance data for this period</p>
              <p className="text-slate-500 text-sm mt-1">Last 30 days up to {format(new Date(date + 'T12:00:00'), 'dd MMM yyyy')}</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <CalendarDays size={13} /> Last 30 days up to {format(new Date(date + 'T12:00:00'), 'dd MMM yyyy')} · {summary.length} students
              </div>
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Attendance % by Student</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={summary.map(s => ({
                    name: s.student?.user?.name?.split(' ')[0] || '?',
                    pct: parseFloat(s.percentage)
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                      formatter={v => [`${v}%`, 'Attendance']} />
                    <Bar dataKey="pct" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 px-5 py-3 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-800/40">
                  <div className="col-span-4">Student</div>
                  <div className="col-span-2 text-center">Days</div>
                  <div className="col-span-2 text-center">Present</div>
                  <div className="col-span-2 text-center">Absent</div>
                  <div className="col-span-2 text-center">%</div>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {summary.map((s, i) => {
                    const pct = parseFloat(s.percentage);
                    return (
                      <div key={i} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-slate-800/20">
                        <div className="col-span-4 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.student?.user?.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm text-white truncate">{s.student?.user?.name || '—'}</span>
                        </div>
                        <div className="col-span-2 text-center text-sm text-slate-300">{s.total}</div>
                        <div className="col-span-2 text-center text-sm text-green-400 font-medium">{s.present}</div>
                        <div className="col-span-2 text-center text-sm text-red-400 font-medium">{s.absent}</div>
                        <div className="col-span-2 text-center">
                          <span className={`text-sm font-bold ${pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                            {pct}%
                          </span>
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
    </div>
  );
}
