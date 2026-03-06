import { useState, useEffect } from 'react';
import { studentAPI, classAPI } from '../../utils/api';
import {
  Plus, Search, Edit, Trash2, X, Loader2, GraduationCap,
  AlertTriangle, AlertCircle, CheckCircle2, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-slate-700">
        <h3 className="font-display font-semibold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18}/></button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const INPUT = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";

export default function AdminStudents() {
  const [students,      setStudents]      = useState([]);
  const [classes,       setClasses]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [editStudent,   setEditStudent]   = useState(null);
  const [submitting,    setSubmitting]    = useState(false);

  // Email-reuse confirmation state
  const [emailConflict, setEmailConflict] = useState(null); // { message, previousName, previousArchived, pendingForm }

  const [form, setForm] = useState({
    name: '', email: '', password: '', rollNumber: '', classId: '',
    section: 'A', gender: 'male', parentName: '', parentPhone: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        studentAPI.getAll({ search, limit: 50 }),
        classAPI.getAll()
      ]);
      setStudents(sRes.data || []);
      setClasses(cRes.data || []);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const openAdd = () => {
    setEditStudent(null);
    setForm({ name:'', email:'', password:'', rollNumber:'', classId:'', section:'A', gender:'male', parentName:'', parentPhone:'' });
    setEmailConflict(null);
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditStudent(s);
    setForm({ name: s.user?.name||'', rollNumber: s.rollNumber||'', classId: s.class?._id||'', section: s.section||'A', gender: s.gender||'male', parentName: s.parentName||'', parentPhone: s.parentPhone||'' });
    setEmailConflict(null);
    setShowModal(true);
  };

  // Core submit — optionally with forceReuseEmail flag
  const doSubmit = async (formData, forceReuseEmail = false) => {
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (forceReuseEmail) payload.forceReuseEmail = true;

      if (editStudent) {
        await studentAPI.update(editStudent._id, payload);
        toast.success('Student updated!');
      } else {
        await studentAPI.create(payload);
        toast.success('Student added!');
      }

      setShowModal(false);
      setEmailConflict(null);
      load();
    } catch (err) {
      // 409 = email conflict needs admin decision
      if (err.status === 409 || err.code === 'EMAIL_REUSE_CONFIRM') {
        setEmailConflict({
          message:          err.message,
          previousName:     err.previousName,
          previousArchived: err.previousArchived,
          pendingForm:      formData,
        });
      } else {
        toast.error(err.message || 'Failed to save student');
      }
    } finally { setSubmitting(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSubmit(form);
  };

  // Admin clicks "Yes, reuse email"
  const confirmEmailReuse = () => {
    doSubmit(emailConflict.pendingForm, true);
    setEmailConflict(null);
  };

  const handleDelete = async (id, studentName) => {
    if (!window.confirm(`Delete "${studentName}"?\n\nThis will permanently remove the student and free their email for reuse. Their attendance and marks history will also be lost.`)) return;
    try {
      await studentAPI.delete(id);
      toast.success('Student deleted. Their email can now be reused.');
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <GraduationCap size={24} className="text-indigo-400"/> Students
          </h1>
          <p className="text-slate-400 text-sm mt-1">{students.length} total students</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16}/> Add Student
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"/>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No students found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Name','Roll No.','Class','Parent','Status','Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{s.user?.name}</p>
                          <p className="text-xs text-slate-500">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-300 font-mono">{s.rollNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">
                      {s.class?.name ? `${s.class.name}${s.section ? ` (${s.section})` : ''}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400">{s.parentName || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-lg ${s.isArchived ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {s.isArchived ? 'TC Archived' : 'Active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-indigo-400 transition-colors p-1"><Edit size={15}/></button>
                        <button onClick={() => handleDelete(s._id, s.user?.name)} className="text-slate-400 hover:text-red-400 transition-colors p-1"><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EMAIL REUSE CONFIRMATION DIALOG ─────────────────────────────────── */}
      {emailConflict && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-slate-700/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-amber-400"/>
              </div>
              <div>
                <h3 className="font-semibold text-white">Email Already Used</h3>
                <p className="text-xs text-slate-400 mt-0.5">Admin decision required</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <p className="text-sm text-amber-200 leading-relaxed">{emailConflict.message}</p>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p className="font-medium text-white">What happens if you proceed:</p>
                <ul className="space-y-1.5 text-slate-400 text-xs">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-green-400 flex-shrink-0 mt-0.5"/>
                    The email will be assigned to the new student "{emailConflict.pendingForm?.name}"
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-green-400 flex-shrink-0 mt-0.5"/>
                    The previous student's old record will be fully cleaned up
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle size={13} className="text-amber-400 flex-shrink-0 mt-0.5"/>
                    The previous user "{emailConflict.previousName}" will no longer be able to log in with this email
                  </li>
                  {emailConflict.previousArchived && (
                    <li className="flex items-start gap-2">
                      <AlertCircle size={13} className="text-blue-400 flex-shrink-0 mt-0.5"/>
                      Previous student had a TC issued — their record was already archived
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setEmailConflict(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancel — Use Different Email
                </button>
                <button
                  onClick={confirmEmailReuse}
                  disabled={submitting}
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                  {submitting ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
                  Yes, Reuse This Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────────────────── */}
      {showModal && (
        <Modal title={editStudent ? 'Edit Student' : 'Add Student'} onClose={() => { setShowModal(false); setEmailConflict(null); }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                <input className={INPUT} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required/>
              </div>

              {!editStudent && (
                <>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                    <input type="email" className={INPUT} value={form.email} onChange={e => setForm({...form, email: e.target.value})} required/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Password <span className="text-slate-500 font-normal">(default: School@123)</span></label>
                    <input className={INPUT} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="School@123"/>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Roll Number *</label>
                <input className={INPUT} value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} required/>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Section</label>
                <input className={INPUT} value={form.section} onChange={e => setForm({...form, section: e.target.value})}/>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Class</label>
                <select className={INPUT} value={form.classId} onChange={e => setForm({...form, classId: e.target.value})}>
                  <option value="">— Select class —</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                <select className={INPUT} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Parent Name</label>
                <input className={INPUT} value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})}/>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Parent Phone</label>
                <input className={INPUT} value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})}/>
              </div>
            </div>

            {/* Show inline warning if there was a previous conflict attempt */}
            {emailConflict && (
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                <AlertTriangle size={13} className="flex-shrink-0 mt-0.5"/>
                Email conflict detected — see the confirmation dialog above.
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-70 mt-4 transition-colors">
              {submitting && <Loader2 size={16} className="animate-spin"/>}
              {editStudent ? 'Save Changes' : 'Add Student'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
