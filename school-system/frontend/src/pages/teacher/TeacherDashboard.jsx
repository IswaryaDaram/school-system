import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classAPI, assignmentAPI, announcementAPI } from '../../utils/api';
import {
  Users, ClipboardList, BookMarked, Upload, Award, Bell,
  TrendingUp, Calendar, ChevronRight, Loader2, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow, isPast } from 'date-fns';

const QuickCard = ({ to, icon: Icon, label, sub, color }) => (
  <Link to={to} className="group bg-slate-900 border border-slate-700/50 hover:border-indigo-500/40 rounded-2xl p-4 flex items-center gap-3 transition-all hover:shadow-lg hover:shadow-indigo-900/10">
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}><Icon size={18} className="text-white"/></div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
    <ArrowUpRight size={15} className="text-slate-600 group-hover:text-indigo-400 transition-colors"/>
  </Link>
);

export default function TeacherDashboard() {
  const { user }  = useAuth();
  const [loading, setLoading]   = useState(true);
  const [classes, setClasses]   = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, aRes, annRes] = await Promise.all([
          classAPI.getAll(),
          assignmentAPI.getAll(),
          announcementAPI.getAll(),
        ]);
        setClasses(cRes.data || []);
        setAssignments(aRes.data || []);
        setAnnouncements(annRes.data?.slice(0, 5) || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const totalStudents = classes.reduce((s, c) => s + (c.students?.length || 0), 0);
  const pendingAssignments = assignments.filter(a => !isPast(new Date(a.deadline))).length;

  // Chart: students per class
  const classData = classes.map(c => ({ name: `${c.name}-${c.section}`, students: c.students?.length || 0 }));

  if (loading) return (
    <div className="space-y-5 animate-pulse">
      {[...Array(4)].map((_,i) => <div key={i} className="h-24 bg-slate-900 rounded-2xl"/>)}
    </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-indigo-600/20 via-slate-900 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">{greeting}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-slate-400 mt-1 text-sm">Here's your teaching overview for today.</p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-500">Today</p>
            <p className="text-sm font-semibold text-indigo-300">{new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'My Classes',    value:classes.length,        bg:'bg-indigo-600',  icon:Users },
          { label:'Total Students',value:totalStudents,         bg:'bg-purple-600',  icon:Users },
          { label:'Assignments',   value:assignments.length,    bg:'bg-emerald-600', icon:BookMarked },
          { label:'Open Deadlines',value:pendingAssignments,    bg:'bg-amber-600',   icon:Clock },
        ].map(({ label, value, bg, icon: Icon }) => (
          <div key={label} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-4">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}><Icon size={15} className="text-white"/></div>
            <p className="text-xl font-display font-bold text-white">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="font-display font-semibold text-white mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickCard to="/teacher/attendance"  icon={ClipboardList} label="Mark Attendance"    sub="Record today's class attendance" color="bg-emerald-600"/>
          <QuickCard to="/teacher/assignments" icon={BookMarked}    label="Create Assignment"  sub="Post a new assignment" color="bg-indigo-600"/>
          <QuickCard to="/teacher/marks"       icon={Award}         label="Update Marks"       sub="Enter exam scores" color="bg-purple-600"/>
          <QuickCard to="/teacher/materials"   icon={Upload}        label="Upload Material"    sub="Share notes and PDFs" color="bg-amber-600"/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes chart */}
        {classData.length > 0 && (
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
            <h3 className="font-display font-semibold text-white mb-4">Students per Class</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={classData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="name" tick={{fill:'#64748b',fontSize:10}}/>
                <YAxis tick={{fill:'#64748b',fontSize:10}}/>
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8}}/>
                <Bar dataKey="students" fill="#6366f1" radius={[6,6,0,0]} label={{position:'top',fill:'#64748b',fontSize:10}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Announcements */}
        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-white flex items-center gap-2"><Bell size={16} className="text-amber-400"/>Announcements</h3>
          </div>
          <div className="space-y-2">
            {announcements.length === 0
              ? <p className="text-slate-500 text-sm text-center py-4">No announcements</p>
              : announcements.map((a,i) => (
                <div key={i} className={`p-3 rounded-xl text-xs border ${a.isUrgent?'bg-red-500/5 border-red-500/20':'bg-slate-800/60 border-slate-700/50'}`}>
                  <div className="flex items-start gap-2">
                    {a.isUrgent && <span className="text-red-400 mt-0.5">!</span>}
                    <div className="min-w-0">
                      <p className="text-white font-medium leading-snug">{a.title}</p>
                      <p className="text-slate-500 mt-0.5">{formatDistanceToNow(new Date(a.createdAt),{addSuffix:true})}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* My Classes */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2"><Users size={16} className="text-indigo-400"/>My Classes</h3>
        {classes.length === 0
          ? (
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Users size={16} className="text-amber-400 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-semibold text-amber-300">No classes assigned to you yet</p>
                <p className="text-xs text-amber-400/80 mt-0.5">Ask your admin to assign classes. Admin → Teachers → Edit &amp; Assign Classes.</p>
              </div>
            </div>
          )
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.map(c => (
                <div key={c._id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white text-sm">{c.name} – {c.section}</h4>
                    <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg">{c.students?.length||0} students</span>
                  </div>
                  <p className="text-xs text-slate-400">{c.subjects?.length||0} subjects · {c.room||'No room'}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.academicYear||'2024-25'}</p>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}

// missing import
function Clock({ size, className }) { return <BookMarked size={size} className={className}/> }
