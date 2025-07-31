
import React, { ReactNode, useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import AppearanceService from '@/services/AppearanceService';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [appName, setAppName] = useState(AppearanceService.getInstance().getMainTitle());
  const [appSubtitle, setAppSubtitle] = useState(AppearanceService.getInstance().getSubtitle());
  const [appLogo, setAppLogo] = useState<string | null>(AppearanceService.getInstance().getLogo());

  // Listen for appearance updates
  useEffect(() => {
    const handleAppearanceUpdate = () => {
      const service = AppearanceService.getInstance();
      setAppName(service.getMainTitle());
      setAppSubtitle(service.getSubtitle());
      setAppLogo(service.getLogo());
    };

    window.addEventListener('appearance-updated', handleAppearanceUpdate);
    return () => window.removeEventListener('appearance-updated', handleAppearanceUpdate);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-3">
              {appLogo && (
                <img 
                  src={appLogo} 
                  alt="App Logo" 
                  className="h-8 w-8 object-contain"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">{appName}</h1>
                {appSubtitle && (
                  <p className="text-sm text-muted-foreground">{appSubtitle}</p>
                )}
              </div>
            </div>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
