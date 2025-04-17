
import React, { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <SidebarTrigger className="lg:hidden" />
            <h1 className="text-2xl font-bold">Financify Portfolio Lens</h1>
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
