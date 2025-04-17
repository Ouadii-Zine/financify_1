
import { useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <DollarSign className="h-8 w-8 text-sidebar-primary" />
          <span className="text-xl font-bold ml-2 text-sidebar-foreground">Financify</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Général</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem active={isActive('/')}>
                <SidebarMenuButton onClick={() => navigate('/')}>
                  <Home />
                  <span>Tableau de bord</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/portfolio')}>
                <SidebarMenuButton onClick={() => navigate('/portfolio')}>
                  <Briefcase />
                  <span>Portefeuille</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/loans')}>
                <SidebarMenuButton onClick={() => navigate('/loans')}>
                  <CreditCard />
                  <span>Prêts</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Analyse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem active={isActive('/analytics/eva')}>
                <SidebarMenuButton onClick={() => navigate('/analytics/eva')}>
                  <BarChart3 />
                  <span>EVA Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/analytics/risk')}>
                <SidebarMenuButton onClick={() => navigate('/analytics/risk')}>
                  <PieChartIcon />
                  <span>Risque</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/analytics/performance')}>
                <SidebarMenuButton onClick={() => navigate('/analytics/performance')}>
                  <LineChart />
                  <span>Performance</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/simulations')}>
                <SidebarMenuButton onClick={() => navigate('/simulations')}>
                  <CalculatorIcon />
                  <span>Simulations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Outils</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem active={isActive('/import')}>
                <SidebarMenuButton onClick={() => navigate('/import')}>
                  <Upload />
                  <span>Import</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/parameters')}>
                <SidebarMenuButton onClick={() => navigate('/parameters')}>
                  <Settings />
                  <span>Paramètres</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem active={isActive('/reports')}>
                <SidebarMenuButton onClick={() => navigate('/reports')}>
                  <FileSpreadsheet />
                  <span>Rapports</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <div className="text-xs text-sidebar-foreground/70">
          Financify Portfolio Lens v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
