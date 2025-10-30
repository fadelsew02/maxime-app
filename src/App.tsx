import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Toaster } from './components/ui/sonner';
import { NotificationProvider } from './contexts/NotificationContext';

export type UserRole = 
  | 'receptionniste'
  | 'responsable_materiaux'
  | 'operateur_route'
  | 'operateur_mecanique'
  | 'responsable_traitement'
  | 'chef_projet'
  | 'chef_service'
  | 'directeur_technique'
  | 'directeur_general';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  return (
    <NotificationProvider userRole={user.role}>
      <DashboardLayout user={user} onLogout={handleLogout} />
      <Toaster />
    </NotificationProvider>
  );
}

export default App;
