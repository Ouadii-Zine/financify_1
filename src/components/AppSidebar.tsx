
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import AppearanceService from '@/services/AppearanceService';
import {
  BarChart3,
  Home,
  Settings,
  FileSpreadsheet,
  PieChart,
  CalculatorIcon,
  ListChecks,
  Upload,
  CreditCard,
  DollarSign,
  PieChartIcon,
  Briefcase,
  LineChart,
  Palette,
} from 'lucide-react';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [appName, setAppName] = useState(AppearanceService.getInstance().getMainTitle());
  const [appSubtitle, setAppSubtitle] = useState(AppearanceService.getInstance().getSubtitle());
  const [appLogo, setAppLogo] = useState<string | null>(AppearanceService.getInstance().getLogo());
  
  const isActive = (path: string) => location.pathname === path;

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
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          {appLogo ? (
            <img 
              src={appLogo} 
              alt="App Logo" 
              className="h-8 w-8 object-contain"
            />
          ) : (
            <DollarSign className="h-8 w-8 text-sidebar-primary" />
          )}
          <div className="ml-2">
            <div className="text-xl font-bold text-sidebar-foreground">{appName}</div>
            {appSubtitle && (
              <div className="text-xs text-sidebar-foreground/70">{appSubtitle}</div>
            )}
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/')} isActive={isActive('/')}>
                  <Home />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/portfolios')} isActive={isActive('/portfolios')}>
                  <Briefcase />
                  <span>Portfolios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/loans')} isActive={isActive('/loans')}>
                  <CreditCard />
                  <span>Loans</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/portfolio')} isActive={isActive('/portfolio')}>
                  <PieChart />
                  <span>Portfolio Analysis</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/analytics/eva')} isActive={isActive('/analytics/eva')}>
                  <BarChart3 />
                  <span>EVA Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/analytics/risk')} isActive={isActive('/analytics/risk')}>
                  <PieChartIcon />
                  <span>Risk</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/analytics/performance')} isActive={isActive('/analytics/performance')}>
                  <LineChart />
                  <span>Performance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/simulations')} isActive={isActive('/simulations')}>
                  <CalculatorIcon />
                  <span>Simulations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/import')} isActive={isActive('/import')}>
                  <Upload />
                  <span>Import</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/parameters')} isActive={isActive('/parameters')}>
                  <Settings />
                  <span>Parameters</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/appearance')} isActive={isActive('/appearance')}>
                  <Palette />
                  <span>Appearance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => navigate('/reports')} isActive={isActive('/reports')}>
                  <FileSpreadsheet />
                  <span>Reports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/70">
          {appName} {appSubtitle && `- ${appSubtitle}`} v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
