import { useState, useEffect, useCallback } from 'react';
import { materialAPI, subjectAPI, classAPI } from '../../utils/api';
import { Upload, BookOpen, Trash2, X, Loader2, File, FileText, Image, Download, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const FIELD = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm";
const fmtSize = b => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;
const getFileIcon = (type = '') => type.includes('pdf')   ? { icon: FileText, color: 'text-red-400',   bg: 'bg-red-500/15' }
                                 : type.includes('image') ? { icon: Image,    color: 'text-blue-400',  bg: 'bg-blue-500/15' }
                                 :                          { icon: File,     color: 'text-slate-400', bg: 'bg-slate-700' };

export default function TeacherMaterials() {
  const [materials,   setMaterials]   = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [deleting,    setDeleting]    = useState(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', classId: '', file: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, sRes, cRes] = await Promise.all([materialAPI.getAll(), subjectAPI.getAll(), classAPI.getAll()]);
      setMaterials(mRes.data || []);
      setAllSubjects(sRes.data || []);
      setSubjects(sRes.data || []);
      setClasses(cRes.data || []);
    } catch { toast.error('Failed to load materials'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClassChange = (classId) => {
    setForm(f => ({ ...f, classId, subjectId: '' }));
    if (classId) {
      const cls = classes.find(c => c._id === classId);
      const classSubjectIds = (cls?.subjects || []).map(s => s._id || s);
      const filtered = allSubjects.filter(s => classSubjectIds.includes(s._id));
      setSubjects(filtered.length > 0 ? filtered : allSubjects);
    } else {
      setSubjects(allSubjects);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Please enter a title');
    if (!form.file)         return toast.error('Please select a file to upload');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title);
      fd.append('description', form.description);
      fd.append('subjectId',   form.subjectId);
      fd.append('classId',     form.classId);
      fd.append('file',        form.file);
      await materialAPI.upload(fd);
      toast.success('Material uploaded successfully!');
      setShowModal(false);
      setForm({ title: '', description: '', subjectId: '', classId: '', file: null });
      setSubjects(allSubjects);
      load();
    } catch (err) { toast.error(err.message || 'Upload failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material? Students will no longer be able to access it.')) return;
    setDeleting(id);
    try {
      await materialAPI.delete(id);
      toast.success('Material deleted.');
      setMaterials(prev => prev.filter(m => m._id !== id));
    } catch (err) { toast.error(err.message || 'Delete failed'); }
    finally { setDeleting(null); }
  };

  const handleDownload = async (m) => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(materialAPI.download(m._id), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Download failed');
      const blob  = await res.blob();
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = m.fileName || m.title;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed. Please try again.'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-400" /> Study Materials
          </h1>
          <p className="text-slate-400 text-sm mt-1">{materials.length} materials uploaded</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Upload size={16} /> Upload Material
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto" /></div>
      ) : materials.length === 0 ? (
        <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-16 text-center">
          <Upload size={48} className="text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">No materials uploaded yet</p>
          <p className="text-slate-500 text-sm mt-1">Upload notes, PDFs or resources for your students</p>
          <button onClick={() => setShowModal(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => {
            const { icon: FIcon, color, bg } = getFileIcon(m.fileType);
            return (
              <div key={m._id} className="bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 flex flex-col gap-3 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <FIcon size={18} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{m.title}</h3>
                    {m.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{m.description}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {m.subject?.name && <span className="bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30">{m.subject.name}</span>}
                  {m.class?.name  && <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg">{m.class.name} {m.class.section}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{m.fileSize ? fmtSize(m.fileSize) : '—'}</span>
                  <span>{format(new Date(m.createdAt), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDownload(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-2 rounded-xl transition-colors">
                    <Download size={12} /> Download
                  </button>
                  <button onClick={() => handleDelete(m._id)} disabled={deleting === m._id}
                    className="w-9 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors disabled:opacity-40">
                    {deleting === m._id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="font-display font-semibold text-white">Upload Study Material</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Title *</label>
                <input className={FIELD} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 5 - Algebra Notes" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</label>
                <textarea className={`${FIELD} resize-none`} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description for students..." />
              </div>

              {/* Class first, then subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Class</label>
                  {classes.length === 0 ? (
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <AlertCircle size={12} /> No classes
                    </div>
                  ) : (
                    <select className={FIELD} value={form.classId} onChange={e => handleClassChange(e.target.value)}>
                      <option value="">— Select —</option>
                      {classes.map(c => <option key={c._id} value={c._id}>{c.name} – {c.section}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Subject</label>
                  <select className={FIELD} value={form.subjectId} onChange={e => setForm({ ...form, subjectId: e.target.value })} disabled={!form.classId}>
                    <option value="">— {form.classId ? 'Select' : 'Class first'} —</option>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Drag & drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setForm(p => ({ ...p, file: f })); }}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-indigo-500 bg-indigo-500/10' : form.file ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700 hover:border-slate-600'
                }`}>
                <input type="file" id="mat-file" className="hidden"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                  onChange={e => setForm(p => ({ ...p, file: e.target.files[0] }))} />
                <label htmlFor="mat-file" className="cursor-pointer">
                  <Upload size={28} className={`mx-auto mb-2 ${form.file ? 'text-green-400' : 'text-slate-500'}`} />
                  {form.file
                    ? <><p className="text-sm text-green-400 font-medium">{form.file.name}</p><p className="text-xs text-slate-500">{fmtSize(form.file.size)}</p></>
                    : <><p className="text-sm text-slate-400">Drag & drop or click to select</p><p className="text-xs text-slate-500 mt-1">PDF, DOC, PPT, Images — max 10MB</p></>}
                </label>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 size={15} className="animate-spin" />} Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
