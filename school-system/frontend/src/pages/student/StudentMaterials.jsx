import { useState, useEffect, useCallback } from 'react';
import { materialAPI, subjectAPI } from '../../utils/api';
import { BookOpen, Download, Search, FileText, File, Image, Loader2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const EXT_ICON = (type = '') => {
  if (type.includes('pdf'))   return { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/15' };
  if (type.includes('image')) return { icon: Image,    color: 'text-blue-400', bg: 'bg-blue-500/15' };
  return { icon: File, color: 'text-slate-400', bg: 'bg-slate-700' };
};

const fmtSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
};

export default function StudentMaterials() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (subjectFilter !== 'all') params.subjectId = subjectFilter;
      const [mRes, sRes] = await Promise.all([materialAPI.getAll(params), subjectAPI.getAll()]);
      setMaterials(mRes.data || []);
      setSubjects(sRes.data || []);
    } catch { toast.error('Failed to load materials'); }
    finally { setLoading(false); }
  }, [subjectFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = materials.filter(m =>
    !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (m) => {
    const url = `${window.location.origin}/${m.filePath?.replace(/\\/g,'/')}`;
    const a   = document.createElement('a');
    a.href = url; a.download = m.fileName || m.title; a.click();
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BookOpen size={24} className="text-indigo-400"/> Study Materials
        </h1>
        <p className="text-slate-400 text-sm mt-1">Download notes, PDFs and resources uploaded by your teachers</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 flex-shrink-0"/>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-900 border border-slate-700/50 rounded-xl px-4 py-2.5">
        <span>{filtered.length} materials found</span>
        {subjectFilter !== 'all' && <span>· filtered by subject</span>}
        {search && <span>· search: "{search}"</span>}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <BookOpen size={40} className="text-slate-600 mx-auto mb-3"/>
          <p className="text-slate-400 font-medium">No materials found</p>
          <p className="text-slate-500 text-sm mt-1">Your teacher hasn't uploaded any materials yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => {
            const { icon: FIcon, color, bg } = EXT_ICON(m.fileType);
            return (
              <div key={i} className="group bg-slate-900 border border-slate-700/50 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-indigo-900/10">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <FIcon size={18} className={color}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">{m.title}</h3>
                    {m.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  {m.subject?.name && <span className="bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/30">{m.subject.name}</span>}
                  {m.fileSize && <span>{fmtSize(m.fileSize)}</span>}
                  <span>·</span>
                  <span>{format(new Date(m.createdAt), 'dd MMM yyyy')}</span>
                </div>
                <button onClick={() => handleDownload(m)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 rounded-xl transition-all group-hover:shadow-md">
                  <Download size={14}/> Download
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
