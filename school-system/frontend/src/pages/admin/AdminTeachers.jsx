import { useState, useEffect, useCallback } from 'react';
import { teacherAPI, classAPI } from '../../utils/api';
import axios from 'axios';
import {
  Users, Plus, Edit2, X, Loader2, Search, BookOpen,
  Building2, CheckSquare, Square, ChevronDown, ChevronUp, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";
const LABEL = "block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5";

export default function AdminTeachers() {
  const [teachers,   setTeachers]   = useState([]);
  const [classes,    setClasses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [editTeacher,setEditTeacher]= useState(null); // teacher object for edit modal
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name:'', email:'', password:'', phone:'',
    qualification:'', specialization:'', experience:''
  });
  const [editForm, setEditForm] = useState({
    assignedClasses: [], qualification:'', specialization:'', experience:'', classTeacherOf:''
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([teacherAPI.getAll(), classAPI.getAll()]);
      setTeachers(tRes.data || []);
      setClasses(cRes.data || []);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create teacher ────────────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/auth/register', {
        name: form.name, email: form.email,
        password: form.password || 'Teacher@123',
        role: 'teacher', phone: form.phone
      });
      toast.success('Teacher added! Default password: Teacher@123');
      setShowAdd(false);
      setForm({ name:'', email:'', password:'', phone:'', qualification:'', specialization:'', experience:'' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setSubmitting(false); }
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (t) => {
    setEditTeacher(t);
    setEditForm({
      assignedClasses: (t.assignedClasses || []).map(c => String(c._id || c)),
      qualification:   t.qualification   || '',
      specialization:  t.specialization  || '',
      experience:      t.experience      || '',
      classTeacherOf:  t.classTeacherOf  ? String(t.classTeacherOf._id || t.classTeacherOf) : '',
    });
  };

  // ── Save teacher edits ────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      await teacherAPI.update(editTeacher._id, {
        assignedClasses: editForm.assignedClasses,
        qualification:   editForm.qualification,
        specialization:  editForm.specialization,
        experience:      editForm.experience      ? Number(editForm.experience) : undefined,
        classTeacherOf:  editForm.classTeacherOf  || null,
        isClassTeacher:  !!editForm.classTeacherOf,
      });
      toast.success('Teacher updated!');
      setEditTeacher(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || err.message); }
    finally { setSubmitting(false); }
  };

  const toggleClass = (classId) => {
    setEditForm(f => ({
      ...f,
      assignedClasses: f.assignedClasses.includes(classId)
        ? f.assignedClasses.filter(id => id !== classId)
        : [...f.assignedClasses, classId]
    }));
  };

  const filtered = teachers.filter(t =>
    !search ||
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-indigo-400"/> Teachers
          </h1>
          <p className="text-slate-400 text-sm mt-1">{teachers.length} total teachers</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16}/> Add Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No teachers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Name','Employee ID','Qualification','Assigned Classes','Status','Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map(t => (
                  <tr key={t._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {t.user?.name?.charAt(0)||'?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{t.user?.name}</p>
                          <p className="text-xs text-slate-500">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300 font-mono">{t.employeeId}</td>
                    <td className="px-5 py-4 text-sm text-slate-400">{t.qualification||'—'}</td>
                    <td className="px-5 py-4">
                      {(t.assignedClasses?.length || 0) === 0 ? (
                        <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                          No class assigned
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(t.assignedClasses || []).map(c => (
                            <span key={c._id} className="text-xs bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                              {c.name}-{c.section}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-lg ${t.user?.isActive!==false?'bg-green-500/20 text-green-400':'bg-slate-700 text-slate-400'}`}>
                        {t.user?.isActive!==false?'Active':'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => openEdit(t)}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/30 px-3 py-1.5 rounded-lg transition-all">
                        <Edit2 size={12}/> Edit & Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD TEACHER MODAL ─────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="font-display font-semibold text-white">Add Teacher</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className={LABEL}>Full Name *</label><input className={FIELD} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
                <div className="col-span-2"><label className={LABEL}>Email *</label><input type="email" className={FIELD} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
                <div><label className={LABEL}>Phone</label><input className={FIELD} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div><label className={LABEL}>Password</label><input className={FIELD} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Teacher@123"/></div>
                <div><label className={LABEL}>Qualification</label><input className={FIELD} value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})} placeholder="e.g. M.Sc."/></div>
                <div><label className={LABEL}>Experience (yrs)</label><input type="number" className={FIELD} value={form.experience} onChange={e=>setForm({...form,experience:e.target.value})}/></div>
                <div className="col-span-2"><label className={LABEL}>Specialization</label><input className={FIELD} value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} placeholder="e.g. Mathematics"/></div>
              </div>
              <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                💡 After creating, click <strong>Edit & Assign</strong> to assign this teacher to specific classes.
              </div>
              <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                Default password is <strong>Teacher@123</strong> if not specified.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowAdd(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin"/>} Add Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT & ASSIGN MODAL ───────────────────────────────────────────────── */}
      {editTeacher && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div>
                <h3 className="font-display font-semibold text-white">Edit Teacher</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editTeacher.user?.name} · {editTeacher.employeeId}</p>
              </div>
              <button onClick={() => setEditTeacher(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"><X size={18}/></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Profile fields */}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={LABEL}>Qualification</label>
                  <input className={FIELD} value={editForm.qualification} onChange={e=>setEditForm({...editForm,qualification:e.target.value})} placeholder="e.g. M.Sc., B.Ed."/>
                </div>
                <div><label className={LABEL}>Experience (years)</label>
                  <input type="number" className={FIELD} value={editForm.experience} onChange={e=>setEditForm({...editForm,experience:e.target.value})} placeholder="0"/>
                </div>
                <div className="col-span-2"><label className={LABEL}>Specialization</label>
                  <input className={FIELD} value={editForm.specialization} onChange={e=>setEditForm({...editForm,specialization:e.target.value})} placeholder="e.g. Mathematics, Telugu"/>
                </div>
              </div>

              {/* Assign Classes */}
              <div>
                <label className={LABEL}>Assign to Classes <span className="text-indigo-400 normal-case font-normal">(select all that apply)</span></label>
                {classes.length === 0 ? (
                  <p className="text-sm text-slate-500">No classes created yet. Create classes first.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                    {classes.map(c => {
                      const cid = String(c._id);
                      const selected = editForm.assignedClasses.includes(cid);
                      return (
                        <button key={cid} type="button" onClick={() => toggleClass(cid)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                            selected
                              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}>
                          {selected ? <CheckSquare size={14} className="text-indigo-400 flex-shrink-0"/> : <Square size={14} className="flex-shrink-0"/>}
                          <span>{c.name}-{c.section}</span>
                          <span className="text-xs opacity-60 ml-auto">({(c.students||[]).filter(s=>s.user).length})</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Class Teacher Of */}
              <div>
                <label className={LABEL}>Set as Class Teacher of</label>
                <select className={FIELD} value={editForm.classTeacherOf} onChange={e=>setEditForm({...editForm,classTeacherOf:e.target.value})}>
                  <option value="">— Not a Class Teacher —</option>
                  {classes.map(c => (
                    <option key={c._id} value={String(c._id)}>{c.name}-{c.section}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Class teacher will have extra responsibility for this class</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditTeacher(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={handleSaveEdit} disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting ? <><Loader2 size={15} className="animate-spin"/> Saving...</> : <><Save size={15}/> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
