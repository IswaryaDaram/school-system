import { useState, useEffect, useCallback } from 'react';
import { subjectAPI, classAPI, teacherAPI } from '../../utils/api';
import { BookOpen, Plus, Trash2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses]   = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name:'', code:'', description:'', maxMarks:100, passingMarks:35, teacher:'', class:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, tRes] = await Promise.all([subjectAPI.getAll(), classAPI.getAll(), teacherAPI.getAll()]);
      setSubjects(sRes.data||[]); setClasses(cRes.data||[]); setTeachers(tRes.data||[]);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await subjectAPI.create(form);
      toast.success('Subject created!');
      setShowModal(false);
      setForm({ name:'', code:'', description:'', maxMarks:100, passingMarks:35, teacher:'', class:'' });
      load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject?')) return;
    try { await subjectAPI.delete(id); toast.success('Deleted.'); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2"><BookOpen size={24} className="text-indigo-400"/> Subjects</h1>
          <p className="text-slate-400 text-sm mt-1">{subjects.length} subjects configured</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16}/> Add Subject
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
        ) : subjects.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No subjects yet. Add your first subject!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Subject','Code','Teacher','Class','Max Marks','Pass Marks','Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {subjects.map(s => (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center"><BookOpen size={14} className="text-indigo-400"/></div>
                        <div>
                          <p className="text-sm font-medium text-white">{s.name}</p>
                          {s.description && <p className="text-xs text-slate-500 truncate max-w-[120px]">{s.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">{s.code}</span></td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{s.teacher?.user?.name||'—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{s.class?.name||'—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 font-medium">{s.maxMarks}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{s.passingMarks}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleDelete(s._id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={15}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="font-display font-semibold text-white">Add Subject</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Subject Name *</label><input className={FIELD} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Mathematics" required/></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Code *</label><input className={FIELD} value={form.code} onChange={e=>setForm({...form,code:e.target.value.toUpperCase()})} placeholder="MATH10" required/></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Max Marks</label><input type="number" className={FIELD} value={form.maxMarks} onChange={e=>setForm({...form,maxMarks:e.target.value})}/></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Pass Marks</label><input type="number" className={FIELD} value={form.passingMarks} onChange={e=>setForm({...form,passingMarks:e.target.value})}/></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Assign Teacher</label>
                  <select className={FIELD} value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})}>
                    <option value="">Select...</option>
                    {teachers.map(t => <option key={t._id} value={t._id}>{t.user?.name}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Assign Class</label>
                  <select className={FIELD} value={form.class} onChange={e=>setForm({...form,class:e.target.value})}>
                    <option value="">Select...</option>
                    {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</label><input className={FIELD} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Optional description..."/></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin"/>}
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
