import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { EmailVerificationView } from './components/EmailVerificationView';
import { CalendarSuccessView } from './components/CalendarSuccessView';
import PatientMedicalFileView from './components/PatientMedicalFileView';
import { useAuth } from './hooks/useAuth';
import { EnhancedChatWidget } from './components/EnhancedChatWidget';
import { supabase } from './lib/supabase';

function App() {
  const { user, loading } = useAuth();
  const [showEnvWarning, setShowEnvWarning] = useState(
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
  );
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

  React.useEffect(() => {
    const checkEmailVerification = async () => {
      if (user) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && !authUser.email_confirmed_at) {
          setNeedsEmailVerification(true);
        } else {
          setNeedsEmailVerification(false);
        }
      }
    };
    checkEmailVerification();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cordelia yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (showEnvWarning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Kurulum Gerekli</h1>
            <p className="text-gray-600 mt-2">Supabase yapılandırması gerekli</p>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <p>Cordelia'yı kullanmak için:</p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Ayarlardaki "Supabase" butonuna tıklayın (sağ üst)</li>
              <li>Yeni bir Supabase projesi oluşturun</li>
              <li>Proje URL'inizi ve anon key'inizi kopyalayın</li>
              <li>Uygulama otomatik olarak bağlanacak</li>
            </ol>
          </div>

          <button
            onClick={() => setShowEnvWarning(false)}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Demo Modu ile Devam Et
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthForm />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              needsEmailVerification ? (
                <EmailVerificationView />
              ) : (
                <>
                  <Dashboard />
                  <EnhancedChatWidget />
                </>
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route
          path="/calendar"
          element={user ? <CalendarSuccessRoute /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/patient-file/:patientId"
          element={user ? <PatientMedicalFileView /> : <Navigate to="/auth" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Separate component for calendar success route
function CalendarSuccessRoute() {
  // Check URL parameter immediately during initialization
  const urlParams = new URLSearchParams(window.location.search);
  const hasConnectedParam = urlParams.get('connected') === 'true';

  if (hasConnectedParam) {
    return <CalendarSuccessView onNavigateHome={() => window.location.href = '/'} />;
  }

  // If no success parameter, redirect to home
  return <Navigate to="/" replace />;
}

export default App;