
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppSidebar } from "@/components/AppSidebar";
import { LandingPage } from "@/components/LandingPage";
import { RepositoriesPage } from "@/components/RepositoriesPage";
import { RenovatePage } from "@/components/RenovatePage";
import { SettingsPage } from "@/components/SettingsPage";
import { Header } from "@/components/Header";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="repopulse-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/repositories" element={
              <div className="min-h-screen bg-background">
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <Header />
                      <main className="flex-1 p-6">
                        <RepositoriesPage />
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </div>
            } />
            <Route path="/renovate" element={
              <div className="min-h-screen bg-background">
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <Header />
                      <main className="flex-1 p-6">
                        <RenovatePage />
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </div>
            } />
            <Route path="/settings" element={
              <div className="min-h-screen bg-background">
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <Header />
                      <main className="flex-1 p-6">
                        <SettingsPage />
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </div>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
