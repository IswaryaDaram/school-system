import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI } from '../../utils/api';
import { BookMarked, Clock, CheckCircle2, AlertTriangle, Upload, X, Loader2, Calendar, FileText } from 'lucide-react';
import { formatDistanceToNow, isPast, format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_PILL = {
  pending:   'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  submitted: 'bg-green-500/15 text-green-400 border border-green-500/30',
  graded:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  late:      'bg-red-500/15 text-red-400 border border-red-500/30',
};

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [filter, setFilter]    = useState('all'); // 'all'|'pending'|'submitted'
  const [submitModal, setSubmitModal] = useState(null);
  const [files, setFiles]      = useState([]);
  const [remarks, setRemarks]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const studentProfile = user?.studentProfile;
      const classId = typeof studentProfile === 'object' ? studentProfile?.class : null;
      const res = await assignmentAPI.getAll(classId ? { classId } : {});
      setAssignments(res.data || []);
    } catch { toast.error('Failed to load assignments'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) return toast.error('Please attach at least one file.');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('assignmentId', submitModal._id);
      fd.append('remarks', remarks);
      files.forEach(f => fd.append('files', f));
      await assignmentAPI.submit(fd);
      toast.success('Assignment submitted!');
      setSubmitModal(null); setFiles([]); setRemarks(''); load();
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const filtered = filter === 'all' ? assignments
    : filter === 'pending' ? assignments.filter(a => !isPast(new Date(a.deadline)))
    : assignments.filter(a => isPast(new Date(a.deadline)));

  const overdue   = assignments.filter(a => isPast(new Date(a.deadline))).length;
  const upcoming  = assignments.filter(a => !isPast(new Date(a.deadline))).length;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BookMarked size={24} className="text-indigo-400"/> Assignments
        </h1>
        <p className="text-slate-400 text-sm mt-1">View and submit your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:'Total',    value:assignments.length, bg:'bg-indigo-600' },
          { label:'Upcoming', value:upcoming,           bg:'bg-green-600' },
          { label:'Overdue',  value:overdue,            bg:'bg-red-600', warn:overdue>0 },
        ].map(({label,value,bg,warn}) => (
          <div key={label} className={`bg-slate-900 border rounded-2xl p-4 ${warn?'border-red-500/40':'border-slate-700/50'}`}>
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}><BookMarked size={14} className="text-white"/></div>
            <p className="text-xl font-display font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[['all','All'],['pending','Upcoming'],['overdue','Past Deadline']].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter===v?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Assignment Cards */}
      {loading ? (
        <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <BookMarked size={40} className="text-slate-600 mx-auto mb-3"/>
          <p className="text-slate-400">No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const isOverdue = isPast(new Date(a.deadline));
            const daysLeft  = formatDistanceToNow(new Date(a.deadline), { addSuffix: true });
            return (
              <div key={a._id} className={`bg-slate-900 border rounded-2xl p-5 hover:border-slate-600 transition-all ${isOverdue?'border-red-500/20':'border-slate-700/50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{a.title}</h3>
                      {isOverdue
                        ? <span className="text-xs px-2 py-0.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">Past Due</span>
                        : <span className="text-xs px-2 py-0.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30">Open</span>}
                    </div>
                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">{a.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1"><BookMarked size={12}/> {a.subject?.name||'—'}</span>
                      <span className="flex items-center gap-1"><Calendar size={12}/> Due: {format(new Date(a.deadline),'dd MMM yyyy')}</span>
                      <span className={`flex items-center gap-1 ${isOverdue?'text-red-400':'text-amber-400'}`}>
                        <Clock size={12}/> {daysLeft}
                      </span>
                      <span className="flex items-center gap-1"><FileText size={12}/> Max: {a.maxMarks} marks</span>
                    </div>
                  </div>
                  <button onClick={() => { setSubmitModal(a); setFiles([]); setRemarks(''); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-xl font-medium transition-all flex-shrink-0">
                    <Upload size={13}/> Submit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      {submitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <div>
                <h3 className="font-display font-semibold text-white">Submit Assignment</h3>
                <p className="text-xs text-slate-400 mt-0.5">{submitModal.title}</p>
              </div>
              <button onClick={() => setSubmitModal(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Upload Files *</label>
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${files.length>0?'border-indigo-500/50 bg-indigo-500/5':'border-slate-700 hover:border-slate-600'}`}>
                  <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} className="hidden" id="asgn-files"/>
                  <label htmlFor="asgn-files" className="cursor-pointer">
                    <Upload size={24} className="text-slate-400 mx-auto mb-2"/>
                    {files.length > 0
                      ? <p className="text-sm text-indigo-400">{files.length} file(s) selected</p>
                      : <p className="text-sm text-slate-400">Click to select files (PDF, DOC, images)</p>}
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f,i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-slate-800 px-3 py-2 rounded-lg">
                        <span className="text-slate-300 truncate">{f.name}</span>
                        <button type="button" onClick={() => setFiles(prev => prev.filter((_,j)=>j!==i))} className="text-slate-500 hover:text-red-400 ml-2"><X size={12}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Remarks (optional)</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  placeholder="Any notes for your teacher..."/>
              </div>
              {isPast(new Date(submitModal.deadline)) && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  <AlertTriangle size={13}/> This is a late submission
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setSubmitModal(null)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-colors">
                  {submitting && <Loader2 size={15} className="animate-spin"/>}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
