import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../utils/api';
import { ClipboardList, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  present: { dot: 'bg-green-400',  ring: 'ring-green-500/40',  text: 'text-green-400',  bg: 'bg-green-500/10' },
  absent:  { dot: 'bg-red-400',    ring: 'ring-red-500/40',    text: 'text-red-400',    bg: 'bg-red-500/10' },
  late:    { dot: 'bg-amber-400',  ring: 'ring-amber-500/40',  text: 'text-amber-400',  bg: 'bg-amber-500/10' },
  excused: { dot: 'bg-blue-400',   ring: 'ring-blue-500/40',   text: 'text-blue-400',   bg: 'bg-blue-500/10' },
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function StudentAttendance() {
  const { user }  = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ total:0, present:0, absent:0, late:0, percentage:'0' });
  const [month,   setMonth]   = useState(new Date().getMonth() + 1);
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [trend,   setTrend]   = useState([]);

  const sid = user?.studentProfile
    ? (typeof user.studentProfile === 'object' ? user.studentProfile._id : user.studentProfile)
    : null;

  const load = useCallback(async () => {
    if (!sid) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await studentAPI.getAttendance(sid, { month, year });
      const d   = res.data || {};
      setRecords(d.records || []);
      setSummary(d.summary || { total:0, present:0, absent:0, late:0, percentage:'0' });
    } catch { toast.error('Failed to load attendance'); }
    finally  { setLoading(false); }
  }, [sid, month, year]);

  const loadTrend = useCallback(async () => {
    if (!sid) return;
    const data = [];
    for (let i = 5; i >= 0; i--) {
      let m = new Date().getMonth() + 1 - i, y = new Date().getFullYear();
      if (m <= 0) { m += 12; y -= 1; }
      try {
        const res = await studentAPI.getAttendance(sid, { month: m, year: y });
        data.push({ month: MONTHS[m-1].slice(0,3), pct: parseFloat(res.data?.summary?.percentage || 0) });
      } catch { data.push({ month: MONTHS[m-1].slice(0,3), pct: 0 }); }
    }
    setTrend(data);
  }, [sid]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTrend(); }, [loadTrend]);

  const firstDay    = new Date(year, month-1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const recordMap   = records.reduce((acc, r) => { acc[new Date(r.date).getDate()] = r.status; return acc; }, {});

  const navigate = (dir) => {
    let m = month + dir, y = year;
    if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  };

  const pct = parseFloat(summary.percentage);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <ClipboardList size={24} className="text-indigo-400" /> My Attendance
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track your daily attendance calendar and monthly trends</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Attendance %',     value:`${summary.percentage}%`, icon:TrendingUp,  bg:'bg-emerald-600', warn: pct < 75 },
          { label:'Days Present',     value:summary.present,           icon:CheckCircle2, bg:'bg-green-600' },
          { label:'Days Absent',      value:summary.absent,            icon:XCircle,      bg:'bg-red-600' },
          { label:'Late / Excused',   value:(summary.late||0),         icon:Clock,        bg:'bg-amber-600' },
        ].map(({ label, value, icon: Icon, bg, warn }) => (
          <div key={label} className={`bg-slate-900 border rounded-2xl p-4 ${warn ? 'border-amber-500/40' : 'border-slate-700/50'}`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}><Icon size={16} className="text-white" /></div>
            <p className="text-xl font-display font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            {warn && <p className="text-xs text-amber-400 mt-1">⚠ Below 75% minimum</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"><ChevronLeft size={16}/></button>
            <h3 className="font-display font-semibold text-white">{MONTHS[month-1]} {year}</h3>
            <button onClick={() => navigate(1)} disabled={year===new Date().getFullYear()&&month>=new Date().getMonth()+1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-40"><ChevronRight size={16}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-slate-500 py-1">{d}</div>)}
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-indigo-400"/></div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`}/>)}
              {Array.from({length:daysInMonth},(_,i)=>i+1).map(day => {
                const status = recordMap[day];
                const cfg    = status ? STATUS_COLOR[status] : null;
                const isToday = day===new Date().getDate() && month===new Date().getMonth()+1 && year===new Date().getFullYear();
                return (
                  <div key={day}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all
                      ${cfg ? `${cfg.bg} ring-1 ${cfg.ring} ${cfg.text}` : 'text-slate-500 hover:bg-slate-800'}
                      ${isToday ? 'ring-2 ring-indigo-500 !text-white font-bold' : ''}`}>
                    <span>{day}</span>
                    {status && <span className={`w-1 h-1 rounded-full mt-0.5 ${cfg.dot}`}/>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800">
            {[['present','Present','bg-green-400'],['absent','Absent','bg-red-400'],['late','Late','bg-amber-400'],['excused','Excused','bg-blue-400']].map(([,label,c]) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400"><div className={`w-2 h-2 rounded-full ${c}`}/>{label}</div>
            ))}
          </div>
        </div>

        {/* Trend + Status */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-1">6-Month Trend</h3>
            <p className="text-xs text-slate-500 mb-4">Monthly attendance percentage</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={trend} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:10}}/>
                <YAxis domain={[0,100]} tick={{fill:'#64748b',fontSize:10}} unit="%"/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}} formatter={v=>[`${v}%`,'Attendance']}/>
                <Bar dataKey="pct" radius={[4,4,0,0]}>
                  {trend.map((e,i) => <Cell key={i} fill={e.pct>=75?'#22c55e':e.pct>=50?'#f59e0b':'#ef4444'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={`p-4 rounded-2xl border text-sm font-medium flex items-start gap-3 ${
            pct>=75 ? 'bg-green-500/8 border-green-500/20 text-green-300'
            : pct>=50 ? 'bg-amber-500/8 border-amber-500/20 text-amber-300'
            : 'bg-red-500/8 border-red-500/20 text-red-300'}`}>
            {pct>=75 ? <CheckCircle2 size={18}/> : <AlertTriangle size={18}/>}
            <div>
              <p className="font-semibold">{pct>=75?'Good Standing':pct>=50?'Needs Improvement':'Critical Alert'}</p>
              <p className="text-xs mt-0.5 opacity-80">{pct>=75?'Maintain above 75% to stay eligible.':pct>=50?'Try to attend more classes.':'Contact your teacher immediately.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <h3 className="font-display font-semibold text-white flex items-center gap-2"><Calendar size={16} className="text-indigo-400"/>Daily Records — {MONTHS[month-1]} {year}</h3>
          <span className="text-xs text-slate-500">{records.length} records</span>
        </div>
        {loading ? (
          <div className="p-8 text-center"><Loader2 size={20} className="animate-spin text-indigo-400 mx-auto"/></div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No attendance records for this month</div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
            {records.map((r,i) => {
              const cfg = STATUS_COLOR[r.status] || STATUS_COLOR.present;
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`}/>
                    <span className="text-sm text-white">{new Date(r.date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</span>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${cfg.bg} ${cfg.text}`}>{r.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
