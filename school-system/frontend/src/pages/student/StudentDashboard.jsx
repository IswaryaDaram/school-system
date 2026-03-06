import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { studentAPI, announcementAPI, newsAPI, assignmentAPI } from '../../utils/api';
import {
  TrendingUp, BookOpen, ClipboardList, Bell, Newspaper,
  FileText, AlertCircle, CheckCircle2, Clock, Star,
  ChevronRight, Calendar, Award, BookMarked, ArrowUpRight
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatDistanceToNow, isPast } from 'date-fns';

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sublabel, color, to, trend }) => (
  <Link to={to || '#'}
    className="group bg-slate-900 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-900/20 block">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <ArrowUpRight size={15} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
    </div>
    <p className="text-2xl font-display font-bold text-white">{value ?? '—'}</p>
    <p className="text-xs text-slate-400 mt-1">{label}</p>
    {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
    {trend !== undefined && (
      <div className={`text-xs mt-1.5 font-medium ${trend >= 75 ? 'text-green-400' : trend >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
        {trend >= 75 ? '✓ Good standing' : trend >= 50 ? '⚠ Needs attention' : '✗ At risk'}
      </div>
    )}
  </Link>
);

const GradeColor = (pct) => {
  if (pct >= 90) return 'text-emerald-400';
  if (pct >= 75) return 'text-green-400';
  if (pct >= 60) return 'text-blue-400';
  if (pct >= 35) return 'text-amber-400';
  return 'text-red-400';
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({ summary: { percentage: 0, present: 0, absent: 0, total: 0 }, records: [] });
  const [marks, setMarks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [topNews, setTopNews] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!user?.studentProfile) { setLoading(false); return; }
      const sid = typeof user.studentProfile === 'object' ? user.studentProfile._id : user.studentProfile;
      try {
        const [attRes, marksRes, annRes, newsRes] = await Promise.all([
          studentAPI.getAttendance(sid, { month: new Date().getMonth() + 1, year: new Date().getFullYear() }),
          studentAPI.getMarks(sid),
          announcementAPI.getAll(),
          newsAPI.getAll({ topOnly: 'true', limit: 5 }),
        ]);
        setAttendance(attRes.data || { summary: { percentage: 0 }, records: [] });
        setMarks(marksRes.data || []);
        setAnnouncements(annRes.data?.slice(0, 5) || []);
        setTopNews(newsRes.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');
  const attPct = parseFloat(attendance.summary?.percentage || 0);

  // Compute average marks
  const avgMarks = marks.length > 0
    ? (marks.reduce((s, m) => s + (m.marksObtained / m.maxMarks) * 100, 0) / marks.length).toFixed(1)
    : null;

  // Group marks by subject for bar chart
  const marksChartData = marks.reduce((acc, m) => {
    const existing = acc.find(a => a.subject === m.subject?.name);
    if (existing) { existing.marks = Math.max(existing.marks, Math.round((m.marksObtained / m.maxMarks) * 100)); }
    else if (m.subject?.name) acc.push({ subject: m.subject.name.slice(0, 6), marks: Math.round((m.marksObtained / m.maxMarks) * 100) });
    return acc;
  }, []);

  // Attendance radial data
  const attChartData = [{ name: 'Attendance', value: attPct, fill: attPct >= 75 ? '#22c55e' : attPct >= 50 ? '#f59e0b' : '#ef4444' }];

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-slate-900 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-900 rounded-2xl" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[...Array(2)].map((_, i) => <div key={i} className="h-60 bg-slate-900 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome */}
      <div className="bg-gradient-to-br from-indigo-600/20 via-slate-900 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-slate-400 mt-1 text-sm">Here's your academic overview for today.</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">Today</p>
            <p className="text-sm font-semibold text-indigo-300">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Attendance Rate" value={`${attPct}%`}
          sublabel={`${attendance.summary?.present || 0} present / ${attendance.summary?.total || 0} days`}
          color="bg-emerald-600" to="/student/attendance" trend={attPct} />
        <StatCard icon={Award} label="Avg. Performance" value={avgMarks ? `${avgMarks}%` : 'N/A'}
          sublabel={`${marks.length} test records`} color="bg-indigo-600" to="/student/marks" />
        <StatCard icon={BookMarked} label="Assignments" value={assignments.length || '—'}
          sublabel="Check deadlines" color="bg-purple-600" to="/student/assignments" />
        <StatCard icon={Bell} label="Announcements" value={announcements.length || '0'}
          sublabel="Active notices" color="bg-amber-600" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Attendance Circle */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-2">This Month's Attendance</h3>
          <p className="text-xs text-slate-500 mb-4">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          <div className="flex items-center gap-5">
            <div className="relative">
              <ResponsiveContainer width={110} height={110}>
                <RadialBarChart cx="50%" cy="50%" innerRadius={30} outerRadius={50} data={attChartData} startAngle={90} endAngle={-270}>
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#1e293b' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-display font-bold ${attPct >= 75 ? 'text-green-400' : attPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {attPct}%
                </span>
              </div>
            </div>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Present', val: attendance.summary?.present || 0, color: 'bg-green-500' },
                { label: 'Absent', val: attendance.summary?.absent || 0, color: 'bg-red-500' },
                { label: 'Total Days', val: attendance.summary?.total || 0, color: 'bg-slate-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-slate-400 text-xs">{label}</span>
                  </div>
                  <span className="text-white font-semibold text-sm">{val}</span>
                </div>
              ))}
              {attPct < 75 && (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1.5">
                  ⚠ Minimum 75% required
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Marks Bar Chart */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white">Subject Performance</h3>
            <Link to="/student/marks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">View all <ChevronRight size={12} /></Link>
          </div>
          {marksChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={marksChartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={v => [`${v}%`, 'Score']} />
                <Bar dataKey="marks" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-36 flex items-center justify-center text-slate-500 text-sm">No marks data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Marks Table + Announcements + Top News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Marks */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white flex items-center gap-2"><Award size={16} className="text-indigo-400" /> Recent Marks</h3>
            <Link to="/student/marks" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          <div className="space-y-2">
            {marks.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No marks yet</p>
            ) : marks.slice(0, 5).map((m, i) => {
              const pct = Math.round((m.marksObtained / m.maxMarks) * 100);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{m.subject?.name || '—'}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.examType}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className={`text-sm font-bold ${GradeColor(pct)}`}>{m.marksObtained}/{m.maxMarks}</p>
                    <p className="text-xs text-slate-500">{m.grade}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Announcements */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white flex items-center gap-2"><Bell size={16} className="text-amber-400" /> Notices</h3>
            {announcements.filter(a => a.isUrgent).length > 0 && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg border border-red-500/30">
                {announcements.filter(a => a.isUrgent).length} urgent
              </span>
            )}
          </div>
          <div className="space-y-2">
            {announcements.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No announcements</p>
            ) : announcements.map((a, i) => (
              <div key={i} className={`p-3 rounded-xl text-sm border ${a.isUrgent ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/60 border-slate-700/50'}`}>
                <div className="flex items-start gap-2">
                  {a.isUrgent ? <AlertCircle size={13} className="text-red-400 flex-shrink-0 mt-0.5" /> : <Bell size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />}
                  <div className="min-w-0">
                    <p className="text-white font-medium text-xs leading-snug">{a.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top News */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white flex items-center gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400" /> Top News
            </h3>
            <Link to="/student/news" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </div>
          <div className="space-y-2">
            {topNews.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No news available</p>
            ) : topNews.map((n, i) => (
              <div key={i} className="flex items-start gap-2 py-2 border-b border-slate-800 last:border-0">
                <span className="text-xs font-bold text-indigo-400 mt-0.5 flex-shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium leading-snug line-clamp-2">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">{n.category.replace('_', ' & ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/student/attendance', icon: ClipboardList, label: 'View Attendance', color: 'from-emerald-600/30 to-emerald-700/20 border-emerald-500/30 text-emerald-300' },
            { to: '/student/marks',      icon: TrendingUp,    label: 'Check Marks',    color: 'from-indigo-600/30 to-indigo-700/20 border-indigo-500/30 text-indigo-300' },
            { to: '/student/documents',  icon: FileText,      label: 'Apply Bonafide', color: 'from-purple-600/30 to-purple-700/20 border-purple-500/30 text-purple-300' },
            { to: '/student/materials',  icon: BookOpen,      label: 'Study Materials', color: 'from-amber-600/30 to-amber-700/20 border-amber-500/30 text-amber-300' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br border text-center transition-all hover:scale-105 ${color}`}>
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
