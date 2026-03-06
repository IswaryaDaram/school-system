import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Users, GraduationCap, TrendingUp, FileText, Bell, Activity } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      {trend && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-lg">+{trend}%</span>}
    </div>
    <p className="text-2xl font-display font-bold text-white mb-1">{value ?? '—'}</p>
    <p className="text-sm text-slate-400">{label}</p>
  </div>
);

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  if (loading) return (
    <div className="space-y-6">
      <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-900 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const trend = data?.attendanceTrend || [];

  const pieData = [
    { name: 'Students', value: stats.totalStudents || 0 },
    { name: 'Teachers', value: stats.totalTeachers || 0 },
    { name: 'Pending Docs', value: stats.pendingDocs || 0 },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-slate-400 mt-1">Here's what's happening at your school today.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Academic Year</p>
          <p className="text-sm font-semibold text-indigo-400">2024 – 2025</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label={t('totalStudents')} value={stats.totalStudents} color="bg-indigo-600" trend={5} />
        <StatCard icon={Users} label={t('totalTeachers')} value={stats.totalTeachers} color="bg-purple-600" />
        <StatCard icon={TrendingUp} label={t('attendanceRate')} value={`${stats.attendancePercentage}%`} color="bg-emerald-600" trend={2} />
        <StatCard icon={FileText} label={t('pendingRequests')} value={stats.pendingDocs} color="bg-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Attendance Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
              <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Overview Pie */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">School Overview</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-slate-400">{d.name}</span>
                </div>
                <span className="text-white font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-indigo-400" />
          <h3 className="font-display font-semibold text-white">{t('recentActivity')}</h3>
        </div>
        <div className="space-y-3">
          {data?.recentActivities?.length > 0 ? data.recentActivities.slice(0, 5).map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <Bell size={14} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">by {a.author?.name} • {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              {a.isUrgent && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg flex-shrink-0">Urgent</span>}
            </div>
          )) : (
            <p className="text-slate-500 text-sm text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </div>
  );
}
