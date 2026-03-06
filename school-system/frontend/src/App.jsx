import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import '../src/i18n/index.js';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminClasses from './pages/admin/AdminClasses';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminNews from './pages/admin/AdminNews';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminAnalytics from './pages/admin/AdminAnalytics';

// Teacher
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherMarks from './pages/teacher/TeacherMarks';
import TeacherMaterials from './pages/teacher/TeacherMaterials';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMarks from './pages/student/StudentMarks';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentNews from './pages/student/StudentNews';
import StudentDocuments from './pages/student/StudentDocuments';
import StudentMaterials from './pages/student/StudentMaterials';
import StudentCareer from './pages/student/StudentCareer';

// Common
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/common/Layout';

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-900"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

// ─── Role Redirect ────────────────────────────────────────────────────────────
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' } }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><Layout /></ProtectedRoute>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="attendance" element={<TeacherAttendance />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="marks" element={<TeacherMarks />} />
            <Route path="materials" element={<TeacherMaterials />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout /></ProtectedRoute>}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance"  element={<StudentAttendance />} />
            <Route path="marks"       element={<StudentMarks />} />
            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="news"        element={<StudentNews />} />
            <Route path="documents"   element={<StudentDocuments />} />
            <Route path="materials"   element={<StudentMaterials />} />
            <Route path="career"      element={<StudentCareer />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
