import { useState, useEffect, useCallback } from 'react';
import { assignmentAPI, classAPI } from '../../utils/api';
import {
  BookMarked, Plus, Trash2, X, Loader2, Calendar,
  Clock, Users, Eye, FileText, AlertCircle, ChevronDown,
  CheckCircle2, XCircle, User
} from 'lucide-react';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

export default function TeacherAssignments() {
  const [assignments,  setAssignments]  = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [filter,       setFilter]       = useState('all');
  const [expandedId,   setExpandedId]   = useState(null);
  const [submissions,  setSubmissions]  = useState({});  // assignmentId → array
  const [loadingSubs,  setLoadingSubs]  = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', subjectId: '', classId: '', deadline: '', maxMarks: 10
  });

  const classSubjects = form.classId
    ? (classes.find(c => String(c._id) === form.classId)?.subjects || [])
    : [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([assignmentAPI.getAll(), classAPI.getAll()]);
      setAssignments(aRes.data || []);
      setClasses(cRes.data || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClassChange = (classId) => {
    setForm(f => ({ ...f, classId, subjectId: '' }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim())       return toast.error('Title is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.classId)            return toast.error('Please select a class');
    if (!form.subjectId)          return toast.error('Please select a subject');
    if (!form.deadline)           return toast.error('Deadline is required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title);
      fd.append('description', form.description);
      fd.append('subjectId',   form.subjectId);
      fd.append('classId',     form.classId);
      fd.append('deadline',    form.deadline);
      fd.append('maxMarks',    form.maxMarks);
      await assignmentAPI.create(fd);
      toast.success('Assignment created!');
      setShowModal(false);
      setForm({ title: '', description: '', subjectId: '', classId: '', deadline: '', maxMarks: 10 });
      load();
    } catch (err) { toast.error(err.message || 'Failed to create'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await assignmentAPI.delete(id);
      toast.success('Assignment deleted.');
      setAssignments(prev => prev.filter(a => a._id !== id));
    } catch (err) { toast.error(err.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  // Toggle expand + load submissions on first expand
  const toggleExpand = async (assignmentId) => {
    if (expandedId === assignmentId) { setExpandedId(null); return; }
    setExpandedId(assignmentId);
    if (!submissions[assignmentId]) {
      setLoadingSubs(assignmentId);
      try {
        const res = await assignmentAPI.getSubmissions(assignmentId);
        setSubmissions(prev => ({ ...prev, [assignmentId]: res.data || [] }));
      } catch { toast.error('Failed to load submissions'); }
      finally { setLoadingSubs(null); }
    }
  };

  const active   = assignments.filter(a => !isPast(new Date(a.deadline)));
  const closed   = assignments.filter(a =>  isPast(new Date(a.deadline)));
  const filtered = filter === 'active' ? active : filter === 'closed' ? closed : assignments;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <BookMarked size={24} className="text-indigo-400" /> Assignments
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {assignments.length} total · {active.length} active · {closed.length} closed
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16} /> New Assignment
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['all',    `All (${assignments.length})`],
          ['active', `Active (${active.length})`],
          ['closed', `Closed (${closed.length})`],
        ].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === v ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* No classes warning */}
      {!loading && classes.length === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-300">No classes assigned to you yet</p>
            <p className="text-xs text-amber-400/80 mt-0.5">Ask your admin to assign classes to your teacher account. Go to Admin → Teachers → Edit & Assign.</p>
          </div>
        </div>
      )}

      {/* Assignment List */}
      {loading ? (
        <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <BookMarked size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            {filter === 'all' ? 'No assignments yet — create one!' : `No ${filter} assignments`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const overdue  = isPast(new Date(a.deadline));
            const expanded = expandedId === a._id;
            const subs     = submissions[a._id] || [];
            const submittedCount = subs.length;
            const classStudentCount = classes.find(c => String(c._id) === String(a.class?._id))?.students?.filter(s => s.user)?.length || 0;

            return (
              <div key={a._id} className="bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-2xl overflow-hidden transition-all">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="font-semibold text-white text-sm">{a.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                          overdue ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-green-500/15 text-green-400 border-green-500/30'
                        }`}>{overdue ? 'Closed' : 'Active'}</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{a.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><BookMarked size={11} className="text-indigo-400"/>{a.subject?.name || '—'}</span>
                        <span className="flex items-center gap-1"><Users size={11} className="text-blue-400"/>{a.class?.name || '—'} {a.class?.section || ''}</span>
                        <span className="flex items-center gap-1"><Calendar size={11}/>Due: {format(new Date(a.deadline), 'dd MMM yyyy, hh:mm a')}</span>
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-amber-400'}`}>
                          <Clock size={11}/>{formatDistanceToNow(new Date(a.deadline), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1"><FileText size={11}/>Max: {a.maxMarks}</span>
                        {submissions[a._id] !== undefined && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 size={11}/>{submittedCount} submitted {classStudentCount > 0 ? `/ ${classStudentCount}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleExpand(a._id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                        <Eye size={12}/>
                        {loadingSubs === a._id
                          ? <Loader2 size={12} className="animate-spin"/>
                          : <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`}/>}
                      </button>
                      <button onClick={() => handleDelete(a._id)} disabled={deleting === a._id}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-40">
                        {deleting === a._id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded: details + submissions */}
                {expanded && (
                  <div className="border-t border-slate-700/50 bg-slate-800/30 space-y-4 p-5">
                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        ['Class',    `${a.class?.name || '—'} ${a.class?.section || ''}`],
                        ['Subject',  a.subject?.name || '—'],
                        ['Max Marks',a.maxMarks],
                        ['Created',  format(new Date(a.createdAt), 'dd MMM yyyy')],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-slate-900 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                          <p className="text-sm font-medium text-white">{val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-slate-900 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-1">Description</p>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{a.description}</p>
                    </div>

                    {/* Submissions */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users size={12}/> Student Submissions
                        <span className="text-indigo-300 font-normal normal-case">
                          ({submittedCount} of {classStudentCount || '?'} submitted)
                        </span>
                      </h4>
                      {subs.length === 0 ? (
                        <div className="bg-slate-900 rounded-xl p-5 text-center">
                          <XCircle size={24} className="text-slate-600 mx-auto mb-2"/>
                          <p className="text-sm text-slate-500">No submissions yet</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {subs.map(sub => (
                            <div key={sub._id} className="bg-slate-900 rounded-xl p-4 flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {sub.student?.user?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{sub.student?.user?.name || '—'}</p>
                                  <p className="text-xs text-slate-400">
                                    Submitted {sub.submittedAt ? format(new Date(sub.submittedAt), 'dd MMM yyyy, hh:mm a') : '—'}
                                    {sub.isLate && <span className="ml-2 text-amber-400 font-medium">· Late</span>}
                                  </p>
                                  {sub.remarks && <p className="text-xs text-slate-500 mt-0.5 italic">"{sub.remarks}"</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                                  sub.isLate
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                    : 'bg-green-500/15 text-green-400 border border-green-500/30'
                                }`}>
                                  {sub.isLate ? '⏰ Late' : '✓ On time'}
                                </span>
                                {sub.files?.length > 0 && (
                                  <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <FileText size={11}/>{sub.files.length} file{sub.files.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700 sticky top-0 bg-slate-900 z-10">
              <h3 className="font-display font-semibold text-white">New Assignment</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title *</label>
                <input className={FIELD} value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Chapter 3 – Quadratic Equations" required/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description *</label>
                <textarea className={`${FIELD} resize-none`} rows={3} value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Instructions for students..." required/>
              </div>

              {/* Class */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Class *</label>
                {classes.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                    <AlertCircle size={14}/> No classes assigned. Ask admin to assign you a class.
                  </div>
                ) : (
                  <select className={FIELD} value={form.classId} onChange={e => handleClassChange(e.target.value)} required>
                    <option value="">— Select Class —</option>
                    {classes.map(c => (
                      <option key={c._id} value={String(c._id)}>
                        {c.name} – Section {c.section} ({(c.students||[]).filter(s=>s.user).length} students)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Subject *</label>
                {form.classId && classSubjects.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
                    <AlertCircle size={14}/> No subjects assigned to this class. Ask admin.
                  </div>
                ) : (
                  <select className={FIELD} value={form.subjectId} onChange={e => setForm({...form, subjectId: e.target.value})}
                    disabled={!form.classId} required>
                    <option value="">— {form.classId ? 'Select Subject' : 'Select class first'} —</option>
                    {classSubjects.map(s => (
                      <option key={s._id||s} value={String(s._id||s)}>{s.name||s} {s.code?`(${s.code})`:''}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Deadline *</label>
                  <input type="datetime-local" className={FIELD} value={form.deadline}
                    onChange={e => setForm({...form, deadline: e.target.value})}
                    min={new Date().toISOString().slice(0,16)} required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Max Marks</label>
                  <input type="number" className={FIELD} value={form.maxMarks}
                    onChange={e => setForm({...form, maxMarks: e.target.value})} min={1} max={200}/>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin"/>} Create Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
