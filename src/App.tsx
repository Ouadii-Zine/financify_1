
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import LoansList from "./pages/LoansList";
import LoanDetail from "./pages/LoanDetail";
import NotFound from "./pages/NotFound";
import Portfolios from "./pages/Portfolios";
import AnalyticsEva from "./pages/AnalyticsEva";
import AnalyticsRisk from "./pages/AnalyticsRisk";
import AnalyticsPerformance from "./pages/AnalyticsPerformance";
import Simulations from "./pages/Simulations";
import Import from "./pages/Import";
import Parameters from "./pages/Parameters";
import Reports from "./pages/Reports";
import Documentation from "./pages/Documentation";
import LoanNew from "./pages/LoanNew";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
          <Route path="/portfolios" element={<Layout><Portfolios /></Layout>} />
          <Route path="/loans" element={<Layout><LoansList /></Layout>} />
          <Route path="/loans/new" element={<Layout><LoanNew /></Layout>} />
          <Route path="/loans/:id" element={<Layout><LoanDetail /></Layout>} />
          <Route path="/analytics/eva" element={<Layout><AnalyticsEva /></Layout>} />
          <Route path="/analytics/risk" element={<Layout><AnalyticsRisk /></Layout>} />
          <Route path="/analytics/performance" element={<Layout><AnalyticsPerformance /></Layout>} />
          <Route path="/simulations" element={<Layout><Simulations /></Layout>} />
          <Route path="/import" element={<Layout><Import /></Layout>} />
          <Route path="/parameters" element={<Layout><Parameters /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          <Route path="/documentation" element={<Layout><Documentation /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
