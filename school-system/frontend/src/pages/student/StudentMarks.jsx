import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../utils/api';
import { Award, TrendingUp, TrendingDown, BookOpen, Loader2, Download } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import toast from 'react-hot-toast';

const GRADE_CONFIG = {
  'A+': { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  'A':  { color: 'text-green-400',   bg: 'bg-green-500/15 border-green-500/30' },
  'B+': { color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30' },
  'B':  { color: 'text-indigo-400',  bg: 'bg-indigo-500/15 border-indigo-500/30' },
  'C':  { color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30' },
  'D':  { color: 'text-orange-400',  bg: 'bg-orange-500/15 border-orange-500/30' },
  'F':  { color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30' },
};

const EXAM_TYPES = ['all','unit1','unit2','midterm','final','assignment','practical'];

const getGrade = (obtained, max) => {
  const p = (obtained / max) * 100;
  if (p >= 90) return 'A+'; if (p >= 80) return 'A'; if (p >= 70) return 'B+';
  if (p >= 60) return 'B';  if (p >= 50) return 'C'; if (p >= 35) return 'D'; return 'F';
};

export default function StudentMarks() {
  const { user }      = useAuth();
  const [loading, setLoading]     = useState(true);
  const [marks, setMarks]         = useState([]);
  const [examFilter, setExamFilter] = useState('all');
  const [view, setView]           = useState('cards'); // 'cards' | 'table'

  const sid = user?.studentProfile
    ? (typeof user.studentProfile === 'object' ? user.studentProfile._id : user.studentProfile)
    : null;

  useEffect(() => {
    if (!sid) { setLoading(false); return; }
    studentAPI.getMarks(sid)
      .then(res => setMarks(res.data || []))
      .catch(() => toast.error('Failed to load marks'))
      .finally(() => setLoading(false));
  }, [sid]);

  const filtered = examFilter === 'all' ? marks : marks.filter(m => m.examType === examFilter);

  // Group by subject for best score per subject
  const bySubject = marks.reduce((acc, m) => {
    const name = m.subject?.name || 'Unknown';
    const pct  = Math.round((m.marksObtained / m.maxMarks) * 100);
    if (!acc[name] || pct > acc[name].pct) acc[name] = { pct, ...m };
    return acc;
  }, {});

  const subjectData  = Object.entries(bySubject).map(([name, d]) => ({ subject: name.slice(0, 7), pct: d.pct }));
  const radarData    = subjectData.map(s => ({ subject: s.subject, A: s.pct, fullMark: 100 }));
  const avgPct       = marks.length > 0 ? Math.round(marks.reduce((s, m) => s + (m.marksObtained/m.maxMarks)*100, 0) / marks.length) : 0;
  const bestSubject  = subjectData.reduce((best, s) => (!best || s.pct > best.pct ? s : best), null);
  const worstSubject = subjectData.reduce((worst, s) => (!worst || s.pct < worst.pct ? s : worst), null);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Award size={24} className="text-indigo-400"/> Marks & Grades
          </h1>
          <p className="text-slate-400 text-sm mt-1">Subject-wise performance and grade analysis</p>
        </div>
        <button className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl transition-colors" onClick={() => window.print()}>
          <Download size={14}/> Report Card
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Overall Average', value:`${avgPct}%`,    bg:'bg-indigo-600' },
          { label:'Total Records',   value:marks.length,    bg:'bg-purple-600' },
          { label:'Best Subject',    value:bestSubject?.subject||'—',  bg:'bg-green-600' },
          { label:'Needs Attention', value:worstSubject?.subject||'—', bg:'bg-amber-600' },
        ].map(({label,value,bg}) => (
          <div key={label} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-4">
            <div className={`w-2 h-8 ${bg} rounded-full mb-3`}/>
            <p className="text-lg font-display font-bold text-white truncate">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {!loading && subjectData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Subject Scores (Best per Subject)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="subject" tick={{fill:'#64748b',fontSize:10}}/>
                <YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:10}} unit="%"/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}} formatter={v=>[`${v}%`,'Score']}/>
                <Bar dataKey="pct" radius={[6,6,0,0]}>
                  {subjectData.map((e,i) => <Cell key={i} fill={e.pct>=75?'#6366f1':e.pct>=50?'#f59e0b':'#ef4444'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b"/>
                <PolarAngleAxis dataKey="subject" tick={{fill:'#64748b',fontSize:10}}/>
                <Radar name="Score" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2}/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EXAM_TYPES.map(t => (
          <button key={t} onClick={() => setExamFilter(t)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all capitalize ${examFilter===t?'bg-indigo-600 text-white':'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
            {t === 'all' ? 'All Exams' : t.replace('unit','Unit ').replace('midterm','Mid-Term').replace('final','Final').replace('assignment','Assignment').replace('practical','Practical')}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {['cards','table'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${view===v?'bg-slate-700 text-white':'bg-slate-800 text-slate-500 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Marks Display */}
      {loading ? (
        <div className="p-12 text-center"><Loader2 size={24} className="animate-spin text-indigo-400 mx-auto"/></div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
          <BookOpen size={40} className="text-slate-600 mx-auto mb-3"/>
          <p className="text-slate-400">No marks found for this filter</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, i) => {
            const pct   = Math.round((m.marksObtained / m.maxMarks) * 100);
            const grade = m.grade || getGrade(m.marksObtained, m.maxMarks);
            const gcfg  = GRADE_CONFIG[grade] || GRADE_CONFIG['D'];
            return (
              <div key={i} className="bg-slate-900 border border-slate-700/50 hover:border-slate-600 rounded-2xl p-5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white text-sm">{m.subject?.name || 'Subject'}</p>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">{m.examType?.replace('unit','Unit ').replace('midterm','Mid-Term').replace('final','Final')}</p>
                  </div>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${gcfg.bg} ${gcfg.color}`}>{grade}</span>
                </div>
                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                    <span>{m.marksObtained} / {m.maxMarks} marks</span>
                    <span className={pct>=75?'text-green-400':pct>=50?'text-amber-400':'text-red-400'}>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${pct>=75?'bg-green-500':pct>=50?'bg-amber-500':'bg-red-500'}`} style={{width:`${pct}%`}}/>
                  </div>
                </div>
                {m.remarks && <p className="text-xs text-slate-500 italic">"{m.remarks}"</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Subject','Exam Type','Marks','Max','%','Grade','Remarks'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((m,i) => {
                  const pct = Math.round((m.marksObtained/m.maxMarks)*100);
                  const g   = m.grade || getGrade(m.marksObtained,m.maxMarks);
                  const gcfg = GRADE_CONFIG[g] || GRADE_CONFIG['D'];
                  return (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 text-sm font-medium text-white">{m.subject?.name||'—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-400 capitalize">{m.examType}</td>
                      <td className="px-5 py-3 text-sm text-white font-semibold">{m.marksObtained}</td>
                      <td className="px-5 py-3 text-sm text-slate-400">{m.maxMarks}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium ${pct>=75?'text-green-400':pct>=50?'text-amber-400':'text-red-400'}`}>{pct}%</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${gcfg.bg} ${gcfg.color}`}>{g}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 max-w-[120px] truncate">{m.remarks||'—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
