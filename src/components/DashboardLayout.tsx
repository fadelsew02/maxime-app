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
import { EssaisRejetesMecaniqueModule } from './modules/EssaisRejetesMecaniqueModule';
import { TraitementModule } from './modules/TraitementModule';
import { TraitementRejeteModule } from './modules/TraitementRejeteModule';
import { ValidationModule } from './modules/ValidationModule';
import { ValidationResultsModule } from './modules/ValidationResultsModule';
import { RapportAAviserModule } from './modules/RapportAAviserModule';
import { ServiceMarketingModule } from './modules/ServiceMarketingModule';
import { AdminModule } from './modules/AdminModule';
import { ChefProjetModule } from './modules/ChefProjetModule';
import { ChefProjetRejeteModule } from './modules/ChefProjetRejeteModule';
import { ChefServiceModule } from './modules/ChefServiceModule';
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
  | 'essais-rejetes-mecanique'
  | 'traitement'
  | 'traitement-rejete'
  | 'validation'
  | 'admin'
  | 'chef-projet'
  | 'chef-projet-rejete'
  | 'rapports-chef-service'
  | 'rapports-valides'
  | 'service-marketing';

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
      case 'essais-rejetes-mecanique':
        return <EssaisRejetesMecaniqueModule />;
      case 'traitement':
        return <TraitementModule />;
      case 'traitement-rejete':
        return <TraitementRejeteModule />;
      case 'validation':
        if (user.role === 'directeur_technique') {
          return <ValidationModule userRole={user.role} />;
        } else {
          return <ValidationResultsModule userRole={user.role} />;
        }
      case 'admin':
        return <AdminModule />;
      case 'chef-projet':
        return <ChefProjetModule />;
      case 'chef-projet-rejete':
        return <ChefProjetRejeteModule />;
      case 'rapports-chef-service':
        return <ChefServiceModule />;
      case 'rapports-valides':
        if (user.role === 'directeur_snertp') {
          return <RapportAAviserModule />;
        } else {
          return <ValidationResultsModule userRole={user.role} />;
        }
      case 'service-marketing':
        return <ServiceMarketingModule />;
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
        <main className="flex-1 overflow-auto bg-background">
          {renderContent()}
        </main>
      </div>
    </SidebarProvider>
  );
}
