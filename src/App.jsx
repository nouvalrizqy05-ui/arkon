import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';

// --- LAZY-LOADED PAGES (Code Splitting untuk performa) ---
// Halaman ringan tetap eager-loaded
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Halaman berat di-lazy load
const ClassroomWorkspace = lazy(() => import('./pages/ClassroomWorkspace'));
const CpuSimulator = lazy(() => import('./pages/CpuSimulator'));
const LecturerDashboard = lazy(() => import('./pages/LecturerDashboard'));
const ArLab = lazy(() => import('./pages/ArLab'));
const CpuVisual = lazy(() => import('./pages/CpuVisual')); // Komponen Visualisasi CPU
// PcShowroom hanya diakses dari dalam RoomHub (tab 'showroom')
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const TentangPage = lazy(() => import('./pages/TentangPage'));
const HubungiKamiPage = lazy(() => import('./pages/HubungiKamiPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
import NotFound from './pages/NotFound';
import AccessibilityWidget from './components/AccessibilityWidget';

// --- LOADING FALLBACK (Professional Skeleton) ---
function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center border border-primary/20">
            <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
          <div className="absolute -inset-2 bg-primary/5 rounded-3xl blur-xl animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-secondary text-sm font-medium mb-1">Memuat halaman...</p>
          <p className="text-secondary text-[10px] font-medium uppercase tracking-widest">ARKON v1.0</p>
        </div>
      </div>
    </div>
  );
}

// --- PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children, roleRequired }) => {
  const token = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role');

  const isTokenValid = (t) => {
    if (!t) return false;
    try {
      const base64Url = t.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
      const payload = JSON.parse(atob(padded));
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  };

  if (!token || !isTokenValid(token)) {
    if (token) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
    }
    return <Navigate to="/login" replace />;
  }

  if (roleRequired && userRole !== roleRequired) {
    return <Navigate to={userRole === 'dosen' ? '/dosen' : '/mahasiswa'} replace />;
  }

  return children;
};

function Layout() {
  const location = useLocation();
  // Sembunyikan Navbar utama di dalam aplikasi
  const hideNavbarRoutes = ['/', '/workspace', '/mahasiswa', '/cpu-simulator', '/cpu-visual', '/lecturer-dashboard', '/dosen', '/ar-lab', '/login', '/register', '/tentang', '/hubungi-kami', '/settings'];
  const showNavbar = !hideNavbarRoutes.some(route => 
    location.pathname === route || (route !== '/' && location.pathname.startsWith(`${route}/`))
  );

  return (
    <>
      {/* WCAG 2.4.1: Skip to main content for keyboard/screen reader users */}
      <a href="#main-content" className="skip-to-content">
        Lewati ke konten utama
      </a>
      <AccessibilityWidget />
      {showNavbar && <Navbar />}
      <main id="main-content" className={showNavbar ? 'pt-[70px]' : ''} role="main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/tentang" element={<TentangPage />} />
            <Route path="/hubungi-kami" element={<HubungiKamiPage />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* Rute Mahasiswa */}
            <Route 
              path="/workspace/*" 
              element={<ProtectedRoute roleRequired="mahasiswa"><ClassroomWorkspace /></ProtectedRoute>} 
            />
            <Route 
              path="/mahasiswa/*" 
              element={<ProtectedRoute roleRequired="mahasiswa"><ClassroomWorkspace /></ProtectedRoute>} 
            />
            <Route 
              path="/cpu-simulator" 
              element={<ProtectedRoute roleRequired="mahasiswa"><CpuSimulator /></ProtectedRoute>} 
            />
            <Route 
              path="/ar-lab" 
              element={<ProtectedRoute roleRequired="mahasiswa"><ArLab /></ProtectedRoute>} 
            />
            <Route 
              path="/cpu-visual" 
              element={<ProtectedRoute roleRequired="mahasiswa"><CpuVisual /></ProtectedRoute>} 
            />
            {/* /showroom dihapus — hanya tersedia sebagai tab di RoomHub */}

            {/* Rute Dosen */}
            <Route 
              path="/lecturer-dashboard/*" 
              element={<ProtectedRoute roleRequired="dosen"><LecturerDashboard /></ProtectedRoute>} 
            />
            <Route 
              path="/dosen/*" 
              element={<ProtectedRoute roleRequired="dosen"><LecturerDashboard /></ProtectedRoute>} 
            />

            {/* Redirect fallback */}
            <Route path="/dashboard" element={<Navigate to="/mahasiswa" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <ErrorBoundary>
          <ToastProvider>
            <Layout />
          </ToastProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </Router>
  );
}