import { useState, useEffect, useCallback } from 'react';
import { classAPI, subjectAPI, teacherAPI } from '../../utils/api';
import { Building2, Plus, Edit, X, Loader2, Users, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

export default function AdminClasses() {
  const [classes,     setClasses]     = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [syncing,     setSyncing]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [form, setForm] = useState({ name:'', section:'A', academicYear:'2024-25', room:'', classTeacher:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([classAPI.getAll(), teacherAPI.getAll()]);
      setClasses(cRes.data || []);
      setTeachers(tRes.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setEditItem(null); setForm({ name:'', section:'A', academicYear:'2024-25', room:'', classTeacher:'' }); setShowModal(true); };
  const openEdit = (c) => {
    setEditItem(c);
    setForm({ name: c.name, section: c.section, academicYear: c.academicYear||'2024-25', room: c.room||'', classTeacher: c.classTeacher?._id||'' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem) await classAPI.update(editItem._id, form);
      else await classAPI.create(form);
      toast.success(editItem ? 'Class updated!' : 'Class created!');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  // Repair: sync all students into their class's students[] array
  const handleSync = async () => {
    if (!window.confirm('This will re-sync all students into their assigned classes. This fixes missing students in teacher dashboards. Continue?')) return;
    setSyncing(true);
    try {
      const res = await classAPI.sync();
      toast.success(res.message || 'Sync complete!');
      load(); // reload to show updated counts
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed');
    } finally { setSyncing(false); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Building2 size={24} className="text-indigo-400"/> Classes
          </h1>
          <p className="text-slate-400 text-sm mt-1">{classes.length} classes configured</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing}
            className="flex items-center gap-2 bg-emerald-700/80 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            title="Fix: sync all students into their assigned class">
            {syncing ? <Loader2 size={15} className="animate-spin"/> : <RefreshCw size={15}/>}
            Sync Students
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
            <Plus size={16}/> Add Class
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3.5 bg-blue-500/8 border border-blue-500/20 rounded-xl text-xs text-blue-300">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
        <span>If students aren't showing in teacher dashboards, click <strong>Sync Students</strong> to repair the data. This is needed once for students added before this fix.</span>
      </div>

      {/* Class grid */}
      {loading ? (
        <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c._id} className="bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-white">{c.name} – {c.section}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{c.academicYear}</p>
                </div>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                  <Edit size={14}/>
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-indigo-400"/>
                  <span>{c.students?.length || 0} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={12} className="text-purple-400"/>
                  <span>{c.subjects?.length || 0} subjects</span>
                </div>
                {c.classTeacher?.user?.name && (
                  <div className="flex items-center gap-2">
                    <span>👤</span>
                    <span className="text-emerald-400">{c.classTeacher.user.name}</span>
                  </div>
                )}
                {!c.classTeacher && (
                  <div className="text-amber-500/80">No teacher assigned</div>
                )}
                {c.room && <div className="flex items-center gap-2"><span>🚪</span><span>{c.room}</span></div>}
              </div>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-3 bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
              <Building2 size={40} className="text-slate-600 mx-auto mb-3"/>
              <p className="text-slate-400">No classes yet. Add your first class!</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="font-display font-semibold text-white">{editItem ? 'Edit Class' : 'Add Class'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Class Name *</label>
                  <input className={FIELD} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Class 10" required/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Section</label>
                  <input className={FIELD} value={form.section} onChange={e=>setForm({...form,section:e.target.value})} placeholder="A"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Academic Year</label>
                  <input className={FIELD} value={form.academicYear} onChange={e=>setForm({...form,academicYear:e.target.value})} placeholder="2024-25"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Room</label>
                  <input className={FIELD} value={form.room} onChange={e=>setForm({...form,room:e.target.value})} placeholder="Room 101"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Class Teacher</label>
                  <select className={FIELD} value={form.classTeacher} onChange={e=>setForm({...form,classTeacher:e.target.value})}>
                    <option value="">— No teacher assigned —</option>
                    {teachers.map(t => (
                      <option key={t._id} value={t._id}>{t.user?.name} {t.qualification ? `(${t.qualification})` : ''}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Assigning a teacher here will add this class to their dashboard automatically.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin"/>}
                  {editItem ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
