import { useState } from 'react';
import { User } from '../App';
import { AppSidebar } from './AppSidebar';
import { SidebarProvider } from './ui/sidebar';
import { ReceptionModule } from './modules/ReceptionModule';
import { StorageModule } from './modules/StorageModule';
import { DecodificationModule } from './modules/DecodificationModule';
import { EssaisRouteModule } from './modules/EssaisRouteModule';
import { EssaisMecaniqueModule } from './modules/EssaisMecaniqueModule';
import { EssaisRejetesModule } from './modules/EssaisRejetesModule';
import { TraitementModule } from './modules/TraitementModule';
import { ValidationModule } from './modules/ValidationModule';
import { AdminModule } from './modules/AdminModule';
import { DashboardHome } from './DashboardHome';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
}

export type ActiveView =
  | 'home'
  | 'reception'
  | 'storage'
  | 'decodification'
  | 'essais-route'
  | 'essais-mecanique'
  | 'essais-rejetes'
  | 'traitement'
  | 'validation'
  | 'admin';

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps) {
  const [activeView, setActiveView] = useState<ActiveView>('home');

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <DashboardHome user={user} />;
      case 'reception':
        return <ReceptionModule />;
      case 'storage':
        return <StorageModule />;
      case 'decodification':
        return <DecodificationModule />;
      case 'essais-route':
        return <EssaisRouteModule />;
      case 'essais-mecanique':
        return <EssaisMecaniqueModule />;
      case 'essais-rejetes':
        return <EssaisRejetesModule />;
      case 'traitement':
        return <TraitementModule />;
      case 'validation':
        return <ValidationModule userRole={user.role} />;
      case 'admin':
        return <AdminModule />;
      default:
        return <DashboardHome user={user} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar 
          user={user} 
          activeView={activeView}
          onNavigate={setActiveView}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-auto" style={{ backgroundColor: '#FFFFFF' }}>
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}
