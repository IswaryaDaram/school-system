import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Chatbot from '../chatbot/Chatbot';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Building2,
  ClipboardList, BarChart3, Newspaper, FileText, Bell,
  LogOut, Menu, Sun, Moon, Globe, BookMarked,
  ChevronRight, Award, TrendingUp, Upload, Compass
} from 'lucide-react';

const adminNav = [
  { to: '/admin',               label: 'dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/students',      label: 'students',      icon: GraduationCap },
  { to: '/admin/teachers',      label: 'teachers',      icon: Users },
  { to: '/admin/classes',       label: 'classes',       icon: Building2 },
  { to: '/admin/subjects',      label: 'subjects',      icon: BookOpen },
  { to: '/admin/announcements', label: 'announcements', icon: Bell },
  { to: '/admin/news',          label: 'news',          icon: Newspaper },
  { to: '/admin/documents',     label: 'documents',     icon: FileText },
  { to: '/admin/analytics',     label: 'analytics',     icon: BarChart3 },
];
const teacherNav = [
  { to: '/teacher',             label: 'dashboard',   icon: LayoutDashboard, end: true },
  { to: '/teacher/attendance',  label: 'attendance',  icon: ClipboardList },
  { to: '/teacher/assignments', label: 'assignments', icon: BookMarked },
  { to: '/teacher/marks',       label: 'marks',       icon: Award },
  { to: '/teacher/materials',   label: 'materials',   icon: Upload },
];
const studentNav = [
  { to: '/student',             label: 'dashboard',   icon: LayoutDashboard, end: true },
  { to: '/student/attendance',  label: 'attendance',  icon: ClipboardList },
  { to: '/student/marks',       label: 'marks',       icon: TrendingUp },
  { to: '/student/assignments', label: 'assignments', icon: BookMarked },
  { to: '/student/materials',   label: 'materials',   icon: BookOpen },
  { to: '/student/news',        label: 'news',        icon: Newspaper },
  { to: '/student/documents',   label: 'documents',   icon: FileText },
  { to: '/student/career',      label: 'career',      icon: Compass },
];
const navByRole = { admin: adminNav, teacher: teacherNav, student: studentNav };

const getInitialDark = () => {
  const s = localStorage.getItem('darkMode');
  return s !== null ? s === 'true' : true;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const { t, i18n }      = useTranslation();
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [isDark,        setIsDark]        = useState(getInitialDark);

  // Toggle html.light class — CSS in index.css does the rest
  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('light');
    } else {
      html.classList.add('light');
    }
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  // Apply saved theme immediately on first mount
  useEffect(() => {
    if (!isDark) document.documentElement.classList.add('light');
  }, []);

  const toggleLang = () => {
    const next = i18n.language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  const navItems = navByRole[user?.role] || [];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-white" style={{ color: '#fff' }} />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-display font-bold text-indigo-400 text-sm leading-tight">School</p>
              <p className="font-display font-bold text-slate-100 text-sm leading-tight">System</p>
            </div>
          )}
        </div>
      </div>

      {/* User info */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{color:'#fff'}}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-indigo-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}>
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{t(label)}</span>}
            {sidebarOpen && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-60" />}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-slate-700/50 space-y-1">
        <button onClick={toggleLang}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all">
          <Globe size={18} />
          {sidebarOpen && <span>{i18n.language === 'en' ? 'తెలుగులో చూడండి' : 'Switch to English'}</span>}
        </button>
        <button onClick={() => setIsDark(d => !d)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          {sidebarOpen && <span>
            {isDark
              ? (i18n.language === 'te' ? 'లైట్ మోడ్' : 'Light Mode')
              : (i18n.language === 'te' ? 'డార్క్ మోడ్' : 'Dark Mode')}
          </span>}
        </button>
        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all">
          <LogOut size={18} />
          {sidebarOpen && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-slate-900 border-r border-slate-700/50 transition-all duration-300 ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebar(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-700/50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-slate-900 border-b border-slate-700/50 px-4 h-14 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { setSidebarOpen(o => !o); setMobileSidebar(o => !o); }}
            className="text-slate-400 hover:text-indigo-400 transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="text-xs text-slate-500">
            {new Date().toLocaleDateString(
              i18n.language === 'te' ? 'te-IN' : 'en-IN',
              { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <Chatbot />
    </div>
  );
}
