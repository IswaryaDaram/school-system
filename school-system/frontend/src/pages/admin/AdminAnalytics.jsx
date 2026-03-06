import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../utils/api';
import { BarChart2, TrendingUp, Users, Calendar, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981'];

const MetricCard = ({ label, value, sub, icon: Icon, color, delta, deltaDir }) => (
  <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}><Icon size={18} className="text-white"/></div>
      {delta !== undefined && (
        <span className={`text-xs flex items-center gap-0.5 ${deltaDir==='up'?'text-green-400':'text-red-400'}`}>
          {deltaDir==='up'?<ArrowUp size={12}/>:<ArrowDown size={12}/>}{delta}%
        </span>
      )}
    </div>
    <p className="text-2xl font-display font-bold text-white">{value}</p>
    <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

export default function AdminAnalytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      <div className="h-12 bg-slate-900 rounded-2xl w-1/3"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <div key={i} className="h-32 bg-slate-900 rounded-2xl"/>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">{[...Array(2)].map((_,i) => <div key={i} className="h-64 bg-slate-900 rounded-2xl"/>)}</div>
    </div>
  );

  const stats = data?.stats || {};
  const trend = data?.attendanceTrend || [];
  const activities = data?.recentActivities || [];

  const pieData = [
    { name:'Students',     value: stats.totalStudents || 0 },
    { name:'Teachers',     value: stats.totalTeachers || 0 },
    { name:'Pending Docs', value: stats.pendingDocs   || 0 },
    { name:'Urgent Notices', value: stats.urgentAnnouncements || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2"><BarChart2 size={24} className="text-indigo-400"/> Analytics</h1>
        <p className="text-slate-400 text-sm mt-1">School performance metrics and reports</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Users}    label="Total Students"   value={stats.totalStudents||0}      color="bg-indigo-600" delta={5} deltaDir="up"/>
        <MetricCard icon={Users}    label="Total Teachers"   value={stats.totalTeachers||0}      color="bg-purple-600"/>
        <MetricCard icon={TrendingUp} label="Attendance Rate" value={`${stats.attendancePercentage||0}%`} color="bg-emerald-600" delta={2} deltaDir="up"/>
        <MetricCard icon={Calendar} label="Pending Docs"     value={stats.pendingDocs||0}        color="bg-amber-600"/>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Monthly Attendance Trend (6 months)</h3>
          {trend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No trend data available yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}}/>
                <YAxis tick={{fill:'#64748b',fontSize:11}} unit="%" domain={[0,100]}/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}} formatter={v=>[`${v}%`,'Attendance']}/>
                <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} dot={{fill:'#6366f1',r:4}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">School Overview</h3>
          {pieData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-500 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {pieData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}}/>
                <Legend iconSize={8} wrapperStyle={{fontSize:'11px',color:'#94a3b8'}}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance bar */}
      {trend.length > 0 && (
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Attendance Breakdown by Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="month" tick={{fill:'#64748b',fontSize:11}}/>
              <YAxis tick={{fill:'#64748b',fontSize:11}} unit="%" domain={[0,100]}/>
              <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}} formatter={v=>[`${v}%`,'Attendance']}/>
              <Bar dataKey="percentage" fill="#6366f1" radius={[6,6,0,0]}
                label={{position:'top',fill:'#64748b',fontSize:10,formatter:v=>`${v}%`}}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4">Recent Activity Feed</h3>
        {activities.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No recent activities</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0,8).map((a,i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-400 text-xs font-bold">{(i+1)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.author?.name} · {new Date(a.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                  </p>
                </div>
                {a.isUrgent && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-lg border border-red-500/30 flex-shrink-0">Urgent</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
