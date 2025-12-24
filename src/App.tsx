import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { EchantillonDetails } from './components/EchantillonDetails';
import { Toaster } from './components/ui/sonner';
import { NotificationProvider } from './contexts/NotificationContext';
import { getCurrentUser, logout as logoutAuth } from './lib/auth';
import { autoCleanOnStartup } from './utils/cleanLocalStorage';

export type UserRole = 
  | 'receptionniste'
  | 'responsable_materiaux'
  | 'operateur_route'
  | 'operateur_mecanique'
  | 'responsable_traitement'
  | 'chef_projet'
  | 'chef_service'
  | 'directeur_technique'
  | 'directeur_general'
  | 'directeur_snertp'
  | 'service_marketing';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    autoCleanOnStartup();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    logoutAuth();
    setUser(null);
  };

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique pour voir les détails d'un échantillon via QR code */}
        <Route path="/echantillon/:code" element={<EchantillonDetails />} />
        
        {/* Routes protégées */}
        <Route
          path="/*"
          element={
            !user ? (
              <>
                <LoginPage onLogin={handleLogin} />
                <Toaster />
              </>
            ) : (
              <NotificationProvider userRole={user.role}>
                <DashboardLayout user={user} onLogout={handleLogout} />
                <Toaster />
              </NotificationProvider>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
