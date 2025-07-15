
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Routes, Route } from "react-router-dom";
import { RepositoriesPage } from "@/components/RepositoriesPage";
import { RenovatePage } from "@/components/RenovatePage";
import { SettingsPage } from "@/components/SettingsPage";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 p-6">
              <Routes>
                <Route path="/" element={<RepositoriesPage />} />
                <Route path="/repositories" element={<RepositoriesPage />} />
                <Route path="/renovate" element={<RenovatePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default Index;
