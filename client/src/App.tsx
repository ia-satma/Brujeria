import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import PerformanceDashboard from "@/pages/PerformanceDashboard";
import ValidationDashboard from "@/pages/ValidationDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/performance" component={PerformanceDashboard} />
      <Route path="/validation" component={ValidationDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <main id="main-content" role="main" tabIndex={-1}>
          <Router />
        </main>
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="announcer"></div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
